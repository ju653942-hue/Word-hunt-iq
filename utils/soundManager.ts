import { Platform } from "react-native";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  try {
    if (!ctx || ctx.state === "closed") {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  volume = 0.07,
  delay = 0,
  type: OscillatorType = "sine",
  attack = 0.008,
  release = 0.06
) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.setValueAtTime(volume, t + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  } catch {
    // AudioContext not available or permission denied — fail silently
  }
}

/** Short tick when finger touches the grid */
export function playSelectSound() {
  tone(1100, 0.045, 0.05, 0, "sine", 0.004, 0.03);
}

/** Ultra-soft tick for each new cell entered during a swipe */
export function playCellTickSound() {
  tone(1600, 0.018, 0.022, 0, "sine", 0.002, 0.010);
}

/** Urgent tick-tock for the last 10 seconds of the timer.
 *  Alternates high/low pitch to mimic a clock ticking. */
export function playTimerTickSound(isEven: boolean) {
  const freq = isEven ? 880 : 660;
  tone(freq, 0.042, 0.14, 0, "square", 0.003, 0.018);
}

/** Satisfying ascending 3-note chord when a word is found */
export function playCorrectSound() {
  tone(523, 0.18, 0.08, 0.00, "sine");   // C5
  tone(659, 0.18, 0.08, 0.07, "sine");   // E5
  tone(784, 0.22, 0.09, 0.14, "sine");   // G5
}

/** Fast excited flourish on combo milestone */
export function playComboSound() {
  tone(659,  0.12, 0.07, 0.00, "sine");
  tone(784,  0.12, 0.07, 0.05, "sine");
  tone(1047, 0.12, 0.07, 0.10, "sine");
  tone(1319, 0.18, 0.08, 0.15, "sine");
}

/** Soft UI tap for buttons and icons */
export function playTapSound() {
  tone(900, 0.055, 0.045, 0, "sine", 0.005, 0.04);
}

/** Punchy start sound for launching a game */
export function playStartSound() {
  tone(440, 0.08, 0.06, 0.00, "sine");
  tone(660, 0.08, 0.07, 0.07, "sine");
  tone(880, 0.12, 0.08, 0.14, "sine");
}

/** Descending downer on time-up / game over */
export function playGameOverSound() {
  tone(440, 0.18, 0.10, 0.00, "sawtooth");  // A4
  tone(349, 0.20, 0.10, 0.15, "sawtooth");  // F4
  tone(262, 0.22, 0.10, 0.32, "sawtooth");  // C4
  tone(196, 0.55, 0.09, 0.50, "sawtooth");  // G3 — long low rumble
}

/** No-op on web — sounds are pre-loaded by the native platform file */
export function preloadSounds() {}

/** Triumphant scale on level complete */
export function playLevelCompleteSound() {
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((f, i) => tone(f, 0.28, 0.08, i * 0.085, "sine"));
  // final chord
  tone(523, 0.6, 0.07, notes.length * 0.085, "sine");
  tone(784, 0.6, 0.07, notes.length * 0.085, "sine");
  tone(1047, 0.6, 0.07, notes.length * 0.085, "sine");
}
