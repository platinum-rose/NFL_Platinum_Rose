#!/usr/bin/env python3
import sys
import os
import json
import imaplib
import email
from email.header import decode_header

def decode_mime_words(s):
    if not s:
        return ""
    decoded_fragments = decode_header(s)
    text = ""
    for fragment, encoding in decoded_fragments:
        if isinstance(fragment, bytes):
            text += fragment.decode(encoding or 'utf-8', errors='ignore')
        else:
            text += str(fragment)
    return text

def fetch_unread_emails(addr, passwd):
    if not addr or not passwd:
        return {"error": "Missing email address or app password"}

    try:
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        mail.login(addr, passwd)
        mail.select('INBOX')
        status, data = mail.search(None, 'UNSEEN')
        if status != 'OK' or not data[0]:
            mail.logout()
            return []

        email_ids = data[0].split()
        results = []
        for eid in email_ids[:15]:
            _, msg_data = mail.fetch(eid, '(RFC822)')
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject = decode_mime_words(msg.get('Subject', ''))
                    sender = decode_mime_words(msg.get('From', ''))
                    date_str = msg.get('Date', '')

                    body = ''
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get('Content-Disposition'))
                            if content_type == 'text/plain' and 'attachment' not in content_disposition:
                                raw_payload = part.get_payload(decode=True)
                                if raw_payload:
                                    body = raw_payload.decode('utf-8', errors='ignore')
                                break
                    else:
                        raw_payload = msg.get_payload(decode=True)
                        if raw_payload:
                            body = raw_payload.decode('utf-8', errors='ignore')

                    results.append({
                        'id': f'gmail-{eid.decode()}',
                        'from': sender,
                        'subject': subject,
                        'date': date_str,
                        'body': body
                    })
        mail.logout()
        return results
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    addr = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else os.environ.get('PLATINUM_ROSE_GMAIL_ADDRESS', '')
    passwd = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else os.environ.get('PLATINUM_ROSE_GMAIL_APP_PASSWORD', '')
    res = fetch_unread_emails(addr, passwd)
    print(json.dumps(res))
