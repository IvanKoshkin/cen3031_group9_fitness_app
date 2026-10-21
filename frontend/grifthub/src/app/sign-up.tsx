import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { signUp } from "@/lib/api";

// SIGN-UP SCREEN (user creation).
//
// How a form works in React:
//  1. Each field's value lives in "state" (useState). Typing calls setX, which
//     re-renders the screen with the new value.
//  2. On submit we validate. If there are problems we store them in `errors`
//     and each field shows its own message.
//  3. If it's valid we call the API, show a spinner, then go to the app.

type Errors = Partial<Record<"username" | "displayName" | "email" | "password" | "confirm", string>>;

function validate(values: {
  username: string;
  displayName: string;
  email: string;
  password: string;
  confirm: string;
}): Errors {
  const errors: Errors = {};

  // Django's default username rules: letters, digits and @ . + - _
  if (!values.username) errors.username = "Choose a username.";
  else if (!/^[\w.@+-]{3,30}$/.test(values.username))
    errors.username = "3–30 characters: letters, numbers, and . _ - only.";

  if (!values.displayName.trim()) errors.displayName = "Enter a display name.";
  else if (values.displayName.trim().length > 30) errors.displayName = "Keep it under 30 characters.";

  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Enter a valid email address.";

  // Django's MinimumLengthValidator defaults to 8.
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  else if (/^\d+$/.test(values.password)) errors.password = "Can't be only numbers.";

  if (values.confirm !== values.password) errors.confirm = "Passwords don't match.";

  return errors;
}

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const found = validate({ username, displayName, email, password, confirm });
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return; // stop: show the field errors

    setSubmitting(true);
    try {
      await signUp({ username, displayName: displayName.trim(), email, password });
      // replace() instead of push(): the user can't press "back" into the sign-up form.
      router.replace("/leaderboard");
    } catch (err) {
      // Keep everything they typed; just show what went wrong.
      setServerError(err instanceof Error ? err.message : "Couldn't create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Pushes the form up so the keyboard doesn't cover the fields on iOS. */}
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.back} onPress={() => router.back()}>
            ‹ Back
          </Text>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Takes about 30 seconds.</Text>

          {serverError ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{serverError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <TextField
              label="Username"
              placeholder="gatorgains"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoComplete="username-new"
            />
            <TextField
              label="Display name"
              placeholder="Alex J."
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              hint="Shown to everyone on the leaderboard."
              autoCapitalize="words"
            />
            <TextField
              label="Email"
              placeholder="you@ufl.edu"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              isPassword
              autoComplete="new-password"
            />
            <TextField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              isPassword
              autoComplete="new-password"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Button title="Sign up" onPress={handleSubmit} loading={submitting} />

          <Text style={styles.switch}>
            Already have an account?{" "}
            <Text style={styles.link} onPress={() => router.replace("/login")}>
              Log in
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  back: { color: colors.textMuted, fontSize: fontSize.body },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900", marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: fontSize.body, marginTop: -spacing.sm },
  banner: {
    backgroundColor: "#3A1E24",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  bannerText: { color: colors.danger, fontWeight: "600" },
  form: { gap: spacing.md, marginBottom: spacing.sm },
  switch: { color: colors.textMuted, textAlign: "center", fontSize: fontSize.body },
  link: { color: colors.accent, fontWeight: "700" },
});
