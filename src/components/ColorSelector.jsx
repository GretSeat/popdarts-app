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
import { PartyVanillaSprinkles } from "./PartyVanillaSprinkles";
import { getGradientProps } from "../utils/colorRenderingUtils";

/**
 * Universal Color Selector Component
 * Single reusable color picker for all parts of the app
 *
 * @param {boolean} visible - Modal visibility state
 * @param {function} onDismiss - Callback to close modal
 * @param {function} onSelectColor - Callback when color is selected, receives colorObject and index
 * @param {array} ownedColors - Optional array of owned color NAMES (e.g., ["Pink", "Gray"]) - shows green border
 * @param {array} takenColors - Optional array of taken color NAMES (shows taken overlay)
 * @param {string} title - Modal title (default: "Select a Color")
 * @param {string} selectedName - Currently selected color name (shows checkmark)
 */
export default function ColorSelector({
  visible,
  onDismiss,
  onSelectColor,
  ownedColors = [],
  takenColors = [],
  title = "Select a Color",
  selectedIndex = null,
  selectedName = null,
}) {
  const [colorSquareDimensions, setColorSquareDimensions] = useState({
    width: 120,
    height: 140,
  });
  const [localSelectedName, setLocalSelectedName] = useState(selectedName);

  const handleSelectColor = (colorName) => {
    setLocalSelectedName(colorName);
  };

  const handleConfirm = () => {
    if (localSelectedName !== null) {
      const selectedColor = POPDARTS_COLORS.find(
        (c) => c.name === localSelectedName,
      );
      const selectedIndex = POPDARTS_COLORS.indexOf(selectedColor);
      onSelectColor(selectedColor, selectedIndex);
      onDismiss();
    }
  };

  // Sort colors: owned colors first, then the rest
  const sortedColors = [
    ...POPDARTS_COLORS.filter((c) => ownedColors.includes(c.name)),
    ...POPDARTS_COLORS.filter((c) => !ownedColors.includes(c.name)),
  ];

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
              {title}
            </Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          {/* Color Grid */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.colorGrid}>
              {Array.from({
                length: Math.ceil(sortedColors.length / 2),
              }).map((_, setIndex) => {
                const colorIndex1 = setIndex * 2;
                const colorIndex2 = setIndex * 2 + 1;
                const color1 = sortedColors[colorIndex1];
                const color2 = sortedColors[colorIndex2];

                return (
                  <View key={setIndex} style={styles.colorSet}>
                    {/* First Color */}
                    {color1 && (
                      <TouchableOpacity
                        disabled={takenColors.includes(color1.name)}
                        onPress={() => handleSelectColor(color1.name)}
                        onLayout={(event) => {
                          const { width, height } = event.nativeEvent.layout;
                          setColorSquareDimensions({ width, height });
                        }}
                        style={[
                          styles.colorSquare,
                          ownedColors.includes(color1.name) &&
                            styles.colorOwned,
                          localSelectedName === color1.name &&
                            styles.colorSelected,
                          takenColors.includes(color1.name) &&
                            styles.colorTaken,
                        ]}
                      >
                        {color1.isGradient ? (
                          <LinearGradient
                            {...getGradientProps(color1)}
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
                        <PartyVanillaSprinkles
                          colorObj={color1}
                          width={colorSquareDimensions.width}
                          height={colorSquareDimensions.height}
                          scale={0.7}
                        />
                        <View style={styles.colorNameContainer}>
                          <Text style={styles.colorName}>{color1.name}</Text>
                        </View>
                        {ownedColors.includes(color1.name) && (
                          <View style={styles.ownedIndicator}>
                            <View style={styles.checkmarkCircle}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          </View>
                        )}
                        {localSelectedName === color1.name && (
                          <View style={styles.selectedIndicator}>
                            <View style={styles.checkmarkCircle}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          </View>
                        )}
                        {takenColors.includes(color1.name) && (
                          <View style={styles.takenIndicator}>
                            <View style={styles.takenOverlay}>
                              <Text style={styles.takenText}>TAKEN</Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Second Color */}
                    {color2 && (
                      <TouchableOpacity
                        disabled={takenColors.includes(color2.name)}
                        onPress={() => handleSelectColor(color2.name)}
                        onLayout={(event) => {
                          const { width, height } = event.nativeEvent.layout;
                          setColorSquareDimensions({ width, height });
                        }}
                        style={[
                          styles.colorSquare,
                          ownedColors.includes(color2.name) &&
                            styles.colorOwned,
                          localSelectedName === color2.name &&
                            styles.colorSelected,
                          takenColors.includes(color2.name) &&
                            styles.colorTaken,
                        ]}
                      >
                        {color2.isGradient ? (
                          <LinearGradient
                            {...getGradientProps(color2)}
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
                        <PartyVanillaSprinkles
                          colorObj={color2}
                          width={colorSquareDimensions.width}
                          height={colorSquareDimensions.height}
                          scale={0.7}
                        />
                        <View style={styles.colorNameContainer}>
                          <Text style={styles.colorName}>{color2.name}</Text>
                        </View>
                        {ownedColors.includes(color2.name) && (
                          <View style={styles.ownedIndicator}>
                            <View style={styles.checkmarkCircle}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          </View>
                        )}
                        {localSelectedName === color2.name && (
                          <View style={styles.selectedIndicator}>
                            <View style={styles.checkmarkCircle}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          </View>
                        )}
                        {takenColors.includes(color2.name) && (
                          <View style={styles.takenIndicator}>
                            <View style={styles.takenOverlay}>
                              <Text style={styles.takenText}>TAKEN</Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.buttonContainer}>
            <Button mode="outlined" onPress={onDismiss} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={localSelectedName === null}
              style={styles.button}
            >
              Select
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
    backgroundColor: "#f5f5f5",
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  colorGrid: {
    gap: 12,
  },
  colorSet: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  colorSquare: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  colorOwned: {
    borderColor: "#4CAF50",
    borderWidth: 3,
  },
  colorSelected: {
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  colorTaken: {
    opacity: 0.5,
    borderColor: "#999",
  },
  colorGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  colorNameContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  colorName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  ownedIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#4CAF50",
    borderRadius: 40,
    padding: 4,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#007AFF",
    borderRadius: 40,
    padding: 4,
  },
  takenIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  takenOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  takenText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    flex: 1,
  },
});
