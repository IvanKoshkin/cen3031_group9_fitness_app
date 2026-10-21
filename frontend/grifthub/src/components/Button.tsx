import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, fontSize, radius, spacing } from "@/constants/theme";

// A reusable button. Every screen uses this instead of styling its own,
// so all buttons in the app look the same.
//
// Usage:
//   <Button title="Sign up" onPress={handleSubmit} />
//   <Button title="I already have an account" variant="ghost" onPress={...} />

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = "primary", loading, disabled }: Props) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      // `pressed` is true while the user's finger is down, so the button dims as feedback.
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        (pressed || isDisabled) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.accentText : colors.text} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.ghostLabel]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.accent },
  ghost: { borderWidth: 1, borderColor: colors.border },
  dimmed: { opacity: 0.6 },
  label: { fontSize: fontSize.body, fontWeight: "700" },
  primaryLabel: { color: colors.accentText },
  ghostLabel: { color: colors.text },
});
