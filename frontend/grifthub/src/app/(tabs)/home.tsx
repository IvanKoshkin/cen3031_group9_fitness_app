import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontSize, spacing } from "@/constants/theme";

// Placeholder for the Dashboard (Screen 3 in the design doc).
// Whoever owns the dashboard can replace this file.

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.body}>Coming soon: your points, rank, and a Log Workout button.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900" },
  body: { color: colors.textMuted, fontSize: fontSize.body },
});
