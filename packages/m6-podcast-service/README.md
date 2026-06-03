# nfl-podcast-service (M6)

Local Fastify service that ingests NFL podcasts, transcribes them with
faster-whisper, extracts picks with Ollama (qwen2.5:3b → GPT-4o fallback), and
serves digest pages over Tailscale + Funnel.

Spec: `/memories/repo/nfl-podcast-pipeline-spec.md` (Phases 1–9).
This README covers Phase 2 (the service skeleton). Phases 3+ (transcribe,
extract, vault rebuild, digest render, Funnel) land in subsequent commits.

---

## Layout

```
packages/m6-podcast-service/
├── package.json
├── .env.example
├── deploy/
│   └── nfl-podcast.service       # systemd unit
├── src/
│   ├── server.js                 # entry point
│   ├── app.js                    # Fastify factory (also imported by tests)
│   ├── config.js                 # env loader + defaults
│   ├── hmac.js                   # X-NFL-Signature validator
│   └── runRegistry.js            # in-memory run state (Phase 3 swaps the worker)
└── test/
    └── server.test.js            # Phase 2 acceptance tests
```

## Endpoints (Phase 2)

| Method | Path                          | Auth                | Status        |
|--------|-------------------------------|---------------------|---------------|
| GET    | `/health`                     | public (Tailscale)  | implemented   |
| POST   | `/ingest/run`                 | HMAC                | implemented (stub worker) |
| GET    | `/ingest/status/:run_id`      | HMAC                | implemented   |
| GET    | `/digest/episodes/:id.html`   | Tailscale-only      | 501 (Phase 7) |
| GET    | `/digest/experts/:slug.html`  | Tailscale-only      | 501 (Phase 7) |
| GET    | `/digest/weekly/:weekTag.html`| Tailscale-only      | 501 (Phase 7) |
| GET    | `/share/*`                    | Funnel + token      | 501 (Phase 8) |
| GET    | `/api/transcript/:id`         | Tailscale-only      | 501 (Phase 3) |

## Local development (Windows)

```powershell
cd packages\m6-podcast-service
copy .env.example .env
# leave NFL_PODCAST_HMAC_SECRET blank for dev — config.js falls back to
# 'dev-secret-do-not-use' when NODE_ENV != 'production'
npm install
npm test                 # vitest acceptance suite
npm run dev              # starts on http://127.0.0.1:5060
```

Verify the dev server:

```powershell
curl http://127.0.0.1:5060/health

# Sign a payload (PowerShell):
$secret = "dev-secret-do-not-use"
$body   = "{}"
$hmac   = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($secret))
$sig    = "sha256=" + ([BitConverter]::ToString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($body))) -replace '-','').ToLower()
curl -X POST http://127.0.0.1:5060/ingest/run -H "content-type: application/json" -H "x-nfl-signature: $sig" -d $body
```

## M6 deployment runbook

```bash
# 1. Sync code (one of):
cd ~/projects/NFL_Dashboard && git pull
# OR rsync from Windows over Tailscale

cd ~/projects/NFL_Dashboard/packages/m6-podcast-service
npm ci

# 2. Create the env file (root-owned, group-readable by service user)
sudo install -o root -g andrewlrose -m 0640 /dev/null /etc/nfl-podcast.env
sudo nano /etc/nfl-podcast.env   # fill in values from .env.example
#   NFL_PODCAST_HMAC_SECRET=$(openssl rand -hex 32)
#   SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   OPENAI_API_KEY=...

# 3. Storage roots
sudo install -d -o andrewlrose -g andrewlrose /var/lib/nfl/audio
sudo install -d -o andrewlrose -g andrewlrose /var/lib/nfl/transcripts
sudo install -d -o andrewlrose -g andrewlrose /var/lib/nfl/digest
sudo install -d -o andrewlrose -g andrewlrose /var/log/nfl-podcast

# 4. Install systemd unit
sudo install -m 0644 deploy/nfl-podcast.service /etc/systemd/system/nfl-podcast.service
sudo systemctl daemon-reload
sudo systemctl enable --now nfl-podcast
sudo systemctl status nfl-podcast

# 5. Smoke-test locally
curl http://127.0.0.1:5060/health
```

## Operations

```bash
# Logs
journalctl -u nfl-podcast -f
journalctl -u nfl-podcast --since "1 hour ago"

# Restart
sudo systemctl restart nfl-podcast

# Restart-on-failure verification (Phase 2 acceptance E2)
sudo kill -9 $(systemctl show -p MainPID --value nfl-podcast)
# Watch: should be re-spawned within ~15s
sleep 20 && systemctl is-active nfl-podcast       # → active

# Rotate HMAC secret
sudo nano /etc/nfl-podcast.env                    # update NFL_PODCAST_HMAC_SECRET
sudo systemctl restart nfl-podcast
# then update the GHA secret used by .github/workflows/podcast-ingest.yml
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `EADDRINUSE :::5060` | another instance running | `sudo systemctl stop nfl-podcast` then re-check |
| 401 `bad_signature` | secret drift between cron and service | rotate secret in both places |
| `Missing required env var: NFL_PODCAST_HMAC_SECRET` on boot | `/etc/nfl-podcast.env` not loaded | check unit's `EnvironmentFile=` path + perms 0640 |
| Service exits immediately | `node` not found at `/usr/bin/node` | `which node` and update `ExecStart` |

## Phase 2 acceptance (per spec §3 Phase 2)

- [x] `GET /health` returns valid JSON
- [x] `POST /ingest/run` with valid HMAC starts a run, returns 202 + `run_id`
- [x] Invalid HMAC returns 401
- [ ] **Manual on M6:** service auto-restarts within 15s after `kill -9`
- [ ] **Manual on M6:** survives reboot (`systemctl is-enabled` = `enabled`)

## Phase 3 � Transcription (Python)

The Python extractor + transcriber lives in [python/](python/). It is portable so unit tests run on Windows dev with a fake Whisper backend; M6 production uses `faster-whisper` (CTranslate2).

### M6 setup

```bash
cd /home/andrewlrose/projects/NFL_Dashboard/packages/m6-podcast-service/python
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt -r requirements-m6.txt

# Pre-download Whisper models (one time)
sudo mkdir -p /var/lib/nfl/models /var/lib/nfl/audio /var/lib/nfl/transcripts /var/lib/nfl/digest
sudo chown -R andrewlrose:andrewlrose /var/lib/nfl
# faster-whisper auto-downloads on first use; or pre-pull e.g.:
# huggingface-cli download Systran/faster-whisper-large-v3-turbo --local-dir /var/lib/nfl/models/large-v3-turbo
```

### Run a transcription

```bash
.venv/bin/python -m nfl_podcast.transcribe \`n  --audio /var/lib/nfl/audio/<id>.mp3 \`n  --episode-id <id> \`n  --model large-v3-turbo
```

### Run the model bench (one time, picks daily driver)

```bash
.venv/bin/python -m nfl_podcast.bin.bench_whisper \`n  --audio /var/lib/nfl/audio/<sample>.mp3 \`n  --reference /var/lib/nfl/transcripts/<sample>.reference.txt \`n  --out /var/lib/nfl/bench/<sample>.json
```

Recommends `large-v3-turbo` unless WER delta vs `large-v3` exceeds 2 percentage points (per spec �3 Phase 3).

### Tests (Windows-friendly)

```bash
cd python && python -m pytest tests/ -v
```

All 36 tests run offline with mocked ffmpeg + mocked Whisper backend.

## Phase 4 wiring — Node ↔ Python extractor

`POST /ingest/run` now requires a JSON body and spawns the Phase 4 Python
extractor as a child process. The signed payload **must** include:

```json
{
  "transcript_path": "/var/lib/nfl/transcripts/<episode_id>.txt",
  "episode_id": "<supabase_episode_id>",
  "model": "qwen2.5:3b",                       // optional; defaults to OLLAMA_MODEL
  "ollama_url": "http://127.0.0.1:11434"     // optional; defaults to OLLAMA_BASE_URL
}
```

The worker (`src/pipelineWorker.js`) invokes:

```
$NFL_PYTHON_EXECUTABLE -m nfl_podcast.extract \
  --transcript <path> --episode-id <id> \
  --ollama-url <url> --model <model>
```

then writes a summary to `run.stats` (`pick_count`, `extraction_quality_score`,
`needs_cloud_fallback`, `duration_ms`, etc.) and stashes the full extractor
JSON on `run.result`. `GET /ingest/status/:run_id` exposes both.

### M6 prerequisites for Phase 4

Run these once on M6 (in addition to the Phase 3 setup above):

```bash
# 1. Pull latest
cd ~/projects/NFL_Dashboard && git pull

# 2. Confirm the venv exists at the expected location
ls /home/andrewlrose/projects/NFL_Dashboard/packages/m6-podcast-service/python/.venv/bin/python

# 3. Confirm Ollama is up and the model is loaded
ollama list | grep qwen2.5:3b
curl -s http://127.0.0.1:11434/api/tags | head

# 4. Add Phase 4 env vars to /etc/nfl-podcast.env (defaults are correct on M6;
#    only override if your venv lives somewhere else):
#       NFL_PYTHON_EXECUTABLE=/home/andrewlrose/projects/NFL_Dashboard/packages/m6-podcast-service/python/.venv/bin/python
#       NFL_PYTHON_CWD=/home/andrewlrose/projects/NFL_Dashboard/packages/m6-podcast-service/python
#       OLLAMA_BASE_URL=http://127.0.0.1:11434
#       OLLAMA_MODEL=qwen2.5:3b
sudo nano /etc/nfl-podcast.env

# 5. Restart and smoke-test
sudo systemctl restart nfl-podcast
journalctl -u nfl-podcast -f &

# 6. End-to-end test using a real transcript on M6
SECRET=$(sudo grep ^NFL_PODCAST_HMAC_SECRET /etc/nfl-podcast.env | cut -d= -f2)
BODY='{"transcript_path":"/var/lib/nfl/transcripts/<id>.txt","episode_id":"<id>"}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"
RUN=$(curl -s -X POST http://127.0.0.1:5060/ingest/run \
  -H "content-type: application/json" -H "x-nfl-signature: $SIG" -d "$BODY" \
  | jq -r .run_id)
sleep 10
SIG2="sha256=$(printf '' | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"
curl -s "http://127.0.0.1:5060/ingest/status/$RUN" -H "x-nfl-signature: $SIG2" | jq
```

You should see `status: "done"`, a non-empty `stats.pick_count`, and an
`extraction_quality_score` between 0 and 1.
