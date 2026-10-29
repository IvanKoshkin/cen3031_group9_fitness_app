import React, { useEffect, useState, useCallback } from "react";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";

const HOST = '127.0.0.1';
const API_URL = `http://${HOST}:8000/leaderboard/exercises/`;

export default function ItemList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);


    const loadItems = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(API_URL);
            if(!res.ok) throw new Error('HTTP ${res.status}');
            const data = await res.json();
            setItems(data.exercises ?? []);
            
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    
    if (loading) return <ActivityIndicator style={styles.center} size="large" />;
    if (error) return <Text style={[styles.center, styles.error]}>Error: {error}</Text>;

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
                <RefreshControl
                    refreshing = {refreshing}
                    onRefresh = {() => {
                        setRefreshing(true);
                        loadItems();
                    }}
                />
            }
            renderItem = {({item}) => (
                <View style = {styles.card}>
                    <Text style = {styles.title}>{item.exercise_name}</Text>
                    <Text style = {styles.category}>{item.category}</Text>
                </View>
            )}
        />
    );
}




//stylesheet generated
const styles = StyleSheet.create({
  // Screen wrapper (use on SafeAreaView, like `safe` in the leaderboard)
  safe: { flex: 1, backgroundColor: colors.background },
  // Replaces your old `center`: for loading / empty / error states
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  // Padding for the FlatList's contentContainerStyle (replaces the cards' marginHorizontal)
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },

  error: { color: colors.danger, fontWeight: "600", textAlign: "center" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: fontSize.large, fontWeight: "800" },
  desc: { color: colors.textMuted, fontSize: fontSize.body, marginTop: spacing.xs },
  category: { color: colors.accent, fontSize: fontSize.body, fontWeight: "700", marginTop: spacing.sm },
});