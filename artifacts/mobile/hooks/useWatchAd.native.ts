import { useEffect, useRef, useState, useCallback } from "react";
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

export type AdState = "idle" | "loading" | "ready" | "showing" | "error" | "unsupported";

const AD_UNIT_ID = "ca-app-pub-4356067796830671/2875593275";

export function useWatchAd(onRewarded: () => void) {
  const [adState, setAdState] = useState<AdState>("loading");
  const adRef = useRef<RewardedAd | null>(null);
  const onRewardedRef = useRef(onRewarded);
  onRewardedRef.current = onRewarded;

  const loadAd = useCallback(() => {
    setAdState("loading");
    const ad = RewardedAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;

    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onRewardedRef.current();
    });

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdState("ready");
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setAdState("error");
      setTimeout(loadAd, 10000);
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setAdState("loading");
      loadAd();
    });

    ad.load();

    return () => {
      unsubEarned();
      unsubLoaded();
      unsubError();
      unsubClosed();
    };
  }, []);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
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
