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

const cache = new Map<SoundKey, Audio.Sound>();
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

async function getSound(key: SoundKey): Promise<Audio.Sound | null> {
  if (cache.has(key)) return cache.get(key)!;
  try {
    await ensureAudio();
    const { sound } = await Audio.Sound.createAsync(ASSETS[key], { shouldPlay: false, volume: 1.0 });
    cache.set(key, sound);
    return sound;
  } catch {
    return null;
  }
}

function play(key: SoundKey) {
  getSound(key).then((s) => s?.replayAsync()).catch(() => {});
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
    getSound(key).catch(() => {});
  }
}
