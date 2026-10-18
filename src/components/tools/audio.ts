"use client";

let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A short beep, e.g. when a timer finishes. */
export function beep(ms = 400, freq = 880) {
  const a = audio();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, a.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, a.currentTime + 0.01);
  gain.gain.setValueAtTime(0.25, a.currentTime + ms / 1000 - 0.02);
  gain.gain.linearRampToValueAtTime(0, a.currentTime + ms / 1000);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + ms / 1000 + 0.05);
}

export type MorseEvent = { on: boolean; index: number };

/**
 * Plays a Morse string (". - / ") as tones and calls onChange as each
 * symbol turns on/off, so a lamp can flash in time. Returns a stop function.
 */
export function playMorse(morse: string, onChange: (e: MorseEvent | null) => void, unitMs = 90): () => void {
  const a = audio();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.frequency.value = 650;
  gain.gain.value = 0;
  osc.connect(gain).connect(a.destination);
  const start = a.currentTime + 0.05;
  let t = 0;
  const timers: number[] = [];
  const unit = unitMs / 1000;

  [...morse].forEach((ch, index) => {
    if (ch === "." || ch === "-") {
      const len = ch === "." ? unit : unit * 3;
      gain.gain.setValueAtTime(0, start + t);
      gain.gain.linearRampToValueAtTime(0.25, start + t + 0.005);
      gain.gain.setValueAtTime(0.25, start + t + len - 0.005);
      gain.gain.linearRampToValueAtTime(0, start + t + len);
      timers.push(window.setTimeout(() => onChange({ on: true, index }), (t + 0.05) * 1000));
      timers.push(window.setTimeout(() => onChange({ on: false, index }), (t + 0.05 + len) * 1000));
      t += len + unit;
    } else if (ch === " ") {
      t += unit * 2; // letter gap = 3 units (1 already added)
    } else if (ch === "/") {
      t += unit * 2; // word gap = 7 units with the spaces either side
    }
  });
  osc.start(start);
  osc.stop(start + t + 0.1);
  timers.push(window.setTimeout(() => onChange(null), (t + 0.15) * 1000));

  return () => {
    timers.forEach(clearTimeout);
    try {
      gain.gain.cancelScheduledValues(a.currentTime);
      gain.gain.value = 0;
      osc.stop();
    } catch {}
    onChange(null);
  };
}

/** A tone that sounds for as long as a Morse key is held down. */
export function keyTone(freq = 650) {
  const a = audio();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.frequency.value = freq;
  gain.gain.value = 0;
  osc.connect(gain).connect(a.destination);
  osc.start();
  const ramp = (to: number) => {
    if (a.state === "suspended") void a.resume();
    const t = a.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(to, t + 0.006);
  };
  return {
    down: () => ramp(0.25),
    up: () => ramp(0),
    close: () => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    },
  };
}
