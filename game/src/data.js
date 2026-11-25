// WARUNG RASA — data: every dish, ingredient and station in the kitchen.
// One file, one job: the menu. The rules in cook.js read it; render.js draws it.

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 4;
export const PLATE_COUNT = 3;

// An ingredient lives in a bin on the counter. `station` is where it cooks;
// null means it goes on the plate raw.
export const INGREDIENTS = [
  { id: 'nasi',   name: 'Nasi',    short: 'NS', station: 'wok',   cook: 3.0, color: '#f5eeda', dot: '#e8d9a0', price: 4 },
  { id: 'telur',  name: 'Telur',   short: 'TL', station: 'wok',   cook: 2.5, color: '#ffd76e', dot: '#f2a93b', price: 3 },
  { id: 'ayam',   name: 'Ayam',    short: 'AY', station: 'grill', cook: 4.0, color: '#e8a06a', dot: '#b85c2e', price: 5 },
  { id: 'sate',   name: 'Sate',    short: 'ST', station: 'grill', cook: 3.5, color: '#c98a4b', dot: '#7a4a1e', price: 5 },
  { id: 'mie',    name: 'Mie',     short: 'MI', station: 'pot',   cook: 3.0, color: '#f7c948', dot: '#d99a1f', price: 4 },
  { id: 'teh',    name: 'Teh',     short: 'TH', station: 'glass', cook: 2.0, color: '#a0662c', dot: '#5e3a15', price: 3 },
  { id: 'es',     name: 'Es Batu', short: 'ES', station: 'glass', cook: 1.5, color: '#bfe8ff', dot: '#5fb7e8', price: 2 },
  { id: 'cabai',  name: 'Cabai',   short: 'CB', station: null,    cook: 0,   color: '#e8442e', dot: '#8f1d10', price: 2 },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((x) => [x.id, x]));

// A station cooks one ingredient at a time. `accepts` lists the bins it takes.
export const STATIONS = [
  { id: 'wok',   name: 'WOK',    sub: 'penggorengan', accepts: ['nasi', 'telur'], color: '#3a3f4a', glow: '#ff9d3c' },
  { id: 'grill', name: 'GRILL',  sub: 'pemanggang',   accepts: ['ayam', 'sate'],  color: '#4a3436', glow: '#ff5d3c' },
  { id: 'pot',   name: 'PANCI',  sub: 'rebus mie',    accepts: ['mie'],           color: '#37455a', glow: '#5fb7e8' },
  { id: 'glass', name: 'GELAS',  sub: 'es teh',       accepts: ['teh', 'es'],     color: '#2e4a44', glow: '#7fe0c3' },
];

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((x) => [x.id, x]));

// A dish is a set of cooked (or raw) ingredients on one plate.
export const DISHES = [
  { id: 'nasgor', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'cabai'], base: 18, icon: '🍳' },
  { id: 'sate',   name: 'Sate Ayam',   needs: ['ayam', 'sate'],           base: 16, icon: '🍢' },
  { id: 'mieayam', name: 'Mie Ayam',   needs: ['mie', 'ayam'],            base: 15, icon: '🍜' },
  { id: 'esteh',  name: 'Es Teh',      needs: ['teh', 'es'],             base: 10, icon: '🧋' },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((x) => [x.id, x]));

// The order board cycles these dishes; later ones only appear as the rush builds.
export const MENU_ORDER = ['nasgor', 'mieayam', 'esteh', 'sate'];

export const RANKS = [
  { min: 0,   title: 'Koki Magang' },
  { min: 60,  title: 'Juru Masak' },
  { min: 120, title: 'Koki Warung' },
  { min: 180, title: 'Master Rasa' },
  { min: 260, title: 'Legenda Dapur' },
];

export function rankFor(coins) {
  let rank = RANKS[0];
  for (const r of RANKS) if (coins >= r.min) rank = r;
  return rank;
}
