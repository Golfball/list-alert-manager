import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FlashOverlay } from "@/components/FlashOverlay";
import { ListsProvider } from "@/context/ListsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Colors from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="address/[listId]/[addressId]" options={{ headerShown: false }} />
      <Stack.Screen name="item/[listId]/[itemId]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [splashDone, setSplashDone] = useState(Platform.OS === "web");
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
          <ListsProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <AppContent />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </ListsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
      {!splashDone && (
        <AnimatedSplash onFinish={() => setSplashDone(true)} />
      )}
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ flex: 1, backgroundColor: colors.header }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootLayoutNav />
      <FlashOverlay />
    </View>
  );
}
