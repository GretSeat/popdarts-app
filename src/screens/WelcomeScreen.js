import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, RadioButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenContainer from "../components/ScreenContainer";

/**
 * Welcome screen for first-time users
 * Asks about play style preference to customize experience
 */
export default function WelcomeScreen({ onComplete }) {
  const [playStyle, setPlayStyle] = useState(null);

  const handleContinue = async () => {
    if (playStyle) {
      // Save user preference
      await AsyncStorage.setItem("play_style", playStyle);
      await AsyncStorage.setItem("has_completed_welcome", "true");

      if (onComplete) {
        onComplete(playStyle);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenContainer>
        <View style={styles.header}>
          <Text variant="displayMedium" style={styles.welcomeTitle}>
            Welcome to Popdarts! 🎯
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Thanks for downloading the app!
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="titleLarge" style={styles.question}>
            Do you see yourself being competitive, or mostly playing for fun
            with friends and family?
          </Text>
          <Text variant="bodyMedium" style={styles.explanation}>
            This helps us prioritize what you see first. You can always change
            this later, and you'll have access to all features either way.
          </Text>

          <RadioButton.Group
            onValueChange={(value) => setPlayStyle(value)}
            value={playStyle}
          >
            <View style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <RadioButton value="casual" />
                <Text variant="titleMedium" style={styles.optionTitle}>
                  Playing for Fun 🎲
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.optionDescription}>
                Quick access to start games with friends and family. Stats and
                leagues available when you want them.
              </Text>
            </View>

            <View style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <RadioButton value="competitive" />
                <Text variant="titleMedium" style={styles.optionTitle}>
                  Being Competitive 🏆
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.optionDescription}>
                Emphasize stats tracking, match history, and nearby leagues.
                Features unlock as you play.
              </Text>
              <Text variant="bodySmall" style={styles.privacyNote}>
                📍 We'll ask for location permission to show you local
                tournaments and league nights.
              </Text>
            </View>
          </RadioButton.Group>
        </View>

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!playStyle}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
        >
          Continue
        </Button>

        <Button
          mode="text"
          onPress={() => handleContinue()}
          style={styles.skipButton}
        >
          Skip for now
        </Button>
      </ScreenContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    justifyContent: "center",
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeTitle: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
  },
  question: {
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  explanation: {
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionTitle: {
    fontWeight: "bold",
    marginLeft: 8,
  },
  optionDescription: {
    marginLeft: 48,
    color: "#555",
    lineHeight: 20,
  },
  privacyNote: {
    marginLeft: 48,
    marginTop: 8,
    color: "#2196F3",
    fontStyle: "italic",
  },
  continueButton: {
    marginBottom: 12,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
  skipButton: {
    marginBottom: 20,
  },
});
