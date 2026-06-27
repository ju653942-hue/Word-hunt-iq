import { useEffect, useRef, useState, useCallback } from "react";
import {
  InterstitialAd,
  AdEventType,
} from "react-native-google-mobile-ads";

export type InterstitialAdState = "idle" | "loading" | "ready" | "showing" | "error";

const AD_UNIT_ID = "ca-app-pub-4356067796830671/5104825895";

export function useInterstitialAd() {
  const [adState, setAdState] = useState<InterstitialAdState>("loading");
  const adRef = useRef<InterstitialAd | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const loadAd = useCallback(() => {
    setAdState("loading");
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setAdState("ready");
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setAdState("error");
      onCompleteRef.current?.();
      onCompleteRef.current = null;
      setTimeout(loadAd, 10000);
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      onCompleteRef.current?.();
      onCompleteRef.current = null;
      setAdState("loading");
      loadAd();
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubError();
      unsubClosed();
    };
  }, []);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
  }, [loadAd]);

  const showAd = useCallback((onComplete: () => void) => {
    if (adRef.current && adState === "ready") {
      onCompleteRef.current = onComplete;
      setAdState("showing");
      adRef.current.show().catch(() => {
        onCompleteRef.current?.();
        onCompleteRef.current = null;
        setAdState("error");
        loadAd();
      });
    } else {
      onComplete();
    }
  }, [adState, loadAd]);

  return {
    adState,
    isAdReady: adState === "ready",
    isAdLoading: adState === "loading",
    showAd,
  };
}
