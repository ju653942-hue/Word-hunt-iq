import { useEffect, useRef, useState, useCallback } from "react";
import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";

export type InterstitialAdState = "idle" | "loading" | "ready" | "showing" | "error";

const AD_UNIT_ID = "ca-app-pub-4356067796830671/5104825895";
const AD_LOAD_TIMEOUT_MS = 8000;
const AD_RETRY_DELAY_MS = 15000;

export function useInterstitialAd() {
  const [adState, setAdState] = useState<InterstitialAdState>("loading");
  const adRef = useRef<InterstitialAd | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAd = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    setAdState("loading");
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setAdState("ready");
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setAdState("error");
      onCompleteRef.current?.();
      onCompleteRef.current = null;
      retryTimeoutRef.current = setTimeout(loadAd, AD_RETRY_DELAY_MS);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      onCompleteRef.current?.();
      onCompleteRef.current = null;
      setAdState("loading");
      loadAd();
    });

    ad.load();
    loadTimeoutRef.current = setTimeout(() => {
      setAdState("error");
      onCompleteRef.current?.();
      onCompleteRef.current = null;
      retryTimeoutRef.current = setTimeout(loadAd, AD_RETRY_DELAY_MS);
    }, AD_LOAD_TIMEOUT_MS);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      unsubLoaded();
      unsubError();
      unsubClosed();
    };
  }, []);

  useEffect(() => {
    const cleanup = loadAd();
    return () => {
      cleanup();
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [loadAd]);

  const showAd = useCallback(
    (onComplete: () => void) => {
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
    },
    [adState, loadAd]
  );

  return {
    adState,
    isAdReady: adState === "ready",
    isAdLoading: adState === "loading",
    showAd,
  };
}
