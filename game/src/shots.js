// WARUNG RASA — shots: the four screenshot scenes.
// One file, one job: put the real game into a real state worth photographing.
// Each scene sets the live state directly (orders, stations, plates, timer), so the
// frame is what the game itself looks like mid-shift — nothing is drawn for the shot.

import { SCREEN_OVER, SCREEN_PLAY, dishOnPlate, newGame, newOrder } from './state.js';

/** A tiny deterministic RNG so every scene stages the same way each run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function putOnPlate(state, plateIndex, items) {
  const plate = state.plates[plateIndex];
  plate.items = items.map((id) => ({ id, cooked: id !== 'cabai' }));
  plate.readyDish = dishOnPlate(plate);
  plate.flash = plate.readyDish ? 1 : 0;
}

function cookAt(state, stationId, itemId, progress, done) {
  const station = state.stations.find((s) => s.id === stationId);
  station.item = itemId;
  station.progress = progress;
  station.done = done;
  station.burn = 0;
}

/**
 * Set `state` to the named scene and return the screen to draw.
 * cover: a full kitchen — 3 orders, food cooking, one dish mid-assembly, one ready.
 * rush: the dinner rush — 4 orders, patience nearly gone, timer nearly out.
 * serve: the moment a plate is served — matching ticket, coin popup in the air.
 * results: the shift-over screen with a night's takings.
 */
export function stageShot(name, state) {
  state.screen = SCREEN_PLAY;
  state.orders = [];
  state.plates.forEach((p) => {
    p.items = [];
    p.readyDish = null;
    p.flash = 0;
    p.shake = 0;
  });
  state.stations.forEach((s) => {
    s.item = null;
    s.progress = 0;
    s.done = false;
    s.burn = 0;
  });
  state.hand = null;
  state.servedPopup = [];
  state.message = '';
  state.combo = 0;

  if (name === 'rush') {
    state.elapsed = 135;
    state.timeLeft = 45;
    state.coins = 148;
    state.served = 9;
    state.combo = 4;
    state.orders = [
      newOrder('nasgor', 9),
      newOrder('sate', 6),
      newOrder('mieayam', 14),
      newOrder('esteh', 4),
    ];
    state.orders.forEach((o) => { o.patienceMax = 30; });
    cookAt(state, 'wok', 'nasi', 0.55, false);
    cookAt(state, 'grill', 'ayam', 1, true);
    putOnPlate(state, 0, ['mie']);
    state.hand = { kind: 'cooked', id: 'telur' };
    state.message = 'Rush! Pelanggan mulai tidak sabar…';
    state.messageAt = state.elapsed;
    return { screen: SCREEN_PLAY };
  }

  if (name === 'serve') {
    state.elapsed = 62;
    state.timeLeft = 118;
    state.coins = 96;
    state.served = 6;
    state.combo = 3;
    state.orders = [newOrder('nasgor', 34), newOrder('esteh', 22)];
    state.orders.forEach((o) => { o.patienceMax = 48; });
    putOnPlate(state, 1, ['nasi', 'telur', 'cabai']);
    cookAt(state, 'pot', 'mie', 0.7, false);
    state.servedPopup.push({ x: 640, y: 300, text: '+24 koin', age: 0.2 });
    state.message = 'Nasi Goreng tersaji! +24 koin';
    state.messageAt = state.elapsed;
    return { screen: SCREEN_PLAY };
  }

  if (name === 'results') {
    state.elapsed = 180;
    state.timeLeft = 0;
    state.coins = 214;
    state.served = 14;
    state.failed = 2;
    state.bestCombo = 6;
    state.screen = SCREEN_OVER;
    state.over = true;
    return { screen: SCREEN_OVER };
  }

  // cover (default): the kitchen at its best.
  state.elapsed = 52;
  state.timeLeft = 128;
  state.coins = 74;
  state.served = 5;
  state.combo = 2;
  state.orders = [newOrder('nasgor', 30), newOrder('mieayam', 24), newOrder('esteh', 40)];
  state.orders.forEach((o) => { o.patienceMax = 48; });
  cookAt(state, 'wok', 'telur', 0.45, false);
  cookAt(state, 'grill', 'sate', 1, true);
  putOnPlate(state, 0, ['nasi', 'telur']);
  putOnPlate(state, 1, ['teh', 'es']);
  state.hand = { kind: 'raw', id: 'cabai' };
  return { screen: SCREEN_PLAY };
}

/** A fresh game already staged for the named shot, for the boot code. */
export function stagedGame(name) {
  const state = newGame();
  stageShot(name, state);
  return state;
}
