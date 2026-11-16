import { SafeAreaView } from "react-native-safe-area-context";

import { WorkoutLogForm } from "@/components/WorkoutLogForm";
import { colors } from "@/constants/theme";

export default function LogWorkoutScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <WorkoutLogForm />
    </SafeAreaView>
  );
}
