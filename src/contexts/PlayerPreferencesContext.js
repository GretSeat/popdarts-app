import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * PlayerPreferencesContext - Manages player's color and jersey preferences
 * - Owned colors (which darts they own)
 * - Favorite home color (auto-selected when Player 1)
 * - Favorite away color (auto-selected when Player 2)
 * - Owned jerseys (which jerseys they own)
 * - Favorite jersey (displayed on profile)
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
  const [ownedColors, setOwnedColors] = useState([]); // Array of color indices
  const [favoriteHomeColor, setFavoriteHomeColor] = useState(null); // Color index
  const [favoriteAwayColor, setFavoriteAwayColor] = useState(null); // Color index
  const [ownedJerseys, setOwnedJerseys] = useState([]); // Array of jersey IDs
  const [favoriteJersey, setFavoriteJersey] = useState(null); // Jersey ID
  const [advancedClosestTracking, setAdvancedClosestTracking] = useState(false); // Competitive setting
  const [loading, setLoading] = useState(true);

  // Storage keys
  const STORAGE_KEYS = {
    OWNED_COLORS: "@popdarts_owned_colors",
    FAVORITE_HOME: "@popdarts_favorite_home",
    FAVORITE_AWAY: "@popdarts_favorite_away",
    OWNED_JERSEYS: "@popdarts_owned_jerseys",
    FAVORITE_JERSEY: "@popdarts_favorite_jersey",
    ADVANCED_CLOSEST_TRACKING: "@popdarts_advanced_closest_tracking",
  };

  /**
   * Load preferences from AsyncStorage on mount
   */
  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * Load all preferences from storage
   */
  const loadPreferences = async () => {
    try {
      const [owned, home, away, jerseys, jersey, advancedTracking] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.OWNED_COLORS),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_HOME),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_AWAY),
          AsyncStorage.getItem(STORAGE_KEYS.OWNED_JERSEYS),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_JERSEY),
          AsyncStorage.getItem(STORAGE_KEYS.ADVANCED_CLOSEST_TRACKING),
        ]);

      if (owned) setOwnedColors(JSON.parse(owned));
      if (home) setFavoriteHomeColor(JSON.parse(home));
      if (away) setFavoriteAwayColor(JSON.parse(away));
      if (jerseys) setOwnedJerseys(JSON.parse(jerseys));
      if (jersey) setFavoriteJersey(JSON.parse(jersey));
      if (advancedTracking)
        setAdvancedClosestTracking(JSON.parse(advancedTracking));
    } catch (error) {
      console.error("Error loading player preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save owned colors to storage
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
   */
  const saveFavoriteHomeColor = async (colorIndex) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITE_HOME,
        JSON.stringify(colorIndex),
      );
      setFavoriteHomeColor(colorIndex);
    } catch (error) {
      console.error("Error saving favorite home color:", error);
    }
  };

  /**
   * Save favorite away color to storage
   */
  const saveFavoriteAwayColor = async (colorIndex) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITE_AWAY,
        JSON.stringify(colorIndex),
      );
      setFavoriteAwayColor(colorIndex);
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
      ]);
      setOwnedColors([]);
      setFavoriteHomeColor(null);
      setFavoriteAwayColor(null);
      setOwnedJerseys([]);
      setFavoriteJersey(null);
      setAdvancedClosestTracking(false);
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
    clearPreferences,
    loading,
  };

  return (
    <PlayerPreferencesContext.Provider value={value}>
      {children}
    </PlayerPreferencesContext.Provider>
  );
};
