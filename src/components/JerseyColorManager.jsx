import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Jersey designs available to players
 * Maps to image files in assets/jerseys/
 * Each jersey is mapped to its corresponding color gradient(s) from POPDARTS_COLORS
 */
const JERSEY_DESIGNS = [
  {
    id: 0,
    name: "Bleen",
    image: require("../../assets/jerseys/bleenjersey.png"),
    colors: ["#0000FF", "#67f00b"], // Bleen gradient
    isGradient: true,
  },
  {
    id: 1,
    name: "Explore",
    image: require("../../assets/jerseys/explorejersey.png"),
    colors: ["#F4AFA4", "#3D5672"], // Explore Ocean gradient
    isGradient: true,
  },
  {
    id: 2,
    name: "Fire & Ice",
    image: require("../../assets/jerseys/fireicejersey.png"),
    colors: ["#F04B25", "#282F85"], // Fire to Ice
    isGradient: true,
  },
  {
    id: 3,
    name: "FRDi",
    image: require("../../assets/jerseys/FRDijersey.png"),
    colors: ["#225879", "#E7D13E"], // FRDI Nick to FRDI Cakes
    isGradient: true,
  },
  {
    id: 4,
    name: "Halloween",
    image: require("../../assets/jerseys/halloweenjersey.png"),
    colors: ["#CD680C", "#AAD225"], // Halloween Pumpkin to Halloween Ghost
    isGradient: true,
  },
  {
    id: 5,
    name: "Neon",
    image: require("../../assets/jerseys/neonjersey.png"),
    colors: ["#2091C1", "#F0067E"], // Neon Green to Neon Pink
    isGradient: true,
  },
  {
    id: 6,
    name: "Pink Grey",
    image: require("../../assets/jerseys/pinkgreyjersey.png"),
    colors: ["#FFAAD8", "#494949"], // Pink to Grey
    isGradient: true,
  },
  {
    id: 7,
    name: "Red Black",
    image: require("../../assets/jerseys/redblackjersey.png"),
    colors: ["#CF2740", "#2A2A2A"], // Red to Black
    isGradient: true,
  },
  {
    id: 8,
    name: "Retro",
    image: require("../../assets/jerseys/retrojersey.png"),
    colors: ["#4ACCC7", "#4605B0"], // Retro Teal to Retro Purple
    isGradient: true,
  },
  {
    id: 9,
    name: "Rizzle",
    image: require("../../assets/jerseys/rizzlejersey.png"),
    colors: ["#FE509D", "#2C2C2C"], // Rizzle Pink to Rizzle Black
    isGradient: true,
  },
  {
    id: 10,
    name: "USA",
    image: require("../../assets/jerseys/usajersey.png"),
    colors: ["#FFFFFF", "#CF2740"], // USA white/blue to red
    isGradient: true,
  },
  {
    id: 11,
    name: "Yurple",
    image: require("../../assets/jerseys/yurplejersey.png"),
    colors: ["#800080", "#f7f307"], // Yurple purple to yellow
    isGradient: true,
  },
];

/**
 * Get jersey design by ID
 * @param {number} jerseyId - Jersey ID
 * @returns {object} Jersey design object with colors array and isGradient flag
 */
export const getJerseyById = (jerseyId) => {
  return JERSEY_DESIGNS.find((j) => j.id === jerseyId) || JERSEY_DESIGNS[0];
};

/**
 * Get gradient colors for a jersey (for LinearGradient component)
 * @param {number} jerseyId - Jersey ID
 * @returns {array} Array of colors for gradient
 */
export const getJerseyGradientColors = (jerseyId) => {
  const jersey = getJerseyById(jerseyId);
  return jersey.colors || ["#000000", "#000000"];
};

/**
 * JerseyColorManager - Manage owned jerseys and set favorite
 * @param {boolean} visible - Modal visibility state
 * @param {function} onDismiss - Callback to close modal
 * @param {array} ownedJerseys - Array of owned jersey IDs
 * @param {function} setOwnedJerseys - State setter for owned jerseys
 * @param {number} favoriteJersey - ID of favorite jersey
 * @param {function} setFavoriteJersey - State setter for favorite jersey
 */
export default function JerseyColorManager({
  visible,
  onDismiss,
  ownedJerseys = [],
  setOwnedJerseys,
  favoriteJersey = null,
  setFavoriteJersey,
}) {
  const [mode, setMode] = useState("ownership"); // 'ownership' or 'favorite'

  const screenWidth = Dimensions.get("window").width;
  const jerseySize = (screenWidth - 64) / 3; // 3 jerseys per row with padding

  /**
   * Toggle ownership of a jersey
   */
  const toggleOwnership = (jerseyId) => {
    if (ownedJerseys.includes(jerseyId)) {
      // Remove from owned
      setOwnedJerseys(ownedJerseys.filter((id) => id !== jerseyId));
      // If it was the favorite, clear that too
      if (favoriteJersey === jerseyId) setFavoriteJersey(null);
    } else {
      // Add to owned
      setOwnedJerseys([...ownedJerseys, jerseyId]);
    }
  };

  /**
   * Set a jersey as favorite
   */
  const setFavorite = (jerseyId) => {
    // Must own the jersey first
    if (!ownedJerseys.includes(jerseyId)) {
      setOwnedJerseys([...ownedJerseys, jerseyId]);
    }
    setFavoriteJersey(jerseyId);
    setMode("ownership");
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              My Jerseys
            </Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <Button
              mode={mode === "ownership" ? "contained" : "outlined"}
              onPress={() => setMode("ownership")}
              style={styles.modeButton}
              compact
            >
              Own ({ownedJerseys.length})
            </Button>
            <Button
              mode={mode === "favorite" ? "contained" : "outlined"}
              onPress={() => setMode("favorite")}
              style={styles.modeButton}
              compact
            >
              Set Favorite
            </Button>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            {mode === "ownership" && (
              <Text variant="bodySmall" style={styles.instructionText}>
                Tap jerseys you own. Your favorite will be displayed on your
                profile.
              </Text>
            )}
            {mode === "favorite" && (
              <Text variant="bodySmall" style={styles.instructionText}>
                Select your favorite jersey. It will be displayed on your
                profile banner.
              </Text>
            )}
          </View>

          {/* Current Favorite Display */}
          <View style={styles.favoritesDisplay}>
            <View style={styles.favoriteItem}>
              <Text variant="labelSmall" style={styles.favoriteLabel}>
                FAVORITE:
              </Text>
              <Text variant="bodySmall" style={styles.favoriteValue}>
                {favoriteJersey !== null
                  ? JERSEY_DESIGNS[favoriteJersey]?.name || "None"
                  : "None"}
              </Text>
            </View>
          </View>

          {/* Jersey Grid */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.jerseyGrid}>
              {JERSEY_DESIGNS.map((jersey) => {
                const isOwned = ownedJerseys.includes(jersey.id);
                const isFavorite = favoriteJersey === jersey.id;

                return (
                  <TouchableOpacity
                    key={jersey.id}
                    style={[
                      styles.jerseyCard,
                      { width: jerseySize, height: jerseySize },
                      isFavorite && styles.favoriteCard,
                    ]}
                    onPress={() => {
                      if (mode === "ownership") {
                        toggleOwnership(jersey.id);
                      } else {
                        setFavorite(jersey.id);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={jersey.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.jerseyGradientBackground,
                        isOwned && styles.ownedCardGradient,
                      ]}
                    >
                      <Image
                        source={jersey.image}
                        style={styles.jerseyImage}
                        resizeMode="contain"
                      />
                    </LinearGradient>
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.jerseyName,
                        isOwned && styles.ownedText,
                        isFavorite && styles.favoriteText,
                      ]}
                      numberOfLines={1}
                    >
                      {jersey.name}
                    </Text>
                    {isFavorite && (
                      <View style={styles.favoriteBadge}>
                        <Text style={styles.favoriteBadgeText}>★</Text>
                      </View>
                    )}
                    {isOwned && !isFavorite && (
                      <View style={styles.ownedBadge}>
                        <Text style={styles.ownedBadgeText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontWeight: "bold",
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
    gap: 12,
    backgroundColor: "white",
  },
  modeButton: {
    flex: 1,
  },
  instructions: {
    padding: 12,
    backgroundColor: "#e3f2fd",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  instructionText: {
    textAlign: "center",
    color: "#1976d2",
  },
  favoritesDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  favoriteLabel: {
    fontWeight: "bold",
    color: "#666",
  },
  favoriteValue: {
    color: "#2196F3",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  jerseyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    justifyContent: "space-between",
  },
  jerseyCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    padding: 8,
    overflow: "hidden",
  },
  jerseyGradientBackground: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  ownedCardGradient: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  ownedCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#f1f8f4",
  },
  favoriteCard: {
    borderColor: "#2196F3",
    backgroundColor: "#e3f2fd",
  },
  jerseyImage: {
    width: "90%",
    height: "75%",
  },
  jerseyName: {
    textAlign: "center",
    marginTop: 4,
    fontSize: 11,
    color: "#666",
  },
  ownedText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  favoriteText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  favoriteBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteBadgeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  ownedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ownedBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});
