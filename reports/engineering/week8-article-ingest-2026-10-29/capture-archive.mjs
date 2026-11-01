// Audit the retained Action Network archive for stories omitted from its RSS.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { htmlToBodyText } from '../../../agents/lib/article-body.js';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const run = promisify(execFile);
const hash = value => createHash('sha256').update(value).digest('hex');
const capture = JSON.parse(await fs.readFile(path.join(OUT, 'expanded/capture.json'), 'utf8'));
const html = await fs.readFile(path.join(OUT, 'action-network-archive.html'), 'utf8');
const known = new Set(capture.rows.map(row => row.canonical_url.replace(/\/$/, '')));
const urls = [...new Set([...html.matchAll(/href=["'](https:\/\/www\.actionnetwork\.com\/nfl\/[^"'#?]+)["']/g)].map(match => match[1]))]
  .filter(url => !url.includes('/archive/') && url.split('/').pop().length > 25 && !known.has(url.replace(/\/$/, '')));
const rows = [];
const retained = process.argv.includes('--replay') ? JSON.parse(await fs.readFile(path.join(OUT,'archive-supplement.json'),'utf8')) : null;
const retainedByUrl = new Map((retained?.rows || []).map(row => [row.url,row]));
await fs.mkdir(path.join(OUT, 'archive-articles'), { recursive: true });
let index = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (index < urls.length) {
    const url = urls[index++];
    const stem = 'archive-articles/' + hash(url).slice(0, 20);
    const row = { source: 'Action Network', url, canonical_url: url, url_hash: hash(url), source_discovery: 'retained_public_NFL_archive_page_1', database_status: 'not_queried' };
    try {
      const saved = retainedByUrl.get(url);
      if (saved) row.http_status = saved.http_status;
      else {
        const { stdout } = await run('curl', ['-sS','-L','--max-time','20','--max-filesize','8000000','-A','Mozilla/5.0',
          '-o', path.join(OUT, stem + '.html'), '-w','%{http_code}',url], { timeout: 25000 });
        row.http_status = Number(stdout.trim());
      }
      const raw = await fs.readFile(path.join(OUT, stem + '.html'), 'utf8');
      row.raw_file = stem + '.html'; row.raw_sha256 = hash(raw);
      const title = (raw.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) ||
        raw.match(/"headline"\s*:\s*"([^"\n]+)"/i) || raw.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) ||
        raw.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
      row.title = htmlToBodyText(title);
      row.published_at = (raw.match(/"datePublished"\s*:\s*"([^"]+)"/i) || raw.match(/property=["']article:published_time["'][^>]*content=["']([^"']+)/i) || [])[1] || null;
      row.modified_at = (raw.match(/"dateModified"\s*:\s*"([^"]+)"/i) || raw.match(/property=["']article:modified_time["'][^>]*content=["']([^"']+)/i) || [])[1] || null;
      row.author = (raw.match(/"author"\s*:\s*\[?\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/i) || [])[1] || null;
      const article = (raw.match(/<article\b[\s\S]*?<\/article>/i) || raw.match(/<main\b[\s\S]*?<\/main>/i) || [raw])[0];
      let body = htmlToBodyText(article);
      row.body_extraction_scope = 'article_or_main_element';
      if (body.length < 500) { body = htmlToBodyText(raw); row.body_extraction_scope = 'whole_page_fallback_needs_chrome_review'; }
      await fs.writeFile(path.join(OUT, stem + '.txt'), body);
      row.body_file = stem + '.txt'; row.body_sha256 = hash(body); row.body_chars_retained = body.length;
      row.body = body.slice(0,200000);
      row.body_status = row.http_status !== 200 ? 'unavailable_http_' + row.http_status : body.length < 500 ? 'thin_public_body' :
        row.body_extraction_scope === 'article_or_main_element' ? 'public_body_captured_not_human_verified' : 'page_text_retained_needs_article_boundary_review';
      const pub = Date.parse(row.published_at), modified = Date.parse(row.modified_at);
      row.window_status = Number.isFinite(pub) && pub >= Date.parse(capture.since) && pub <= Date.parse(capture.through) ? 'publication_in_window' :
        Number.isFinite(modified) && modified >= Date.parse(capture.since) ? 'updated_evergreen_requires_revision_review' :
        Number.isFinite(pub) ? 'older_publication_excluded' : 'date_not_verified_hold';
    } catch(error) { row.error = String(error.message).slice(0,300); row.window_status='fetch_error_hold'; }
    rows.push(row);
  }
}));
const result = { schema:'local_archive_gap_audit_v1',generated_at:new Date().toISOString(),since:capture.since,
  archive_url:'https://www.actionnetwork.com/nfl/archive/1',archive_raw_sha256:hash(html),
  archive_urls_absent_from_retained_feeds:urls.length,rows, paid_calls:0,supabase_actions:0 };
await fs.writeFile(path.join(OUT,'archive-supplement.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({archived_candidates:rows.length,by_window:Object.fromEntries([...new Set(rows.map(row=>row.window_status))].map(status=>[status,rows.filter(row=>row.window_status===status).length])),
  current_candidates:rows.filter(row=>['publication_in_window','updated_evergreen_requires_revision_review'].includes(row.window_status)).map(row=>({title:row.title,published_at:row.published_at,modified_at:row.modified_at,status:row.window_status}))},null,2));
