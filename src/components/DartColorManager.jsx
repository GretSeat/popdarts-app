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
            {/* Home Fav Button with Gradient Background */}
            <View style={styles.modeButtonWrapper}>
              {favoriteHomeColor !== null && (
                <LinearGradient
                  colors={POPDARTS_COLORS[favoriteHomeColor].colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modeButtonGradientBackground}
                >
                  <Button
                    mode={mode === "home" ? "contained" : "outlined"}
                    onPress={() => setMode("home")}
                    style={styles.modeButton}
                    compact
                    labelStyle={styles.modeButtonLabel}
                  >
                    Home Fav
                  </Button>
                </LinearGradient>
              )}
              {favoriteHomeColor === null && (
                <Button
                  mode={mode === "home" ? "contained" : "outlined"}
                  onPress={() => setMode("home")}
                  style={styles.modeButton}
                  compact
                >
                  Home Fav
                </Button>
              )}
            </View>
            {/* Away Fav Button with Gradient Background */}
            <View style={styles.modeButtonWrapper}>
              {favoriteAwayColor !== null && (
                <LinearGradient
                  colors={POPDARTS_COLORS[favoriteAwayColor].colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modeButtonGradientBackground}
                >
                  <Button
                    mode={mode === "away" ? "contained" : "outlined"}
                    onPress={() => setMode("away")}
                    style={styles.modeButton}
                    compact
                    labelStyle={styles.modeButtonLabel}
                  >
                    Away Fav
                  </Button>
                </LinearGradient>
              )}
              {favoriteAwayColor === null && (
                <Button
                  mode={mode === "away" ? "contained" : "outlined"}
                  onPress={() => setMode("away")}
                  style={styles.modeButton}
                  compact
                >
                  Away Fav
                </Button>
              )}
            </View>
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

          {/* Color Grid */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.colorGrid}>
              {Array.from({
                length: Math.ceil(POPDARTS_COLORS.length / 2),
              }).map((_, setIndex) => {
                const colorIndex1 = setIndex * 2;
                const colorIndex2 = setIndex * 2 + 1;
                const color1 = POPDARTS_COLORS[colorIndex1];
                const color2 = POPDARTS_COLORS[colorIndex2];

                // Check if both colors should be hidden in favorite modes
                const isColor1Owned = ownedColors.includes(colorIndex1);
                const isColor2Owned = ownedColors.includes(colorIndex2);
                const shouldHideSet =
                  (mode === "home" || mode === "away") &&
                  !isColor1Owned &&
                  !isColor2Owned;

                if (shouldHideSet) {
                  return null;
                }

                return (
                  <View key={setIndex} style={styles.colorSet}>
                    {/* First Color */}
                    {color1 && (
                      <TouchableOpacity
                        onPress={() => {
                          if (mode === "ownership") {
                            toggleOwnership(colorIndex1);
                          } else if (mode === "home") {
                            setHomeFavorite(colorIndex1);
                          } else if (mode === "away") {
                            setAwayFavorite(colorIndex1);
                          }
                        }}
                        style={[
                          styles.colorSquare,
                          isColor1Owned &&
                            mode === "ownership" &&
                            styles.colorOwned,
                          favoriteHomeColor === colorIndex1 &&
                            mode === "home" &&
                            styles.colorFavoriteHome,
                          favoriteAwayColor === colorIndex1 &&
                            mode === "away" &&
                            styles.colorFavoriteAway,
                        ]}
                      >
                        {color1.isGradient ? (
                          <LinearGradient
                            colors={color1.colors}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            locations={[0, 1]}
                            style={styles.colorGradient}
                          />
                        ) : (
                          <View
                            style={[
                              styles.colorGradient,
                              { backgroundColor: color1.colors[0] },
                            ]}
                          />
                        )}
                        <View style={styles.colorNameContainer}>
                          <Text style={styles.colorName}>{color1.name}</Text>
                        </View>
                        {isColor1Owned && mode === "ownership" && (
                          <View style={styles.ownedIndicator}>
                            <View style={styles.checkmarkCircle}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          </View>
                        )}
                        {favoriteHomeColor === colorIndex1 && (
                          <View style={styles.favoriteIndicatorHome}>
                            <Text style={styles.favoriteIcon}>⭐</Text>
                            <Text style={styles.favoriteText}>HOME</Text>
                          </View>
                        )}
                        {favoriteAwayColor === colorIndex1 && (
                          <View style={styles.favoriteIndicatorAway}>
                            <Text style={styles.favoriteIcon}>⭐</Text>
                            <Text style={styles.favoriteText}>AWAY</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Second Color */}
                    {color2 && (
                      <TouchableOpacity
                        onPress={() => {
                          if (mode === "ownership") {
                            toggleOwnership(colorIndex2);
                          } else if (mode === "home") {
                            setHomeFavorite(colorIndex2);
                          } else if (mode === "away") {
                            setAwayFavorite(colorIndex2);
                          }
                        }}
                        style={[
                          styles.colorSquare,
                          isColor2Owned &&
                            mode === "ownership" &&
                            styles.colorOwned,
                          favoriteHomeColor === colorIndex2 &&
                            mode === "home" &&
                            styles.colorFavoriteHome,
                          favoriteAwayColor === colorIndex2 &&
                            mode === "away" &&
                            styles.colorFavoriteAway,
                        ]}
                      >
                        {color2.isGradient ? (
                          <LinearGradient
                            colors={color2.colors}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            locations={[0, 1]}
                            style={styles.colorGradient}
                          />
                        ) : (
                          <View
                            style={[
                              styles.colorGradient,
                              { backgroundColor: color2.colors[0] },
                            ]}
                          />
                        )}
                        <View style={styles.colorNameContainer}>
                          <Text style={styles.colorName}>{color2.name}</Text>
                        </View>
                        {isColor2Owned && mode === "ownership" && (
                          <View style={styles.ownedIndicator}>
                            <View style={styles.checkmarkCircle}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          </View>
                        )}
                        {favoriteHomeColor === colorIndex2 && (
                          <View style={styles.favoriteIndicatorHome}>
                            <Text style={styles.favoriteIcon}>⭐</Text>
                            <Text style={styles.favoriteText}>HOME</Text>
                          </View>
                        )}
                        {favoriteAwayColor === colorIndex2 && (
                          <View style={styles.favoriteIndicatorAway}>
                            <Text style={styles.favoriteIcon}>⭐</Text>
                            <Text style={styles.favoriteText}>AWAY</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
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
  modeButtonWrapper: {
    flex: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  modeButtonGradientBackground: {
    borderRadius: 6,
    padding: 1,
  },
  modeButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
  scrollView: {
    flex: 1,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingTop: 15,
    paddingBottom: 20,
    gap: 12,
    width: "100%",
  },
  colorSet: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 8,
    gap: 8,
    width: "31%",
  },
  colorSquare: {
    width: "50%",
    height: 140,
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
