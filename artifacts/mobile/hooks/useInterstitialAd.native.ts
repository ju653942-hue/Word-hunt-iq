export type InterstitialAdState = "idle" | "loading" | "ready" | "showing" | "error";

export function useInterstitialAd() {
  return {
    adState: "idle" as InterstitialAdState,
    isAdReady: false,
    isAdLoading: false,
    showAd: (onComplete: () => void) => {
      onComplete();
    },
  };
}
