import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider } from "../lib/store";
import { theme } from "../lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.color.surface },
            headerTintColor: theme.color.text,
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: theme.color.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Rememeber It" }} />
          <Stack.Screen name="course/[slug]" options={{ title: "Course" }} />
          <Stack.Screen name="learn/[levelId]" options={{ title: "Learn" }} />
          <Stack.Screen name="social" options={{ title: "Friends" }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
