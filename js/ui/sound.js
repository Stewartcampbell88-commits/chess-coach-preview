// Synthesised sounds with WebAudio (no sound files). iOS/Android need a user
// gesture before audio can start, so the context is created/resumed on first tap.
let ctx = null;
let muted = false;

export function setSoundMuted(m) { muted = Boolean(m); }
export function isSoundMuted() { return muted; }

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
  } catch { ctx = null; }
}

function tone(freq, start, dur, { type = "sine", gain = 0.18, slideTo = null } = {}) {
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function knock(start, dur, { freq = 900, gain = 0.5 } = {}) {
  const t0 = ctx.currentTime + start;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t0);
}

const SOUNDS = {
  move: () => { knock(0, 0.07, { freq: 700, gain: 0.9 }); tone(170, 0, 0.06, { gain: 0.12 }); },
  capture: () => { knock(0, 0.05, { freq: 1300, gain: 1 }); knock(0.045, 0.08, { freq: 650, gain: 0.9 }); },
  correct: () => { tone(784, 0.02, 0.14, { type: "triangle" }); tone(1175, 0.12, 0.22, { type: "triangle" }); },
  wrong: () => { tone(330, 0, 0.18, { type: "sawtooth", gain: 0.07, slideTo: 196 }); tone(165, 0.02, 0.22, { gain: 0.12 }); },
  promote: () => {
    [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.11, 0.3, { type: "triangle", gain: 0.15 }));
    [1047, 1319, 1568].forEach((f) => tone(f, 0.5, 0.7, { type: "triangle", gain: 0.11 }));
  },
  clear: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.26, { type: "triangle", gain: 0.16 })); },
  select: () => { knock(0, 0.03, { freq: 2200, gain: 0.25 }); },
};

export function playSound(name) {
  if (muted || !ctx || !SOUNDS[name]) return;
  try { SOUNDS[name](); } catch {}
}
