/**
 * Color Rendering Utilities
 * Handles rendering different color patterns: gradients, gradient stops, and stripes
 */

import { getGradientLocations } from "../constants/colors";

/**
 * Get LinearGradient props for a color object
 * Handles: standard gradients, gradient stops, and calculates stripe properties
 *
 * @param {object} colorObj - Color object from POPDARTS_COLORS
 * @returns {object} Object with gradient properties: { colors, locations, isStripe, stripeWidth, start, end }
 * @example
 * const gradientProps = getGradientProps(colorObj);
 * <LinearGradient {...gradientProps} style={styles}>
 */
export const getGradientProps = (colorObj) => {
  if (!colorObj) {
    return {
      colors: ["#000000", "#000000"],
      locations: [0, 1],
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      isStripe: false,
    };
  }

  // Handle Stripe Pattern
  if (colorObj.pattern === "stripes") {
    const { colors: stripeColors, locations: stripeLocs } = calculateStripeLocations(
      colorObj.colors,
      colorObj.stripeWidth || 15,
      colorObj.stripeFade || 0 // 0 = sharp edges, higher = softer transitions
    );
    return {
      colors: stripeColors,
      locations: stripeLocs,
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      isStripe: true,
      stripeWidth: colorObj.stripeWidth || 15,
    };
  }

  // Handle Gradient with Custom Stops
  if (colorObj.gradientStops) {
    return {
      colors: colorObj.colors,
      locations: getGradientLocations(colorObj.gradientStops),
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      isStripe: false,
    };
  }

  // Default: Standard Gradient (distribute colors evenly)
  const numColors = colorObj.colors.length;
  const locations =
    numColors === 1
      ? [0, 1]
      : Array.from({ length: numColors }, (_, i) => i / (numColors - 1));

  return {
    colors: colorObj.colors,
    locations,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
    isStripe: false,
  };
};

/**
 * Calculate expanded colors and locations for repeating stripe pattern
 * Creates visual stripes by repeating colors with optional soft edges
 *
 * @param {array} colors - Array of colors to use in stripes
 * @param {number} stripeWidth - Width percentage of each stripe (e.g., 15 = 15%)
 * @param {number} stripeFade - Fade width for soft edges (0 = sharp, higher = softer)
 * @returns {object} { colors: expandedArray, locations: placementArray }
 * @example
 * // 2 colors with 25% width and 5% fade = softer stripe transitions
 * calculateStripeLocations(["#FF0000", "#FFFFFF"], 25, 5)
 */
export const calculateStripeLocations = (colors, stripeWidth, stripeFade = 0) => {
  if (!colors || colors.length === 0) {
    return { colors: ["#000000", "#000000"], locations: [0, 1] };
  }

  const stripePercent = stripeWidth / 100;
  const fadePercent = stripeFade / 100;
  const expandedColors = [];
  const locations = [];

  // Calculate how many complete stripe patterns fit in the gradient
  const patternsPerGradient = Math.ceil(1 / (stripeWidth / 100 * colors.length));
  let currentPosition = 0;

  // Repeat the stripe pattern across the gradient
  for (let patternIdx = 0; patternIdx < patternsPerGradient; patternIdx++) {
    for (let colorIdx = 0; colorIdx < colors.length; colorIdx++) {
      const stripeStart = currentPosition;
      const stripeEnd = currentPosition + stripePercent;
      const nextColorIdx = (colorIdx + 1) % colors.length;
      const nextColor = colors[nextColorIdx];

      if (stripeFade === 0) {
        // Sharp edges: hard color boundaries
        expandedColors.push(colors[colorIdx]);
        locations.push(stripeStart);

        if (stripeEnd < 1) {
          expandedColors.push(colors[colorIdx]);
          locations.push(Math.min(stripeEnd, 1));
        }
      } else {
        // Soft edges: create gradient transition zones
        const fadeStart = Math.max(0, stripeStart - fadePercent / 2);
        const fadeEnd = Math.min(1, stripeEnd + fadePercent / 2);

        // Fade in to this color
        if (fadeStart > 0) {
          expandedColors.push(nextColor);
          locations.push(fadeStart);
        }

        // Solid color in middle
        expandedColors.push(colors[colorIdx]);
        locations.push(Math.min(stripeStart + fadePercent / 4, 1));

        // Hold solid color
        expandedColors.push(colors[colorIdx]);
        locations.push(Math.max(fadeStart, Math.min(stripeEnd - fadePercent / 4, 1)));

        // Fade out to next color
        if (fadeEnd < 1) {
          expandedColors.push(nextColor);
          locations.push(Math.min(fadeEnd, 1));
        }
      }

      currentPosition = stripeEnd;

      // Stop if we've filled the gradient
      if (currentPosition >= 1) {
        break;
      }
    }

    if (currentPosition >= 1) break;
  }

  // Ensure we end at exactly 1.0
  if (locations[locations.length - 1] !== 1) {
    expandedColors.push(expandedColors[expandedColors.length - 1]);
    locations.push(1);
  }

  return { colors: expandedColors, locations };
};

/**
 * Check if a color object uses a pattern (stripes, etc)
 *
 * @param {object} colorObj - Color object from POPDARTS_COLORS
 * @returns {boolean} True if color uses a pattern
 */
export const hasPattern = (colorObj) => {
  return colorObj && colorObj.pattern !== undefined && colorObj.pattern !== null;
};

/**
 * Check if a color object has custom gradient stops
 *
 * @param {object} colorObj - Color object from POPDARTS_COLORS
 * @returns {boolean} True if color has gradientStops array
 */
export const hasGradientStops = (colorObj) => {
  return colorObj && Array.isArray(colorObj.gradientStops);
};

/**
 * Get a user-friendly description of the color rendering
 * Useful for tooltips or info displays
 *
 * @param {object} colorObj - Color object from POPDARTS_COLORS
 * @returns {string} Description of how the color is rendered
 */
export const getColorDescription = (colorObj) => {
  if (!colorObj) return "Unknown color";

  if (colorObj.pattern === "stripes") {
    return `${colorObj.colors.length}-color stripe pattern (${colorObj.stripeWidth}% width)`;
  }

  if (colorObj.gradientStops) {
    return colorObj.description || `Custom gradient with ${colorObj.colors.length} colors`;
  }

  if (colorObj.colors.length === 1) {
    return "Solid color";
  }

  return `${colorObj.colors.length}-color gradient`;
};
