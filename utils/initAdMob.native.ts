import mobileAds from "react-native-google-mobile-ads";

export async function initAdMob(): Promise<void> {
  try {
    await mobileAds().initialize();
  } catch {
  }
}
