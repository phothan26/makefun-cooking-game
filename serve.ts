// A tiny static server for game/ (Node 22, standard library only), so the entry
// can be played locally without a build step: `node serve.ts` serves game/ on
// http://localhost:8080. Development convenience only, not part of the game.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const port = Number(process.env.PORT ?? 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = resolve(join(root, normalize(urlPath).replace(/^(\.\.[/\\])+/, '')));
  if (!target.startsWith(root + sep) && target !== root) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }
  const file = target === root ? join(root, 'index.html') : target;
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
  } catch {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, () => console.log(`Warung Rasa at http://localhost:${port}`));
