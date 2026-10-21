import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { logIn } from "@/lib/api";

// LOGIN SCREEN. Same pattern as sign-up, just fewer fields.
// (Mock mode: any username + a password of 8+ characters "works".)

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!username || !password) {
      setError("Enter your username and password.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await logIn(username, password);
      router.replace("/leaderboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.back} onPress={() => router.back()}>
            ‹ Back
          </Text>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Your streak missed you.</Text>

          {error ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <TextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoComplete="username"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="current-password"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Button title="Log in" onPress={handleSubmit} loading={submitting} />

          <Text style={styles.switch}>
            New here?{" "}
            <Text style={styles.link} onPress={() => router.replace("/sign-up")}>
              Create an account
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
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
