// WARUNG RASA — main: boot the kitchen, run the loop, stage the screenshots.
// One file, one job: start the game and keep it ticking.

import { SCREEN_PLAY, newGame } from './state.js';
import { tick } from './cook.js';
import { draw, VIEW_H, VIEW_W } from './render.js';
import { attachInput } from './input.js';
import { playSound } from './audio.js';
import { stagedGame } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

// A ?shot=cover|rush|serve|results URL opens the game already in that scene,
// staged from the real rules, so a screenshot shows a real frame of play.
const state = shot ? stagedGame(shot) : newGame();
let last = performance.now();

attachInput(canvas, state, () => {});

/** Start a fresh shift after the results screen (same object, so input keeps working). */
function restart() {
  const fresh = newGame();
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
  state.screen = SCREEN_PLAY;
  state.restartRequested = false;
  last = performance.now();
  playSound('click');
}

/** The frame loop: advance the rules, then paint. */
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (state.restartRequested) restart();
  if (state.screen === SCREEN_PLAY) tick(state, dt, Math.random);
  draw(ctx, state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Let a screenshot script know the first frame has been painted.
window.__warungReady = true;
// And let a play-test read the live state (coins, orders, plates, hand).
window.__warungState = state;
