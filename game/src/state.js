// WARUNG RASA — state: one fresh kitchen, its orders, plates and score.
// One file, one job: what the game remembers. cook.js changes it; render.js reads it.

import { DISH_BY_ID, INGREDIENT_BY_ID, MENU_ORDER, PLATE_COUNT, SHIFT_SECONDS, STATIONS } from './data.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

let uidCounter = 1;

/** A blank plate waiting for food. */
export function newPlate() {
  return { items: [], readyDish: null, flash: 0, shake: 0 };
}

/** A blank station: nothing cooking, nothing waiting to be picked up. */
export function newStation(station) {
  return { id: station.id, item: null, progress: 0, done: false, burn: 0 };
}

/** A fresh order ticket on the board. */
export function newOrder(dishId, patience) {
  return {
    id: uidCounter += 1,
    dishId,
    dish: DISH_BY_ID[dishId],
    patience,
    patienceMax: patience,
    born: 0,
  };
}

/** A brand-new shift: empty counters, empty plates, one order already waiting. */
export function newGame() {
  const state = {
    screen: SCREEN_TITLE,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    hand: null, // { kind: 'raw'|'cooked', id } or null
    orders: [],
    plates: Array.from({ length: PLATE_COUNT }, () => newPlate()),
    stations: STATIONS.map((s) => newStation(s)),
    spawnIn: 1.5,
    servedPopup: [],
    message: '',
    messageAt: 0,
    muted: false,
    over: false,
  };
  state.orders.push(newOrder('nasgor', 48));
  return state;
}

/** How long a new order waits before the customer storms off. */
export function patienceFor(elapsed) {
  if (elapsed < 60) return 48;
  if (elapsed < 120) return 38;
  return 30;
}

/** How fast new customers walk in, in seconds between spawns. */
export function spawnGapFor(elapsed) {
  if (elapsed < 45) return 14;
  if (elapsed < 90) return 11;
  if (elapsed < 135) return 8.5;
  return 6.5;
}

/** Which dishes the board may ask for at this point in the shift. */
export function menuFor(elapsed) {
  if (elapsed < 30) return MENU_ORDER.slice(0, 2);
  if (elapsed < 75) return MENU_ORDER.slice(0, 3);
  return MENU_ORDER;
}

/** Pick the next dish, avoiding three of the same in a row on the board. */
export function pickDish(state, rand) {
  const menu = menuFor(state.elapsed);
  const counts = {};
  for (const order of state.orders) counts[order.dishId] = (counts[order.dishId] || 0) + 1;
  const pool = menu.filter((id) => (counts[id] || 0) < 2);
  const list = pool.length > 0 ? pool : menu;
  return list[Math.floor(rand() * list.length)];
}

/** Coins for serving a dish: base price plus a tip for a patient customer. */
export function serveValue(order, combo) {
  const patienceShare = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(patienceShare * 8);
  const comboBonus = Math.min(combo, 5);
  return order.dish.base + tip + comboBonus;
}

/** The plate's dish once its items match a recipe exactly, else null. */
export function dishOnPlate(plate) {
  const ids = plate.items.map((x) => x.id).sort().join('+');
  for (const dish of Object.values(DISH_BY_ID)) {
    if (dish.needs.slice().sort().join('+') === ids) return dish;
  }
  return null;
}

/** Human names for what the player is carrying, for the hand label. */
export function handLabel(hand) {
  if (!hand) return '';
  const ing = INGREDIENT_BY_ID[hand.id];
  return hand.kind === 'cooked' ? `${ing.name} matang` : ing.name;
}
