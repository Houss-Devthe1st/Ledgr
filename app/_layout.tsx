import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { initDb } from "@/lib/db/client";
import { SubscriptionsProvider } from "@/lib/subscriptions";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-regular":   require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold":      require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium":    require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold":  require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light":     require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    initDb()
      .then(() => setDbReady(true))
      .catch((e) => {
        console.error("DB init failed:", e);
        setDbError(true);
      });
  }, []);

  const isReady = fontsLoaded && dbReady;

  useEffect(() => {
    // Hide splash once ready, or on DB error so the user isn't left on a
    // blank screen — the error UI below will render instead.
    if (isReady || dbError) SplashScreen.hideAsync();
  }, [isReady, dbError]);

  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Text style={{ fontSize: 16, textAlign: "center", color: "#333" }}>
          Failed to open the database.{"\n"}Please restart the app.
        </Text>
      </View>
    );
  }

  // ClerkProvider always renders so session hydration runs in parallel with
  // font + DB initialisation rather than sequentially after them.
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {isReady ? (
        <SubscriptionsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SubscriptionsProvider>
      ) : null}
    </ClerkProvider>
  );
}
