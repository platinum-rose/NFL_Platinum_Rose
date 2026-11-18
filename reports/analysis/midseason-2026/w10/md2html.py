"""Minimal markdown -> standalone HTML for the mid-season reports (headings, tables, lists, bold, code). Usage: python3 md2html.py in.md out.html"""
import html, re, sys
src = open(sys.argv[1], encoding='utf-8').read().split('\n')
def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t); t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    return t.replace('\\|', '|')
out = []; i = 0; title = 'Report'
while i < len(src):
    l = src[i]
    if l.startswith('#'):
        n = len(l) - len(l.lstrip('#')); txt = l[n:].strip()
        if n == 1: title = txt
        out.append(f'<h{n}>{inline(txt)}</h{n}>'); i += 1
    elif l.startswith('|'):
        rows = []
        while i < len(src) and src[i].startswith('|'):
            rows.append([c.strip() for c in re.split(r'(?<!\\)\|', src[i].strip().strip('|'))]); i += 1
        out.append('<div class="tw"><table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in rows[0]) + '</tr></thead><tbody>')
        for r in rows[2:]: out.append('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>')
        out.append('</tbody></table></div>')
    elif re.match(r'^(\d+\.|-) ', l):
        tag = 'ol' if l[0].isdigit() else 'ul'; out.append(f'<{tag}>')
        while i < len(src) and re.match(r'^(\d+\.|-) ', src[i]):
            out.append('<li>' + inline(re.sub(r'^(\d+\.|-) ', '', src[i])) + '</li>'); i += 1
        out.append(f'</{tag}>')
    elif l.startswith('```'):
        i += 1; buf = []
        while i < len(src) and not src[i].startswith('```'): buf.append(html.escape(src[i])); i += 1
        i += 1; out.append('<pre>' + '\n'.join(buf) + '</pre>')
    elif l.strip(): out.append(f'<p>{inline(l)}</p>'); i += 1
    else: i += 1
css = """body{font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:1080px;margin:28px auto;padding:0 18px;color:#1c1f24;background:#fff}
h1{font-size:26px;margin-bottom:4px}h2{font-size:20px;margin-top:34px;border-bottom:2px solid #9b1b30;padding-bottom:4px}h3{font-size:16px;margin-top:24px}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;margin:10px 0 18px;font-size:13.5px}th,td{border:1px solid #d5d8dd;padding:5px 8px;text-align:left;vertical-align:top}
th{background:#f3f4f6}tr:nth-child(even) td{background:#fafafa}code,pre{font:12.5px Consolas,monospace;background:#f3f4f6;border-radius:3px}code{padding:1px 4px}pre{padding:10px;overflow-x:auto}
@media(prefers-color-scheme:dark){body{background:#14161a;color:#e6e8eb}th{background:#22262c}td,th{border-color:#3a3f47}tr:nth-child(even) td{background:#1a1d22}code,pre{background:#22262c}}
@media print{body{max-width:none;margin:0}h2{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid}}"""
open(sys.argv[2], 'w', encoding='utf-8').write(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title><style>{css}</style></head><body>\n' + '\n'.join(out) + '\n</body></html>\n')
