// WARUNG RASA — cook: the rules. Clicks go in, dishes come out.
// One file, one job: what happens when the player acts, and what time does.

import { INGREDIENT_BY_ID, STATION_BY_ID, SHIFT_SECONDS } from './data.js';
import { dishOnPlate, newOrder, patienceFor, pickDish, serveValue, spawnGapFor } from './state.js';

/** Advance the shift by dt seconds: timer, patience, cooking, new customers. */
export function tick(state, dt, rand) {
  if (state.screen !== 'play') return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  if (state.timeLeft <= 0) {
    state.screen = 'over';
    state.over = true;
    return;
  }
  // Orders lose patience; a customer who hits zero storms off.
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders.splice(i, 1);
      state.failed += 1;
      state.combo = 0;
      state.message = `${order.dish.name} gagal — pelanggan pergi!`;
      state.messageAt = state.elapsed;
    }
  }
  // Stations cook; food left too long after done starts to burn.
  for (const station of state.stations) {
    if (!station.item) continue;
    if (!station.done) {
      station.progress += dt / INGREDIENT_BY_ID[station.item].cook;
      if (station.progress >= 1) {
        station.progress = 1;
        station.done = true;
      }
    } else {
      station.burn += dt;
      if (station.burn > 12) {
        station.item = null;
        station.progress = 0;
        station.done = false;
        station.burn = 0;
        state.message = 'Hangus! Masakan dibuang.';
        state.messageAt = state.elapsed;
      }
    }
  }
  // New customers walk in.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < 4) {
    state.orders.push(newOrder(pickDish(state, rand), patienceFor(state.elapsed)));
    state.spawnIn = spawnGapFor(state.elapsed);
  }
  // Plate flash and shake decay.
  for (const plate of state.plates) {
    plate.flash = Math.max(0, plate.flash - dt * 2);
    plate.shake = Math.max(0, plate.shake - dt * 3);
  }
  // Floating +coin popups drift up and fade.
  for (let i = state.servedPopup.length - 1; i >= 0; i -= 1) {
    const p = state.servedPopup[i];
    p.age += dt;
    if (p.age > 1.2) state.servedPopup.splice(i, 1);
  }
}

/** Pick up an ingredient from its bin. Returns a sound key or null. */
export function grabIngredient(state, ingredientId) {
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return null;
  if (state.hand) return 'deny';
  state.hand = { kind: 'raw', id: ingredientId };
  return 'pick';
}

/** Use a station: put the carried ingredient in to cook, or take it out when done. */
export function useStation(state, stationId) {
  const station = state.stations.find((s) => s.id === stationId);
  if (!station) return null;
  const def = STATION_BY_ID[stationId];
  // Take finished food out.
  if (station.item && station.done) {
    if (state.hand) return 'deny';
    state.hand = { kind: 'cooked', id: station.item };
    station.item = null;
    station.progress = 0;
    station.done = false;
    station.burn = 0;
    return 'take';
  }
  // Put a raw ingredient in to cook.
  if (state.hand && state.hand.kind === 'raw' && def.accepts.includes(state.hand.id) && !station.item) {
    station.item = state.hand.id;
    station.progress = 0;
    station.done = false;
    station.burn = 0;
    state.hand = null;
    return 'cook';
  }
  // Raw ingredient that needs no cooking goes straight onto a plate, not a station.
  if (state.hand && state.hand.kind === 'raw' && INGREDIENT_BY_ID[state.hand.id].station === null) return 'raw';
  return 'deny';
}

/** Add what the player carries onto a plate. Returns a sound key or null. */
export function addToPlate(state, plateIndex) {
  const plate = state.plates[plateIndex];
  if (!plate || !state.hand) return null;
  const hand = state.hand;
  // A raw ingredient with no station goes on the plate as it is.
  if (hand.kind === 'raw' && INGREDIENT_BY_ID[hand.id].station === null) {
    if (plate.items.some((x) => x.id === hand.id)) return 'deny';
    plate.items.push({ id: hand.id, cooked: false });
    state.hand = null;
  } else if (hand.kind === 'cooked') {
    if (plate.items.some((x) => x.id === hand.id)) return 'deny';
    plate.items.push({ id: hand.id, cooked: true });
    state.hand = null;
  } else {
    return 'deny';
  }
  const dish = dishOnPlate(plate);
  plate.readyDish = dish;
  if (dish) {
    plate.flash = 1;
    return 'ready';
  }
  return 'place';
}

/** Serve a ready plate to the order ticket it matches. Returns a sound key or null. */
export function serveOrder(state, orderId, x, y) {
  const orderIndex = state.orders.findIndex((o) => o.id === orderId);
  if (orderIndex < 0) return null;
  const order = state.orders[orderIndex];
  const plateIndex = state.plates.findIndex((p) => p.readyDish && p.readyDish.id === order.dishId);
  if (plateIndex < 0) return 'deny';
  const plate = state.plates[plateIndex];
  const value = serveValue(order, state.combo);
  state.coins += value;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.servedPopup.push({ x, y, text: `+${value} koin`, age: 0 });
  state.orders.splice(orderIndex, 1);
  state.plates[plateIndex] = { items: [], readyDish: null, flash: 1, shake: 0 };
  state.message = `${order.dish.name} tersaji! +${value} koin`;
  state.messageAt = state.elapsed;
  return 'serve';
}

/** Drop what the player carries (clicking the hand area or pressing Esc). */
export function dropHand(state) {
  if (!state.hand) return null;
  state.hand = null;
  return 'drop';
}
