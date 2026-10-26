import React, { useEffect, useState, useCallback } from "react";
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
                    <Text style = {styles.score}>{item.points}</Text>
                </View>
            )}
        />
    );
}


//stylesheet generated
const styles = StyleSheet.create({
  center: { flex: 1, marginTop: 100, textAlign: "center" },
  error: { color: "red" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  desc: { color: "#555", marginTop: 4 },
  score: { marginTop: 8, fontWeight: "600" },
});