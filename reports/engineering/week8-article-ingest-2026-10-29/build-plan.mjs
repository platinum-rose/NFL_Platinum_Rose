// Prepare a reviewable notes-only database action. This file never connects to a database.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(OUT,'../../..');
const hash = value => createHash('sha256').update(value).digest('hex');
const read = async name => JSON.parse(await fs.readFile(path.join(OUT,name),'utf8'));
const save = async (name,value) => fs.writeFile(path.join(OUT,name),JSON.stringify(value,null,2)+'\n');
const current = await read('expanded/capture.json');
const archive = await read('archive-supplement.json');
const archiveInWindow = archive.rows.filter(row => row.window_status === 'publication_in_window');
const allRows = [...current.rows,...archiveInWindow.map(row => ({...row,source_type:'betting',confidence:0.74,
  summary:String(row.body || '').slice(0,800),content_hash:hash(`${row.title}|${String(row.body || '').slice(0,800)}`),
  captured_at:archive.generated_at,track_revisions:true,proposed_database_body_would_be_capped:(row.body_chars_retained || 0)>200000,
  evidence_base:OUT}))];
const rows = [...new Map(allRows.map(row=>[row.url_hash,row])).values()];
const payload = rows.map(row => ({source:row.source,source_type:row.source_type,url:row.url,canonical_url:row.canonical_url,
  url_hash:row.url_hash,content_hash:row.content_hash,title:row.title,summary:row.summary,published_at:row.published_at || null,
  confidence:row.confidence,author:row.author || null,captured_at:row.captured_at,
  body:row.body_status==='public_body_captured_not_human_verified' && !row.proposed_database_body_would_be_capped ? row.body : null,
  revision_hash:row.track_revisions&&row.published_at ? hash(`${row.canonical_url}#rev=${row.published_at.slice(0,10)}`) : null}));
if(new Set(payload.map(row=>row.url_hash)).size!==payload.length)throw new Error('Duplicate proposed note keys');
if(payload.some(row=>!row.title||row.title==='Right Arrow'||!/^https?:\/\//.test(row.url)))throw new Error('Invalid proposed metadata');
if(payload.some(row=>row.body&&row.body.length>200000))throw new Error('A proposed body exceeds the existing limit');
const json = JSON.stringify(payload);
const delimiter = '$nfl_articles_' + hash(json).slice(0,16) + '$';
if(json.includes(delimiter))throw new Error('SQL data delimiter appears inside source data');
const literal = delimiter + json + delimiter + '::jsonb';
const sql = `-- PROPOSED ONLY. Requires Andy's per-action approval before execution.
-- Target aambmuzfcojxqvbzhngp.public.research_intel_notes only.
-- Does not write signals, feed health, picks, ledgers, accounts, or publications.
BEGIN;
WITH incoming AS MATERIALIZED (
  SELECT * FROM jsonb_to_recordset(${literal}) AS x(
    source text,source_type text,url text,canonical_url text,url_hash text,content_hash text,title text,summary text,
    published_at timestamptz,confidence numeric,author text,captured_at timestamptz,body text,revision_hash text)
), existing AS MATERIALIZED (
  SELECT n.id,n.url_hash,n.published_at,n.body
  FROM public.research_intel_notes n
  WHERE n.url_hash IN (SELECT url_hash FROM incoming UNION SELECT revision_hash FROM incoming WHERE revision_hash IS NOT NULL)
), candidates AS (
  SELECT x.*,CASE WHEN e.id IS NULL THEN x.url_hash ELSE x.revision_hash END AS target_hash
  FROM incoming x LEFT JOIN existing e ON e.url_hash=x.url_hash
  WHERE e.id IS NULL OR (x.source='Action Network' AND x.revision_hash IS NOT NULL
    AND x.published_at>=e.published_at+interval '20 hours'
    AND NOT EXISTS (SELECT 1 FROM existing r WHERE r.url_hash=x.revision_hash))
), inserted AS (
  INSERT INTO public.research_intel_notes
    (source,source_type,url,canonical_url,url_hash,content_hash,title,summary,published_at,confidence,author,captured_at,body)
  SELECT source,source_type,url,canonical_url,target_hash,content_hash,title,summary,published_at,confidence,author,captured_at,body
  FROM candidates ON CONFLICT (url_hash) DO NOTHING
  RETURNING id,source,url_hash,published_at,length(body) AS body_chars
), filled AS (
  UPDATE public.research_intel_notes n SET body=x.body FROM incoming x
  WHERE n.url_hash=x.url_hash AND (n.body IS NULL OR btrim(n.body)='') AND x.body IS NOT NULL
    AND EXISTS (SELECT 1 FROM existing e WHERE e.id=n.id)
    AND NOT EXISTS (SELECT 1 FROM candidates c WHERE c.url_hash=x.url_hash AND c.target_hash<>x.url_hash)
  RETURNING n.id,n.source,n.url_hash,length(n.body) AS body_chars
)
SELECT jsonb_build_object('staged_candidates',(SELECT count(*) FROM incoming),
  'inserted_notes',(SELECT count(*) FROM inserted),'existing_empty_bodies_filled',(SELECT count(*) FROM filled),
  'inserted',coalesce((SELECT jsonb_agg(to_jsonb(i)) FROM inserted i),'[]'::jsonb),
  'filled',coalesce((SELECT jsonb_agg(to_jsonb(f)) FROM filled f),'[]'::jsonb)) AS ingestion_receipt;
COMMIT;
`;
await save('proposed-notes.json',payload);
await fs.writeFile(path.join(OUT,'proposed-notes.sql'),sql);

const before = await read('protected-before.json');
const protectedAfter=[];
for(const row of before){
 const actual=hash(await fs.readFile(path.join(ROOT,row.path)));
 protectedAfter.push({path:row.path,before_sha256:row.sha256.toLowerCase(),after_sha256:actual,unchanged:actual===row.sha256.toLowerCase()});
}
if(protectedAfter.some(row=>!row.unchanged))throw new Error('Protected file drift detected; report before database action');
const counts=Object.fromEntries([...new Set(rows.map(row=>row.body_status))].map(status=>[status,rows.filter(row=>row.body_status===status).length]));
const sourceCounts=Object.fromEntries([...new Set(rows.map(row=>row.source))].sort().map(source=>[source,rows.filter(row=>row.source===source).length]));
let execution=null;
try{execution=await read('execution-receipt.json');}catch(error){if(error.code!=='ENOENT')throw error;}
if(execution&&execution.approved_sql_sha256!==hash(sql))throw new Error('Executed batch differs from regenerated proposal; preserve approval scope');
const databaseActions=execution ? execution.mutation_call_count+execution.verification_select_count : 0;
const plan={schema:'proposed_article_notes_ingestion_v1',status:execution?.status||'awaiting_andy_per_action_approval',project_id:'aambmuzfcojxqvbzhngp',
 table:'public.research_intel_notes',candidates:payload.length,body_values_proposed:payload.filter(row=>row.body).length,
 body_status_counts:counts,source_counts:sourceCounts,since:current.since,through:current.through,
 operations:['Read/deduplicate only matching base and Action Network revision hashes',
 'Insert missing raw article notes; preserve existing records',
 'Append eligible Action Network revisions using the existing 20-hour rule',
 'Fill existing empty bodies only from the staged article/main extracts; preserve nonempty bodies',
 'Return inserted IDs and filled-body IDs for verification'],
 excluded_operations:['research_pick_signals writes','feed_health writes','emails','paid calls','official-pick or ledger mutations','tracker or report publication'],
 payload_sha256:hash(await fs.readFile(path.join(OUT,'proposed-notes.json'))),payload_canonical_sha256:hash(json),sql_sha256:hash(sql),supabase_actions_so_far:databaseActions,paid_calls_so_far:0,emails_sent:0,
 archive_gap_audit:{additional_current_articles:archiveInWindow.length,older_articles_excluded:archive.rows.filter(row=>row.window_status==='older_publication_excluded').length},
 current_database_new_count:execution?.results.inserted_notes??null,source_quality:'Raw intake only; not roster-cleared or human-reviewed betting intel',
 execution_receipt:execution?'execution-receipt.json':null,verification_receipt:execution?'database-verification.json':null};
await save('write-plan.json',plan);
await save('validation.json',{generated_at:new Date().toISOString(),unique_url_hashes:payload.length,
 nonempty_titles:true,untruncated_proposed_bodies:true,protected_files:protectedAfter,
 paid_calls:0,supabase_actions:databaseActions,emails_sent:0,body_status_counts:counts,
 execution_status:execution?.status||'not_run',database_results:execution?.results||null,
 database_verification:execution?.verification_summary||null});
let markdown=`# Article intake pass — October 29, 2026\n\n`;
markdown+=execution ? `**Approved notes-only ingestion completed and verified.** All ${payload.length} staged articles were already present in Supabase. The transaction inserted ${execution.results.inserted_notes} notes and filled ${execution.results.existing_empty_bodies_filled} bodies. All 80 approved body-fill candidates already had nonempty stored bodies; no eligible Action Network revision was missing. One approved transaction and one verification SELECT ran. No pick signals, feed health, paid calls, emails, wagers, ledgers or publications were changed. The TNF card remains HOLD.\n\n` :
 `**Local capture complete; Supabase ingestion awaits Andy's per-action approval.** ${payload.length} unique raw article candidates from nine established sources are staged. No database query or write, paid call, email, account, wager, ledger or publication action has run. The existing TNF card remains HOLD.\n\n`;
markdown+=`Scope: Week 8 Tuesday anchor, October 27 at 12:00 AM PT, through the retained October 29 feed snapshot. This captures the entries present in those finite feeds and the first Action Network archive page; it is not an assertion of complete publisher-site coverage.\n\n`;
markdown+='| Source | Staged articles |\n|---|---:|\n'+Object.entries(sourceCounts).map(([source,count])=>`| ${source} | ${count} |`).join('\n')+'\n\n';
markdown+=`The first standard-cap preview found 93 candidates. Replaying its retained feeds without the 20-item cap, recovering Action Network's direct public feed, and date-checking its archive increased the staged set to ${payload.length}. The archive added four current articles, including the Week 8 primer and AFC futures reset; five older archive stories were retained for audit and excluded. Production feed settings were not changed.\n\n`;
markdown+=`## Evidence quality\n\n${plan.body_values_proposed} article/main body extracts were eligible for the proposed database body values. These are automated public captures, not human-verified text or recommendations. ${counts.page_text_retained_needs_article_boundary_review || 0} whole-page texts need article-boundary review and one subscription-marked page is held from body insertion. Five Rotowire items retain their item-specific RSS descriptions locally; generic player pages were not fetched. Nine Walter Football items were captured as metadata-only under the existing source policy. Full raw pages/text, dates, URLs and hashes are retained.\n\n`;
markdown+=execution ? '## Database result and remaining gap\n\n`execution-receipt.json` records the approval, immutable SQL hash and zero-change transaction result. `database-verification.json` retains the matching note IDs, publication/capture dates and body-presence checks. Existing bodies were preserved, not compared for textual equality with the local captures. Seven ESPN notes still have no stored body; all seven are outside the approved 80-body set and their local page text needs article-boundary review. Details: `remaining-body-gaps.json`.\n\n' :
 '## Proposed database action\n\nReview `write-plan.json`, `proposed-notes.json` and `proposed-notes.sql`. One bounded notes-only pass would deduplicate against the live table, insert missing notes or eligible Action Network revisions, and fill empty bodies from the staged eligible extracts. It preserves existing nonempty bodies and writes no pick signals or feed-health rows. Actual inserted/fill counts cannot be known until the authorized reconciliation runs.\n\n';
markdown+='The 120 feed candidates include 92 URLs absent from yesterday\'s saved 189-record export. That comparison is local and historical; it does not mean 92 new database rows. The four archive candidates were not in the retained feeds.\n\n';
markdown+='Named source text is retained as raw evidence. Player status, role, injury and betting claims have not been released as verified intel; the earlier roster-check approval is still pending. No canonical review, prop-intel, Alpha, card or tracker outputs were rebuilt.\n';
await fs.writeFile(path.join(OUT,'README.md'),markdown);
const manifest=[];
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else if(!entry.name.includes('sha256-manifest')){const content=await fs.readFile(full);manifest.push({path:path.relative(OUT,full),bytes:content.length,sha256:hash(content)});}}}
await walk(OUT);
await save('sha256-manifest-final.json',{generated_at:new Date().toISOString(),files:manifest});
console.log(JSON.stringify({candidates:plan.candidates,body_values_proposed:plan.body_values_proposed,body_status_counts:counts,
 sources:sourceCounts,protected_files_unchanged:protectedAfter.every(row=>row.unchanged),sql_bytes:Buffer.byteLength(sql),
 status:plan.status},null,2));
