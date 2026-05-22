// App.tsx
import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import * as Notifications from "expo-notifications";
import { Platform, Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { navigationRef } from "./src/navigation/navigationRef";
import { AuthProvider, getFavoritesSnapshot } from "./src/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerTranscriptTask, cleanupOldSessions } from './src/tasks/transcriptTask';

const STORAGE_FAV_ITEMS = "obi_fav_items";
const STORAGE_FAVS = "obi_favorites";

function normalizeId(id: string | number): string {
  const str = String(id).trim().toUpperCase();
  return str.startsWith("P") ? str.slice(1) : str;
}

async function getFavoritesReliable(): Promise<string[]> {
  const snapshot = getFavoritesSnapshot();
  if (snapshot.length > 0) return snapshot;

  try {
    const [[, itemsRaw], [, favsRaw]] = await AsyncStorage.multiGet([
      STORAGE_FAV_ITEMS,
      STORAGE_FAVS,
    ]);

    const ids: string[] = [];

    if (itemsRaw) {
      const items: any[] = JSON.parse(itemsRaw);
      for (const item of items) {
        const immoId = item.immoflux_id ?? item.id;
        if (immoId) ids.push(normalizeId(immoId));
      }
    }

    if (favsRaw && ids.length === 0) {
      const favs: number[] = JSON.parse(favsRaw);
      for (const id of favs) {
        if (id) ids.push(normalizeId(id));
      }
    }

    return [...new Set(ids.filter(Boolean))];
  } catch {
    return [];
  }
}

const SHOW: Notifications.NotificationBehavior = {
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
  shouldShowBanner: true,
  shouldShowList: true,
};
const HIDE: Notifications.NotificationBehavior = {
  shouldShowAlert: false,
  shouldPlaySound: false,
  shouldSetBadge: false,
  shouldShowBanner: false,
  shouldShowList: false,
};

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data ?? {};
    const type = data.type as string | undefined;

    if (type === "price_change") {
      const propertyId = normalizeId((data.propertyId as string | number) ?? "");
      if (!propertyId) return HIDE;

      const favorites = await getFavoritesReliable();
      const isFav = favorites.includes(propertyId);

      console.log(
        `🔍 price_change ${propertyId} | isFav=${isFav} | favs=${favorites.length}`
      );
      return isFav ? SHOW : HIDE;
    }

    return SHOW;
  },
});

function navigateToProperty(immofluxId: string) {
  console.log("🏠 Navigate to:", immofluxId);

  const interval = setInterval(() => {
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate("PropertyDetail", { propertyId: immofluxId });
      clearInterval(interval);
      console.log("✅ Navigation triggered");
    }
  }, 300);

  setTimeout(() => clearInterval(interval), 15000);
}

function handleNotificationTap(data: any) {
  if (!data) return;
  if (data.propertyId) {
    navigateToProperty(normalizeId(data.propertyId));
  } else if (data.link && typeof data.link === "string") {
    Linking.openURL(data.link);
  }
}

export default function App() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    async function setup() {
      await registerTranscriptTask();
      await cleanupOldSessions();
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("⚠️ Push permission denied");
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("obi-push", {
          name: "Notificări Obiectiv Imobiliare",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
        });
      }

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          const data = notification.request.content.data ?? {};
          console.log(`🔔 Received: type=${data.type} propertyId=${data.propertyId}`);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("👆 Notification tapped");
          handleNotificationTap(response.notification.request.content.data);
        });

      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        console.log("💀 Killed-state launch via notification");
        handleNotificationTap(lastResponse.notification.request.content.data);
      }
    }

    setup();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}