# Antigravity AI — Documentation & Architectural Specs Repository

Welcome to the **Antigravity AI** directory for the Platinum Rose NFL Dashboard. This folder contains all system architecture maps, data flow specs, intake blueprints, and research reports generated during pair-programming sessions with Antigravity.

---

## 📄 Key Documents & Specs

| Document | Description | Path |
|---|---|---|
| **Gemini Audio Migration Spec** | Technical specification to migrate `podcast-ingest.js` to 1-step Gemini 2.0 Flash Multimodal Audio transcription & pick extraction. | [`GEMINI_AUDIO_MIGRATION_SPEC.md`](file:///e:/dev/projects/NFL_Dashboard/docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md) |
| **Full Test Transcription & Parity Report** | Head-to-head data parity verification report comparing current Groq/AssemblyAI outputs vs. Gemini 2.0 Multimodal Audio outputs. | [`FULL_TEST_TRANSCRIPTION_COMPARISON.md`](file:///e:/dev/projects/NFL_Dashboard/docs/antigravity/FULL_TEST_TRANSCRIPTION_COMPARISON.md) |
| **System Architecture & Monte Carlo Data Flow** | Comprehensive map detailing React 19 component hierarchy, Tailwind CSS v3 styling interaction, and the end-to-end 10,000-iteration Monte Carlo simulation Web Worker engine. | [`architecture_map.md`](file:///e:/dev/projects/NFL_Dashboard/docs/antigravity/architecture_map.md) |
| **Google Ecosystem Intake Blueprint** | Architectural blueprint for integrating a dedicated Gmail account, YouTube summaries, Google Calendar, and Google Photos OCR into the Obsidian Vault & AI Agent system. | [`google_vault_intake_architecture.md`](file:///e:/dev/projects/NFL_Dashboard/docs/antigravity/google_vault_intake_architecture.md) |

---

## 📁 Repository Placement & Conventions

* **Documentation Directory**: All general technical specifications, audit reports, and architectural blueprints produced by Antigravity are permanently stored in `docs/antigravity/`.
* **Vault Seed Drop Directory**: All ingested Markdown notes, podcast summaries, and manual research intel are saved directly in `data/vault-seed/manual/` for instant sync via `vault-seed.js` or `export-vault-to-md.js`.
