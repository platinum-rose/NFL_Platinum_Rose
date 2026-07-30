#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANUAL_DIR = path.join(ROOT, 'data', 'secondary-matchups', 'manual');

const STALE_AFTER = "2026-09-15T00:00:00.000Z";
const UPDATED_AT = "2026-07-30T17:00:00.000Z";
const SOURCE_DATE = "2026-07-30";
const SOURCE_URL = "https://www.ourlads.com/nfl-depth-charts/";

// -----------------------------------------------------------------------------
// 1. COVERAGE SCHEMES (32 Teams)
// -----------------------------------------------------------------------------
const COVERAGE_SCHEMES = [
  {
    team: "ARI", season: 2026, week: 1,
    primary_coverage_family: "zone_match", scheme_tags: ["zone_heavy", "two_high", "match_zone"],
    pressure_profile: "front_dependent", confidence: 0.65,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Gannon zone match defense with two-high split safety tendency.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "ATL", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "two_high", "quarters"],
    pressure_profile: "balanced", confidence: 0.70,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Jimmy Lake quarters/match zone scheme relying on Jessie Bates deep range.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "BAL", season: 2026, week: 1,
    primary_coverage_family: "man_match", scheme_tags: ["man_heavy", "single_high", "blitz_heavy"],
    pressure_profile: "aggressive", confidence: 0.85,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Orr aggressive blitz-heavy man match structure with Kyle Hamilton roaming.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "BUF", season: 2026, week: 1,
    primary_coverage_family: "zone_heavy", scheme_tags: ["zone_heavy", "two_high", "quarters"],
    pressure_profile: "coverage_first", confidence: 0.80,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "McDermott Cover 4 / Cover 6 zone-heavy structure featuring Taron Johnson in slot.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "CAR", season: 2026, week: 1,
    primary_coverage_family: "zone_heavy", scheme_tags: ["zone_heavy", "single_high"],
    pressure_profile: "passive", confidence: 0.60,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Ejiro Evero 3-4 base zone scheme funneling passing volume underneath.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "CHI", season: 2026, week: 1,
    primary_coverage_family: "cover_2_two_high", scheme_tags: ["zone_heavy", "two_high"],
    pressure_profile: "front_dependent", confidence: 0.75,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Eberflus Tampa 2 / Cover 4 hybrid shell relying on Jaylon Johnson lock down.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "CIN", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "single_high"],
    pressure_profile: "aggressive", confidence: 0.72,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Anarumo disguises and post-snap rotation using single-high and match principles.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "CLE", season: 2026, week: 1,
    primary_coverage_family: "man_heavy", scheme_tags: ["man_heavy", "single_high", "blitz_heavy"],
    pressure_profile: "aggressive", confidence: 0.82,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Jim Schwartz high-frequency Press Man / Cover 1 with aggressive 4-man rush.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "DAL", season: 2026, week: 1,
    primary_coverage_family: "single_high_man", scheme_tags: ["single_high", "man_heavy", "blitz_heavy"],
    pressure_profile: "blitz_heavy", confidence: 0.78,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Mike Zimmer aggressive Cover 1/Cover 3 blitz-heavy secondary structure.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "DEN", season: 2026, week: 1,
    primary_coverage_family: "man_match", scheme_tags: ["man_heavy", "single_high", "blitz_heavy"],
    pressure_profile: "blitz_heavy", confidence: 0.80,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Vance Joseph heavy blitz and man press around Patrick Surtain II shadow assignments.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "DET", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "two_high", "quarters"],
    pressure_profile: "front_dependent", confidence: 0.75,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Aaron Glenn split-safety match zone featuring Kerby Joseph and Brian Branch.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "GB", season: 2026, week: 1,
    primary_coverage_family: "zone_match", scheme_tags: ["zone_heavy", "match_zone"],
    pressure_profile: "balanced", confidence: 0.70,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Jeff Hafley aggressive zone-match system with Xavier McKinney deep safety range.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "HOU", season: 2026, week: 1,
    primary_coverage_family: "cover_4_quarters", scheme_tags: ["quarters", "two_high", "zone_heavy"],
    pressure_profile: "front_dependent", confidence: 0.80,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "DeMeco Ryans Cover 4/Cover 6 zone shell anchored by Derek Stingley Jr.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "IND", season: 2026, week: 1,
    primary_coverage_family: "cover_3_zone", scheme_tags: ["zone_heavy", "single_high"],
    pressure_profile: "coverage_first", confidence: 0.75,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Gus Bradley classic Cover 3 / Quarters system funneling plays to Kenny Moore II.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "JAX", season: 2026, week: 1,
    primary_coverage_family: "man_heavy", scheme_tags: ["man_heavy", "blitz_heavy", "single_high"],
    pressure_profile: "aggressive", confidence: 0.72,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Ryan Nielsen aggressive press-man scheme relying on Tyson Campbell.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "KC", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "blitz_heavy", "two_high"],
    pressure_profile: "aggressive", confidence: 0.85,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Steve Spagnuolo intricate blitz packages and post-snap rotation around Trent McDuffie.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "LV", season: 2026, week: 1,
    primary_coverage_family: "cover_3_zone", scheme_tags: ["zone_heavy", "single_high"],
    pressure_profile: "front_dependent", confidence: 0.68,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Patrick Graham adaptable zone-first scheme featuring Nate Hobbs in nickel.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "LAC", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "two_high", "quarters"],
    pressure_profile: "coverage_first", confidence: 0.78,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Jesse Minter Ravens-style match zone structure with Derwin James in hybrid role.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "LAR", season: 2026, week: 1,
    primary_coverage_family: "zone_match", scheme_tags: ["zone_heavy", "two_high"],
    pressure_profile: "front_dependent", confidence: 0.70,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Chris Shula Fangio-lineage soft zone two-high shell.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "MIA", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "two_high", "quarters"],
    pressure_profile: "coverage_first", confidence: 0.78,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Anthony Weaver two-high match zone scheme built around Jalen Ramsey and Jevon Holland.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "MIN", season: 2026, week: 1,
    primary_coverage_family: "blitz_heavy", scheme_tags: ["blitz_heavy", "match_zone", "two_high"],
    pressure_profile: "blitz_heavy", confidence: 0.88,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Brian Flores league-highest blitz rate with psycho fronts and Harrison Smith roaming.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "NE", season: 2026, week: 1,
    primary_coverage_family: "man_heavy", scheme_tags: ["man_heavy", "single_high"],
    pressure_profile: "coverage_first", confidence: 0.75,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Jerod Mayo Belichick-lineage press man featuring Christian Gonzalez.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "NO", season: 2026, week: 1,
    primary_coverage_family: "cover_1_man", scheme_tags: ["man_heavy", "single_high"],
    pressure_profile: "aggressive", confidence: 0.76,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Dennis Allen aggressive Cover 1 man press with Marshon Lattimore and Tyrann Mathieu.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "NYG", season: 2026, week: 1,
    primary_coverage_family: "man_match", scheme_tags: ["man_heavy", "blitz_heavy"],
    pressure_profile: "blitz_heavy", confidence: 0.72,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Shane Bowen pressure-heavy scheme utilizing Deonte Banks on outside receivers.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "NYJ", season: 2026, week: 1,
    primary_coverage_family: "cover_3_zone", scheme_tags: ["zone_heavy", "two_high", "quarters"],
    pressure_profile: "front_dependent", confidence: 0.88,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Robert Saleh elite Cover 3/Quarters zone shell led by Sauce Gardner and DJ Reed.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "PHI", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "two_high", "quarters"],
    pressure_profile: "front_dependent", confidence: 0.82,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Vic Fangio master match zone / split safety system with Quinyon Mitchell and Cooper DeJean.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "PIT", season: 2026, week: 1,
    primary_coverage_family: "man_match", scheme_tags: ["man_heavy", "single_high", "blitz_heavy"],
    pressure_profile: "aggressive", confidence: 0.82,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Mike Tomlin/Teryl Austin Cover 1/Cover 3 aggressive shell with Joey Porter Jr. and Minkah Fitzpatrick.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "SF", season: 2026, week: 1,
    primary_coverage_family: "zone_heavy", scheme_tags: ["zone_heavy", "two_high", "quarters"],
    pressure_profile: "front_dependent", confidence: 0.85,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Nick Sorensen 4-3 Cover 3/Cover 4 zone shell anchored by Charvarius Ward and Fred Warner.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "SEA", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "single_high", "two_high"],
    pressure_profile: "aggressive", confidence: 0.80,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Mike Macdonald Ravens-style disguise/match zone featuring Devon Witherspoon.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "TB", season: 2026, week: 1,
    primary_coverage_family: "zone_heavy", scheme_tags: ["zone_heavy", "two_high", "blitz_heavy"],
    pressure_profile: "blitz_heavy", confidence: 0.80,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Todd Bowles heavy pressure and simulated pressure with Antoine Winfield Jr.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "TEN", season: 2026, week: 1,
    primary_coverage_family: "match_zone", scheme_tags: ["match_zone", "single_high"],
    pressure_profile: "front_dependent", confidence: 0.72,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Dennard Wilson Ravens-lineage match zone featuring L'Jarius Sneed shadow coverage.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  },
  {
    team: "WAS", season: 2026, week: 1,
    primary_coverage_family: "zone_heavy", scheme_tags: ["zone_heavy", "two_high"],
    pressure_profile: "passive", confidence: 0.62,
    source: "manual_seed_2026", source_url: SOURCE_URL, source_date: SOURCE_DATE,
    notes: "Dan Quinn Cover 3 / Quarters zone structure featuring Mike Sainristil in nickel.",
    updated_at: UPDATED_AT, stale_after: STALE_AFTER
  }
];

// -----------------------------------------------------------------------------
// 2. SECONDARY ROLES (32 Teams - Key DBs)
// -----------------------------------------------------------------------------
const SECONDARY_ROLES = [
  // ARI
  { team: "ARI", player_name: "Max Melton", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "starter", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "boundary_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI CB1 starter." },
  { team: "ARI", player_name: "Starling Thomas V", position: "CB", role: "outside_cb2", side: "field", impact_tier: "rotational", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI CB2 starter." },
  { team: "ARI", player_name: "Garrett Williams", position: "CB", role: "slot_cb", side: "slot", impact_tier: "starter", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost", "inside_seam_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI Nickel CB." },
  { team: "ARI", player_name: "Budda Baker", position: "S", role: "hybrid_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["te_middle", "slot"], weakness_tags: ["te_middle_boost", "slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI Elite All-Pro Safety." },
  { team: "ARI", player_name: "Jalen Thompson", position: "S", role: "free_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI Free Safety." },

  // ATL
  { team: "ATL", player_name: "A.J. Terrell", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x", "boundary_wr_boost"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL Shutdown CB1." },
  { team: "ATL", player_name: "Mike Hughes", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL CB2." },
  { team: "ATL", player_name: "Dee Alford", position: "CB", role: "slot_cb", side: "slot", impact_tier: "starter", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL Nickel." },
  { team: "ATL", player_name: "Jessie Bates III", position: "S", role: "free_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["field_stretcher", "post_cross_boost"], weakness_tags: ["deep_pass_boost", "post_cross_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL Elite Centerfield FS." },
  { team: "ATL", player_name: "Justin Simmons", position: "S", role: "strong_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["te_middle"], weakness_tags: ["te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL Pro-Bowl Safety." },

  // BAL
  { team: "BAL", player_name: "Marlon Humphrey", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x", "slot"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL All-Pro CB." },
  { team: "BAL", player_name: "Nate Wiggins", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver", "field_stretcher"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL 1st round CB." },
  { team: "BAL", player_name: "Arthur Maulet", position: "CB", role: "slot_cb", side: "slot", impact_tier: "starter", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL Nickel CB." },
  { team: "BAL", player_name: "Kyle Hamilton", position: "S", role: "hybrid_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["te_middle", "slot", "alpha_x"], weakness_tags: ["te_middle_boost", "slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL All-Pro Swiss Army Knife." },
  { team: "BAL", player_name: "Marcus Williams", position: "S", role: "free_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL Deep Safety." },

  // BUF
  { team: "BUF", player_name: "Christian Benford", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BUF CB1." },
  { team: "BUF", player_name: "Rasul Douglas", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BUF CB2." },
  { team: "BUF", player_name: "Taron Johnson", position: "CB", role: "slot_cb", side: "slot", impact_tier: "elite", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost", "inside_seam_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BUF All-Pro Nickel." },

  // CAR
  { team: "CAR", player_name: "Jaycee Horn", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CAR Lockdown CB1." },
  { team: "CAR", player_name: "Mike Jackson", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CAR CB2." },
  { team: "CAR", player_name: "Xavier Woods", position: "S", role: "free_safety", side: "middle", impact_tier: "starter", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CAR Safety." },

  // CHI
  { team: "CHI", player_name: "Jaylon Johnson", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI All-Pro CB1." },
  { team: "CHI", player_name: "Tyrique Stevenson", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI CB2." },
  { team: "CHI", player_name: "Kyler Gordon", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI Nickel." },
  { team: "CHI", player_name: "Jaquan Brisker", position: "S", role: "strong_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["te_middle"], weakness_tags: ["te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI Enforcer SS." },

  // CIN
  { team: "CIN", player_name: "Cam Taylor-Britt", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CIN CB1." },
  { team: "CIN", player_name: "DJ Turner II", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver", "field_stretcher"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CIN Speedy CB2." },
  { team: "CIN", player_name: "Mike Hilton", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CIN Premier Blitz Nickel." },

  // CLE
  { team: "CLE", player_name: "Denzel Ward", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CLE Pro-Bowl Shutdown CB." },
  { team: "CLE", player_name: "Martin Emerson Jr.", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CLE Press CB2." },
  { team: "CLE", player_name: "Greg Newsome II", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CLE Slot CB." },

  // DAL
  { team: "DAL", player_name: "Trevon Diggs", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x", "z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DAL Ballhawk CB." },
  { team: "DAL", player_name: "DaRon Bland", position: "CB", role: "outside_cb2", side: "field", impact_tier: "elite", receiver_archetypes_impacted: ["z_receiver", "slot"], weakness_tags: ["outside_wr_boost", "slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DAL All-Pro Pick-6 record holder." },

  // DEN
  { team: "DEN", player_name: "Patrick Surtain II", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DEN #1 Shutdown Corner in NFL." },
  { team: "DEN", player_name: "Riley Moss", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DEN CB2." },
  { team: "DEN", player_name: "Ja'Quan McMillian", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DEN Playmaking Slot." },

  // DET
  { team: "DET", player_name: "Terrion Arnold", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "starter", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DET 1st round rookie CB1." },
  { team: "DET", player_name: "Carlton Davis III", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DET Veteran Press CB." },
  { team: "DET", player_name: "Kerby Joseph", position: "S", role: "deep_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["field_stretcher", "te_middle"], weakness_tags: ["deep_pass_boost", "post_cross_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DET Deep Safety." },
  { team: "DET", player_name: "Brian Branch", position: "S", role: "hybrid_safety", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot", "te_middle"], weakness_tags: ["slot_wr_boost", "te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DET Versatile DB." },

  // GB
  { team: "GB", player_name: "Jaire Alexander", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB All-Pro Corner." },
  { team: "GB", player_name: "Eric Stokes", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB Speed CB2." },
  { team: "GB", player_name: "Keisean Nixon", position: "CB", role: "slot_cb", side: "slot", impact_tier: "starter", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost", "inside_seam_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB Slot CB." },
  { team: "GB", player_name: "Xavier McKinney", position: "S", role: "free_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB Elite Free Safety acquisition." },

  // HOU
  { team: "HOU", player_name: "Derek Stingley Jr.", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "HOU Shutdown CB1." },
  { team: "HOU", player_name: "Kamari Lassiter", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "HOU Rookie CB2." },
  { team: "HOU", player_name: "Jalen Pitre", position: "S", role: "hybrid_safety", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot", "te_middle"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "HOU Nickel/Safety." },

  // IND
  { team: "IND", player_name: "JuJu Brents", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "starter", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "IND Tall CB1." },
  { team: "IND", player_name: "Kenny Moore II", position: "CB", role: "slot_cb", side: "slot", impact_tier: "elite", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost", "inside_seam_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "IND Premier Slot Defender." },

  // JAX
  { team: "JAX", player_name: "Tyson Campbell", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "JAX CB1." },
  { team: "JAX", player_name: "Darnell Savage", position: "S", role: "free_safety", side: "middle", impact_tier: "starter", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "JAX Safety." },

  // KC
  { team: "KC", player_name: "Trent McDuffie", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x", "slot"], weakness_tags: ["outside_wr_boost", "slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "KC All-Pro Corner." },
  { team: "KC", player_name: "Jaylen Watson", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "KC Physical CB2." },
  { team: "KC", player_name: "Justin Reid", position: "S", role: "hybrid_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["te_middle"], weakness_tags: ["te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "KC Veteran Safety Leader." },

  // LV
  { team: "LV", player_name: "Jack Jones", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "starter", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LV Playmaking CB." },
  { team: "LV", player_name: "Nate Hobbs", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LV Tough Slot CB." },

  // LAC
  { team: "LAC", player_name: "Asante Samuel Jr.", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAC Ballhawk CB." },
  { team: "LAC", player_name: "Derwin James Jr.", position: "S", role: "hybrid_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["te_middle", "slot"], weakness_tags: ["te_middle_boost", "slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAC All-Pro Safety." },

  // LAR
  { team: "LAR", player_name: "Tre'Davious White", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "starter", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAR Veteran CB." },
  { team: "LAR", player_name: "Darious Williams", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAR Returning Zone CB." },
  { team: "LAR", player_name: "Kamren Curl", position: "S", role: "box_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["te_middle"], weakness_tags: ["te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAR Box Safety." },

  // MIA
  { team: "MIA", player_name: "Jalen Ramsey", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x", "field_stretcher"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIA All-Pro Corner." },
  { team: "MIA", player_name: "Kendall Fuller", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIA Smart Tech CB." },
  { team: "MIA", player_name: "Jevon Holland", position: "S", role: "free_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIA Top Tier Free Safety." },

  // MIN
  { team: "MIN", player_name: "Stephon Gilmore", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIN Veteran Corner." },
  { team: "MIN", player_name: "Byron Murphy Jr.", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIN Inside/Outside CB." },
  { team: "MIN", player_name: "Harrison Smith", position: "S", role: "hybrid_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["te_middle", "slot"], weakness_tags: ["te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIN Future HOF Disguise Specialist." },

  // NE
  { team: "NE", player_name: "Christian Gonzalez", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NE Rising Lockdown CB1." },
  { team: "NE", player_name: "Jonathan Jones", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NE Speed CB." },
  { team: "NE", player_name: "Kyle Dugger", position: "S", role: "strong_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["te_middle"], weakness_tags: ["te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NE Heavy Hitting SS." },

  // NO
  { team: "NO", player_name: "Marshon Lattimore", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NO Premier Man CB1." },
  { team: "NO", player_name: "Paulson Adebo", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NO Physical CB2." },
  { team: "NO", player_name: "Tyrann Mathieu", position: "S", role: "free_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NO Honey Badger Safety." },

  // NYG
  { team: "NYG", player_name: "Deonte Banks", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYG Athletic Press CB1." },
  { team: "NYG", player_name: "Cor'Dale Flott", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYG CB2." },

  // NYJ
  { team: "NYJ", player_name: "Sauce Gardner", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYJ All-Pro Premier Corner." },
  { team: "NYJ", player_name: "DJ Reed", position: "CB", role: "outside_cb2", side: "field", impact_tier: "elite", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYJ Elite CB2." },
  { team: "NYJ", player_name: "Michael Carter II", position: "CB", role: "slot_cb", side: "slot", impact_tier: "elite", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYJ Premier Slot Corner." },

  // PHI
  { team: "PHI", player_name: "Darius Slay", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PHI Veteran CB1." },
  { team: "PHI", player_name: "Quinyon Mitchell", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PHI 1st round CB." },
  { team: "PHI", player_name: "Cooper DeJean", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PHI Versatile Rookie DB." },

  // PIT
  { team: "PIT", player_name: "Joey Porter Jr.", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x", "z_receiver"], weakness_tags: ["outside_wr_boost", "boundary_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PIT Press Corner." },
  { team: "PIT", player_name: "Donte Jackson", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PIT Speed CB2." },
  { team: "PIT", player_name: "Minkah Fitzpatrick", position: "S", role: "free_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["field_stretcher", "post_cross_boost"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PIT All-Pro Free Safety." },

  // SF
  { team: "SF", player_name: "Charvarius Ward", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SF All-Pro Press Corner." },
  { team: "SF", player_name: "Deommodore Lenoir", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver", "slot"], weakness_tags: ["outside_wr_boost", "slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SF Versatile Inside/Out CB." },
  { team: "SF", player_name: "Talanoa Hufanga", position: "S", role: "box_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["te_middle"], weakness_tags: ["te_middle_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SF All-Pro Box Enforcer." },

  // SEA
  { team: "SEA", player_name: "Riq Woolen", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SEA Length & Speed CB1." },
  { team: "SEA", player_name: "Devon Witherspoon", position: "CB", role: "slot_cb", side: "slot", impact_tier: "elite", receiver_archetypes_impacted: ["slot", "z_receiver"], weakness_tags: ["slot_wr_boost", "inside_seam_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SEA All-Pro Nickel/Corner." },
  { team: "SEA", player_name: "Julian Love", position: "S", role: "free_safety", side: "middle", impact_tier: "plus", receiver_archetypes_impacted: ["field_stretcher"], weakness_tags: ["deep_pass_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SEA Pro-Bowl Safety." },

  // TB
  { team: "TB", player_name: "Jamel Dean", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "plus", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TB Speed CB1." },
  { team: "TB", player_name: "Zyon McCollum", position: "CB", role: "outside_cb2", side: "field", impact_tier: "starter", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TB Athletic CB2." },
  { team: "TB", player_name: "Antoine Winfield Jr.", position: "S", role: "free_safety", side: "middle", impact_tier: "elite", receiver_archetypes_impacted: ["field_stretcher", "te_middle", "slot"], weakness_tags: ["deep_pass_boost", "slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TB Highest Paid All-Pro Safety." },

  // TEN
  { team: "TEN", player_name: "L'Jarius Sneed", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "elite", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost", "alpha_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TEN Lockdown Press CB1." },
  { team: "TEN", player_name: "Chidobe Awuzie", position: "CB", role: "outside_cb2", side: "field", impact_tier: "plus", receiver_archetypes_impacted: ["z_receiver"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TEN Veteran CB2." },
  { team: "TEN", player_name: "Roger McCreary", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TEN Nickel Corner." },

  // WAS
  { team: "WAS", player_name: "Benjamin St-Juste", position: "CB", role: "outside_cb1", side: "boundary", impact_tier: "starter", receiver_archetypes_impacted: ["alpha_x"], weakness_tags: ["outside_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "WAS CB1." },
  { team: "WAS", player_name: "Mike Sainristil", position: "CB", role: "slot_cb", side: "slot", impact_tier: "plus", receiver_archetypes_impacted: ["slot"], weakness_tags: ["slot_wr_boost"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "WAS Playmaking Rookie Slot." }
];

// -----------------------------------------------------------------------------
// 3. RECEIVER ROLES (32 Teams - Key Pass Catchers)
// -----------------------------------------------------------------------------
const RECEIVER_ROLES = [
  // ARI
  { team: "ARI", player_name: "Marvin Harrison Jr.", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI #1 WR Alpha." },
  { team: "ARI", player_name: "Michael Wilson", position: "WR", roles: ["z_receiver"], target_share_tier: "medium", route_area_tags: ["boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI Outside WR2." },
  { team: "ARI", player_name: "Greg Dortch", position: "WR", roles: ["slot"], target_share_tier: "medium", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI Slot WR." },
  { team: "ARI", player_name: "Trey McBride", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "alpha", route_area_tags: ["middle", "intermediate", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ARI Elite Target Share TE." },

  // ATL
  { team: "ATL", player_name: "Drake London", position: "WR", roles: ["alpha_x", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL WR1 Alpha." },
  { team: "ATL", player_name: "Darnell Mooney", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL Speed WR2." },
  { team: "ATL", player_name: "Kyle Pitts", position: "TE", roles: ["te_middle", "field_stretcher"], target_share_tier: "high", route_area_tags: ["middle", "deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "ATL Hybrid TE." },

  // BAL
  { team: "BAL", player_name: "Zay Flowers", position: "WR", roles: ["alpha_x", "slot"], target_share_tier: "alpha", route_area_tags: ["boundary", "slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL Primary Target." },
  { team: "BAL", player_name: "Rashod Bateman", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL Outside WR." },
  { team: "BAL", player_name: "Mark Andrews", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "alpha", route_area_tags: ["middle", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL All-Pro TE." },
  { team: "BAL", player_name: "Isaiah Likely", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "medium", route_area_tags: ["middle", "seam"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BAL Playmaking TE2." },

  // BUF
  { team: "BUF", player_name: "Keon Coleman", position: "WR", roles: ["alpha_x", "red_zone"], target_share_tier: "high", route_area_tags: ["boundary", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BUF Rookie X WR." },
  { team: "BUF", player_name: "Khalil Shakir", position: "WR", roles: ["slot", "possession"], target_share_tier: "high", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BUF YAC Slot WR." },
  { team: "BUF", player_name: "Dalton Kincaid", position: "TE", roles: ["te_middle", "slot"], target_share_tier: "high", route_area_tags: ["middle", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "BUF Receiving TE." },

  // CAR
  { team: "CAR", player_name: "Adam Thielen", position: "WR", roles: ["slot", "possession"], target_share_tier: "high", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CAR Veteran Slot." },
  { team: "CAR", player_name: "Diontae Johnson", position: "WR", roles: ["alpha_x"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CAR Target Volume WR." },
  { team: "CAR", player_name: "Xavier Legette", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CAR Rookie WR." },

  // CHI
  { team: "CHI", player_name: "DJ Moore", position: "WR", roles: ["alpha_x", "z_receiver"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate", "deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI WR1." },
  { team: "CHI", player_name: "Keenan Allen", position: "WR", roles: ["slot", "possession"], target_share_tier: "high", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI Veteran Slot." },
  { team: "CHI", player_name: "Rome Odunze", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "high", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI Rookie 1st Round WR." },
  { team: "CHI", player_name: "Cole Kmet", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "medium", route_area_tags: ["middle", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CHI TE." },

  // CIN
  { team: "CIN", player_name: "Ja'Marr Chase", position: "WR", roles: ["alpha_x", "field_stretcher", "slot"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CIN All-Pro Alpha WR." },
  { team: "CIN", player_name: "Tee Higgins", position: "WR", roles: ["z_receiver", "red_zone"], target_share_tier: "high", route_area_tags: ["boundary", "deep", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CIN Premium WR2." },
  { team: "CIN", player_name: "Mike Gesicki", position: "TE", roles: ["te_middle", "slot"], target_share_tier: "medium", route_area_tags: ["middle", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CIN Big Slot TE." },

  // CLE
  { team: "CLE", player_name: "Amari Cooper", position: "WR", roles: ["alpha_x"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CLE Route Technician WR1." },
  { team: "CLE", player_name: "Jerry Jeudy", position: "WR", roles: ["z_receiver", "slot"], target_share_tier: "medium", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CLE WR2." },
  { team: "CLE", player_name: "David Njoku", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "high", route_area_tags: ["middle", "red_zone", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "CLE YAC TE." },

  // DAL
  { team: "DAL", player_name: "CeeDee Lamb", position: "WR", roles: ["alpha_x", "slot", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DAL All-Pro Alpha Target Monster." },
  { team: "DAL", player_name: "Brandin Cooks", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DAL Speed WR." },
  { team: "DAL", player_name: "Jake Ferguson", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "high", route_area_tags: ["middle", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DAL TE1." },

  // DEN
  { team: "DEN", player_name: "Courtland Sutton", position: "WR", roles: ["alpha_x", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DEN X Receiver." },
  { team: "DEN", player_name: "Josh Reynolds", position: "WR", roles: ["z_receiver"], target_share_tier: "medium", route_area_tags: ["boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DEN WR2." },
  { team: "DEN", player_name: "Marvin Mims Jr.", position: "WR", roles: ["field_stretcher", "slot"], target_share_tier: "rotational", route_area_tags: ["deep", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DEN Speed Threat." },

  // DET
  { team: "DET", player_name: "Amon-Ra St. Brown", position: "WR", roles: ["slot", "alpha_x", "possession"], target_share_tier: "alpha", route_area_tags: ["slot", "intermediate", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DET All-Pro Slot Alpha." },
  { team: "DET", player_name: "Jameson Williams", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "high", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DET Deep Threat." },
  { team: "DET", player_name: "Sam LaPorta", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "alpha", route_area_tags: ["middle", "red_zone", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "DET All-Pro TE." },

  // GB
  { team: "GB", player_name: "Christian Watson", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "high", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB Deep Threat." },
  { team: "GB", player_name: "Romeo Doubs", position: "WR", roles: ["alpha_x", "red_zone"], target_share_tier: "medium", route_area_tags: ["boundary", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB Boundary WR." },
  { team: "GB", player_name: "Jayden Reed", position: "WR", roles: ["slot", "possession"], target_share_tier: "high", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB Playmaking Slot." },
  { team: "GB", player_name: "Luke Musgrave", position: "TE", roles: ["te_middle"], target_share_tier: "medium", route_area_tags: ["middle", "seam"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "GB Athletic TE." },

  // HOU
  { team: "HOU", player_name: "Nico Collins", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "HOU Dominant Alpha WR1." },
  { team: "HOU", player_name: "Stefon Diggs", position: "WR", roles: ["slot", "z_receiver"], target_share_tier: "high", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "HOU All-Pro Acquisition." },
  { team: "HOU", player_name: "Tank Dell", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "high", route_area_tags: ["deep", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "HOU Explosive Playmaker." },
  { team: "HOU", player_name: "Dalton Schultz", position: "TE", roles: ["te_middle"], target_share_tier: "medium", route_area_tags: ["middle", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "HOU Reliable TE." },

  // IND
  { team: "IND", player_name: "Michael Pittman Jr.", position: "WR", roles: ["alpha_x", "possession"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "IND Heavy Volume WR1." },
  { team: "IND", player_name: "Alec Pierce", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "IND Deep Threat." },
  { team: "IND", player_name: "Josh Downs", position: "WR", roles: ["slot"], target_share_tier: "high", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "IND High-Efficiency Slot." },

  // JAX
  { team: "JAX", player_name: "Brian Thomas Jr.", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "high", route_area_tags: ["boundary", "deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "JAX 1st Round Rookie WR." },
  { team: "JAX", player_name: "Christian Kirk", position: "WR", roles: ["slot"], target_share_tier: "high", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "JAX Slot WR." },
  { team: "JAX", player_name: "Gabe Davis", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "JAX Deep Threat." },
  { team: "JAX", player_name: "Evan Engram", position: "TE", roles: ["te_middle", "slot"], target_share_tier: "alpha", route_area_tags: ["middle", "underneath", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "JAX High Volume TE." },

  // KC
  { team: "KC", player_name: "Rashee Rice", position: "WR", roles: ["slot", "alpha_x"], target_share_tier: "alpha", route_area_tags: ["slot", "underneath", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "KC YAC Target Leader." },
  { team: "KC", player_name: "Xavier Worthy", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "high", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "KC 4.21 Speed 1st Rounder." },
  { team: "KC", player_name: "Hollywood Brown", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "KC Veteran Speed WR." },
  { team: "KC", player_name: "Travis Kelce", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "alpha", route_area_tags: ["middle", "intermediate", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "KC All-Pro Future HOF TE." },

  // LV
  { team: "LV", player_name: "Davante Adams", position: "WR", roles: ["alpha_x", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LV All-Pro Route Master." },
  { team: "LV", player_name: "Jakobi Meyers", position: "WR", roles: ["slot", "possession"], target_share_tier: "medium", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LV Reliable WR2." },
  { team: "LV", player_name: "Brock Bowers", position: "TE", roles: ["te_middle", "slot"], target_share_tier: "alpha", route_area_tags: ["middle", "slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LV 1st Round Generational TE." },

  // LAC
  { team: "LAC", player_name: "Ladd McConkey", position: "WR", roles: ["slot", "alpha_x"], target_share_tier: "alpha", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAC Rookie Target Leader." },
  { team: "LAC", player_name: "Joshua Palmer", position: "WR", roles: ["z_receiver"], target_share_tier: "medium", route_area_tags: ["boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAC Outside WR." },
  { team: "LAC", player_name: "Quentin Johnston", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["boundary", "deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAC 1st Round WR." },

  // LAR
  { team: "LAR", player_name: "Cooper Kupp", position: "WR", roles: ["slot", "alpha_x", "possession"], target_share_tier: "alpha", route_area_tags: ["slot", "intermediate", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAR Triple Crown WR." },
  { team: "LAR", player_name: "Puka Nacua", position: "WR", roles: ["alpha_x", "possession", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAR Record-Breaking All-Pro." },
  { team: "LAR", player_name: "Demarcus Robinson", position: "WR", roles: ["z_receiver"], target_share_tier: "medium", route_area_tags: ["boundary", "deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "LAR Veteran WR3." },

  // MIA
  { team: "MIA", player_name: "Tyreek Hill", position: "WR", roles: ["alpha_x", "field_stretcher", "slot"], target_share_tier: "alpha", route_area_tags: ["deep", "boundary", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIA All-Pro Cheetah." },
  { team: "MIA", player_name: "Jaylen Waddle", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["deep", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIA Elite Speed WR2." },
  { team: "MIA", player_name: "Jonnu Smith", position: "TE", roles: ["te_middle"], target_share_tier: "medium", route_area_tags: ["middle", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIA YAC TE." },

  // MIN
  { team: "MIN", player_name: "Justin Jefferson", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIN Premier WR in NFL." },
  { team: "MIN", player_name: "Jordan Addison", position: "WR", roles: ["z_receiver", "slot"], target_share_tier: "high", route_area_tags: ["slot", "intermediate", "deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIN Touchdown Machine WR2." },
  { team: "MIN", player_name: "T.J. Hockenson", position: "TE", roles: ["te_middle"], target_share_tier: "alpha", route_area_tags: ["middle", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "MIN Pro-Bowl TE." },

  // NE
  { team: "NE", player_name: "Ja'Lynn Polk", position: "WR", roles: ["alpha_x"], target_share_tier: "medium", route_area_tags: ["boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NE 2nd Round Rookie WR." },
  { team: "NE", player_name: "DeMario Douglas", position: "WR", roles: ["slot"], target_share_tier: "high", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NE Quick Slot WR." },
  { team: "NE", player_name: "Hunter Henry", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "medium", route_area_tags: ["middle", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NE Veteran TE." },

  // NO
  { team: "NO", player_name: "Chris Olave", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["deep", "boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NO Smooth Route WR1." },
  { team: "NO", player_name: "Rashid Shaheed", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "high", route_area_tags: ["deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NO Elite Deep Threat." },
  { team: "NO", player_name: "Taysom Hill", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "medium", route_area_tags: ["underneath", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NO Offensive Weapon." },

  // NYG
  { team: "NYG", player_name: "Malik Nabers", position: "WR", roles: ["alpha_x", "field_stretcher", "slot"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYG Explosive 1st Round Alpha." },
  { team: "NYG", player_name: "Wan'Dale Robinson", position: "WR", roles: ["slot", "possession"], target_share_tier: "high", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYG High Volume Slot." },
  { team: "NYG", player_name: "Darius Slayton", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "medium", route_area_tags: ["deep"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYG Deep Threat." },

  // NYJ
  { team: "NYJ", player_name: "Garrett Wilson", position: "WR", roles: ["alpha_x", "slot"], target_share_tier: "alpha", route_area_tags: ["boundary", "slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYJ All-Pro Target Monster." },
  { team: "NYJ", player_name: "Mike Williams", position: "WR", roles: ["z_receiver", "red_zone"], target_share_tier: "medium", route_area_tags: ["boundary", "deep", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYJ Contested Catch Veteran." },
  { team: "NYJ", player_name: "Tyler Conklin", position: "TE", roles: ["te_middle"], target_share_tier: "medium", route_area_tags: ["middle", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "NYJ TE." },

  // PHI
  { team: "PHI", player_name: "A.J. Brown", position: "WR", roles: ["alpha_x", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "intermediate", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PHI Dominant All-Pro Alpha." },
  { team: "PHI", player_name: "DeVonta Smith", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["deep", "boundary", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PHI Slim Reaper WR1B." },
  { team: "PHI", player_name: "Dallas Goedert", position: "TE", roles: ["te_middle"], target_share_tier: "high", route_area_tags: ["middle", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PHI YAC TE." },

  // PIT
  { team: "PIT", player_name: "George Pickens", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PIT Contested Catch WR1." },
  { team: "PIT", player_name: "Van Jefferson", position: "WR", roles: ["z_receiver"], target_share_tier: "rotational", route_area_tags: ["boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PIT Veteran WR." },
  { team: "PIT", player_name: "Pat Freiermuth", position: "TE", roles: ["te_middle", "red_zone"], target_share_tier: "high", route_area_tags: ["middle", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "PIT TE1." },

  // SF
  { team: "SF", player_name: "Brandon Aiyuk", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SF All-Pro Route Master." },
  { team: "SF", player_name: "Deebo Samuel", position: "WR", roles: ["z_receiver", "slot", "possession"], target_share_tier: "alpha", route_area_tags: ["slot", "underneath", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SF All-Pro Wide Back." },
  { team: "SF", player_name: "Jauan Jennings", position: "WR", roles: ["slot", "possession"], target_share_tier: "medium", route_area_tags: ["slot", "third_down"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SF 3rd Down Clutch WR." },
  { team: "SF", player_name: "George Kittle", position: "TE", roles: ["te_middle", "field_stretcher", "red_zone"], target_share_tier: "alpha", route_area_tags: ["middle", "deep", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SF All-Pro YAC Monster." },

  // SEA
  { team: "SEA", player_name: "DK Metcalf", position: "WR", roles: ["alpha_x", "field_stretcher", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SEA Physical Freak WR1." },
  { team: "SEA", player_name: "Tyler Lockett", position: "WR", roles: ["z_receiver", "possession"], target_share_tier: "high", route_area_tags: ["deep", "slot"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SEA Veteran Technician." },
  { team: "SEA", player_name: "Jaxon Smith-Njigba", position: "WR", roles: ["slot", "possession"], target_share_tier: "high", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SEA Rising Slot Star." },
  { team: "SEA", player_name: "Noah Fant", position: "TE", roles: ["te_middle"], target_share_tier: "medium", route_area_tags: ["middle", "seam"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "SEA Athletic TE." },

  // TB
  { team: "TB", player_name: "Mike Evans", position: "WR", roles: ["alpha_x", "field_stretcher", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TB 1,000-yard Streak HOF WR." },
  { team: "TB", player_name: "Chris Godwin", position: "WR", roles: ["slot", "possession"], target_share_tier: "alpha", route_area_tags: ["slot", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TB Elite Slot WR." },
  { team: "TB", player_name: "Jalen McMillan", position: "WR", roles: ["z_receiver"], target_share_tier: "medium", route_area_tags: ["boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TB Rookie WR3." },
  { team: "TB", player_name: "Cade Otton", position: "TE", roles: ["te_middle"], target_share_tier: "medium", route_area_tags: ["middle"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TB TE." },

  // TEN
  { team: "TEN", player_name: "DeAndre Hopkins", position: "WR", roles: ["alpha_x", "red_zone"], target_share_tier: "alpha", route_area_tags: ["boundary", "red_zone"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TEN Veteran HOF WR." },
  { team: "TEN", player_name: "Calvin Ridley", position: "WR", roles: ["z_receiver", "field_stretcher"], target_share_tier: "high", route_area_tags: ["deep", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TEN Speed Free Agent." },
  { team: "TEN", player_name: "Tyler Boyd", position: "WR", roles: ["slot"], target_share_tier: "medium", route_area_tags: ["slot", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TEN Slot Veteran." },
  { team: "TEN", player_name: "Chigoziem Okonkwo", position: "TE", roles: ["te_middle"], target_share_tier: "medium", route_area_tags: ["middle", "seam"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "TEN YAC TE." },

  // WAS
  { team: "WAS", player_name: "Terry McLaurin", position: "WR", roles: ["alpha_x", "field_stretcher"], target_share_tier: "alpha", route_area_tags: ["boundary", "deep", "intermediate"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "WAS Scary Terry WR1." },
  { team: "WAS", player_name: "Jahan Dotson", position: "WR", roles: ["z_receiver", "slot"], target_share_tier: "medium", route_area_tags: ["slot", "boundary"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "WAS WR2." },
  { team: "WAS", player_name: "Zach Ertz", position: "TE", roles: ["te_middle", "possession"], target_share_tier: "medium", route_area_tags: ["middle", "underneath"], source: "manual_seed_2026", source_url: SOURCE_URL, notes: "WAS Veteran TE." }
];

async function main() {
  console.log(`Writing ${COVERAGE_SCHEMES.length} coverage schemes to coverage-schemes-2026.json...`);
  await writeFile(
    path.join(MANUAL_DIR, 'coverage-schemes-2026.json'),
    JSON.stringify(COVERAGE_SCHEMES, null, 2),
    'utf8'
  );

  console.log(`Writing ${SECONDARY_ROLES.length} secondary DB roles to secondary-roles-2026.json...`);
  await writeFile(
    path.join(MANUAL_DIR, 'secondary-roles-2026.json'),
    JSON.stringify(SECONDARY_ROLES, null, 2),
    'utf8'
  );

  console.log(`Writing ${RECEIVER_ROLES.length} receiver roles to receiver-roles-2026.json...`);
  await writeFile(
    path.join(MANUAL_DIR, 'receiver-roles-2026.json'),
    JSON.stringify(RECEIVER_ROLES, null, 2),
    'utf8'
  );

  console.log('Seed files successfully written!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
