"""Build an isolated source-review packet from retained local evidence only."""
import collections
import datetime as dt
import hashlib
import json
import pathlib
import re
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent
PT = ZoneInfo("America/Los_Angeles")
GENERATED = dt.datetime.now(dt.timezone.utc).isoformat()
IDS = ("SBt7paSti4M", "YuFlxjiEDJ4", "5dIACwzMnzg")
discovery = json.loads((ROOT / "discovery.json").read_text(encoding="utf-8-sig"))
published = {ep["video_id"]: ep for channel in discovery for ep in channel.get("episodes", [])}
sources, data_by_id = [], {}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stamp(value):
    return f"{int(value) // 60:02d}:{int(value) % 60:02d}"


for episode_id in IDS:
    meta_path = ROOT / "youtube" / f"{episode_id}.info.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    caption = episode_id == "SBt7paSti4M"
    evidence_path = ROOT / "youtube" / f"{episode_id}.{'captions' if caption else 'parakeet'}.json"
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    segments = evidence["segments"] if caption else evidence["utterances"]
    duration = meta["duration"] if caption else evidence["meta"]["duration_sec"]
    last_end = max(segment["end"] for segment in segments)
    assert all(0 <= segment["start"] <= segment["end"] <= duration + 1 for segment in segments)
    assert all(a["start"] <= b["start"] for a, b in zip(segments, segments[1:]))
    source = {
        "video_id": episode_id, "title": meta["title"], "url": meta["webpage_url"],
        "published_at": published[episode_id]["published_at"],
        "duration_seconds": duration, "last_recognized_speech_second": last_end,
        "untranscribed_tail_seconds": round(duration - last_end, 2),
        "evidence_kind": "youtube_automatic_captions" if caption else "local_parakeet_v3_pyannote_community_1",
        "evidence_file": str(evidence_path.relative_to(ROOT)), "evidence_sha256": sha(evidence_path),
        "raw_file": str((ROOT / "youtube" / f"{episode_id}.en.vtt").relative_to(ROOT)) if caption else str((ROOT / "youtube" / f"{episode_id}.audio.webm").relative_to(ROOT)),
        "raw_sha256": sha(ROOT / "youtube" / (f"{episode_id}.en.vtt" if caption else f"{episode_id}.audio.webm")),
        "automated_deletion_flags": None if caption else len(evidence["flags"]),
        "human_audio_verified": False, "promotion_status": "local_source_review_only",
        "database_status": "not_queried", "player_named_derived_intel": "withheld_pending_authorized_current_roster_gate",
    }
    data_by_id[episode_id] = {"source": source, "segments": segments}
    sources.append(source)

items = []


def add(episode_id, item_id, start, end, speaker, classification, game, selection, quote, note,
        line=None, odds=None, **extra):
    evidence = data_by_id[episode_id]
    rows = [row for row in evidence["segments"] if row["end"] >= start and row["start"] <= end]
    normalized = re.sub(r"\s+", " ", " ".join(row["text"] for row in rows)).lower()
    assert re.sub(r"\s+", " ", quote).lower() in normalized, (item_id, "quote missing from indicated evidence span")
    assert 0 <= start < end <= evidence["source"]["duration_seconds"] + 1
    items.append({
        "id": item_id, "episode_id": episode_id, "source_title": evidence["source"]["title"],
        "source_url": evidence["source"]["url"], "source_published_at": evidence["source"]["published_at"],
        "evidence_file": evidence["source"]["evidence_file"], "evidence_sha256": evidence["source"]["evidence_sha256"],
        "start_seconds": start, "end_seconds": end, "speaker": speaker,
        "classification": classification, "game": game, "selection": selection, "line": line, "odds_american": odds,
        "quote": quote, "note": note, "status": "source_evidence_only_pending_human_review",
        "price_status": "historical_episode_reference_not_current_offer", "execution_eligible": False,
        "human_audio_verified": False, **extra,
    })


EM = "SBt7paSti4M"
for suffix, game, selection, line, quote, note in [
    ("dal", "ARI@DAL", "DAL", -6.5, "Dallas minus", "Contest selection; episode's earlier market recap already describes a move to -7."),
    ("den", "KC@DEN", "DEN", 1.5, "Denver plus", "Contest selection; also described as a Tuesday carry-forward."),
    ("cle", "CLE@PIT", "CLE", 3.5, "Cleveland plus", "Contest selection; not automatically a standalone cash recommendation."),
    ("bal", "BAL@BUF", "BAL", 3.5, "Baltimore plus", "Contest selection conditional on quarterback availability; speaker may change it. Higher-confidence contest designation is also conditional."),
]:
    add(EM, "em-contest-" + suffix, 1218, 1257, "Steve Fezzik", "contest_only", game, selection, quote, note, line=line,
        attribution_basis="Host explicitly asks Steve for his contest selections; subtitles have no speaker labels.")
add(EM, "em-contest-chi", 1256, 1276, "Steve Fezzik", "contest_only", "CHI@SEA", "CHI", "Bears plus",
    "Explicitly the weakest of the five and likely to change; contest line differs from the earlier +3 recap.", line=3.5)
add(EM, "em-min-q1", 1352, 1389, "Steve Fezzik", "explicit_recommendation_candidate", "MIN@DET", "MIN first-quarter spread",
    "Plus a half minus 135", "A first-quarter team spread, despite being introduced as the week's prop; source price only.", line=0.5, odds=-135)
add(EM, "em-parlay-atl-tb", 1408, 1450, "Steve Fezzik", "parlay_only", "ATL@TB", "UNDER", "under 45",
    "Leg of one three-total traditional parlay, not a separately promoted single. Weather rationale is the speaker's assertion.", line=45, parlay_group="em-three-unders")
add(EM, "em-parlay-cle-pit", 1428, 1450, "Steve Fezzik", "parlay_only_pending_line_verification", "CLE@PIT", "UNDER", "under 39 12",
    "Automatic captions render the number ambiguously. Preserve null line; a possible 39.5 reading requires audio verification.",
    possible_line_for_review=39.5, parlay_group="em-three-unders")
add(EM, "em-parlay-lac-lar", 1428, 1450, "Steve Fezzik", "parlay_only", "LAC@LAR", "UNDER", "under 45 and a half",
    "Third leg of the same traditional parlay. Approximate combined +570 is a host reference, not a book quote.", line=45.5, parlay_group="em-three-unders")

AN = "YuFlxjiEDJ4"
add(AN, "an-car-contest", 39, 114, "Doug Kezirian (context-supported; not visually verified)", "contest_only_cash_bet_undecided", "CAR@GB", "CAR",
    "pick'em leagues", "Definitely takes the points in pick'em; explicitly undecided about betting cash.", line=3.5,
    attribution_basis="Opening speaker addresses Doug; episode description names Doug Kezirian.")
add(AN, "an-under-conditional", 114, 343, "Stuckey (context-supported; not visually verified)", "conditional_lean", "CAR@GB", "UNDER",
    "small lean to the under", "Small lean, not a strong bet; possible small stake contingent on offensive availability. Counterarguments are retained in the transcript.", line=47.5)
add(AN, "an-half-under-watch", 343, 361, "Evan (addressed by first name; surname unverified)", "watchlist_not_a_bet", "CAR@GB", "FIRST_HALF_UNDER",
    "wish first half under", "Discusses 23.5 but wishes for 24 or 24.5. Do not promote 23.5 as his placed/recommended bet. Historical-system claims are unverified.",
    discussed_line=23.5, preferred_lines=[24, 24.5])
add(AN, "an-spread-pass", 361, 375.4, "Stuckey (context-supported; not visually verified)", "pass_neutral", "CAR@GB", "NO_SPREAD_EDGE",
    "on market with the spread", "His own spread is on the market. Closing preference for the under does not remove the earlier small-lean/availability qualifications.")

GC = "5dIACwzMnzg"
for suffix, start, end, game, quote, note in [
    ("car-gb", 133, 353, "CAR@GB", "the run game", "Green Bay run-game and offensive-line execution against Carolina; qualitative matchup discussion only."),
    ("bal-buf", 408, 649, "BAL@BUF", "outside zone", "Buffalo run concepts versus Baltimore pressure/disguise. Prior opponent results are not assumed to transfer directly."),
    ("ten-cin", 672, 776, "TEN@CIN", "attack the corners", "Cincinnati's outside passing matchups and Tennessee's need to create pressure with its front."),
    ("ari-dal", 790, 894, "ARI@DAL", "the run game", "Dallas early-down rushing efficiency and its effect on passing workload; no spread/total pick supplied."),
    ("min-det", 1033, 1257, "MIN@DET", "pressure fronts", "Minnesota pressure-front and protection math versus Detroit play-action; host statistics remain unverified source assertions."),
    ("ind-jax", 1373, 1460, "IND@JAX", "clean, defined reads", "Jacksonville route spacing and passing decisiveness; favorable film assessment is not a wager recommendation."),
]:
    add(GC, "cosell-" + suffix, start, end, "Greg Cosell (SPEAKER_02; introduced/addressed in episode)", "analysis_only", game,
        "MATCHUP_CONTEXT", quote, note, attribution_basis="Ross introduces Greg and directly addresses him before the analysis; no visual verification.")

counts = dict(collections.Counter(item["classification"] for item in items))
packet = {
    "generated_at": GENERATED, "scope": "Morning releases on 2026-10-29 Pacific; configured public channels plus four retained public audio feeds",
    "status": "local_source_review_only", "paid_calls": 0, "supabase_actions": 0, "account_actions": 0,
    "official_picks_or_ledger_changes": False, "roster_gate": "not_run_pending_per_action_approval",
    "player_named_derived_intel": "withheld", "sources": sources, "classification_counts": counts, "items": items,
    "parlay_context": {"id": "em-three-unders", "approximate_combined_odds_american": 570,
                       "odds_status": "speaker_estimate_not_executable_quote", "cle_pit_line": "unverified"},
    "withheld_source_sections": [
        {"episode_id": EM, "start_seconds": 496, "end_seconds": 1106, "reason": "Named injury/status commentary awaits authorized roster gate and source verification."},
        {"episode_id": GC, "start_seconds": 1499, "end_seconds": 1659.5, "reason": "Named news/transactions/status commentary remains raw evidence; not adopted as verified fact."},
    ],
}
(ROOT / "candidate-intel.json").write_text(json.dumps(packet, ensure_ascii=False, indent=2), encoding="utf-8")

titles = {EM: "Even Money: props and parlays", AN: "Action Network: TNF picks", GC: "Greg Cosell: Week 8 preview, part 1"}
lines = ["# Morning podcast source review — October 29, 2026", "", "Three available episodes captured and locally extracted. These are source-review candidates, not an official card or current betting offers. Automated text and speaker attribution still need human review. Player-named derived intel is withheld while the requested roster-check approval is pending.", "",
         "No paid calls, Supabase actions, account actions, ledger/portfolio edits, or publication. The existing TNF card remains HOLD.", "",
         "| Source | Runtime | Local evidence |", "|---|---:|---|"]
for source in sources:
    lines.append(f"| [{titles[source['video_id']]}]({source['url']}) | {stamp(source['duration_seconds'])} | {source['evidence_kind']} |")
lines.extend(["", "## Classified source items", "", "Prices below were spoken in the episode. They have not been refreshed or verified as available.", "",
              "| Source/time | Speaker | Classification | Game | Source selection | Qualification |", "|---|---|---|---|---|---|"])
for item in items:
    selection = item["selection"]
    if item["line"] is not None:
        selection += f" {item['line']:+g}" if "UNDER" not in selection else f" {item['line']:g}"
    if item["odds_american"] is not None:
        selection += f" ({item['odds_american']:+d})"
    lines.append(f"| {titles[item['episode_id']]} {stamp(item['start_seconds'])}–{stamp(item['end_seconds'])} | {item['speaker']} | {item['classification']} | {item['game']} | {selection} | {item['note']} |")
lines.extend(["", "## Coverage and remaining checks", "",
              "Every available source has its original URL, publication time, raw evidence, retained SHA-256, timestamps and direct quote links in candidate-intel.json. There is one source row per episode; clips/YouTube and audio mirrors are not counted as independent opinions.", "",
              "The complete downloaded audio was supplied to the local VAD/transcriber. Last recognized speech is reported below; proximity to the runtime and zero automated deletion flags do not establish human-verified completeness.", "",
              "| Source | Runtime seconds | Last recognized speech | Remaining tail | Automated deletion flags |", "|---|---:|---:|---:|---:|"])
for source in sources:
    lines.append(f"| {titles[source['video_id']]} | {source['duration_seconds']} | {source['last_recognized_speech_second']} | {source['untranscribed_tail_seconds']} | {source['automated_deletion_flags']} |")
lines.extend(["", "- The Favorites preview (`wroZyAXRZhc`) is scheduled for 10:00 AM PT and was not playable at capture. It is queued, not processed. The public audio feed had no morning release at capture.",
              "- Three new short clips and Sal Vetri's fantasy trade video were inventoried separately. BettingPros' morning RSS release was college football and was excluded from the NFL packet.",
              "- The saved canonical 57-episode transcript manifest and inspected local candidate/shadow/scratch artifacts had no matches for these new video IDs. Supabase was not queried, so database processing/promotion status is unknown.",
              "- The Even Money CLE–PIT under number is ambiguous in captions; the structured line is null until audio verification. Its other two totals remain parlay-only.",
              "- Named injury, trade, roster and role assertions have not been turned into verified player intel. Historical trend/statistical claims remain source assertions.",
              "- Nine public YouTube channel feeds and four public audio feeds were retained. The shared discovery queue, canonical recommendation files, Master Intel inputs and live trackers were not rebuilt.", ""])
(ROOT / "README.md").write_text("\n".join(lines), encoding="utf-8")

hash_rows = []
for path in sorted(ROOT.rglob("*")):
    if path.is_file() and path.name != "sha256-manifest.json":
        hash_rows.append({"path": str(path.relative_to(ROOT)), "bytes": path.stat().st_size, "sha256": sha(path)})
(ROOT / "sha256-manifest.json").write_text(json.dumps({"generated_at": GENERATED, "files": hash_rows}, indent=2), encoding="utf-8")
print(json.dumps({"sources": len(sources), "items": len(items), "classification_counts": counts,
                  "files_hashed": len(hash_rows), "paid_calls": 0, "supabase_actions": 0}, indent=2))
