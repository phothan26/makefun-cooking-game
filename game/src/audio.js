// WARUNG RASA — audio: every sound is a tiny synthesised tone.
// One file, one job: beeps and sizzles with no audio files at all.

let ctx = null;
let muted = false;

/** Lazily open the audio context on the first user gesture. */
export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = value;
}

/** One short oscillator blip: frequency slides from `from` to `to` over `seconds`. */
function blip(from, to, seconds, type, gain) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), ac.currentTime + seconds);
  amp.gain.setValueAtTime(gain, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + seconds);
  osc.connect(amp).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + seconds + 0.02);
}

/** A burst of filtered noise, for the wok sizzle. */
function sizzle(seconds) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4200;
  const amp = ac.createGain();
  amp.gain.value = 0.12;
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start();
}

/** Play one of the game's named sounds. Unknown keys stay silent. */
export function playSound(key) {
  switch (key) {
    case 'pick': blip(520, 660, 0.07, 'triangle', 0.12); break;
    case 'place': blip(420, 520, 0.06, 'triangle', 0.10); break;
    case 'cook': sizzle(0.35); blip(180, 120, 0.15, 'sawtooth', 0.05); break;
    case 'take': blip(660, 880, 0.08, 'triangle', 0.12); break;
    case 'ready': blip(880, 880, 0.09, 'sine', 0.14); setTimeout(() => blip(1174, 1174, 0.12, 'sine', 0.14), 90); break;
    case 'serve': blip(660, 660, 0.08, 'sine', 0.14); setTimeout(() => blip(880, 880, 0.08, 'sine', 0.14), 80); setTimeout(() => blip(1320, 1320, 0.16, 'sine', 0.14), 160); break;
    case 'deny': blip(160, 110, 0.12, 'square', 0.06); break;
    case 'drop': blip(300, 200, 0.08, 'triangle', 0.08); break;
    case 'raw': blip(500, 700, 0.06, 'triangle', 0.10); break;
    case 'click': blip(700, 700, 0.04, 'sine', 0.08); break;
    default: break;
  }
}
