import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { POPDARTS_COLORS } from "../constants/colors";

/**
 * DartColorManager - Manage owned colors and set favorites
 * @param {boolean} visible - Modal visibility state
 * @param {function} onDismiss - Callback to close modal
 * @param {array} ownedColors - Array of owned color indices
 * @param {function} setOwnedColors - State setter for owned colors
 * @param {number} favoriteHomeColor - Index of favorite home color
 * @param {function} setFavoriteHomeColor - State setter for home favorite
 * @param {number} favoriteAwayColor - Index of favorite away color
 * @param {function} setFavoriteAwayColor - State setter for away favorite
 */
export default function DartColorManager({
  visible,
  onDismiss,
  ownedColors = [],
  setOwnedColors,
  favoriteHomeColor = null,
  setFavoriteHomeColor,
  favoriteAwayColor = null,
  setFavoriteAwayColor,
}) {
  const [mode, setMode] = useState("ownership"); // 'ownership', 'home', 'away'

  /**
   * Toggle ownership of a color
   */
  const toggleOwnership = (colorIndex) => {
    if (ownedColors.includes(colorIndex)) {
      // Remove from owned
      setOwnedColors(ownedColors.filter((i) => i !== colorIndex));
      // If it was a favorite, clear that too
      if (favoriteHomeColor === colorIndex) setFavoriteHomeColor(null);
      if (favoriteAwayColor === colorIndex) setFavoriteAwayColor(null);
    } else {
      // Add to owned
      setOwnedColors([...ownedColors, colorIndex]);
    }
  };

  /**
   * Set a color as home favorite
   */
  const setHomeFavorite = (colorIndex) => {
    // Must own the color first
    if (!ownedColors.includes(colorIndex)) {
      setOwnedColors([...ownedColors, colorIndex]);
    }
    setFavoriteHomeColor(colorIndex);
    setMode("ownership");
  };

  /**
   * Set a color as away favorite
   */
  const setAwayFavorite = (colorIndex) => {
    // Must own the color first
    if (!ownedColors.includes(colorIndex)) {
      setOwnedColors([...ownedColors, colorIndex]);
    }
    setFavoriteAwayColor(colorIndex);
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
              My Dart Colors
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
              Own ({ownedColors.length})
            </Button>
            <Button
              mode={mode === "home" ? "contained" : "outlined"}
              onPress={() => setMode("home")}
              style={styles.modeButton}
              compact
            >
              Home Fav
            </Button>
            <Button
              mode={mode === "away" ? "contained" : "outlined"}
              onPress={() => setMode("away")}
              style={styles.modeButton}
              compact
            >
              Away Fav
            </Button>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            {mode === "ownership" && (
              <Text variant="bodySmall" style={styles.instructionText}>
                Tap colors you own. Owned colors will be highlighted in Quick
                Match.
              </Text>
            )}
            {mode === "home" && (
              <Text variant="bodySmall" style={styles.instructionText}>
                Select your favorite home color. It will be auto-selected when
                you're Player 1.
              </Text>
            )}
            {mode === "away" && (
              <Text variant="bodySmall" style={styles.instructionText}>
                Select your favorite away color. It will be auto-selected when
                you're Player 2.
              </Text>
            )}
          </View>

          {/* Current Favorites Display */}
          <View style={styles.favoritesDisplay}>
            <View style={styles.favoriteItem}>
              <Text variant="labelSmall" style={styles.favoriteLabel}>
                HOME:
              </Text>
              <Text variant="bodySmall" style={styles.favoriteValue}>
                {favoriteHomeColor !== null
                  ? POPDARTS_COLORS[favoriteHomeColor].name
                  : "None"}
              </Text>
            </View>
            <View style={styles.favoriteItem}>
              <Text variant="labelSmall" style={styles.favoriteLabel}>
                AWAY:
              </Text>
              <Text variant="bodySmall" style={styles.favoriteValue}>
                {favoriteAwayColor !== null
                  ? POPDARTS_COLORS[favoriteAwayColor].name
                  : "None"}
              </Text>
            </View>
          </View>

          {/* Color Grid */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.colorGrid}>
              {POPDARTS_COLORS.map((colorObj, colorIndex) => {
                const isOwned = ownedColors.includes(colorIndex);
                const isHomeFavorite = favoriteHomeColor === colorIndex;
                const isAwayFavorite = favoriteAwayColor === colorIndex;

                // Filter: Only show owned colors in home/away favorite modes
                if ((mode === "home" || mode === "away") && !isOwned) {
                  return null;
                }

                return (
                  <TouchableOpacity
                    key={colorIndex}
                    onPress={() => {
                      if (mode === "ownership") {
                        toggleOwnership(colorIndex);
                      } else if (mode === "home") {
                        setHomeFavorite(colorIndex);
                      } else if (mode === "away") {
                        setAwayFavorite(colorIndex);
                      }
                    }}
                    style={[
                      styles.colorSquare,
                      isOwned && mode === "ownership" && styles.colorOwned,
                      isHomeFavorite &&
                        mode === "home" &&
                        styles.colorFavoriteHome,
                      isAwayFavorite &&
                        mode === "away" &&
                        styles.colorFavoriteAway,
                    ]}
                  >
                    {/* Gradient or Solid Background */}
                    {colorObj.isGradient ? (
                      <LinearGradient
                        colors={colorObj.colors}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        locations={[0, 1]}
                        style={styles.colorGradient}
                      />
                    ) : (
                      <View
                        style={[
                          styles.colorGradient,
                          { backgroundColor: colorObj.colors[0] },
                        ]}
                      />
                    )}

                    {/* Color Name */}
                    <View style={styles.colorNameContainer}>
                      <Text style={styles.colorName}>{colorObj.name}</Text>
                    </View>

                    {/* Ownership Indicator */}
                    {isOwned && mode === "ownership" && (
                      <View style={styles.ownedIndicator}>
                        <View style={styles.checkmarkCircle}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      </View>
                    )}

                    {/* Home Favorite Star */}
                    {isHomeFavorite && (
                      <View style={styles.favoriteIndicatorHome}>
                        <Text style={styles.favoriteIcon}>⭐</Text>
                        <Text style={styles.favoriteText}>HOME</Text>
                      </View>
                    )}

                    {/* Away Favorite Star */}
                    {isAwayFavorite && (
                      <View style={styles.favoriteIndicatorAway}>
                        <Text style={styles.favoriteIcon}>⭐</Text>
                        <Text style={styles.favoriteText}>AWAY</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={onDismiss}
              style={styles.doneButton}
            >
              Done
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: "bold",
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  modeButton: {
    flex: 1,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
  },
  instructionText: {
    textAlign: "center",
    color: "#666",
  },
  favoritesDisplay: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  favoriteItem: {
    alignItems: "center",
  },
  favoriteLabel: {
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  favoriteValue: {
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  colorSquare: {
    width: "48%",
    height: 140,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cccccc",
    overflow: "hidden",
    position: "relative",
  },
  colorOwned: {
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  colorFavoriteHome: {
    borderColor: "#FFD700",
    borderWidth: 4,
  },
  colorFavoriteAway: {
    borderColor: "#FF6347",
    borderWidth: 4,
  },
  colorGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  colorNameContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colorName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  ownedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  favoriteIndicatorHome: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  favoriteIndicatorAway: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 99, 71, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  favoriteIcon: {
    fontSize: 12,
  },
  favoriteText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  doneButton: {
    paddingVertical: 4,
  },
});
