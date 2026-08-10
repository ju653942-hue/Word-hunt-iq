import { useEffect, useRef, useState, useCallback } from "react";
import {
  RewardedInterstitialAd,
  RewardedAdEventType,
  AdEventType,
} from "react-native-google-mobile-ads";

export type AdState = "idle" | "loading" | "ready" | "showing" | "error" | "unsupported";

const AD_UNIT_ID = "ca-app-pub-4356067796830671/2875593275";
const AD_LOAD_TIMEOUT_MS = 8000;
const AD_RETRY_DELAY_MS = 15000;

export function useWatchAd(onRewarded: () => void) {
  const [adState, setAdState] = useState<AdState>("loading");
  const adRef = useRef<RewardedInterstitialAd | null>(null);
  const onRewardedRef = useRef(onRewarded);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  onRewardedRef.current = onRewarded;

  const loadAd = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    setAdState("loading");
    const ad = RewardedInterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;

    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onRewardedRef.current();
    });
    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setAdState("ready");
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setAdState("error");
      retryTimeoutRef.current = setTimeout(loadAd, AD_RETRY_DELAY_MS);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setAdState("loading");
      loadAd();
    });

    ad.load();
    loadTimeoutRef.current = setTimeout(() => {
      setAdState("error");
      retryTimeoutRef.current = setTimeout(loadAd, AD_RETRY_DELAY_MS);
    }, AD_LOAD_TIMEOUT_MS);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      unsubEarned();
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

  const showAd = useCallback(async (): Promise<boolean> => {
    if (adRef.current && adState === "ready") {
      try {
        setAdState("showing");
        await adRef.current.show();
        return true;
      } catch {
        setAdState("error");
        loadAd();
        return false;
      }
    }
    return false;
  }, [adState, loadAd]);

  return {
    adState,
    isAdReady: adState === "ready",
    isAdLoading: adState === "loading",
    isSupported: true,
    showAd,
  };
}
