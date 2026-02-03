/**
 * Popdarts Color Palette
 * Each color can be solid or gradient
 * - Solid colors have only 'colors' array with one value
 * - Gradient colors have 'colors' array with two values [primary, secondary]
 */

export const POPDARTS_COLORS = [
  // Black & Red Set (Solid Colors)
  { name: "Black", colors: ["#2A2A2A"], isGradient: false },
  { name: "Red", colors: ["#CF2740"], isGradient: false },

  // Grey & Pink Set
  { name: "Grey", colors: ["#494949", "#D2D0D0"], isGradient: true },
  { name: "Pink", colors: ["#FFAAD8", "#D2D0D0"], isGradient: true },

  // FRDi Set (Nick is black/blue, Cakes is yellow/black)
  { name: "FRDI Nick", colors: ["#225879", "#020201"], isGradient: true },
  { name: "FRDI Cakes", colors: ["#E7D13E", "#020201"], isGradient: true },

  // Party Set
  {
    name: "Party Chocolate",
    colors: ["#443326ff", "#050505ff"],
    isGradient: true,
  },
  { name: "Party Vanilla", colors: ["#FFFFFF", "#F3E5AB"], isGradient: true },

  // Fire & Ice Set
  { name: "Fire", colors: ["#F04B25", "#CCC029"], isGradient: true },
  { name: "Ice", colors: ["#282F85", "#BBC8D6"], isGradient: true },

  // Rizzle Set
  { name: "Rizzle Pink", colors: ["#FE509D", "#52DFFB"], isGradient: true },
  { name: "Rizzle Black", colors: ["#2C2C2C", "#52DFFB"], isGradient: true },

  // Bleen & Yurple Set
  { name: "Bleen", colors: ["#0000FF", "#67f00b"], isGradient: true },
  { name: "Yurple", colors: ["#800080", "#f7f307"], isGradient: true },

  // USA Set
  { name: "USA Stars", colors: ["#FFFFFF", "#0000FF"], isGradient: true },
  { name: "USA Stripes", colors: ["#FFFFFF", "#FF0000"], isGradient: true },

  // Retro Set
  { name: "Retro Teal", colors: ["#FFFFFF", "#4ACCC7"], isGradient: true },
  { name: "Retro Purple", colors: ["#FFFFFF", "#4605B0"], isGradient: true },

  // Gold & Silver Set
  { name: "Gold", colors: ["#FFD700"], isGradient: false },
  { name: "Silver", colors: ["#C0C0C0"], isGradient: false },

  // Blue & Green Set
  { name: "Blue", colors: ["#429FC0"], isGradient: false },
  { name: "Green", colors: ["#68B843"], isGradient: false },

  // Purple & Yellow Set
  { name: "Purple", colors: ["#745EAE"], isGradient: false },
  { name: "Yellow", colors: ["#D6BE54"], isGradient: false },

  // Explore Set
  { name: "Explore Ocean", colors: ["#F4AFA4", "#3D5672"], isGradient: true },
  { name: "Explore Forest", colors: ["#ADC48E", "#3D5672"], isGradient: true },

  // Drizzle Set
  { name: "Drizzle Dawn", colors: ["#44B6DD", "#081540"], isGradient: true },
  { name: "Drizzle Dusk", colors: ["#B5C600", "#081540"], isGradient: true },

  // Neon Set
  { name: "Neon Green", colors: ["#2091C1", "#DB6E0F"], isGradient: true },
  { name: "Neon Pink", colors: ["#F0067E", "#46C924"], isGradient: true },

  // Halloween Set
  {
    name: "Halloween Pumpkin",
    colors: ["#CD680C", "#4A0A96"],
    isGradient: true,
  },
  { name: "Halloween Ghost", colors: ["#AAD225", "#4A0A96"], isGradient: true },
];

/**
 * Helper function to get a color object by name
 */
export const getColorByName = (name) => {
  return POPDARTS_COLORS.find((color) => color.name === name);
};

/**
 * Helper function to get the primary color (first color in array)
 */
export const getPrimaryColor = (colorObj) => {
  return colorObj.colors[0];
};

/**
 * Helper function to get the secondary color (second color in array, if exists)
 */
export const getSecondaryColor = (colorObj) => {
  return colorObj.colors[1] || null;
};
