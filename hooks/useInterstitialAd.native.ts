import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";
import { useCallback, useEffect, useRef, useState } from "react";

export type InterstitialAdState = "idle" | "loading" | "ready" | "showing" | "error";

const PROD_AD_UNIT_ID = "ca-app-pub-4356067796830671/5104825895";
const AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : PROD_AD_UNIT_ID;

export function useInterstitialAd() {
  const [adState, setAdState] = useState<InterstitialAdState>("idle");
  const adRef = useRef<InterstitialAd | null>(null);
  const unsubsRef = useRef<(() => void)[]>([]);
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  const cleanupAd = useCallback(() => {
    unsubsRef.current.forEach((fn) => fn?.());
    unsubsRef.current = [];
    adRef.current = null;
  }, []);

  const loadAd = useCallback(() => {
    cleanupAd();
    setAdState("loading");

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    unsubsRef.current = [
      ad.addAdEventListener(AdEventType.LOADED, () => {
        setAdState("ready");
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        const cb = pendingCallbackRef.current;
        pendingCallbackRef.current = null;
        cleanupAd();
        setAdState("idle");
        cb?.();
        loadAd();
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        const cb = pendingCallbackRef.current;
        pendingCallbackRef.current = null;
        setAdState("error");
        cleanupAd();
        cb?.();
      }),
    ];

    adRef.current = ad;
    ad.load();
  }, [cleanupAd]);

  useEffect(() => {
    loadAd();
    return cleanupAd;
  }, []);

  const showAd = useCallback(
    (onComplete: () => void) => {
      if (adState !== "ready" || !adRef.current) {
        onComplete();
        return;
      }
      pendingCallbackRef.current = onComplete;
      try {
        setAdState("showing");
        adRef.current.show();
      } catch {
        pendingCallbackRef.current = null;
        setAdState("error");
        cleanupAd();
        onComplete();
      }
    },
    [adState, cleanupAd]
  );

  return {
    adState,
    isAdReady: adState === "ready",
    isAdLoading: adState === "loading",
    showAd,
  };
}
