import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const importer = resolve(import.meta.dirname, 'import-bookmaker-props-from-clipboard.mjs');
const server = createServer((request, response) => {
  response.setHeader('access-control-allow-origin', 'https://be.bookmaker.eu');
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type');
  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
    return;
  }
  if (request.method !== 'POST' || request.url !== '/capture') {
    response.writeHead(404).end();
    return;
  }
  let body = '';
  request.setEncoding('utf8');
  request.on('data', (chunk) => { body += chunk; });
  request.on('end', () => {
    const result = spawnSync(process.execPath, [importer], { input: body, encoding: 'utf8', cwd: resolve(import.meta.dirname, '..') });
    response.writeHead(result.status === 0 ? 200 : 500, { 'content-type': 'application/json' });
    response.end(result.status === 0 ? result.stdout : JSON.stringify({ error: result.stderr || result.stdout }));
    server.close(() => process.exit(result.status || 0));
  });
});
server.listen(39877, '127.0.0.1', () => console.log('READY'));
