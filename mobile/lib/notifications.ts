import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { Audio } from "expo-av";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Resolves to an Expo push token, or `null` when push is unavailable.
 *
 * Never rejects: registration depends on OS permissions, device entitlements
 * and a network round-trip, any of which can fail on a perfectly healthy
 * install. Callers treat a missing token as "no push for this session" rather
 * than an error, so failures are logged and swallowed here.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Web push needs `notification.vapidPublicKey` in app.json, which this app
  // does not configure — it ships to iOS and Android only.
  if (Platform.OS === "web") {
    console.log("Push notifications are not configured for web");
    return null;
  }

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permission for push notifications not granted");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "New Orders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "ringtone.mp3",
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.warn("Failed to obtain an Expo push token:", error);
    return null;
  }
}

let sound: Audio.Sound | null = null;

export async function playNewOrderSound(): Promise<void> {
  try {
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      require("../assets/sounds/ringtone.mp3")
    );
    sound = newSound;
    await sound.playAsync();
  } catch (error) {
    console.warn("Failed to play notification sound:", error);
  }
}

export function addNotificationResponseListener(
  onTap: (orderId: string) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.orderId) {
      onTap(data.orderId as string);
    }
  });
}
