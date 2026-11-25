// WARUNG RASA — input: mouse clicks and keyboard, translated into kitchen actions.
// One file, one job: where the player pointed, and what that means.

import { INGREDIENTS } from './data.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './state.js';
import { addToPlate, dropHand, grabIngredient, serveOrder, useStation } from './cook.js';
import { layout } from './render.js';
import { ensureAudio, playSound, setMuted } from './audio.js';

function inside(rect, x, y) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

/** Convert a mouse event to canvas coordinates (the canvas fills the window). */
export function toCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

/** Handle one click while playing: bins, stations, plates, tickets, hand. */
function clickPlay(state, x, y) {
  const L = layout();
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (inside(L.bins[i], x, y)) {
      playSound(grabIngredient(state, INGREDIENTS[i].id));
      return;
    }
  }
  for (let i = 0; i < state.stations.length; i += 1) {
    if (inside(L.stations[i], x, y)) {
      playSound(useStation(state, state.stations[i].id));
      return;
    }
  }
  for (let i = 0; i < state.plates.length; i += 1) {
    if (inside(L.plates[i], x, y)) {
      playSound(addToPlate(state, i));
      return;
    }
  }
  for (let i = 0; i < state.orders.length; i += 1) {
    if (inside(L.tickets[i], x, y)) {
      playSound(serveOrder(state, state.orders[i].id, x, y - 30));
      return;
    }
  }
  if (inside(L.hand, x, y)) playSound(dropHand(state));
}

/** Wire the canvas and the keyboard to one game state. Returns a detach function. */
export function attachInput(canvas, state, onStateChange) {
  function onClick(event) {
    ensureAudio();
    if (state.screen === SCREEN_TITLE) {
      state.screen = SCREEN_PLAY;
      playSound('click');
      onStateChange();
      return;
    }
    if (state.screen === SCREEN_OVER) {
      // main.js restarts the shift when it sees this flag.
      state.restartRequested = true;
      onStateChange();
      return;
    }
    const { x, y } = toCanvas(canvas, event);
    clickPlay(state, x, y);
    onStateChange();
  }

  function onKey(event) {
    if (event.key === 'm' || event.key === 'M') {
      state.muted = !state.muted;
      setMuted(state.muted);
      return;
    }
    if (state.screen === SCREEN_TITLE && (event.key === 'Enter' || event.key === ' ')) {
      state.screen = SCREEN_PLAY;
      playSound('click');
      onStateChange();
      return;
    }
    if (state.screen === SCREEN_OVER && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
      state.restartRequested = true;
      onStateChange();
      return;
    }
    if (state.screen !== SCREEN_PLAY) return;
    if (event.key === 'Escape') {
      playSound(dropHand(state));
      onStateChange();
      return;
    }
    // Number keys 1-8 grab an ingredient straight from its bin.
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= INGREDIENTS.length) {
      playSound(grabIngredient(state, INGREDIENTS[digit - 1].id));
      onStateChange();
    }
  }

  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return () => {
    canvas.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
  };
}
