/**
 * Popdarts Color Palette
 * Each color can be solid or gradient
 * - Solid colors have only 'colors' array with one value
 * - Gradient colors have 'colors' array with two values [primary, secondary]
 */

export const POPDARTS_COLORS = [
  // Grey & Pink Set
  { name: "Grey", colors: ["#494949", "#D2D0D0"], isGradient: true },
  { name: "Pink", colors: ["#FFAAD8", "#D2D0D0"], isGradient: true },

  // FRDi Set (Nick is black/blue, Cakes is yellow/black)
  { name: "FRDI Nick", colors: ["#225879", "#020201"], isGradient: true },
  { name: "FRDI Cakes", colors: ["#E7D13E", "#020201"], isGradient: true },

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

  // Blue & Green Set
  { name: "Blue", colors: ["#429FC0"], isGradient: false },
  { name: "Green", colors: ["#68B843"], isGradient: false },

  // Purple & Yellow Set
  { name: "Purple", colors: ["#745EAE"], isGradient: false },
  { name: "Yellow", colors: ["#D6BE54"], isGradient: false },

  // Black & Red Set (Solid Colors)
  { name: "Black", colors: ["#2A2A2A"], isGradient: false },
  { name: "Red", colors: ["#CF2740"], isGradient: false },

  // Pop Golf Set
  { name: "Golf Orange", colors: ["#ff7300"], isGradient: false },
  { name: "Golf White", colors: ["#FFFFFF"], isGradient: false },

  // Gold & Silver Set
  {
    name: "Gold",
    colors: ["#3a2d16", "#b08d57", "#f2d28b", "#c19a49", "#4a3a1f"],
    isGradient: true,
  },
  {
    name: "Silver",
    colors: ["#2e3136", "#9ea4ad", "#f1f3f5", "#8e949c", "#2b2f34"],
    isGradient: true,
  },

  // Party Set
  {
    name: "Party Chocolate",
    colors: ["#2b1a12", "#6b3e2e", "#a56a4a", "#5a3426", "#1e120d"],
    isGradient: true,
  },
  {
    name: "Party Vanilla",
    colors: ["#fffdf8", "#f8f3ea", "#efe7da", "#e6dccb"],
    isGradient: true,
    sprinkles: [
      { top: "20%", left: "5%", color: "#ff6b6b", rotate: "20deg" },
      { top: "60%", left: "10%", color: "#4dabf7", rotate: "75deg" },
      { top: "40%", left: "15%", color: "#ffd43b", rotate: "140deg" },
      { top: "80%", left: "20%", color: "#69db7c", rotate: "300deg" },
      { top: "30%", left: "25%", color: "#b197fc", rotate: "45deg" },
      { top: "70%", left: "30%", color: "#ff6b6b", rotate: "200deg" },
      { top: "50%", left: "35%", color: "#4dabf7", rotate: "15deg" },
      { top: "25%", left: "40%", color: "#ffd43b", rotate: "85deg" },
      { top: "75%", left: "45%", color: "#b197fc", rotate: "260deg" },
      { top: "35%", left: "50%", color: "#69db7c", rotate: "120deg" },
      { top: "65%", left: "55%", color: "#ff6b6b", rotate: "50deg" },
      { top: "45%", left: "60%", color: "#4dabf7", rotate: "100deg" },
      { top: "55%", left: "65%", color: "#ffd43b", rotate: "30deg" },
      { top: "15%", left: "70%", color: "#69db7c", rotate: "175deg" },
      { top: "70%", left: "75%", color: "#ff6b6b", rotate: "90deg" },
      { top: "40%", left: "80%", color: "#4dabf7", rotate: "45deg" },
      { top: "60%", left: "85%", color: "#ffd43b", rotate: "200deg" },
      { top: "35%", left: "90%", color: "#69db7c", rotate: "60deg" },
      { top: "75%", left: "95%", color: "#b197fc", rotate: "120deg" },
    ],
  },

  { name: "USA Blue", colors: ["#1a2981"], isGradient: false },
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
