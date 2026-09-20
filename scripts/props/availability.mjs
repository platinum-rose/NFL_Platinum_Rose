#!/usr/bin/env node

/**
 * availability.mjs
 *
 * Works out which players (and which sides/totals) are genuinely SPOKEN FOR by
 * live tickets, and which are FREE to reuse on a new build.
 *
 * The thing this exists to fix: a parlay is dead the instant one leg LOSES, but
 * the book leaves the ticket PENDING until it settles — often hours later. Week 2
 * treated "on any non-SETTLED ticket" as unavailable, which left 12 afternoon and
 * evening players locked behind morning legs that had already busted.
 *
 * The rule instead:
 *
 *   A player is SPOKEN FOR only if he has a PENDING leg on a ticket that can still win.
 *
 * A leg that already WON also frees its player — that value is banked, so reusing
 * him adds no correlation to the ticket's remaining outcome.
 *
 * Tiers:
 *   HARD  same player, same market, same line, on a live ticket  -> true duplicate
 *   SOFT  same player, different market/line, on a live ticket   -> real correlation
 *   FREE  no pending leg on any live ticket                      -> fully available
 *
 * Usage:
 *   node scripts/props/availability.mjs [--week 2] [--out <path>] [--print] [--free-only]
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const WAGERS = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');
const DEFAULT_OUT = path.join(ROOT, 'data', 'generated', 'prop-availability.json');

const DEAD = new Set(['LOST', 'LOSS']);
const NEUTRAL = new Set(['PUSH', 'VOID', 'CANCELLED', 'CANCELED']);
const BANKED = new Set(['WON', 'WIN']);
const IGNORED = new Set(['OPEN']);

/** Round robins survive partial losses: an N-selection, K-team RR dies only once
 *  fewer than K selections remain, i.e. when losses > N - K. Parse N and K from
 *  the ticket_type string the book gives us. */
function roundRobinShape(bet) {
  const t = String(bet.ticket_type || '');
  if (!/round robin/i.test(t)) return null;
  const sel = t.match(/(\d+)\s*Selections?/i);
  const combo = t.match(/(\d+)-Team Combinations?/i);
  if (!sel || !combo) return null;
  return { selections: parseInt(sel[1], 10), comboSize: parseInt(combo[1], 10) };
}

/** Can this ticket still win? */
export function ticketLiveness(bet) {
  const legs = (bet.legs || []).filter(l => !IGNORED.has(String(l.status || '').toUpperCase()));
  const lost = legs.filter(l => DEAD.has(String(l.status || '').toUpperCase())).length;

  if (String(bet.status || '').toUpperCase() === 'SETTLED') {
    return { alive: false, reason: 'ticket settled', lost, legs: legs.length };
  }
  const rr = roundRobinShape(bet);
  if (rr) {
    const survivors = rr.selections - lost;
    const alive = survivors >= rr.comboSize;
    return {
      alive,
      reason: alive
        ? `round robin: ${survivors}/${rr.selections} selections alive, needs ${rr.comboSize}`
        : `round robin dead: only ${survivors} selections left, needs ${rr.comboSize}`,
      lost, legs: legs.length,
    };
  }
  return lost === 0
    ? { alive: true, reason: 'no losing legs', lost, legs: legs.length }
    : { alive: false, reason: `${lost} leg(s) already lost`, lost, legs: legs.length };
}

function legKeyParts(l) {
  return {
    market: String(l.market || '').toLowerCase(),
    line: l.line === undefined || l.line === null ? null : Number(l.line),
  };
}

export function buildAvailability(wagers, week) {
  const players = new Map();   // name -> { tier, holds: [] }
  const sides = new Map();     // "TEAM|market" -> { tier, holds: [] }
  const tickets = [];

  for (const bet of wagers) {
    if (week != null && bet.week !== week) continue;
    if (bet.is_paper) continue;                 // imaginary money, no real exposure
    const live = ticketLiveness(bet);
    tickets.push({ id: bet.id, alive: live.alive, reason: live.reason, title: bet.game_title || bet.game });
    if (!live.alive) continue;                  // dead ticket holds nothing hostage

    for (const l of bet.legs || []) {
      const st = String(l.status || 'PENDING').toUpperCase();
      if (IGNORED.has(st) || NEUTRAL.has(st) || BANKED.has(st) || DEAD.has(st)) continue;
      // only a still-PENDING leg on a live ticket reserves anything
      const { market, line } = legKeyParts(l);
      const hold = { ticket: bet.id, market, line, selection: l.selection || null, game: l.game || null };

      if (l.player) {
        const k = String(l.player).trim();
        if (!players.has(k)) players.set(k, { holds: [] });
        players.get(k).holds.push(hold);
      } else if (l.team) {
        // Totals carry team "TOTAL", so key them by game or they all collapse
        // into one bucket and the repeat-exposure count becomes meaningless.
        const who = /^(total|team_total)$/.test(market) && l.game
          ? String(l.game).replace(/\s+/g, '')
          : String(l.team).toUpperCase();
        const k = `${who}|${market}`;
        if (!sides.has(k)) sides.set(k, { holds: [] });
        sides.get(k).holds.push(hold);
      }
    }
  }
  return { players, sides, tickets };
}

/** HARD when the exact same market+line is already held; SOFT otherwise. */
export function classify(entry, market, line) {
  if (!entry) return { tier: 'FREE', reason: null };
  const m = String(market || '').toLowerCase();
  const ln = line === undefined || line === null ? null : Number(line);
  const exact = entry.holds.find(h => h.market === m && h.line === ln);
  if (exact) return { tier: 'HARD', reason: `same market+line on ${exact.ticket}` };
  const held = entry.holds.map(h => `${h.market}${h.line != null ? ' ' + h.line + '+' : ''}`).join(', ');
  return { tier: 'SOFT', reason: `live on ${entry.holds.length} ticket(s) as ${held}` };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const week = arg('--week') ? parseInt(arg('--week'), 10) : null;
  const out = arg('--out', DEFAULT_OUT);
  const wagers = JSON.parse(await readFile(WAGERS, 'utf8'));
  const { players, sides, tickets } = buildAvailability(wagers, week);

  const payload = {
    generated_at: new Date().toISOString(),
    week,
    tickets,
    players: Object.fromEntries([...players].map(([k, v]) => [k, v.holds])),
    sides: Object.fromEntries([...sides].map(([k, v]) => [k, v.holds])),
  };
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(payload, null, 2));

  const alive = tickets.filter(t => t.alive);
  const dead = tickets.filter(t => !t.alive);
  console.log(`\n  tickets: ${alive.length} alive, ${dead.length} dead`);
  for (const t of dead) console.log(`    DEAD  ${t.id.slice(-34).padEnd(34)} ${t.reason}`);
  console.log(`\n  ${players.size} player(s) reserved by live tickets:`);
  for (const [k, v] of [...players].sort()) {
    console.log(`    ${k.padEnd(24)} ${v.holds.map(h => `${h.market}${h.line != null ? ' ' + h.line + '+' : ''}`).join(', ')}`);
  }
  console.log(`\n  ${sides.size} side/total selection(s) reserved:`);
  for (const [k, v] of [...sides].sort()) {
    console.log(`    ${k.padEnd(24)} x${v.holds.length}${v.holds.length > 2 ? '   <-- heavy repeat exposure' : ''}`);
  }
  console.log(`\n  -> ${out}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
