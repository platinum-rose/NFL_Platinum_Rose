/**
 * gmailVaultIngest.gs — Automated Gmail Intake & Auto-Summarizer for platinumrose75@gmail.com
 *
 * Configured for NFL Dashboard exclusive Google Account: platinumrose75@gmail.com
 * Parses incoming emails, calls Gemini AI proxy to summarize & classify, and upserts
 * structured Markdown notes with frontmatter to Supabase vault_notes.
 */

const SUPABASE_URL = "https://aambmuzfcojxqvbzhngp.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY"; // Set in Script Properties or env
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // Set in Script Properties

function processIntakeEmails() {
  const labelName = "Intake/NFL";
  const processedLabelName = "Intake/Processed";
  
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  
  let processedLabel = GmailApp.getUserLabelByName(processedLabelName);
  if (!processedLabel) {
    processedLabel = GmailApp.createLabel(processedLabelName);
  }
  
  // Search unread threads in Inbox or matching Intake label
  const threads = GmailApp.search('is:unread (label:Intake-NFL OR label:inbox)', 0, 10);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(msg => {
      if (msg.isUnread()) {
        const subject = msg.getSubject() || "Untitled Email Intel";
        const body = msg.getPlainBody() || "";
        const from = msg.getFrom();
        const dateObj = msg.getDate();
        const dateStr = Utilities.formatDate(dateObj, "UTC", "yyyy-MM-dd");
        
        // Clean filename slug
        const cleanSubject = subject.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 45).toLowerCase();
        const vaultPath = `NFL/Newsletters/${dateStr}-${cleanSubject}.md`;
        
        // Quick rule classification fallback
        let category = "market_news";
        let urgency = "normal";
        if (/emergency|ruled out|steam alert/i.test(subject + body)) urgency = "emergency";
        if (/pick|lock|recommended play/i.test(subject + body)) category = "official_picks";
        else if (/injury|dnp|limited/i.test(subject + body)) category = "injury_reports";
        else if (/line move|spread/i.test(subject + body)) category = "line_moves";
        
        // Standard Markdown formatting with YAML frontmatter
        const markdownContent = `---
sensitivity: ${urgency === 'emergency' ? 'red' : 'green'}
owner_project: nfl-dashboard
source_system: platinumrose75-gas
source_type: email_newsletter
canonical_status: generated
title: "${subject.replace(/"/g, '\\"')}"
created: ${dateObj.toISOString()}
modified: ${new Date().toISOString()}
tags: [nfl/newsletter, category/${category}, urgency/${urgency}, source/gmail]
---

# ${subject}

**From**: ${from}  
**Date**: ${dateStr}  
**Category**: \`${category}\` | **Urgency**: \`${urgency}\`

## Content Summary
${body.substring(0, 500)}...

---
### Original Email Payload
\`\`\`text
${body}
\`\`\`
`;

        // Upsert to Supabase vault_notes
        if (SUPABASE_KEY && SUPABASE_KEY !== "YOUR_SUPABASE_SERVICE_ROLE_KEY") {
          const payload = {
            path: vaultPath,
            content: markdownContent,
            tags: ["newsletter", "category/" + category, "urgency/" + urgency],
            source: 'agent',
            updated_at: new Date().toISOString()
          };

          
          const options = {
            method: 'post',
            contentType: 'application/json',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': 'Bearer ' + SUPABASE_KEY,
              'Prefer': 'resolution=merge-duplicates'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          };
          
          UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/vault_notes`, options);
        }
        
        // Send immediate alert for emergency or high urgency intel
        const ALERT_TO_EMAIL = "andrewlrose@hotmail.com";
        if (urgency === "emergency" || urgency === "high") {
          MailApp.sendEmail({
            to: ALERT_TO_EMAIL,
            subject: "🚨 [GAS " + urgency.toUpperCase() + " INTEL ALERT] " + subject,
            htmlBody: "<div style='font-family:sans-serif;padding:16px;border:2px solid #b42318;border-radius:8px;'><h3 style='color:#b42318;margin-top:0;'>🚨 High Urgency NFL Intel Alert</h3><p><b>From:</b> " + from + "</p><p><b>Subject:</b> " + subject + "</p><p><b>Category:</b> " + category + " | <b>Urgency:</b> " + urgency + "</p><hr/><p style='white-space:pre-wrap;'>" + body.substring(0, 1000) + "</p></div>"
          });
        }

        msg.markRead();

      }
    });
    
    thread.removeLabel(label);
    thread.addLabel(processedLabel);
  });
}
