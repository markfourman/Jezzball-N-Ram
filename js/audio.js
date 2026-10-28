// audio.js: tiny WebAudio synth. No asset files, so the app stays small and works offline.

let ctx = null, muted = false;

export const setMuted = (m) => { muted = m; };

export function beep(freq, dur = 0.08, type = 'square') {
  if (muted) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.value = 0.05;
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch { /* audio is optional */ }
}

export const jingle = (notes, { gap = 120, dur = 0.15, type = 'square' } = {}) =>
  notes.forEach((f, i) => setTimeout(() => beep(f, dur, type), i * gap));
