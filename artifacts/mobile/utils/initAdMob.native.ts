import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";

export async function initAdMob(): Promise<void> {
  try {
    await mobileAds().initialize();
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
  } catch (e) {
    console.warn("AdMob init failed:", e);
  }
}
