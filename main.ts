// WARUNG RASA — the hand-in program (Node 22, standard library only).
//
// The game itself is plain static files in game/ (an index.html that opens in a
// desktop browser and plays offline) plus 3-4 screenshots in screenshots/.
// This program's only job is to hand those files in: it copies both folders
// into the grader's output directory and writes dossier.json there, the
// summary the judge reads, built by the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The run must be byte-identical every time, so this program writes nothing
// with a timestamp in it and never touches the network or the filesystem
// outside its own repository and the output directory.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copy a folder from the repo into the output, failing loudly if it is missing. */
function handInFolder(name) {
  const source = join(repoRoot, name);
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error(`missing folder in repository: ${name}/`);
  }
  cpSync(source, join(outputDir, name), { recursive: true });
}

/** The screenshots the gate counts: plain image files, hidden ones skipped. */
function countShots() {
  return readdirSync(join(repoRoot, 'screenshots'))
    .filter((file) => !file.startsWith('.'))
    .filter((file) => /\.(png|jpe?g)$/i.test(file));
}

mkdirSync(outputDir, { recursive: true });
handInFolder('game');
handInFolder('screenshots');

const shots = countShots();
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}

// The gate's own caps, so a bad hand-in fails here instead of in the grader:
// at most 4 screenshots of 256 KiB, game/ at most 993 files and 48 MiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
