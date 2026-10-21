import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/constants/theme";

// The root layout wraps EVERY screen in the app.
// A <Stack> means screens slide on top of each other, and the back button
// takes you to the previous one.
//
// Files in src/app become screens automatically:
//   src/app/index.tsx          -> "/"              (welcome)
//   src/app/how-it-works.tsx   -> "/how-it-works"
//   src/app/sign-up.tsx        -> "/sign-up"
//   src/app/login.tsx          -> "/login"
//   src/app/(tabs)/...         -> the main app with a bottom tab bar
//                                  (the "(tabs)" folder name doesn't appear in the URL)

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false, // our screens draw their own titles
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Once you're in the main app, swiping back shouldn't return to sign-up. */}
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
