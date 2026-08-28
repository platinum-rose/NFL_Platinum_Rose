// src/lib/expertInjuries.js
// ═══════════════════════════════════════════════════════════════════════════════
// Expert Medical Intelligence & Injury Registry
//
// Consolidates off-season/preseason injury intelligence, recovery timelines,
// PUP list designations, and betting impact warnings extracted from:
// 1. Dr. David Chao (Pro Football Doc / The Favorites Podcast)
// 2. PFF, Rotowire, and Pro Football Talk Intel Notes
// 3. Twitter Sharp Injury Accounts (@ProFootballDoc, @RotowireNFL, @ProFootballTalk)
// ═══════════════════════════════════════════════════════════════════════════════

export const EXPERT_INJURIES = {
  'GB': [
    {
      name: 'Micah Parsons',
      position: 'LB/EDGE',
      status: 'PUP',
      injury: 'Offseason Recovery (PUP List)',
      impact: 'critical',
      source: 'Dr. David Chao (Pro Football Doc)',
      prognosis: 'Starting season on PUP list; mid-to-late season return anticipated. Pass rush win rate severely impacted early.',
      bettingWarning: 'Fade Packers pass rush win rate & early-season team spreads (Weeks 1-6).',
      citation: 'The Favorites [00:18:20]',
      lastUpdate: '2026-08-25',
    },
  ],
  'CIN': [
    {
      name: "Ja'Marr Chase",
      position: 'WR',
      status: 'QUESTIONABLE',
      injury: 'Leg / Hamstring (Practice Limp)',
      impact: 'high',
      source: 'Rotowire & Pro Football Talk',
      prognosis: 'Limped off field during Tuesday practice. Monitoring volume and snap counts for preseason Week 3.',
      bettingWarning: 'Monitor practice reports before placing Bengals Week 1 spread or player prop overs.',
      citation: 'Rotowire NFL [2026-08-25]',
      lastUpdate: '2026-08-25',
    },
    {
      name: 'Joe Burrow',
      position: 'QB',
      status: 'QUESTIONABLE',
      injury: 'Ankle Surgery Recovery',
      impact: 'critical',
      source: 'Steve Fezzik & Pro Football Doc',
      prognosis: 'Recovering from off-season ankle procedure; pocket mobility and scramble EPA expected to be limited early.',
      bettingWarning: 'Caution on Bengals win total (11.5 under lean) due to early-season mobility limitations.',
      citation: 'Even Money [00:18:30]',
      lastUpdate: '2026-08-24',
    },
  ],
  'SF': [
    {
      name: 'Nick Bosa',
      position: 'EDGE',
      status: 'QUESTIONABLE',
      injury: 'Leg / Groin Strain',
      impact: 'critical',
      source: 'Pro Football Talk (Kyle Shanahan)',
      prognosis: 'Shanahan expecting Bosa back at practice next week; Week 1 availability on track.',
      bettingWarning: 'High confidence for Week 1 defense if practice participation resumes on schedule.',
      citation: 'Pro Football Talk [2026-08-25]',
      lastUpdate: '2026-08-25',
    },
  ],
  'NYG': [
    {
      name: 'Malik Nabers',
      position: 'WR',
      status: 'QUESTIONABLE',
      injury: 'Ankle / Foot',
      impact: 'high',
      source: 'Pro Football Talk (John Harbaugh / Giants Staff)',
      prognosis: 'Coaching staff states it is "reasonable to assume" Nabers plays in Week 1.',
      bettingWarning: 'Positive indicator for Giants target share & offensive pass volume.',
      citation: 'Pro Football Talk [2026-08-24]',
      lastUpdate: '2026-08-24',
    },
  ],
  'NE': [
    {
      name: 'Christian Gonzalez',
      position: 'CB',
      status: 'QUESTIONABLE',
      injury: 'Contract / Shoulder Status',
      impact: 'high',
      source: 'Pro Football Talk',
      prognosis: 'Patriots do not view Week 1 as hard deadline; monitoring practice reps.',
      bettingWarning: 'Patriots secondary coverage grade drops if Gonzalez sits Week 1.',
      citation: 'Pro Football Talk [2026-08-25]',
      lastUpdate: '2026-08-25',
    },
  ],
  'ARI': [
    {
      name: 'Marvin Harrison Jr.',
      position: 'WR',
      status: 'QUESTIONABLE',
      injury: 'Lingering Rash of Injuries',
      impact: 'high',
      source: 'ESPN & Rotowire NFL',
      prognosis: 'Harrison stated Tuesday he is not yet 100% recovered from 2025 lingering injuries.',
      bettingWarning: 'Cap target expectations for early-season player props.',
      citation: 'Rotowire NFL [2026-08-25]',
      lastUpdate: '2026-08-25',
    },
  ],
  'CHI': [
    {
      name: 'Rome Odunze',
      position: 'WR',
      status: 'QUESTIONABLE',
      injury: 'Left Foot Recovery',
      impact: 'medium',
      source: 'Pro Football Talk',
      prognosis: 'Hampered by foot injury last season; fully participating in 2026 camp drills.',
      bettingWarning: 'Positive indicator for Caleb Williams WR corps target distribution.',
      citation: 'Pro Football Talk [2026-08-25]',
      lastUpdate: '2026-08-25',
    },
    {
      name: 'Kyler Gordon',
      position: 'CB',
      status: 'QUESTIONABLE',
      injury: 'Offseason Recovery',
      impact: 'medium',
      source: 'Pro Football Talk',
      prognosis: 'Off-field for most of 2025; returning to slot CB rotation.',
      bettingWarning: 'Monitored slot coverage metric for Bears pass defense.',
      citation: 'Pro Football Talk [2026-08-25]',
      lastUpdate: '2026-08-25',
    },
  ],
  'KC': [
    {
      name: 'Patrick Mahomes',
      position: 'QB',
      status: 'PROBABLE',
      injury: 'General Maintenance',
      impact: 'critical',
      source: 'Pro Football Talk & Andy Reid',
      prognosis: 'Mahomes plans to "go out there and be myself" for Week 1 opener.',
      bettingWarning: 'Full green light for Chiefs Week 1 offense & spread positions.',
      citation: 'Pro Football Talk [2026-08-25]',
      lastUpdate: '2026-08-25',
    },
  ],
  'HOU': [
    {
      name: 'Tank Dell',
      position: 'WR',
      status: 'PROBABLE',
      injury: '2024 Knee Recovery',
      impact: 'high',
      source: 'Pro Football Talk',
      prognosis: 'Dell sees "light at the end of the tunnel" in knee rehab; full speed in camp.',
      bettingWarning: 'Strong upside indicator for CJ Stroud passing attack.',
      citation: 'Pro Football Talk [2026-08-24]',
      lastUpdate: '2026-08-24',
    },
  ],
  'LAC': [
    {
      name: 'Ladd McConkey',
      position: 'WR',
      status: 'QUESTIONABLE',
      injury: 'Hamstring',
      impact: 'high',
      source: 'Pro Football Talk',
      prognosis: 'Dealing with hamstring strain; expects to be ready for regular season kickoff.',
      bettingWarning: 'Monitor Justin Herbert early-season target volume.',
      citation: 'Pro Football Talk [2026-08-24]',
      lastUpdate: '2026-08-24',
    },
  ],
};

/**
 * Get expert injury intelligence records for a given team abbreviation.
 */
export function getExpertInjuriesForTeam(teamAbbrev) {
  if (!teamAbbrev) return [];
  const code = String(teamAbbrev).toUpperCase();
  return EXPERT_INJURIES[code] || [];
}

/**
 * Get all expert injuries formatted for UI consumption.
 */
export function getAllExpertInjuries() {
  return EXPERT_INJURIES;
}
