import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors, fontSize, radius, spacing } from "@/constants/theme";

// WELCOME SCREEN — the first thing a new user sees.
// Its only job: say what the app is in one sentence and get them to sign up.

export default function Welcome() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top: brand */}
        <Text style={styles.brand}>GRIFTHUB</Text>

        {/* Middle: the pitch */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW WEEK STARTS MONDAY</Text>
          </View>
          <Text style={styles.headline}>
            Every workout{"\n"}is a <Text style={styles.highlight}>point</Text>.
          </Text>
          <Text style={styles.subhead}>
            Log your workouts, earn points, and climb your campus leaderboard. Scores reset every
            week, so anyone can win.
          </Text>
        </View>

        {/* Bottom: actions */}
        <View style={styles.actions}>
          {/* router.push() goes to a new screen; the user can press back. */}
          <Button title="Get started" onPress={() => router.push("/how-it-works")} />
          <Button
            title="I already have an account"
            variant="ghost"
            onPress={() => router.push("/login")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "space-between", // brand at top, buttons at bottom
  },
  brand: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "900",
    letterSpacing: 4,
  },
  hero: { gap: spacing.md },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  headline: {
    color: colors.text,
    fontSize: fontSize.hero + 4,
    lineHeight: fontSize.hero + 10,
    fontWeight: "900",
  },
  highlight: { color: colors.accent },
  subhead: { color: colors.textMuted, fontSize: fontSize.body, lineHeight: 24 },
  actions: { gap: spacing.sm + 4 },
});
