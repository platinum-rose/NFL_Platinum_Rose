"""Normalize retained public VTT captions locally; no network or model calls."""
import hashlib
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
SOURCE = ROOT / "youtube" / "SBt7paSti4M.en.vtt"
META = json.loads((ROOT / "youtube" / "SBt7paSti4M.info.json").read_text(encoding="utf-8"))


def seconds(value):
    hours, minutes, secs = value.split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(secs)


def stamp(value):
    return f"{int(value) // 60:02d}:{int(value) % 60:02d}"


raw = SOURCE.read_text(encoding="utf-8-sig")
segments = []
previous = []
for block in re.split(r"\n\n+", raw.replace("\r\n", "\n")):
    lines = block.splitlines()
    timing_index = next((i for i, line in enumerate(lines) if " --> " in line), None)
    if timing_index is None:
        continue
    timing = re.match(r"(\d{2}:\d{2}:\d{2}\.\d+) --> (\d{2}:\d{2}:\d{2}\.\d+)", lines[timing_index])
    if not timing:
        continue
    text = html.unescape(re.sub(r"<[^>]*>", "", " ".join(lines[timing_index + 1:]))).strip()
    tokens = text.split()
    overlap = 0
    for size in range(min(len(previous), len(tokens)), 0, -1):
        if previous[-size:] == tokens[:size]:
            overlap = size
            break
    previous = tokens
    new_tokens = tokens[overlap:]
    if not new_tokens:
        continue
    start, end = seconds(timing[1]), seconds(timing[2])
    text = " ".join(new_tokens)
    if segments and start - segments[-1]["start"] < 18:
        segments[-1]["text"] += " " + text
        segments[-1]["end"] = end
    else:
        segments.append({"start": start, "end": end, "text": text, "speaker": "unattributed"})

duration = META["duration"]
assert segments, "No captions parsed"
assert all(0 <= row["start"] <= row["end"] <= duration + 1 for row in segments), "Caption times exceed video runtime"
assert all(a["start"] <= b["start"] for a, b in zip(segments, segments[1:])), "Caption time order invalid"
result = {
    "video_id": META["id"],
    "title": META["title"],
    "source_url": META["webpage_url"],
    "source_type": "youtube_automatic_captions",
    "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    "duration_seconds": duration,
    "first_caption_second": segments[0]["start"],
    "last_caption_second": segments[-1]["end"],
    "status": "source_evidence_only_pending_human_review",
    "speaker_attribution": "Not supplied by captions; no inferred speaker labels assigned",
    "segments": segments,
}
output = ROOT / "youtube" / "SBt7paSti4M.captions.json"
output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
text_path = output.with_suffix(".txt")
text_path.write_text("# Automatic captions; not a human-verified transcript\n" + "\n".join(
    f"[{stamp(row['start'])}-{stamp(row['end'])}] {row['text']}" for row in segments
) + "\n", encoding="utf-8")
print(json.dumps({"segments": len(segments), "words": sum(len(row["text"].split()) for row in segments),
                  "runtime": duration, "last_caption": segments[-1]["end"], "sha256": result["source_sha256"]}))
