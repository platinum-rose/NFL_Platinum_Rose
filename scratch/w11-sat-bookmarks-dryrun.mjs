// Saturday W11 E8: read Andy's X bookmarks with the agent in --dry-run (no Supabase client),
// and with GEMINI_API_KEY forced empty so no paid Gemini OCR/extraction calls are made.
// dotenv does not override an env var that already exists, so '' survives agent start-up.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
process.env.GEMINI_API_KEY = '';
process.env.DRY_RUN = 'true';
const agent = path.resolve('agents/twitter-bookmarks-agent.js');
process.argv = [process.argv[0], agent, '--dry-run'];
await import(pathToFileURL(agent).href);
