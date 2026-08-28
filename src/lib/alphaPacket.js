import { ALPHA_FANTASY_LEAGUE_IDS, ALPHA_PROFILE_IDS } from './profiles.js';

export const ALPHA_PACKET_SCHEMA_VERSION = 'alpha_packet_v1';

export const REQUIRED_ALPHA_PACKET_FIELDS = [
  'schema_version',
  'generated_at',
  'season',
  'alpha_window',
  'profiles',
  'fantasy_leagues',
  'fantasy_team_packets',
  'nfl_team_dashboards',
  'schedule',
  'injuries',
  'market_context',
  'supercontest_demo_lines',
  'survivor_demo_slate',
  'source_provenance',
];

export const REQUIRED_ALPHA_MANIFEST_FIELDS = [
  'schema_version',
  'generated_at',
  'season',
  'required_profile_ids',
  'files',
  'source_provenance',
];

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const isValidIsoDate = (value) => {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
};

const validateScheduleKickoffs = (schedule, errors) => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    errors.push('schedule must be a non-empty array');
    return;
  }

  schedule.forEach((game, index) => {
    if (!isObject(game)) {
      errors.push(`schedule[${index}] must be an object`);
      return;
    }
    if (!isValidIsoDate(game.kickoff_utc)) {
      errors.push(`schedule[${index}].kickoff_utc must be an ISO timestamp`);
    }
  });
};

const validateTeamDashboards = (dashboards, errors) => {
  if (!Array.isArray(dashboards) || dashboards.length !== 32) {
    errors.push('nfl_team_dashboards must contain all 32 NFL teams');
    return;
  }

  dashboards.forEach((team, index) => {
    if (!team?.team_abbr) errors.push(`nfl_team_dashboards[${index}].team_abbr is required`);
    if (!team?.full_name) errors.push(`nfl_team_dashboards[${index}].full_name is required`);
  });
};

export const validateAlphaPacket = (packet) => {
  const errors = [];
  if (!isObject(packet)) {
    return { ok: false, errors: ['Alpha packet must be an object'] };
  }

  for (const field of REQUIRED_ALPHA_PACKET_FIELDS) {
    if (!(field in packet)) errors.push(`Missing required field: ${field}`);
  }

  const profileIds = Array.isArray(packet.profiles)
    ? packet.profiles.map((profile) => profile?.id).filter(Boolean)
    : [];
  for (const requiredId of ALPHA_PROFILE_IDS) {
    if (!profileIds.includes(requiredId)) {
      errors.push(`Missing required Alpha profile: ${requiredId}`);
    }
  }

  const leagueIds = Array.isArray(packet.fantasy_leagues)
    ? packet.fantasy_leagues.map((league) => league?.id).filter(Boolean)
    : [];
  for (const requiredLeagueId of ALPHA_FANTASY_LEAGUE_IDS) {
    if (!leagueIds.includes(requiredLeagueId)) {
      errors.push(`Missing required fantasy league: ${requiredLeagueId}`);
    }
  }

  validateScheduleKickoffs(packet.schedule, errors);
  validateTeamDashboards(packet.nfl_team_dashboards, errors);

  return { ok: errors.length === 0, errors };
};

export const validateAlphaManifest = (manifest) => {
  const errors = [];
  if (!isObject(manifest)) {
    return { ok: false, errors: ['Alpha manifest must be an object'] };
  }

  for (const field of REQUIRED_ALPHA_MANIFEST_FIELDS) {
    if (!(field in manifest)) errors.push(`Missing required field: ${field}`);
  }

  if (!Array.isArray(manifest.required_profile_ids)) {
    errors.push('required_profile_ids must be an array');
  } else {
    for (const requiredId of ALPHA_PROFILE_IDS) {
      if (!manifest.required_profile_ids.includes(requiredId)) {
        errors.push(`Manifest missing required Alpha profile id: ${requiredId}`);
      }
    }
  }

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    errors.push('files must be a non-empty array');
  } else {
    manifest.files.forEach((file, index) => {
      if (!file?.path) errors.push(`files[${index}].path is required`);
      if (!file?.schema_version) errors.push(`files[${index}].schema_version is required`);
      if (!file?.generated_at) errors.push(`files[${index}].generated_at is required`);
      if (!file?.sha256 && !file?.hash) errors.push(`files[${index}] must include sha256 or hash`);
    });
  }

  return { ok: errors.length === 0, errors };
};
