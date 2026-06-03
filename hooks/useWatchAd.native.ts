import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { useCallback, useEffect, useRef, useState } from "react";

export type AdState = "idle" | "loading" | "ready" | "showing" | "error" | "unsupported";

const PROD_AD_UNIT_ID = "ca-app-pub-4356067796830671/2875593275";
const AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : PROD_AD_UNIT_ID;

export function useWatchAd(onRewarded: () => void) {
  const [adState, setAdState] = useState<AdState>("idle");
  const adRef = useRef<RewardedAd | null>(null);
  const unsubsRef = useRef<(() => void)[]>([]);
  const onRewardedRef = useRef(onRewarded);

  useEffect(() => {
    onRewardedRef.current = onRewarded;
  }, [onRewarded]);

  const cleanupAd = useCallback(() => {
    unsubsRef.current.forEach((fn) => fn?.());
    unsubsRef.current = [];
    adRef.current = null;
  }, []);

  const loadAd = useCallback(() => {
    cleanupAd();
    setAdState("loading");

    const ad = RewardedAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    unsubsRef.current = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdState("ready");
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        onRewardedRef.current();
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        cleanupAd();
        loadAd();
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        setAdState("error");
        cleanupAd();
        setTimeout(() => loadAd(), 30000);
      }),
    ];

    adRef.current = ad;
    ad.load();
  }, [cleanupAd]);

  useEffect(() => {
    loadAd();
    return cleanupAd;
  }, []);

  const showAd = useCallback(async () => {
    if (adState !== "ready" || !adRef.current) return false;
    try {
      setAdState("showing");
      await adRef.current.show();
      return true;
    } catch {
      setAdState("error");
      cleanupAd();
      setTimeout(() => loadAd(), 30000);
      return false;
    }
  }, [adState, cleanupAd, loadAd]);

  return {
    adState,
    isAdReady: adState === "ready",
    isAdLoading: adState === "loading",
    isSupported: true,
    showAd,
  };
}
