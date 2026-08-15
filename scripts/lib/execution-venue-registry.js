// Compatibility re-export. The canonical execution-venue registry lives at
// src/lib/executionVenues.js (this repo's established shared-code home —
// agents/portfolio-dossier.js already imports src/lib/teams.js, so Node-side
// code importing from src/lib/ is the existing pattern here, not the reverse).
// This file exists only so a `scripts/lib/*` import path also resolves; new
// code should import src/lib/executionVenues.js directly.
export * from '../../src/lib/executionVenues.js';
