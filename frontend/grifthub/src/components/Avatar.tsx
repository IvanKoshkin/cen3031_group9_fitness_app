import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";

// Shows a person's initials in a colored circle.
// Users don't have avatar images yet, so this is the "missing avatar" fallback
// your design doc asked for. Later you can add an `imageUrl` prop.

const PALETTE = ["#5B8CFF", "#FF7A59", "#34C3A0", "#B07CFF", "#FFB547", "#FF5FA2"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

// Same name always gets the same color.
function colorFor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return PALETTE[sum % PALETTE.length];
}

export function Avatar({ name, size = 40, ring }: { name: string; size?: number; ring?: string }) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorFor(name),
          borderWidth: ring ? 3 : 0,
          borderColor: ring,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: colors.text, fontWeight: "800" },
});
