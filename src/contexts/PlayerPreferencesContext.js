import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { POPDARTS_COLORS } from "../constants/colors";

/**
 * PlayerPreferencesContext - Manages player's color, jersey, and gameplay preferences
 * - Owned colors (which darts they own) - NOW STORED BY COLOR NAME, not index
 * - Favorite home color (auto-selected when Player 1) - NOW STORED BY COLOR NAME
 * - Favorite away color (auto-selected when Player 2) - NOW STORED BY COLOR NAME
 * - Owned jerseys (which jerseys they own)
 * - Favorite jersey (displayed on profile)
 * - Advanced closest tracking (3-tap dart entry for competitive)
 * - Show victory reminder (points to win indicator in casual scoring)
 */
const PlayerPreferencesContext = createContext();

export const usePlayerPreferences = () => {
  const context = useContext(PlayerPreferencesContext);
  if (!context) {
    throw new Error(
      "usePlayerPreferences must be used within PlayerPreferencesProvider",
    );
  }
  return context;
};

export const PlayerPreferencesProvider = ({ children }) => {
  const [ownedColors, setOwnedColors] = useState([]); // Array of color names (e.g., ["Pink", "Gray"])
  const [favoriteHomeColor, setFavoriteHomeColor] = useState(null); // Color name
  const [favoriteAwayColor, setFavoriteAwayColor] = useState(null); // Color name
  const [ownedJerseys, setOwnedJerseys] = useState([]); // Array of jersey IDs
  const [favoriteJersey, setFavoriteJersey] = useState(null); // Jersey ID
  const [advancedClosestTracking, setAdvancedClosestTracking] = useState(false); // Competitive setting
  const [showVictoryReminder, setShowVictoryReminder] = useState(true); // Show victory hint in casual scoring
  const [loading, setLoading] = useState(true);

  // Storage keys
  const STORAGE_KEYS = {
    OWNED_COLORS: "@popdarts_owned_colors",
    FAVORITE_HOME: "@popdarts_favorite_home",
    FAVORITE_AWAY: "@popdarts_favorite_away",
    OWNED_JERSEYS: "@popdarts_owned_jerseys",
    FAVORITE_JERSEY: "@popdarts_favorite_jersey",
    ADVANCED_CLOSEST_TRACKING: "@popdarts_advanced_closest_tracking",
    SHOW_VICTORY_REMINDER: "@popdarts_show_victory_reminder",
  };

  /**
   * Load preferences from AsyncStorage on mount
   */
  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * Migrate legacy index-based color data to name-based
   * @param {array} indexData - Array of color indices (old format)
   * @returns {array} Array of color names (new format)
   */
  const migrateColorIndexesToNames = (indexData) => {
    if (!Array.isArray(indexData)) return [];
    return indexData
      .map((index) => {
        if (typeof index === "string") return index; // Already migrated
        if (typeof index === "number" && POPDARTS_COLORS[index]) {
          return POPDARTS_COLORS[index].name;
        }
        return null;
      })
      .filter((name) => name !== null);
  };

  /**
   * Load all preferences from storage
   */
  const loadPreferences = async () => {
    try {
      const [
        owned,
        home,
        away,
        jerseys,
        jersey,
        advancedTracking,
        victoryReminder,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.OWNED_COLORS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_HOME),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_AWAY),
        AsyncStorage.getItem(STORAGE_KEYS.OWNED_JERSEYS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_JERSEY),
        AsyncStorage.getItem(STORAGE_KEYS.ADVANCED_CLOSEST_TRACKING),
        AsyncStorage.getItem(STORAGE_KEYS.SHOW_VICTORY_REMINDER),
      ]);

      // Migrate owned colors from indices to names
      if (owned) {
        const parsedOwned = JSON.parse(owned);
        const migratedOwned = migrateColorIndexesToNames(parsedOwned);
        setOwnedColors(migratedOwned);
        // Save migrated data back
        if (migratedOwned.length > 0) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.OWNED_COLORS,
            JSON.stringify(migratedOwned),
          );
        }
      }

      // Migrate favorites from indices to names
      if (home) {
        const parsedHome = JSON.parse(home);
        const migratedHome =
          typeof parsedHome === "number"
            ? POPDARTS_COLORS[parsedHome]?.name || null
            : parsedHome;
        setFavoriteHomeColor(migratedHome);
        if (migratedHome && typeof parsedHome === "number") {
          await AsyncStorage.setItem(
            STORAGE_KEYS.FAVORITE_HOME,
            JSON.stringify(migratedHome),
          );
        }
      }

      if (away) {
        const parsedAway = JSON.parse(away);
        const migratedAway =
          typeof parsedAway === "number"
            ? POPDARTS_COLORS[parsedAway]?.name || null
            : parsedAway;
        setFavoriteAwayColor(migratedAway);
        if (migratedAway && typeof parsedAway === "number") {
          await AsyncStorage.setItem(
            STORAGE_KEYS.FAVORITE_AWAY,
            JSON.stringify(migratedAway),
          );
        }
      }

      if (jerseys) setOwnedJerseys(JSON.parse(jerseys));
      if (jersey) setFavoriteJersey(JSON.parse(jersey));
      if (advancedTracking)
        setAdvancedClosestTracking(JSON.parse(advancedTracking));
      if (victoryReminder) setShowVictoryReminder(JSON.parse(victoryReminder));
    } catch (error) {
      console.error("Error loading player preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save owned colors to storage
   * @param {array} colors - Array of color names (e.g., ["Pink", "Gray"])
   */
  const saveOwnedColors = async (colors) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OWNED_COLORS,
        JSON.stringify(colors),
      );
      setOwnedColors(colors);
    } catch (error) {
      console.error("Error saving owned colors:", error);
    }
  };

  /**
   * Save favorite home color to storage
   * @param {string} colorName - Color name (e.g., "Pink")
   */
  const saveFavoriteHomeColor = async (colorName) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITE_HOME,
        JSON.stringify(colorName),
      );
      setFavoriteHomeColor(colorName);
    } catch (error) {
      console.error("Error saving favorite home color:", error);
    }
  };

  /**
   * Save favorite away color to storage
   * @param {string} colorName - Color name (e.g., "Gray")
   */
  const saveFavoriteAwayColor = async (colorName) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITE_AWAY,
        JSON.stringify(colorName),
      );
      setFavoriteAwayColor(colorName);
    } catch (error) {
      console.error("Error saving favorite away color:", error);
    }
  };

  /**
   * Save owned jerseys to storage
   */
  const saveOwnedJerseys = async (jerseys) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OWNED_JERSEYS,
        JSON.stringify(jerseys),
      );
      setOwnedJerseys(jerseys);
    } catch (error) {
      console.error("Error saving owned jerseys:", error);
    }
  };

  /**
   * Save favorite jersey to storage
   */
  const saveFavoriteJersey = async (jerseyId) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITE_JERSEY,
        JSON.stringify(jerseyId),
      );
      setFavoriteJersey(jerseyId);
    } catch (error) {
      console.error("Error saving favorite jersey:", error);
    }
  };

  /**
   * Save advanced closest tracking preference to storage
   */
  const saveAdvancedClosestTracking = async (value) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ADVANCED_CLOSEST_TRACKING,
        JSON.stringify(value),
      );
      setAdvancedClosestTracking(value);
    } catch (error) {
      console.error(
        "Error saving advanced closest tracking preference:",
        error,
      );
    }
  };

  /**
   * Save show victory reminder preference to storage
   */
  const saveShowVictoryReminder = async (value) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SHOW_VICTORY_REMINDER,
        JSON.stringify(value),
      );
      setShowVictoryReminder(value);
    } catch (error) {
      console.error("Error saving show victory reminder preference:", error);
    }
  };

  /**
   * Clear all preferences (useful for sign out)
   */
  const clearPreferences = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.OWNED_COLORS,
        STORAGE_KEYS.FAVORITE_HOME,
        STORAGE_KEYS.FAVORITE_AWAY,
        STORAGE_KEYS.OWNED_JERSEYS,
        STORAGE_KEYS.FAVORITE_JERSEY,
        STORAGE_KEYS.ADVANCED_CLOSEST_TRACKING,
        STORAGE_KEYS.SHOW_VICTORY_REMINDER,
      ]);
      setOwnedColors([]);
      setFavoriteHomeColor(null);
      setFavoriteAwayColor(null);
      setOwnedJerseys([]);
      setFavoriteJersey(null);
      setAdvancedClosestTracking(false);
      setShowVictoryReminder(true);
    } catch (error) {
      console.error("Error clearing preferences:", error);
    }
  };

  const value = {
    ownedColors,
    setOwnedColors: saveOwnedColors,
    favoriteHomeColor,
    setFavoriteHomeColor: saveFavoriteHomeColor,
    favoriteAwayColor,
    setFavoriteAwayColor: saveFavoriteAwayColor,
    ownedJerseys,
    setOwnedJerseys: saveOwnedJerseys,
    favoriteJersey,
    setFavoriteJersey: saveFavoriteJersey,
    advancedClosestTracking,
    setAdvancedClosestTracking: saveAdvancedClosestTracking,
    showVictoryReminder,
    setShowVictoryReminder: saveShowVictoryReminder,
    clearPreferences,
    loading,
  };

  return (
    <PlayerPreferencesContext.Provider value={value}>
      {children}
    </PlayerPreferencesContext.Provider>
  );
};
