import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { getLeaderboard, type Leaderboard, type LeaderboardEntry } from "@/lib/api";

// WEEKLY LEADERBOARD (Screen 4 in the design doc).
//
// The screen can be in one of four states, and we draw something different for each:
//   loading  -> spinner
//   error    -> message + "Try again"
//   empty    -> nobody has logged a workout yet this week
//   ready    -> podium (top 3) + the rest of the list

type RankedEntry = LeaderboardEntry & { rank: number };

// Ties share a rank: 842, 790, 790, 655 -> ranks 1, 2, 2, 4.
// (Ideally the backend sends `rank` so the tie-break rule lives in one place.)
function addRanks(entries: LeaderboardEntry[]): RankedEntry[] {
  return entries.map((entry, i) => {
    let rank = i + 1;
    if (i > 0 && entry.points === entries[i - 1].points) {
      // walk back to the first person with the same score
      let j = i;
      while (j > 0 && entries[j - 1].points === entry.points) j--;
      rank = j + 1;
    }
    return { ...entry, rank };
  });
}

// "Oct 19 – Oct 25"
function weekLabel(weekStart: string) {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

// "Resets in 4d 6h" (next Monday at midnight)
function resetCountdown(weekStart: string) {
  const reset = new Date(weekStart + "T00:00:00");
  reset.setDate(reset.getDate() + 7);
  const ms = Math.max(0, reset.getTime() - Date.now());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `Resets in ${days}d ${hours}h` : `Resets in ${hours}h`;
}

export default function LeaderboardScreen() {
  const [data, setData] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getLeaderboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // useEffect with [] runs once, when the screen first appears.
  useEffect(() => {
    load();
  }, [load]);

  // ----- loading / error states -----
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[styles.safe, styles.center, { padding: spacing.lg }]}>
        <Text style={styles.emptyTitle}>Couldn't load the leaderboard</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <View style={{ alignSelf: "stretch", marginTop: spacing.lg }}>
          <Button
            title="Try again"
            onPress={() => {
              setLoading(true);
              load();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const ranked = addRanks(data.entries.filter((e) => e.points > 0));
  const me = addRanks(data.entries).find((e) => e.userId === data.currentUserId);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const header = (
    <View style={{ gap: spacing.lg }}>
      <View>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.weekRow}>
          <Text style={styles.week}>{weekLabel(data.weekStart)}</Text>
          <View style={styles.resetPill}>
            <Text style={styles.resetText}>{resetCountdown(data.weekStart)}</Text>
          </View>
        </View>
      </View>

      {me && <MyRankCard entry={me} hasPoints={me.points > 0} />}

      {podium.length > 0 && <Podium entries={podium} currentUserId={data.currentUserId} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        // FlatList only renders rows that are on screen, so it stays fast
        // even with thousands of students.
        data={rest}
        keyExtractor={(item) => String(item.userId)}
        renderItem={({ item }) => <Row entry={item} isMe={item.userId === data.currentUserId} />}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{ marginBottom: spacing.md }}
        ListEmptyComponent={
          ranked.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No points yet this week</Text>
              <Text style={styles.emptyBody}>
                Be the first on the board. Log a workout and you'll show up here.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        // Pull down to refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

// ---------- Small pieces of the screen ----------
// Splitting the screen into small components keeps each one easy to read.

function MyRankCard({ entry, hasPoints }: { entry: RankedEntry; hasPoints: boolean }) {
  return (
    <View style={styles.myCard}>
      <View>
        <Text style={styles.myLabel}>YOUR RANK</Text>
        <Text style={styles.myRank}>{hasPoints ? `#${entry.rank}` : "—"}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.myLabel}>THIS WEEK</Text>
        <Text style={styles.myPoints}>
          {entry.points.toLocaleString()} <Text style={styles.myPts}>pts</Text>
        </Text>
      </View>
    </View>
  );
}

function Podium({ entries, currentUserId }: { entries: RankedEntry[]; currentUserId: number }) {
  // Display order is 2nd, 1st, 3rd so the winner stands in the middle.
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  const medal = [colors.gold, colors.silver, colors.bronze];
  const heights = [120, 90, 70];

  return (
    <View style={styles.podium}>
      {order.map((entry) => {
        // Use rank (not position) so tied players get the same medal and height.
        const place = Math.min(entry.rank, 3) - 1; // 0, 1 or 2
        const isMe = entry.userId === currentUserId;
        return (
          <View key={entry.userId} style={styles.podiumCol}>
            <Avatar name={entry.displayName} size={place === 0 ? 64 : 52} ring={medal[place]} />
            <Text style={styles.podiumName} numberOfLines={1}>
              {isMe ? "You" : entry.displayName.split(" ")[0]}
            </Text>
            <Text style={styles.podiumPts}>{entry.points.toLocaleString()}</Text>
            <View
              style={[
                styles.podiumBlock,
                { height: heights[place], borderTopColor: medal[place] },
              ]}
            >
              <Text style={[styles.podiumRank, { color: medal[place] }]}>{entry.rank}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Row({ entry, isMe }: { entry: RankedEntry; isMe: boolean }) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={[styles.rank, isMe && styles.textOnAccent]}>{entry.rank}</Text>
      <Avatar name={entry.displayName} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, isMe && styles.textOnAccent]} numberOfLines={1}>
          {isMe ? "You" : entry.displayName}
        </Text>
        <Text style={[styles.sub, isMe && styles.subOnAccent]}>
          {entry.workouts} {entry.workouts === 1 ? "workout" : "workouts"}
        </Text>
      </View>
      <Text style={[styles.points, isMe && styles.textOnAccent]}>
        {entry.points.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },

  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900" },
  weekRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  week: { color: colors.textMuted, fontSize: fontSize.body },
  resetPill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  resetText: { color: colors.accent, fontSize: 12, fontWeight: "700" },

  myCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  myLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  myRank: { color: colors.text, fontSize: fontSize.hero - 4, fontWeight: "900" },
  myPoints: { color: colors.accent, fontSize: fontSize.hero - 4, fontWeight: "900" },
  myPts: { fontSize: fontSize.body, fontWeight: "700" },

  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: spacing.sm,
  },
  podiumCol: { flex: 1, alignItems: "center", gap: spacing.xs },
  podiumName: { color: colors.text, fontWeight: "700", fontSize: fontSize.body - 1 },
  podiumPts: { color: colors.textMuted, fontSize: fontSize.small },
  podiumBlock: {
    alignSelf: "stretch",
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 3,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  podiumRank: { fontSize: fontSize.title, fontWeight: "900" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
  },
  rowMe: { backgroundColor: colors.accent }, // highlighted row for the logged-in user
  rank: { color: colors.textMuted, width: 22, fontWeight: "800", fontSize: fontSize.body },
  name: { color: colors.text, fontWeight: "700", fontSize: fontSize.body },
  sub: { color: colors.textMuted, fontSize: fontSize.small },
  points: { color: colors.text, fontWeight: "900", fontSize: fontSize.large - 2 },
  textOnAccent: { color: colors.accentText },
  subOnAccent: { color: "#3C4A1A" },

  empty: { alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: fontSize.large, fontWeight: "800", textAlign: "center" },
  emptyBody: { color: colors.textMuted, fontSize: fontSize.body, textAlign: "center" },
});
