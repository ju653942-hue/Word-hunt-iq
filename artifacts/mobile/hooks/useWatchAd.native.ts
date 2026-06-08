export type AdState =
  | "idle"
  | "loading"
  | "ready"
  | "showing"
  | "error"
  | "unsupported";

export function useWatchAd(_onRewarded: () => void) {
  return {
    adState: "unsupported" as AdState,
    isAdReady: false,
    isAdLoading: false,
    isSupported: false,
    showAd: async () => false,
  };
}
