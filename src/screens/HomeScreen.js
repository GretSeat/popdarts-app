import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, Card, IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/AuthContext";

/**
 * Home screen - Card-based with primary action and progressive disclosure
 * Answers: "What should I do right now?"
 */
export default function HomeScreen({ navigation }) {
  const { user, isGuest, guestName } = useAuth();
  const [playStyle, setPlayStyle] = useState("casual");
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [dismissedCards, setDismissedCards] = useState([]);

  const displayName =
    user?.user_metadata?.display_name || guestName || "Player";

  useEffect(() => {
    // Load user preferences and stats
    AsyncStorage.multiGet([
      "play_style",
      "games_played",
      "dismissed_cards",
    ]).then((values) => {
      const style = values[0][1];
      const games = values[1][1];
      const dismissed = values[2][1];

      if (style) setPlayStyle(style);
      if (games) setGamesPlayed(parseInt(games, 10));
      if (dismissed) setDismissedCards(JSON.parse(dismissed));
    });
  }, []);

  const dismissCard = async (cardId) => {
    const updated = [...dismissedCards, cardId];
    setDismissedCards(updated);
    await AsyncStorage.setItem("dismissed_cards", JSON.stringify(updated));
  };

  const shouldShowCard = (cardId) => !dismissedCards.includes(cardId);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.greeting}>
            Hey {displayName} 👋
          </Text>
        </View>

        {/* PRIMARY ACTION - Always Visible */}
        <Card style={styles.primaryCard} mode="elevated">
          <Card.Content>
            <Text variant="headlineMedium" style={styles.primaryTitle}>
              {playStyle === "competitive" ? "🏆 Start Match" : "🎯 Quick Play"}
            </Text>
            <Text variant="bodyMedium" style={styles.primarySubtitle}>
              {playStyle === "competitive"
                ? "Track your stats and compete"
                : "Jump into a casual 1v1 game"}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => {
                if (playStyle === "competitive") {
                  navigation.navigate("Play");
                } else {
                  // Quick Play: Go directly to 1v1 casual lobby
                  navigation.navigate("Play", {
                    quickPlay: true,
                    gameFormat: "1v1",
                    edition: "classic",
                    matchType: "casual",
                  });
                }
              }}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
            >
              {playStyle === "competitive" ? "Start New Game" : "Quick Play"}
            </Button>
          </Card.Actions>
        </Card>

        {/* APL Promo Card */}
        {shouldShowCard("apl_promo") && (
          <Card style={styles.contextCard} mode="elevated">
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => dismissCard("apl_promo")}
            >
              <IconButton icon="close" size={16} />
            </TouchableOpacity>
            <Card.Cover
              source={require("../../assets/APL_Hero_2.0_Banner.jpg")}
              style={{ height: 120, resizeMode: "cover" }}
            />
            <Card.Content>
              <Text variant="titleMedium" style={styles.contextTitle}>
                🏆 Join the APL!
              </Text>
              <Text variant="bodyMedium" style={styles.contextDescription}>
                Track your stats, compete officially, and see your global
                ranking. Registration is free!
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => {
                  // Open APL website
                  Linking.openURL("https://www.iplayapl.com");
                }}
              >
                Register at iplayapl.com
              </Button>
            </Card.Actions>
          </Card>
        )}

        {/* Stats Unlock Prompt - Show after 5 games */}
        {gamesPlayed >= 5 && shouldShowCard("stats_unlock") && (
          <Card style={styles.contextCard} mode="elevated">
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => dismissCard("stats_unlock")}
            >
              <IconButton icon="close" size={16} />
            </TouchableOpacity>
            <Card.Content>
              <Text variant="titleMedium" style={styles.contextTitle}>
                📊 You've played {gamesPlayed} games!
              </Text>
              <Text variant="bodyMedium" style={styles.contextDescription}>
                View your stats, track your progress, and see how you stack up.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate("Profile")}
              >
                View Stats
              </Button>
            </Card.Actions>
          </Card>
        )}

        {/* League Discovery - Show for competitive or after 10 games */}
        {(playStyle === "competitive" || gamesPlayed >= 10) &&
          shouldShowCard("league_discovery") && (
            <Card style={styles.contextCard} mode="elevated">
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => dismissCard("league_discovery")}
              >
                <IconButton icon="close" size={16} />
              </TouchableOpacity>
              <Card.Content>
                <Text variant="titleMedium" style={styles.contextTitle}>
                  🎯 Local League Nights
                </Text>
                <Text variant="bodyMedium" style={styles.contextDescription}>
                  Find Popdarts leagues and tournaments near you.
                </Text>
                <Text variant="bodySmall" style={styles.comingSoonBadge}>
                  Coming Soon
                </Text>
              </Card.Content>
            </Card>
          )}

        {/* Guest Account Upgrade */}
        {isGuest && shouldShowCard("guest_upgrade") && (
          <Card style={styles.contextCard} mode="elevated">
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => dismissCard("guest_upgrade")}
            >
              <IconButton icon="close" size={16} />
            </TouchableOpacity>
            <Card.Content>
              <Text variant="titleMedium" style={styles.contextTitle}>
                ⭐ Save Your Progress
              </Text>
              <Text variant="bodyMedium" style={styles.contextDescription}>
                Create an account to save matches across devices.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate("Profile")}
              >
                Create Account
              </Button>
            </Card.Actions>
          </Card>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Dark mode default
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  greeting: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // PRIMARY ACTION CARD
  primaryCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: "#2196F3", // Popdarts blue
    elevation: 6,
  },
  primaryTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 4,
  },
  primarySubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  primaryButtonContent: {
    paddingVertical: 8,
  },
  primaryButtonLabel: {
    color: "#2196F3", // Blue text on white button
    fontWeight: "600",
    fontSize: 16,
  },
  // CONTEXTUAL CARDS
  contextCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: "#2A2A2A",
    position: "relative",
  },
  dismissButton: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
  },
  contextTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  contextDescription: {
    color: "#CCCCCC",
    lineHeight: 20,
  },
  comingSoonBadge: {
    marginTop: 8,
    color: "#4CAF50",
    fontStyle: "italic",
  },
  spacer: {
    height: 40,
  },
});
