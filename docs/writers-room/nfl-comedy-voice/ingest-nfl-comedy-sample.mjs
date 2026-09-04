import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_PATH = 'E:\\dev\\projects\\Writers_Room\\docs\\Fw_ this just in.eml';
const OUT_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const INGEST_DATE = '2026-09-04';

function decodeQuotedPrintable(value) {
  return value
    .replace(/=\r?\n/g, '')
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function normalizeLines(value) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractPlainText(raw) {
  const boundaryMatch = raw.match(/boundary="([^"]+)"/i);
  if (!boundaryMatch) {
    throw new Error('No MIME boundary found in source email.');
  }

  const boundary = boundaryMatch[1];
  const parts = raw.split(`--${boundary}`);
  const plainPart = parts.find((part) => /Content-Type:\s*text\/plain/i.test(part));
  if (!plainPart) {
    throw new Error('No text/plain MIME part found in source email.');
  }

  const bodyStart = plainPart.search(/\r?\n\r?\n/);
  if (bodyStart < 0) {
    throw new Error('No header/body separator found in text/plain MIME part.');
  }

  const separator = plainPart.match(/\r?\n\r?\n/)[0];
  const body = plainPart.slice(bodyStart + separator.length);
  return normalizeLines(decodeQuotedPrintable(body));
}

function extractForwardedArticle(plainText) {
  const start = plainText.search(/^updated\s+\d/m);
  const end = plainText.search(/^Copyright\s+2008/m);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('Could not identify forwarded parody article bounds.');
  }

  const copyrightEnd = plainText.indexOf('\n', end);
  const article = copyrightEnd > end
    ? plainText.slice(start, copyrightEnd)
    : plainText.slice(start);

  return normalizeLines(article)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, '[redacted-phone]')
    .replace(/https?:\/\/\S+/gi, '[redacted-url]');
}

function countMatches(value, pattern) {
  return Array.from(value.matchAll(pattern)).length;
}

function writeJson(fileName, value) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(fileName, value) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${value.trim()}\n`, 'utf8');
}

const raw = fs.readFileSync(SOURCE_PATH, 'utf8');
const plainText = extractPlainText(raw);
const articleText = extractForwardedArticle(plainText);
const sourceHash = crypto.createHash('sha256').update(raw).digest('hex');
const articleHash = crypto.createHash('sha256').update(articleText).digest('hex');
const wordCount = articleText.split(/\s+/).filter(Boolean).length;

const sample = {
  schema_version: 1,
  ingest_date: INGEST_DATE,
  source: {
    path: SOURCE_PATH,
    source_hash_sha256: sourceHash,
    source_status_at_ingest: 'untracked in Writers_Room',
    forwarded_subject: 'Fw: this just in',
    forwarded_timestamp_utc: '2026-09-04T06:54:47Z',
    original_timestamp_local: '2008-07-10T12:14:00',
    author_context: 'Andy-authored sample, per user context',
    privacy: 'local private source; contact headers excluded from derived artifacts'
  },
  sample: {
    id: 'nfl-comedy-voice-2008-fat-lazy-americans-this-just-in',
    title: 'this just in',
    article_hash_sha256: articleHash,
    type: 'fantasy football fake wire-service parody',
    voice_family: 'NFL comedy report',
    separate_from: ['Abracadickface Records revival voice'],
    target_use: 'Writers Room seed for future NFL_Dashboard comedy reports',
    text: articleText,
    metrics: {
      word_count: wordCount,
      paragraph_count: articleText.split(/\n\n+/).filter(Boolean).length,
      direct_quote_count: countMatches(articleText, /"/g) / 2,
      bracketed_editorial_aside_count: countMatches(articleText, /\[[^\]]+\]/g)
    }
  },
  extracted_voice_profile: {
    stance: [
      'mock-serious sports desk reporting applied to ridiculous fantasy-football stakes',
      'arrogant franchise mythology delivered through deadpan wire-service structure',
      'adult, abrasive, old-league trash-talk edge'
    ],
    devices: [
      'fake AP/NBC dateline and update scaffolding',
      'coach and commissioner quote structure',
      'press-conference style attribution',
      'editorial bracket asides',
      'league-history callbacks and rival-team continuity',
      'mundane offseason-process language escalated into absurd claims',
      'fake legal/trademark/newsroom boilerplate'
    ],
    recurring_material: [
      'Fat Lazy Americans',
      'Dr. Acropolis Furious',
      'No Talent Ass Clowns',
      'losing-record championship season',
      'Brett Favre retirement uncertainty',
      'mock commissioner-rumor ecosystem'
    ],
    boundaries: [
      'comedy layer only; do not mutate picks, portfolios, parlays, rosters, or official recommendations',
      'keep separate from Abracadickface persona/band voice',
      'use real NFL/fantasy facts only when separately sourced in NFL_Dashboard',
      'do not preserve email addresses, phone numbers, or recipient metadata in downstream voice artifacts'
    ],
    open_needs: [
      'ingest at least one modern NFL comedy-report example before locking the production voice',
      'define target franchises/leagues and real-data fields available to the report generator',
      'decide how abrasive/adult the published surface should be per destination'
    ]
  }
};

const corpusRecord = {
  id: sample.sample.id,
  ingest_date: INGEST_DATE,
  source_path: SOURCE_PATH,
  article_hash_sha256: articleHash,
  voice_family: sample.sample.voice_family,
  target_use: sample.sample.target_use,
  text: articleText,
  tags: [
    'nfl-comedy',
    'fantasy-football',
    'fake-wire-report',
    'andy-authored',
    'adult-edge',
    'source-seed'
  ]
};

const profileMd = `# NFL Comedy Voice Seed - 2008 Fantasy Wire Parody

Generated: ${INGEST_DATE}

## Source

- Source file: \`${SOURCE_PATH}\`
- Source status at ingest: untracked in \`Writers_Room\`
- Forwarded subject: \`Fw: this just in\`
- Original sample date: 2008-07-10
- Author context: Andy-authored, per user context
- Privacy note: email headers, recipient details, signatures, phone numbers, and addresses are excluded from this profile.

## Role

This is a private seed for the NFL_Dashboard Writers Room comedy-report voice. It is not the Abracadickface Records revival voice, and it should not be used to modify real picks, portfolios, parlays, rosters, proposal slots, or betting recommendations.

## Voice Fingerprint

- Fake wire-service seriousness wrapped around fantasy-football nonsense.
- Coach-speak and league-office drama treated like breaking national sports news.
- Self-mythologizing franchise arrogance, rivalry lore, and invented institutional history.
- Adult, abrasive, trash-talk-friendly edge.
- Deadpan reportorial surface with occasional editorial asides.
- Escalation pattern: ordinary offseason detail, inflated quote, ridiculous personal or league scandal, then fake-newsroom boilerplate.

## Useful Devices

- Dateline/update framing.
- Attributed quotes from exaggerated coaches, commissioners, or front-office figures.
- Rival-team callbacks and fake historical continuity.
- Mock legal, trademark, or syndication language.
- Bracketed editorial interruptions.
- Mundane NFL process language repurposed for absurd fantasy stakes.

## Guardrails

- Keep this as a comedy skin layered over separately verified NFL/fantasy facts.
- Keep the Abracadickface voice and NFL comedy-report voice separate.
- Preserve the abrasive/adult edge for now, but decide per destination before publishing.
- Strip private email/contact metadata from downstream artifacts.
- Ingest at least one current NFL comedy sample before treating this as a production-ready style guide.

## Generated Files

- \`nfl_comedy_voice_sample_2008_fat_lazy_americans.json\`: structured sample with cleaned article text.
- \`nfl_comedy_voice_corpus_2026-09-04.jsonl\`: corpus record for future Writers Room tooling.
- \`nfl_comedy_voice_profile_seed_2026-09-04.md\`: this profile seed.
`;

writeJson('nfl_comedy_voice_sample_2008_fat_lazy_americans.json', sample);
writeText('nfl_comedy_voice_corpus_2026-09-04.jsonl', JSON.stringify(corpusRecord));
writeText('nfl_comedy_voice_profile_seed_2026-09-04.md', profileMd);

console.log(JSON.stringify({
  ok: true,
  output_dir: OUT_DIR,
  sample_id: sample.sample.id,
  word_count: wordCount,
  article_hash_sha256: articleHash
}, null, 2));
