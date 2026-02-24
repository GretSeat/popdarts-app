import React from "react";
import { View, StyleSheet } from "react-native";

/**
 * PartyVanillaSprinkles - Renders sprinkles for colors that have them
 * Sprinkles are defined in the color object and positioned with percentages
 * @param {object} colorObj - Color object that may contain sprinkles array
 * @param {number} width - Width of the container (for reference)
 * @param {number} height - Height of the container (for reference)
 * @param {boolean} isCircular - If true, applies circular border-radius (e.g., for coin flip)
 * @param {number} scale - Scale factor for sprinkle density (0.5 = 50% size/density, default 1 = 100%)
 */
export const PartyVanillaSprinkles = ({
  colorObj,
  width = 120,
  height = 120,
  isCircular = false,
  scale = 1,
}) => {
  // Only render if this color has sprinkles defined
  if (!colorObj) return null;
  if (!colorObj.sprinkles) return null;
  if (!Array.isArray(colorObj.sprinkles)) return null;
  if (colorObj.sprinkles.length === 0) return null;

  /**
   * Convert percentage string to pixel value
   */
  const percentToPixels = (percentStr, baseValue) => {
    if (typeof percentStr === "string" && percentStr.includes("%")) {
      const percent = parseFloat(percentStr) / 100;
      return baseValue * percent;
    }
    return parseFloat(percentStr) || 0;
  };

  return (
    <View
      style={[
        styles.sprinklesContainer,
        {
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          borderRadius: isCircular ? width / 2 : 0,
        },
      ]}
      pointerEvents="none"
    >
      {colorObj.sprinkles.map((sprinkle, idx) => {
        // Validate sprinkle data
        if (!sprinkle) return null;
        if (!sprinkle.color) return null;
        if (sprinkle.top === undefined || sprinkle.top === null) return null;
        if (sprinkle.left === undefined || sprinkle.left === null) return null;

        try {
          const topPx = percentToPixels(sprinkle.top, height);
          const leftPx = percentToPixels(sprinkle.left, width);
          const sprinkleWidth = Math.max(12 * scale, 0.5);
          const sprinkleHeight = Math.max(4 * scale, 0.5);

          return (
            <View
              key={`sprinkle-${idx}`}
              style={[
                styles.sprinkle,
                {
                  backgroundColor: sprinkle.color,
                  width: sprinkleWidth,
                  height: sprinkleHeight,
                  borderRadius: Math.max(2 * scale, 0.5),
                  top: topPx,
                  left: leftPx,
                  transform: [{ rotate: sprinkle.rotate || "0deg" }],
                },
              ]}
            />
          );
        } catch (error) {
          // Silently fail for individual sprinkles
          return null;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  sprinklesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  sprinkle: {
    position: "absolute",
    width: 12,
    height: 4,
    borderRadius: 2,
  },
});

export default PartyVanillaSprinkles;
