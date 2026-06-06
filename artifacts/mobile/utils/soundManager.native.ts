import { Audio } from "expo-av";

type SoundKey =
  | "select" | "cellTick" | "timerHigh" | "timerLow"
  | "tap" | "correct" | "combo" | "start" | "gameOver" | "levelComplete";

const ASSETS: Record<SoundKey, number> = {
  select:        require("../assets/sounds/select.wav"),
  cellTick:      require("../assets/sounds/cellTick.wav"),
  timerHigh:     require("../assets/sounds/timerHigh.wav"),
  timerLow:      require("../assets/sounds/timerLow.wav"),
  tap:           require("../assets/sounds/tap.wav"),
  correct:       require("../assets/sounds/correct.wav"),
  combo:         require("../assets/sounds/combo.wav"),
  start:         require("../assets/sounds/start.wav"),
  gameOver:      require("../assets/sounds/gameOver.wav"),
  levelComplete: require("../assets/sounds/levelComplete.wav"),
};

const cache   = new Map<SoundKey, Audio.Sound>();
// In-flight load promises — prevents two concurrent createAsync calls for the same key
const loading = new Map<SoundKey, Promise<Audio.Sound | null>>();
let audioReady = false;

async function ensureAudio() {
  if (audioReady) return;
  audioReady = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch {}
}

async function loadSound(key: SoundKey): Promise<Audio.Sound | null> {
  if (cache.has(key)) return cache.get(key)!;
  if (loading.has(key)) return loading.get(key)!;

  const promise = (async (): Promise<Audio.Sound | null> => {
    try {
      await ensureAudio();
      const { sound } = await Audio.Sound.createAsync(
        ASSETS[key],
        { shouldPlay: false, volume: 1.0 }
      );
      cache.set(key, sound);
      return sound;
    } catch {
      return null;
    } finally {
      loading.delete(key);
    }
  })();

  loading.set(key, promise);
  return promise;
}

async function playKey(key: SoundKey): Promise<void> {
  try {
    const sound = await loadSound(key);
    if (!sound) return;

    try {
      await sound.replayAsync();
    } catch {
      // Android MediaPlayer entered a bad state (e.g. audio focus lost, PlaybackCompleted).
      // Unload and recreate so the next play attempt starts fresh.
      try { await sound.unloadAsync(); } catch {}
      cache.delete(key);

      // Play immediately with a brand-new instance
      await ensureAudio();
      const { sound: fresh } = await Audio.Sound.createAsync(
        ASSETS[key],
        { shouldPlay: true, volume: 1.0 }
      );
      cache.set(key, fresh);
    }
  } catch {}
}

function play(key: SoundKey) {
  playKey(key).catch(() => {});
}

export function playSelectSound()                      { play("select"); }
export function playCellTickSound()                    { play("cellTick"); }
export function playTimerTickSound(isEven: boolean)    { play(isEven ? "timerHigh" : "timerLow"); }
export function playTapSound()                         { play("tap"); }
export function playCorrectSound()                     { play("correct"); }
export function playComboSound()                       { play("combo"); }
export function playStartSound()                       { play("start"); }
export function playGameOverSound()                    { play("gameOver"); }
export function playLevelCompleteSound()               { play("levelComplete"); }

export function preloadSounds() {
  for (const key of Object.keys(ASSETS) as SoundKey[]) {
    loadSound(key).catch(() => {});
  }
}
