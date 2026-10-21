import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, fontSize, radius, spacing } from "@/constants/theme";

// A labeled text input with an optional error message underneath.
// Set `isPassword` to get a Show/Hide toggle.
//
// Usage:
//   <TextField label="Email" value={email} onChangeText={setEmail} error={errors.email} />

type Props = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
};

export function TextField({ label, error, hint, isPassword, style, ...inputProps }: Props) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          {...inputProps}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && hidden}
          autoCapitalize={inputProps.autoCapitalize ?? "none"}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {isPassword && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10} accessibilityRole="button">
            <Text style={styles.toggle}>{hidden ? "Show" : "Hide"}</Text>
          </Pressable>
        )}
      </View>

      {/* Show the error if there is one, otherwise the hint (if any). */}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  label: { color: colors.text, fontSize: fontSize.small, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputFocused: { borderColor: colors.accent },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    minHeight: 52,
    color: colors.text,
    fontSize: fontSize.body,
  },
  toggle: { color: colors.accent, fontWeight: "600", fontSize: fontSize.small },
  error: { color: colors.danger, fontSize: fontSize.small },
  hint: { color: colors.textMuted, fontSize: fontSize.small },
});
