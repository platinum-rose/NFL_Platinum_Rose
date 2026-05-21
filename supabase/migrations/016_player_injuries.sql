-- F-19: Player injuries table
-- Source : ESPN injuries API
--          site.api.espn.com/apis/site/v2/sports/football/nfl/injuries
-- Populated by : agents/injury-ingest.js
-- Schedule     : Mon/Wed/Thu/Fri via .github/workflows/injury-ingest.yml

create table if not exists public.player_injuries (
  id               bigserial    primary key,
  espn_injury_id   text         not null,
  espn_player_id   text,
  player_name      text         not null,
  team_abbr        text         not null,
  position         text,
  -- Out | Doubtful | Questionable | Probable | Active | IR | PUP | Unknown
  injury_status    text         not null,
  -- Body part parsed from shortComment parenthetical, e.g. "knee"
  injury_type      text,
  short_comment    text,
  long_comment     text,
  reported_at      timestamptz,
  captured_at      timestamptz  default now(),

  constraint player_injuries_espn_injury_id_key unique (espn_injury_id)
);

create index if not exists idx_player_injuries_team
  on public.player_injuries (team_abbr);

create index if not exists idx_player_injuries_status
  on public.player_injuries (injury_status);

create index if not exists idx_player_injuries_player
  on public.player_injuries (espn_player_id, captured_at desc);

create index if not exists idx_player_injuries_reported
  on public.player_injuries (reported_at desc);

comment on table public.player_injuries is
  'Player injury and roster news from ESPN. Upserted by injury-ingest.js on '
  'Mon/Wed/Thu/Fri. espn_injury_id is the upsert key — same record is '
  'updated in place when ESPN updates a report.';

comment on column public.player_injuries.espn_injury_id is
  'ESPN injury report ID — unique per report, used as upsert key.';

comment on column public.player_injuries.injury_type is
  'Body part extracted from shortComment parenthetical, e.g. "knee", "ankle". '
  'Null for Active news items with no body-part mention.';
