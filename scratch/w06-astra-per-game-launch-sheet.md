# W6 Astra per-game launch sheet (Sat 2026-10-17)

State: QUEUED / HOLD. This sheet and the launch board do not authorize a run. Only Andy initiates a launch. The preparing chat verifies readiness and returns activation messages; it never synthesizes.

## Exact activation template

```text
Run the Platinum Rose Week 6 Astra synthesis for ONE game: <GAME>.
Repo: E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Branch claude/w5-prop-cards-2026-10-11.
Read agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md and follow it exactly. Do not synthesize any other game.
Queue: scratch/w06-astra-synthesis-queue.json; matchup: <GAME>; packet SHA-256: <PACKET_SHA256>; queue SHA-256: <QUEUE_SHA256>; pinned HEAD: <PINNED_HEAD>.
This stored activation is inert. Andy must paste it after a fresh successful launch preflight. No launch signal or conditional status waives the article gate.
Recheck HEAD/branch, queue and packet hashes, every packet source hash, kickoff still in the future, and strict roster gate. Refuse stale pins, passed kickoff, roster BLOCK or unresolved launch-blocking conditions.
Article-gate decision in this queued version: unresolved; STOP until Andy explicitly resolves or waives it and the packet is requeued.
Outputs: reports/intel/games/2026-w06-astra-<AWAY>_at_<HOME>.md ; data/research-intel/proposed/games-w06/2026-w06-astra-<AWAY>_at_<HOME>.json ; append one line to reports/intel/games/2026-w06-astra-RUNLOG.md.
```

Substitute every placeholder from the regenerated queue/board. Packet hash uses recursively sorted JSON object keys, array order retained, UTF-8, no whitespace; hash the entire packet object. Queue hash is SHA-256 of the exact saved queue JSON bytes.

## Controller signals

- `launch <GAME>`: verify current pins, future kickoff and roster gate; report ready/not-ready and the activation message. Do not run synthesis.
- `launch all ready`: same check for each ready/conditional packet in kickoff order. Never treat conditional as a waiver; list not-ready reasons where launch-blocking conditions remain.
- `refresh <GAME>` or `requeue`: rebuild the requested packet/queue and all affected launch-board hashes after inputs change.
- No other message launches a game. Remain on HOLD after replying.

Kickoff order (PT, Sun 10/18 unless noted): HOU@JAX 06:30; NYJ@NE, PIT@TB, BAL@CLE, CHI@ATL, TEN@IND, CAR@PHI, NO@NYG 10:00; ARI@LAR 13:05; BUF@LV, LAC@KC 13:25; DAL@GB 17:20; WAS@SF Mon 10/19 17:15.

## Schema and stop contract

Queue schema: `w06_astra_synthesis_queue_v1`; state `status: queued_hold`; `dispatch_allowed: false` controls this preparation chat. `hold_for_andy: true` is intentional, not a failed evidence gate. A fresh session requires Andy to paste the activation after successful preflight; it must not treat HOLD alone as authorization.

Select `packets[]` by `matchup`; use `synthesis_status`, `blockers[]`, `conditions[]`, `evidence_manifest[]` and `sources`. CHI@ATL is blocked until Sunday starting-QB confirmation. A condition with `launch_blocking: true` must be resolved or explicitly waived by Andy and requeued; other conditions restrict only their named claim/market. Line movement and thin boards are notes, never automatic blockers.

Check all source pins BEFORE rerunning roster vet. The requested gate rewrites its own report. Record the new receipt separately; permit only this expected report rewrite after a PASS with unchanged roster source and no new blocking issues. If a fetch changes the roster snapshot, stop and requeue. Any other source drift is a stop.

Outputs and RUNLOG are created only by a separately activated future game session, never by preparing this board.
