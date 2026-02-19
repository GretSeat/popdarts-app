import React from "react";
import { View, StyleSheet } from "react-native";

/**
 * PartyVanillaSprinkles - Renders fixed sprinkles for Party Vanilla color
 * Sprinkles are defined in the color object and positioned with percentages
 * @param {object} colorObj - Color object that may contain sprinkles array
 * @param {number} width - Width of the container (for reference)
 * @param {number} height - Height of the container (for reference)
 * @param {boolean} isCircular - If true, applies circular border-radius (e.g., for coin flip)
 * @param {number} scale - Scale factor for sprinkle density (0.5 = 50% size/density, default 1 = 100%)
 */
export const PartyVanillaSprinkles = ({ colorObj, width = 120, height = 120, isCircular = false, scale = 1 }) => {
  // Only render if this is Party Vanilla and it has sprinkles defined
  if (!colorObj?.sprinkles || colorObj.name !== "Party Vanilla") {
    return null;
  }

  /**
   * Convert percentage string to pixel value
   */
  const percentToPixels = (percentStr, baseValue) => {
    if (typeof percentStr === "string" && percentStr.includes("%")) {
      const percent = parseFloat(percentStr) / 100;
      return baseValue * percent;
    }
    return parseFloat(percentStr);
  };

  return (
    <View
      style={[
        styles.sprinklesContainer,
        {
          width,
          height,
          borderRadius: isCircular ? width / 2 : 0,
        },
      ]}
      pointerEvents="none"
    >
      {colorObj.sprinkles.map((sprinkle, idx) => {
        const topPx = percentToPixels(sprinkle.top, height);
        const leftPx = percentToPixels(sprinkle.left, width);
        const sprinkleWidth = 12 * scale;
        const sprinkleHeight = 4 * scale;

        return (
          <View
            key={idx}
            style={[
              styles.sprinkle,
              {
                backgroundColor: sprinkle.color,
                width: sprinkleWidth,
                height: sprinkleHeight,
                borderRadius: 2 * scale,
                top: topPx,
                left: leftPx,
                transform: [{ rotate: sprinkle.rotate }],
              },
            ]}
          />
        );
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
