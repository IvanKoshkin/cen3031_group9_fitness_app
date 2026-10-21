import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors, fontSize, radius, spacing } from "@/constants/theme";

// HOW IT WORKS — a short intro explaining the scoring rules before sign-up.
// These numbers come straight from backend/djangoserver/leaderboard/points.py.
// If the backend changes the rules, update this list too.

const STEPS = [
  {
    number: "1",
    title: "Log a workout",
    body: "Pick an exercise, how many minutes you did (5 to 180), and how hard it felt.",
  },
  {
    number: "2",
    title: "Earn points",
    body: "Points depend on the type of exercise, the time, and the intensity. Up to 300 points per day.",
  },
  {
    number: "3",
    title: "Climb the board",
    body: "The leaderboard resets every Monday. You can only log workouts from the current week.",
  },
];

export default function HowItWorks() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.back} onPress={() => router.back()}>
          ‹ Back
        </Text>

        <Text style={styles.title}>How it works</Text>
        <Text style={styles.subtitle}>Three things to know before you start.</Text>

        <View style={styles.steps}>
          {/* .map() turns each item in STEPS into a card. `key` helps React track them. */}
          {STEPS.map((step) => (
            <View key={step.number} style={styles.card}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{step.number}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{step.title}</Text>
                <Text style={styles.cardBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.fairPlay}>
          Unusually long sessions get a quick review by a moderator to keep things fair.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Create my account" onPress={() => router.push("/sign-up")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.sm },
  back: { color: colors.textMuted, fontSize: fontSize.body, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900" },
  subtitle: { color: colors.textMuted, fontSize: fontSize.body, marginBottom: spacing.md },
  steps: { gap: spacing.md },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md + 4,
  },
  number: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { color: colors.accentText, fontWeight: "900", fontSize: fontSize.large },
  cardText: { flex: 1, gap: spacing.xs },
  cardTitle: { color: colors.text, fontSize: fontSize.large - 2, fontWeight: "800" },
  cardBody: { color: colors.textMuted, fontSize: fontSize.body - 1, lineHeight: 22 },
  fairPlay: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
