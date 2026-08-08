import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";

const APP_RATED_KEY = "app_rated";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.jalaltech.wordhuntiq";
const RATING_MESSAGE =
  "Enjoying Word Hunt? 🌟 Give us a 5-Star Rating on Play Store to support us!";

async function getRatedValue(): Promise<string | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.localStorage.getItem(APP_RATED_KEY);
  }
  return AsyncStorage.getItem(APP_RATED_KEY);
}

async function saveRatedValue(): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem(APP_RATED_KEY, "true");
    return;
  }
  await AsyncStorage.setItem(APP_RATED_KEY, "true");
}

export async function askForRating(): Promise<void> {
  if ((await getRatedValue()) === "true") return;

  await new Promise<void>((resolve) => {
    Alert.alert("Word Hunt", RATING_MESSAGE, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve(),
      },
      {
        text: "OK",
        onPress: async () => {
          await saveRatedValue();
          try {
            await Linking.openURL(PLAY_STORE_URL);
          } finally {
            resolve();
          }
        },
      },
    ]);
  });
}