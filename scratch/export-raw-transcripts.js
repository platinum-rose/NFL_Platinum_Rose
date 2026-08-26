import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function fmtTimestamp(sec) {
  const totalSec = Math.floor(sec);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const EPISODES = [
  {
    id: '770aa638-b82b-4fb3-8e2f-8316b02e6635',
    title: 'Sharp_or_Square_AFC_East_Betting_Preview',
    speakerMap: { 'E': 'Chad Millman', 'D': 'Simon Hunter' }
  },
  {
    id: '463708c5-9dfb-44ba-a49b-cacf21eb506d',
    title: 'Sharp_or_Square_NFC_East_Betting_Preview',
    speakerMap: { 'F': 'Chad Millman', 'G': 'Simon Hunter' }
  }
];

async function exportRawTranscripts() {
  const outDir = path.resolve(process.cwd(), 'scratch/raw_transcripts');
  fs.mkdirSync(outDir, { recursive: true });

  for (const ep of EPISODES) {
    console.log(`Exporting raw transcript for ${ep.title} (${ep.id})...`);

    const { data: epData } = await sb.from('podcast_episodes').select('*, feed:podcast_feeds(*)').eq('id', ep.id).single();
    const { data: tRow } = await sb.from('podcast_transcripts').select('*').eq('episode_id', ep.id).single();

    if (!tRow) {
      console.warn(`No transcript found for episode ${ep.id}`);
      continue;
    }

    const segs = tRow.speaker_segments || [];
    let formattedText = `================================================================================\n`;
    formattedText += `RAW PODCAST TRANSCRIPT FOR CODEX SUMMARIZATION & AUDIT\n`;
    formattedText += `Episode Title: ${epData?.title || ep.title}\n`;
    formattedText += `Episode ID: ${ep.id}\n`;
    formattedText += `Published Date: ${epData?.pub_date || 'N/A'}\n`;
    formattedText += `Audio URL: ${epData?.audio_url || 'N/A'}\n`;
    formattedText += `Speaker Attribution: ${JSON.stringify(ep.speakerMap)}\n`;
    formattedText += `Total Speaker Turns: ${segs.length}\n`;
    formattedText += `================================================================================\n\n`;

    segs.forEach((s, idx) => {
      const speakerName = ep.speakerMap[s.speaker] || `Speaker ${s.speaker}`;
      const startFmt = fmtTimestamp(s.start);
      const endFmt = fmtTimestamp(s.end);
      formattedText += `[Turn #${idx + 1}] [${startFmt} - ${endFmt}] ${speakerName}:\n${s.text}\n\n`;
    });

    const txtPath = path.join(outDir, `${ep.title}_raw_transcript.txt`);
    const jsonPath = path.join(outDir, `${ep.title}_raw_transcript.json`);

    fs.writeFileSync(txtPath, formattedText, 'utf-8');
    fs.writeFileSync(jsonPath, JSON.stringify({ metadata: epData, speakerMap: ep.speakerMap, speaker_segments: segs }, null, 2), 'utf-8');

    console.log(`✓ Exported formatted TXT: ${txtPath} (${formattedText.length} chars)`);
    console.log(`✓ Exported JSON payload: ${jsonPath}`);
  }

  console.log(`\n✅ Raw transcript exports ready in: ${outDir}`);
}

exportRawTranscripts().catch(console.error);
