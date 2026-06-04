/**
 * Generates WAV sound assets for the native Android/iOS build.
 * Run with: node scripts/generateSounds.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = join(__dir, '../assets/sounds');

if (!existsSync(SOUNDS_DIR)) mkdirSync(SOUNDS_DIR, { recursive: true });

const SAMPLE_RATE = 22050;

function buildWav(notes) {
  let maxEnd = 0;
  for (const n of notes) maxEnd = Math.max(maxEnd, (n.delay ?? 0) + n.duration);
  maxEnd += 0.03;

  const totalSamples = Math.ceil(SAMPLE_RATE * maxEnd);
  const mixed = new Float32Array(totalSamples);

  for (const { freq, duration, volume = 0.07, delay = 0, type = 'sine', attack = 0.008, release = 0.06 } of notes) {
    const startSample = Math.floor(delay * SAMPLE_RATE);
    const numSamples = Math.ceil(duration * SAMPLE_RATE);
    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      const env =
        t < attack       ? t / attack :
        t > duration - release ? Math.max(0, (duration - t) / release) : 1;
      let wave =
        type === 'square'   ? (Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1) :
        type === 'sawtooth' ? (2 * ((freq * t) % 1) - 1) :
                              Math.sin(2 * Math.PI * freq * t);
      const idx = startSample + i;
      if (idx < totalSamples) mixed[idx] += wave * volume * env;
    }
  }

  // Normalize
  let peak = 0;
  for (let i = 0; i < mixed.length; i++) peak = Math.max(peak, Math.abs(mixed[i]));
  if (peak > 0.88) { const s = 0.88 / peak; for (let i = 0; i < mixed.length; i++) mixed[i] *= s; }

  // WAV header
  const byteCount = 44 + totalSamples * 2;
  const buf = Buffer.alloc(byteCount);
  buf.write('RIFF', 0);   buf.writeUInt32LE(36 + totalSamples * 2, 4);
  buf.write('WAVE', 8);   buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);            // chunk size
  buf.writeUInt16LE(1, 20);             // PCM
  buf.writeUInt16LE(1, 22);             // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);             // block align
  buf.writeUInt16LE(16, 34);            // bits/sample
  buf.write('data', 36);
  buf.writeUInt32LE(totalSamples * 2, 40);
  for (let i = 0; i < totalSamples; i++) {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(mixed[i] * 32767))), 44 + i * 2);
  }
  return buf;
}

const SOUNDS = {
  select:        [{ freq: 1100, duration: 0.045, volume: 0.05,  type: 'sine',     attack: 0.004, release: 0.030 }],
  cellTick:      [{ freq: 1600, duration: 0.022, volume: 0.022, type: 'sine',     attack: 0.002, release: 0.012 }],
  timerHigh:     [{ freq: 880,  duration: 0.042, volume: 0.14,  type: 'square',   attack: 0.003, release: 0.018 }],
  timerLow:      [{ freq: 660,  duration: 0.042, volume: 0.14,  type: 'square',   attack: 0.003, release: 0.018 }],
  tap:           [{ freq: 900,  duration: 0.055, volume: 0.045, type: 'sine',     attack: 0.005, release: 0.040 }],
  correct: [
    { freq: 523, duration: 0.18, volume: 0.08, delay: 0.00 },
    { freq: 659, duration: 0.18, volume: 0.08, delay: 0.07 },
    { freq: 784, duration: 0.22, volume: 0.09, delay: 0.14 },
  ],
  combo: [
    { freq: 659,  duration: 0.12, volume: 0.07, delay: 0.00 },
    { freq: 784,  duration: 0.12, volume: 0.07, delay: 0.05 },
    { freq: 1047, duration: 0.12, volume: 0.07, delay: 0.10 },
    { freq: 1319, duration: 0.18, volume: 0.08, delay: 0.15 },
  ],
  start: [
    { freq: 440, duration: 0.08, volume: 0.06, delay: 0.00 },
    { freq: 660, duration: 0.08, volume: 0.07, delay: 0.07 },
    { freq: 880, duration: 0.12, volume: 0.08, delay: 0.14 },
  ],
  gameOver: [
    { freq: 440, duration: 0.18, volume: 0.10, delay: 0.00, type: 'sawtooth' },
    { freq: 349, duration: 0.20, volume: 0.10, delay: 0.15, type: 'sawtooth' },
    { freq: 262, duration: 0.22, volume: 0.10, delay: 0.32, type: 'sawtooth' },
    { freq: 196, duration: 0.55, volume: 0.09, delay: 0.50, type: 'sawtooth' },
  ],
  levelComplete: [
    { freq: 523,  duration: 0.28, volume: 0.08, delay: 0 * 0.085 },
    { freq: 659,  duration: 0.28, volume: 0.08, delay: 1 * 0.085 },
    { freq: 784,  duration: 0.28, volume: 0.08, delay: 2 * 0.085 },
    { freq: 1047, duration: 0.28, volume: 0.08, delay: 3 * 0.085 },
    { freq: 1319, duration: 0.28, volume: 0.08, delay: 4 * 0.085 },
    { freq: 1568, duration: 0.28, volume: 0.08, delay: 5 * 0.085 },
    { freq: 523,  duration: 0.60, volume: 0.07, delay: 6 * 0.085 },
    { freq: 784,  duration: 0.60, volume: 0.07, delay: 6 * 0.085 },
    { freq: 1047, duration: 0.60, volume: 0.07, delay: 6 * 0.085 },
  ],
};

let totalBytes = 0;
for (const [name, notes] of Object.entries(SOUNDS)) {
  const wav = buildWav(notes);
  const dest = join(SOUNDS_DIR, `${name}.wav`);
  writeFileSync(dest, wav);
  totalBytes += wav.length;
  console.log(`  ${name}.wav  (${(wav.length / 1024).toFixed(1)} KB)`);
}
console.log(`\nTotal: ${(totalBytes / 1024).toFixed(1)} KB in ${Object.keys(SOUNDS).length} files → ${SOUNDS_DIR}`);
