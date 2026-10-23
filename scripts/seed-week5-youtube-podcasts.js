import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('--- 1. Updating existing RSS episodes with verified YouTube URLs ---');
  const updates = [
    { id: '8a7228d9-e3f7-4fb3-98a7-3c44d9c66d5a', youtube_url: 'https://www.youtube.com/watch?v=Uy2iBIBqCUs' },
    { id: 'd7d59ee5-46f6-44bd-a688-c5f6b5ff66fc', youtube_url: 'https://www.youtube.com/watch?v=-jqw2xpoLlU' },
    { id: 'ec6055f1-5971-4e98-9b10-93618023d534', youtube_url: 'https://www.youtube.com/watch?v=P3X8BD_4KTw' },
    { id: '3ce1d299-6f0c-4ed1-b514-17a87af21a56', youtube_url: 'https://www.youtube.com/watch?v=VL4Esqd7btw' },
    { id: 'ff1e957d-77c1-4f11-9e99-802cba8e3ea7', youtube_url: 'https://www.youtube.com/watch?v=zUZNHpEiIII' },
    { id: 'bfcd20cb-39ac-4fe8-a495-da06debf6193', youtube_url: 'https://www.youtube.com/watch?v=2-fTrFRuxNw' },
    { id: 'ad2effb1-b188-4a64-8f29-7e33be08b063', youtube_url: 'https://www.youtube.com/watch?v=5O_yW_iE1V0' },
  ];

  for (const u of updates) {
    const { error } = await sb.from('podcast_episodes').update({ youtube_url: u.youtube_url }).eq('id', u.id);
    if (error) console.error('Error updating', u.id, error.message);
    else console.log(`✓ Updated ${u.id} -> ${u.youtube_url}`);
  }

  console.log('\n--- 2. Seeding standalone Week 5 YouTube videos ---');
  const standalones = [
    {
      feed_id: '0d5a3fa5-b1e8-41a1-9b8d-1f523536c757', // Sharp or Square
      guid: 'youtube:y_Lr5V1mSVY',
      title: 'Professional NFL Gamblers Hotline Week 5 - Calls on Bears-Packers, Texans-Titans, Niners-Seahawks',
      pub_date: '2026-10-08T20:00:00Z',
      duration_secs: 550,
      youtube_url: 'https://www.youtube.com/watch?v=y_Lr5V1mSVY',
      status: 'discovered'
    },
    {
      feed_id: '8605b2d7-dbfa-49b7-b33e-6cf66be8e3c6', // BettingPros
      guid: 'youtube:SODLko3XWgE',
      title: 'NFL Thursday Night Football Bets & Player Props: Buccaneers vs. Cowboys Picks (Week 5)',
      pub_date: '2026-10-07T21:00:00Z',
      duration_secs: 1580,
      youtube_url: 'https://www.youtube.com/watch?v=SODLko3XWgE',
      status: 'discovered'
    },
    {
      feed_id: 'f4a11a38-1501-4ead-a94f-41abcabc0d07', // Even Money / Ross Tucker
      guid: 'youtube:47vtEAEbrhU',
      title: "Greg Cosell's 2026 NFL Week 5 PREVIEW Part 1",
      pub_date: '2026-10-08T14:00:00Z',
      duration_secs: 1660,
      youtube_url: 'https://www.youtube.com/watch?v=47vtEAEbrhU',
      status: 'discovered'
    },
    {
      feed_id: 'f4a11a38-1501-4ead-a94f-41abcabc0d07', // Even Money / Ross Tucker
      guid: 'youtube:DTqwGdX1leg',
      title: "Greg Cosell's 2026 NFL Week 5 PREVIEW: Part 2 + Buccaneers - Cowboys REACTION",
      pub_date: '2026-10-09T03:00:00Z',
      duration_secs: 1709,
      youtube_url: 'https://www.youtube.com/watch?v=DTqwGdX1leg',
      status: 'discovered'
    },
    {
      feed_id: 'f7215626-28f3-4e4e-8963-d093310d0577', // Action Network
      guid: 'youtube:D-VSFIRKqec',
      title: 'Our Anytime Touchdown Picks for Week 5 of The NFL Season!',
      pub_date: '2026-10-08T19:00:00Z',
      duration_secs: 2733,
      youtube_url: 'https://www.youtube.com/watch?v=D-VSFIRKqec',
      status: 'discovered'
    },
    {
      feed_id: 'eeb6fbc6-1130-4b01-bb9b-1f217cb20bc8', // SportsLine
      guid: 'youtube:YKf8QH6Mtis',
      title: 'NFL Picks: Bets for Every Week 5 Game!',
      pub_date: '2026-10-07T16:00:00Z',
      duration_secs: 3585,
      youtube_url: 'https://www.youtube.com/watch?v=YKf8QH6Mtis',
      status: 'discovered'
    },
    {
      feed_id: '17669dfb-b964-47de-93b9-e693749e78f5', // FantasyPros
      guid: 'youtube:9R50o6kkYUM',
      title: 'Fantasy Football Start or Sit Lineup Advice: Experts Pick Who To Start Week 5 (2026)',
      pub_date: '2026-10-08T18:00:00Z',
      duration_secs: 3399,
      youtube_url: 'https://www.youtube.com/watch?v=9R50o6kkYUM',
      status: 'discovered'
    }
  ];

  for (const s of standalones) {
    const { data: existing } = await sb.from('podcast_episodes').select('id, title').eq('guid', s.guid).limit(1);
    if (existing && existing.length > 0) {
      console.log(`- Already exists: ${existing[0].title} (${existing[0].id})`);
      continue;
    }
    const { data, error } = await sb.from('podcast_episodes').insert(s).select('id, title');
    if (error) console.error('Error inserting', s.title, error.message);
    else console.log(`✓ Inserted: ${data[0].title} (${data[0].id})`);
  }
}

main().catch(console.error);
