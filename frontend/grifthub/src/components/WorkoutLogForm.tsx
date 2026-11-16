import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { createWorkoutLog, getExercises, type Exercise } from "@/lib/api";

const INTENSITIES = ["light", "moderate", "vigorous"] as const;
type Intensity = (typeof INTENSITIES)[number];

const titleCase = (value: string) => value[0].toUpperCase() + value.slice(1);

export function WorkoutLogForm() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [query, setQuery] = useState("");
  const [minutes, setMinutes] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [intensityOpen, setIntensityOpen] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getExercises()
      .then(setExercises)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load exercises."))
      .finally(() => setLoadingExercises(false));
  }, []);

  const filteredExercises = useMemo(() => {
    const search = query.trim().toLowerCase();
    return exercises.filter((exercise) => exercise.exercise_name.toLowerCase().includes(search));
  }, [exercises, query]);

  async function submit() {
    setError("");
    setMessage("");
    const parsedMinutes = Number(minutes);
    if (!selected) return setError("Choose an exercise.");
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 5 || parsedMinutes > 180) {
      return setError("Minutes must be a whole number between 5 and 180.");
    }

    setSubmitting(true);
    try {
      const workout = await createWorkoutLog({
        exerciseId: selected.id,
        minutes: parsedMinutes,
        intensity,
      });
      setMinutes("");
      setMessage(`Workout logged. You earned ${workout.pointsAwarded} points.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log workout.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log workout</Text>
        <Text style={styles.subtitle}>Choose an exercise, duration, and intensity.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Exercise</Text>
          <Pressable style={styles.selector} onPress={() => setExerciseOpen((open) => !open)}>
            <Text style={selected ? styles.selectorText : styles.placeholder}>
              {selected?.exercise_name ?? "Search and choose an exercise"}
            </Text>
            <Text style={styles.chevron}>{exerciseOpen ? "▲" : "▼"}</Text>
          </Pressable>
          {exerciseOpen && (
            <View style={styles.dropdown}>
              <TextField
                label="Search"
                value={query}
                onChangeText={setQuery}
                placeholder="Type an exercise name"
              />
              {loadingExercises ? (
                <ActivityIndicator color={colors.accent} style={styles.loader} />
              ) : (
                <FlatList
                  data={filteredExercises}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  style={styles.results}
                  ListEmptyComponent={<Text style={styles.empty}>No matching exercises.</Text>}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.option}
                      onPress={() => {
                        setSelected(item);
                        setQuery("");
                        setExerciseOpen(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.exercise_name}</Text>
                      <Text style={styles.optionHint}>{item.category}</Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          )}
        </View>

        <TextField
          label="Minutes"
          value={minutes}
          onChangeText={setMinutes}
          placeholder="5–180"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={3}
          hint="Enter a whole number from 5 to 180."
        />

        <View style={styles.field}>
          <Text style={styles.label}>Intensity</Text>
          <Pressable style={styles.selector} onPress={() => setIntensityOpen((open) => !open)}>
            <Text style={styles.selectorText}>{titleCase(intensity)}</Text>
            <Text style={styles.chevron}>{intensityOpen ? "▲" : "▼"}</Text>
          </Pressable>
          {intensityOpen && (
            <View style={styles.dropdown}>
              {INTENSITIES.map((option) => (
                <Pressable
                  key={option}
                  style={styles.option}
                  onPress={() => {
                    setIntensity(option);
                    setIntensityOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{titleCase(option)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <Button title="Log workout" onPress={submit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900" },
  subtitle: { color: colors.textMuted, fontSize: fontSize.body },
  field: { gap: spacing.xs + 2 },
  label: { color: colors.text, fontSize: fontSize.small, fontWeight: "600" },
  selector: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  selectorText: { color: colors.text, fontSize: fontSize.body },
  placeholder: { color: colors.textMuted, fontSize: fontSize.body },
  chevron: { color: colors.textMuted, fontSize: fontSize.small },
  dropdown: {
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  results: { maxHeight: 220 },
  option: { padding: spacing.sm, borderRadius: radius.sm },
  optionText: { color: colors.text, fontSize: fontSize.body },
  optionHint: { color: colors.textMuted, fontSize: fontSize.small, marginTop: 2 },
  loader: { padding: spacing.md },
  empty: { color: colors.textMuted, padding: spacing.sm },
  error: { color: colors.danger, fontSize: fontSize.small },
  success: { color: colors.accent, fontSize: fontSize.small },
});
