import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, List } from "react-native-paper";

/**
 * Matches screen - Display match history
 */
export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  // TODO: Fetch matches from Supabase
  const matches = [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Match History
          </Text>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="headlineSmall" style={styles.emptyIcon}>
              🎯
            </Text>
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No matches yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Start your first match to see it here
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {matches.map((match) => (
              <List.Item
                key={match.id}
                title={`${match.player1_name} vs ${match.player2_name}`}
                description={`${match.player1_score} - ${match.player2_score}`}
                left={(props) => <List.Icon {...props} icon="trophy" />}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#666",
    textAlign: "center",
  },
  list: {
    backgroundColor: "white",
  },
});
