// WARUNG RASA — render: everything the player sees, drawn on one canvas.
// One file, one job: paint the kitchen. No images, no fonts from the network.

import { DISHES, INGREDIENTS, STATIONS, STATION_BY_ID, rankFor } from './data.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, handLabel } from './state.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

/** Every clickable rectangle, in canvas pixels. input.js hit-tests against these. */
export function layout() {
  const tickets = [];
  for (let i = 0; i < 4; i += 1) {
    tickets.push({ x: 16 + i * 308, y: 76, w: 296, h: 116 });
  }
  const stations = [];
  for (let i = 0; i < 4; i += 1) {
    stations.push({ x: 16 + i * 308, y: 208, w: 296, h: 172 });
  }
  const plates = [];
  for (let i = 0; i < 3; i += 1) {
    plates.push({ x: 16 + i * 308, y: 396, w: 296, h: 140 });
  }
  const bins = [];
  for (let i = 0; i < 8; i += 1) {
    bins.push({ x: 16 + i * 153, y: 552, w: 141, h: 148 });
  }
  return {
    tickets, stations, plates, bins,
    hand: { x: 1000, y: 396, w: 264, h: 140 },
    topbar: { x: 0, y: 0, w: VIEW_W, h: 60 },
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function patienceColor(share) {
  if (share > 0.5) return '#58c96b';
  if (share > 0.25) return '#f7c948';
  return '#e8442e';
}

function drawIngredientChip(ctx, ing, cx, cy, r, cooked) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = ing.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = cooked ? '#7a4a1e' : ing.dot;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = ing.dot;
  ctx.fill();
  text(ctx, ing.short, cx, cy + r * 0.55, Math.max(11, r * 0.62), '#2a1f16', 'center', '800');
  if (cooked) text(ctx, '✓', cx + r * 0.62, cy - r * 0.62, 15, '#2f7a3d', 'center', '800');
}

function drawOrderTicket(ctx, order, rect, index) {
  const share = Math.max(0, order.patience / order.patienceMax);
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = share < 0.25 ? '#5a2320' : '#fff8e7';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = share < 0.25 ? '#e8442e' : '#d9b36a';
  ctx.stroke();
  text(ctx, `#${index + 1}  ${order.dish.name}`, rect.x + 14, rect.y + 30, 21, share < 0.25 ? '#ffd9d0' : '#3a2a18');
  text(ctx, order.dish.icon, rect.x + rect.w - 44, rect.y + 34, 26, '#3a2a18', 'center');
  // Ingredient chips the dish needs.
  let cx = rect.x + 30;
  for (const need of order.dish.needs) {
    const ing = INGREDIENTS.find((x) => x.id === need);
    drawIngredientChip(ctx, ing, cx, rect.y + 62, 17, false);
    cx += 44;
  }
  text(ctx, `$${order.dish.base}`, rect.x + rect.w - 18, rect.y + 66, 18, share < 0.25 ? '#ffd9d0' : '#7a5a2e', 'right');
  // Patience bar.
  roundRect(ctx, rect.x + 14, rect.y + rect.h - 20, rect.w - 28, 10, 5);
  ctx.fillStyle = '#e5d9bd';
  ctx.fill();
  roundRect(ctx, rect.x + 14, rect.y + rect.h - 20, (rect.w - 28) * share, 10, 5);
  ctx.fillStyle = patienceColor(share);
  ctx.fill();
  ctx.restore();
}

function drawStation(ctx, station, rect) {
  const def = STATIONS.find((s) => s.id === station.id);
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fillStyle = def.color;
  ctx.fill();
  ctx.lineWidth = station.done ? 4 : 2;
  ctx.strokeStyle = station.done ? '#ffd76e' : '#00000055';
  ctx.stroke();
  text(ctx, def.name, rect.x + 16, rect.y + 32, 24, '#fff3d6');
  text(ctx, def.sub, rect.x + 16, rect.y + 56, 14, '#ffffff99');
  if (!station.item) {
    text(ctx, '— kosong —', rect.x + rect.w / 2, rect.y + 118, 18, '#ffffff66', 'center');
    text(ctx, `masak: ${def.accepts.join(' / ')}`, rect.x + rect.w / 2, rect.y + 148, 13, '#ffffff88', 'center');
  } else {
    const ing = INGREDIENTS.find((x) => x.id === station.item);
    drawIngredientChip(ctx, ing, rect.x + 62, rect.y + 108, 34, station.done);
    if (!station.done) {
      // Progress ring around the food.
      ctx.beginPath();
      ctx.arc(rect.x + 62, rect.y + 108, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * station.progress);
      ctx.strokeStyle = def.glow;
      ctx.lineWidth = 7;
      ctx.stroke();
      text(ctx, `${Math.ceil((1 - station.progress) * ing.cook)} dtk`, rect.x + 132, rect.y + 100, 20, '#fff3d6');
      text(ctx, 'memasak…', rect.x + 132, rect.y + 126, 14, '#ffffffaa');
    } else {
      text(ctx, 'MATANG!', rect.x + 132, rect.y + 96, 20, '#ffd76e');
      text(ctx, 'klik untuk ambil', rect.x + 132, rect.y + 122, 14, '#ffffff');
      text(ctx, station.burn > 8 ? '⚠ hampir hangus!' : 'siap disajikan', rect.x + 132, rect.y + 146, 13, station.burn > 8 ? '#ff8a7a' : '#ffffffaa');
    }
  }
  ctx.restore();
}

function drawPlate(ctx, plate, rect, index) {
  ctx.save();
  const shakeX = plate.shake > 0 ? (Math.random() - 0.5) * plate.shake * 8 : 0;
  roundRect(ctx, rect.x + shakeX, rect.y, rect.w, rect.h, 14);
  ctx.fillStyle = plate.readyDish ? '#3d5a2e' : '#4a3a28';
  ctx.fill();
  ctx.lineWidth = plate.readyDish ? 4 : 2;
  ctx.strokeStyle = plate.readyDish ? '#ffd76e' : '#00000055';
  ctx.stroke();
  text(ctx, `PIRING ${index + 1}`, rect.x + 16, rect.y + 28, 15, '#ffffff99');
  // The plate itself: a white ellipse with the food on it.
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w / 2, rect.y + 82, 108, 34, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f7f2e7';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#cbb98f';
  ctx.stroke();
  let cx = rect.x + rect.w / 2 - (plate.items.length - 1) * 26;
  for (const item of plate.items) {
    const ing = INGREDIENTS.find((x) => x.id === item.id);
    drawIngredientChip(ctx, ing, cx, rect.y + 78, 20, item.cooked);
    cx += 52;
  }
  if (plate.items.length === 0) text(ctx, 'piring kosong', rect.x + rect.w / 2, rect.y + 86, 14, '#8a7a5e', 'center');
  if (plate.readyDish) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 180);
    text(ctx, `✓ ${plate.readyDish.name.toUpperCase()} — SIAP SAJI!`, rect.x + rect.w / 2, rect.y + rect.h - 12, 17, `rgba(255, 215, 110, ${pulse})`, 'center', '800');
  } else if (plate.items.length > 0) {
    text(ctx, 'tambah bahan…', rect.x + rect.w / 2, rect.y + rect.h - 12, 14, '#ffffff88', 'center');
  }
  ctx.restore();
}

function drawBin(ctx, ing, rect, key) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = '#6b4a2a';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00000044';
  ctx.stroke();
  drawIngredientChip(ctx, ing, rect.x + rect.w / 2, rect.y + 58, 36, false);
  text(ctx, ing.name, rect.x + rect.w / 2, rect.y + 118, 16, '#fff3d6', 'center');
  text(ctx, ing.station ? `→ ${STATION_BY_ID[ing.station].name}` : '→ langsung ke piring', rect.x + rect.w / 2, rect.y + 138, 11, '#ffffff88', 'center');
  ctx.restore();
  // Keyboard hint.
  ctx.beginPath();
  ctx.arc(rect.x + 14, rect.y + 14, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#00000066';
  ctx.fill();
  text(ctx, key, rect.x + 14, rect.y + 18, 12, '#fff3d6', 'center', '800');
}

function drawTopBar(ctx, state) {
  ctx.save();
  ctx.fillStyle = '#1d2733';
  ctx.fillRect(0, 0, VIEW_W, 60);
  text(ctx, '🍜 WARUNG RASA', 16, 40, 26, '#ffd76e');
  text(ctx, 'Midnight Kitchen Rush', 308, 38, 15, '#ffffffaa');
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const low = state.timeLeft <= 30 && state.screen === SCREEN_PLAY;
  text(ctx, `⏱ ${timeText}`, 1010, 42, 30, low ? '#ff6b5e' : '#ffffff', 'right');
  text(ctx, `🪙 ${state.coins} koin`, 700, 40, 22, '#ffd76e', 'center');
  text(ctx, `combo x${state.combo}`, 830, 38, 15, '#ffffffaa', 'center');
  text(ctx, `disajikan: ${state.served}`, 560, 38, 15, '#ffffffaa', 'center');
  ctx.restore();
}

function drawHand(ctx, state, rect) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fillStyle = state.hand ? '#7a5a2e' : '#4a3a28';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00000055';
  ctx.stroke();
  text(ctx, 'TANGAN', rect.x + 16, rect.y + 28, 15, '#ffffff99');
  if (state.hand) {
    const ing = INGREDIENTS.find((x) => x.id === state.hand.id);
    drawIngredientChip(ctx, ing, rect.x + 52, rect.y + 82, 30, state.hand.kind === 'cooked');
    text(ctx, handLabel(state.hand), rect.x + 100, rect.y + 78, 18, '#fff3d6');
    text(ctx, 'klik stasiun / piring', rect.x + 100, rect.y + 104, 13, '#ffffffaa');
  } else {
    text(ctx, 'tangan kosong', rect.x + rect.w / 2, rect.y + 82, 16, '#ffffff88', 'center');
    text(ctx, 'klik bahan di bawah', rect.x + rect.w / 2, rect.y + 106, 13, '#ffffff66', 'center');
  }
  ctx.restore();
}

function drawMessage(ctx, state) {
  if (!state.message || state.elapsed - state.messageAt > 3) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, 3 - (state.elapsed - state.messageAt));
  text(ctx, state.message, VIEW_W / 2, 550, 20, '#ffd76e', 'center', '800');
  ctx.restore();
}

function drawTitle(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(12, 16, 24, 0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '🍜', VIEW_W / 2, 150, 90, '#ffd76e', 'center');
  text(ctx, 'WARUNG RASA', VIEW_W / 2, 210, 64, '#ffd76e', 'center', '800');
  text(ctx, 'Midnight Kitchen Rush — masak cepat, sajikan tepat waktu!', VIEW_W / 2, 252, 22, '#ffffffcc', 'center');
  const lines = [
    '1. Klik bahan di konter bawah, lalu klik stasiunnya untuk memasak.',
    '2. Ambil masakan yang matang, susun di piring sampai resepnya lengkap.',
    '3. Klik tiket pesanan yang cocok untuk menyajikan — cepat = tip besar!',
    'Cabai langsung ke piring. Masakan yang kelamaan di stasiun bisa hangus.',
  ];
  lines.forEach((line, i) => text(ctx, line, VIEW_W / 2, 316 + i * 32, 18, '#ffffffaa', 'center'));
  text(ctx, 'MENU', VIEW_W / 2, 470, 18, '#ffd76e', 'center', '800');
  DISHES.forEach((dish, i) => {
    const needs = dish.needs.map((id) => INGREDIENTS.find((x) => x.id === id).name).join(' + ');
    text(ctx, `${dish.icon} ${dish.name} — ${needs}  ($${dish.base})`, VIEW_W / 2, 500 + i * 28, 17, '#ffffffcc', 'center');
  });
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
  text(ctx, 'KLIK UNTUK MULAI  •  tombol 1-8 pilih bahan  •  M bisu', VIEW_W / 2, 650, 20, `rgba(255, 215, 110, ${pulse})`, 'center', '800');
  ctx.restore();
}

function drawResults(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(12, 16, 24, 0.9)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '⏰ SHIFT SELESAI!', VIEW_W / 2, 150, 52, '#ffd76e', 'center', '800');
  const rank = rankFor(state.coins);
  text(ctx, `Gelar: ${rank.title}`, VIEW_W / 2, 210, 28, '#ffffff', 'center');
  text(ctx, `🪙 ${state.coins} koin`, VIEW_W / 2, 290, 44, '#ffd76e', 'center', '800');
  text(ctx, `Hidangan tersaji: ${state.served}   •   Pesanan gagal: ${state.failed}`, VIEW_W / 2, 350, 20, '#ffffffcc', 'center');
  text(ctx, `Combo terbaik: x${state.bestCombo}`, VIEW_W / 2, 386, 20, '#ffffffcc', 'center');
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
  text(ctx, 'Tekan R atau klik untuk main lagi', VIEW_W / 2, 470, 20, `rgba(255, 215, 110, ${pulse})`, 'center', '800');
  ctx.restore();
}

/** Paint one frame of the game. */
export function draw(ctx, state) {
  // Kitchen backdrop: warm night-warung wall and tiled floor.
  const wall = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  wall.addColorStop(0, '#2e3a4a');
  wall.addColorStop(0.55, '#3a2f24');
  wall.addColorStop(1, '#241a12');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Hanging lamps.
  for (const x of [220, 640, 1060]) {
    ctx.beginPath();
    ctx.arc(x, 74, 60, 0, Math.PI * 2);
    const glow = ctx.createRadialGradient(x, 74, 4, x, 74, 60);
    glow.addColorStop(0, 'rgba(255, 215, 110, 0.20)');
    glow.addColorStop(1, 'rgba(255, 215, 110, 0)');
    ctx.fillStyle = glow;
    ctx.fill();
  }
  const L = layout();
  drawTopBar(ctx, state);
  // Section labels.
  text(ctx, '📋 PAPAN PESANAN', 16, 70, 14, '#ffffff88', 'left', '800');
  text(ctx, '🔥 STASIUN MASAK', 16, 202, 14, '#ffffff88', 'left', '800');
  text(ctx, '🍽 PIRING SAJI', 16, 390, 14, '#ffffff88', 'left', '800');
  text(ctx, '🧺 KONTER BAHAN — klik untuk ambil', 16, 546, 14, '#ffffff88', 'left', '800');
  // Order board.
  state.orders.forEach((order, i) => drawOrderTicket(ctx, order, L.tickets[i], i));
  for (let i = state.orders.length; i < 4; i += 1) {
    ctx.save();
    roundRect(ctx, L.tickets[i].x, L.tickets[i].y, L.tickets[i].w, L.tickets[i].h, 12);
    ctx.fillStyle = '#ffffff10';
    ctx.fill();
    text(ctx, 'menunggu pelanggan…', L.tickets[i].x + L.tickets[i].w / 2, L.tickets[i].y + 62, 15, '#ffffff55', 'center');
    ctx.restore();
  }
  // Stations, plates, hand, bins.
  state.stations.forEach((station, i) => drawStation(ctx, station, L.stations[i]));
  state.plates.forEach((plate, i) => drawPlate(ctx, plate, L.plates[i], i));
  drawHand(ctx, state, L.hand);
  INGREDIENTS.forEach((ing, i) => drawBin(ctx, ing, L.bins[i], String(i + 1)));
  // Floating +coin popups.
  for (const p of state.servedPopup) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p.age / 1.2);
    text(ctx, p.text, p.x, p.y - p.age * 40, 22, '#ffd76e', 'center', '800');
    ctx.restore();
  }
  drawMessage(ctx, state);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  if (state.screen === SCREEN_OVER) drawResults(ctx, state);
}
