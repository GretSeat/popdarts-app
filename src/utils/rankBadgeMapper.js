/**
 * Rank Badge Mapper - Maps rank names to badge image paths
 * Provides utilities for displaying the correct rank badge throughout the game
 */

// Map of rank names to badge image paths
const RANK_BADGE_MAP = {
  Rookie: require("../../assets/rankBadges/RookieBadge.png"),
  "Bronze 1": require("../../assets/rankBadges/Bronze1Badge.png"),
  "Bronze 2": require("../../assets/rankBadges/Bronze2Badge.png"),
  "Bronze 3": require("../../assets/rankBadges/Bronze3Badge.png"),
  "Silver 1": require("../../assets/rankBadges/Silver1Badge.png"),
  "Silver 2": require("../../assets/rankBadges/Silver2Badge.png"),
  "Silver 3": require("../../assets/rankBadges/Silver3Badge.png"),
  "Gold 1": require("../../assets/rankBadges/Gold1Badge.png"),
  "Gold 2": require("../../assets/rankBadges/Gold2Badge.png"),
  "Gold 3": require("../../assets/rankBadges/Gold3Badge.png"),
  "Platinum 1": require("../../assets/rankBadges/Platinum1Badge.png"),
  "Platinum 2": require("../../assets/rankBadges/Platinum2Badge.png"),
  "Platinum 3": require("../../assets/rankBadges/Platinum3Badge.png"),
  "Diamond 1": require("../../assets/rankBadges/Diamond1Badge.png"),
  "Diamond 2": require("../../assets/rankBadges/Diamond2Badge.png"),
  "Diamond 3": require("../../assets/rankBadges/Diamond3Badge.png"),
  "Pro 1": require("../../assets/rankBadges/Pro1Badge.png"),
  "Pro 2": require("../../assets/rankBadges/Pro2Badge.png"),
  "Pro 3": require("../../assets/rankBadges/Pro3Badge.png"),
  Elite: require("../../assets/rankBadges/Elite1Badge.png"),
  // Handle common alternate spellings/formats
  "Gold I": require("../../assets/rankBadges/Gold1Badge.png"),
  "Platinum III": require("../../assets/rankBadges/Platinum3Badge.png"),
  "Diamond II": require("../../assets/rankBadges/Diamond2Badge.png"),
  "Pro II": require("../../assets/rankBadges/Pro2Badge.png"),
};

/**
 * Get the badge image for a given rank name
 * @param {string} rankName - The rank name (e.g., "Pro 2", "Diamond II", "Gold 1")
 * @returns {number} - The require() image reference for the badge, or null if not found
 */
export const getRankBadge = (rankName) => {
  if (!rankName) return null;
  return RANK_BADGE_MAP[rankName] || null;
};

/**
 * Normalize rank name to standard format for consistent mapping
 * Converts "Pro II" to "Pro 2", "Gold I" to "Gold 1", etc.
 * @param {string} rankName - The rank name to normalize
 * @returns {string} - Normalized rank name
 */
export const normalizeRankName = (rankName) => {
  if (!rankName) return rankName;

  const normalizations = {
    I: "1",
    II: "2",
    III: "3",
  };

  let normalized = rankName;
  Object.entries(normalizations).forEach(([roman, digit]) => {
    normalized = normalized.replace(new RegExp(`\\s${roman}$`), ` ${digit}`);
  });

  return normalized;
};

/**
 * Check if a rank is an Elite rank
 * @param {string} rankName - The rank name to check
 * @returns {boolean} - True if the rank is Elite or top tier
 */
export const isEliteRank = (rankName) => {
  if (!rankName) return false;
  return rankName.toLowerCase().includes("elite");
};

export default {
  getRankBadge,
  normalizeRankName,
  isEliteRank,
  RANK_BADGE_MAP,
};
