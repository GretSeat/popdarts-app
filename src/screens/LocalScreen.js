import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Text,
  Button,
  Card,
  Searchbar,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import ScreenContainer from "../components/ScreenContainer";

/**
 * Local Screen - Find and manage clubs
 * Shows: Search for clubs, favorite clubs, create club option
 */
export default function LocalScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const insets = useSafeAreaInsets();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [clubs, setClubs] = useState([]);
  const [favoriteClubs, setFavoriteClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("all"); // 'all', 'favorites', 'my-clubs'

  useEffect(() => {
    loadClubs();
    if (user) {
      loadFavorites();
    }
  }, [filterMode]);

  /**
   * Load clubs from database based on filter mode
   */
  const loadClubs = async () => {
    try {
      setLoading(true);

      // Query clubs
      let clubsQuery = supabase
        .from("clubs")
        .select("*")
        .eq("is_listed", true)
        .order("name");

      // Apply filters
      if (filterMode === "my-clubs" && user) {
        clubsQuery = clubsQuery.eq("owner_id", user.id);
      }

      const { data: clubsData, error: clubsError } = await clubsQuery;

      if (clubsError) throw clubsError;

      // Query club stats separately
      const { data: statsData, error: statsError } = await supabase
        .from("club_stats")
        .select("*");

      if (statsError) throw statsError;

      // Merge clubs with their stats
      const clubsWithStats = clubsData.map((club) => {
        const stats = statsData.find((s) => s.id === club.id);
        return {
          ...club,
          member_count: stats?.member_count || 0,
          favorite_count: stats?.favorite_count || 0,
          event_count: stats?.event_count || 0,
          next_event_time: stats?.next_event_time || null,
        };
      });

      // If filtering favorites, filter on client side
      if (filterMode === "favorites" && favoriteClubs.length > 0) {
        const favoriteIds = favoriteClubs.map((f) => f.club_id);
        setClubs(
          clubsWithStats.filter((club) => favoriteIds.includes(club.id)),
        );
      } else if (filterMode === "favorites") {
        setClubs([]);
      } else {
        setClubs(clubsWithStats);
      }
    } catch (error) {
      console.error("Error loading clubs:", error);
      Alert.alert("Error", "Failed to load clubs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user's favorite clubs
   */
  const loadFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("club_members")
        .select("club_id, club:clubs(*)")
        .eq("user_id", user.id)
        .eq("is_favorite", true);

      if (error) throw error;
      setFavoriteClubs(data || []);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  /**
   * Toggle club favorite status
   */
  const toggleFavorite = async (clubId) => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "You need to sign in to favorite clubs.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => navigation.navigate("Profile"),
          },
        ],
      );
      return;
    }

    try {
      const isFavorited = favoriteClubs.some((f) => f.club_id === clubId);

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("club_members")
          .delete()
          .eq("club_id", clubId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase.from("club_members").upsert({
          club_id: clubId,
          user_id: user.id,
          is_favorite: true,
        });

        if (error) throw error;
      }

      // Reload favorites
      await loadFavorites();
      await loadClubs();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorite. Please try again.");
    }
  };

  /**
   * Filter clubs by search query
   */
  const filteredClubs = clubs.filter((club) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      club.name.toLowerCase().includes(query) ||
      club.description?.toLowerCase().includes(query) ||
      club.city?.toLowerCase().includes(query) ||
      club.state?.toLowerCase().includes(query)
    );
  });

  /**
   * Check if club is favorited
   */
  const isClubFavorited = (clubId) => {
    return favoriteClubs.some((f) => f.club_id === clubId);
  };

  /**
   * Format next event time
   */
  const formatNextEvent = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `In ${days} days`;
    return date.toLocaleDateString();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        <ScreenContainer>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              🎯 Local Clubs
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Find clubs and leagues near you
            </Text>
          </View>

          {/* Create Club Button - Always visible */}
          <Card style={styles.createClubCard} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.createClubTitle}>
                💡 Have a club or venue?
              </Text>
              <Text variant="bodyMedium" style={styles.createClubDescription}>
                Create your club page to connect with players in your area
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => {
                  if (isGuest) {
                    Alert.alert(
                      "Sign In Required",
                      "You need to create an account to create a club.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Sign In",
                          onPress: () => navigation.navigate("Profile"),
                        },
                      ],
                    );
                  } else {
                    navigation.navigate("CreateClub");
                  }
                }}
                style={styles.createClubButton}
              >
                Create Club Page
              </Button>
            </Card.Actions>
          </Card>

          {/* Search Bar */}
          <Searchbar
            placeholder="Search clubs by name, city, or state..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#2196F3"
          />

          {/* Filter Chips */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip
                selected={filterMode === "all"}
                onPress={() => setFilterMode("all")}
                style={styles.filterChip}
                textStyle={
                  filterMode === "all"
                    ? styles.filterChipTextActive
                    : styles.filterChipText
                }
              >
                All Clubs
              </Chip>
              <Chip
                selected={filterMode === "favorites"}
                onPress={() => setFilterMode("favorites")}
                style={styles.filterChip}
                textStyle={
                  filterMode === "favorites"
                    ? styles.filterChipTextActive
                    : styles.filterChipText
                }
                disabled={!user}
              >
                ⭐ Favorites ({favoriteClubs.length})
              </Chip>
              {user && (
                <Chip
                  selected={filterMode === "my-clubs"}
                  onPress={() => setFilterMode("my-clubs")}
                  style={styles.filterChip}
                  textStyle={
                    filterMode === "my-clubs"
                      ? styles.filterChipTextActive
                      : styles.filterChipText
                  }
                >
                  My Clubs
                </Chip>
              )}
            </ScrollView>
          </View>

          <Divider style={styles.divider} />

          {/* Loading State */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading clubs...</Text>
            </View>
          ) : filteredClubs.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                {searchQuery
                  ? "🔍 No clubs found"
                  : filterMode === "favorites"
                    ? "⭐ No favorite clubs yet"
                    : filterMode === "my-clubs"
                      ? "📋 You haven't created any clubs"
                      : "📍 No clubs listed yet"}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyDescription}>
                {searchQuery
                  ? "Try a different search term"
                  : filterMode === "favorites"
                    ? "Tap the star icon on clubs to add them to your favorites"
                    : filterMode === "my-clubs"
                      ? "Create your first club to get started"
                      : "Be the first to create a club in your area!"}
              </Text>
            </View>
          ) : (
            /* Clubs List */
            <View style={styles.clubsList}>
              {filteredClubs.map((club) => {
                const nextEvent = formatNextEvent(club.next_event_time);

                return (
                  <Card key={club.id} style={styles.clubCard} mode="elevated">
                    <Card.Content>
                      <View style={styles.clubHeader}>
                        <View style={styles.clubTitleContainer}>
                          <Text variant="titleLarge" style={styles.clubName}>
                            {club.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleFavorite(club.id)}
                            style={styles.favoriteButton}
                          >
                            <IconButton
                              icon={
                                isClubFavorited(club.id)
                                  ? "star"
                                  : "star-outline"
                              }
                              iconColor={
                                isClubFavorited(club.id) ? "#FFD700" : "#999"
                              }
                              size={24}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Location */}
                      {(club.city || club.state) && (
                        <Text variant="bodyMedium" style={styles.clubLocation}>
                          📍{" "}
                          {[club.city, club.state].filter(Boolean).join(", ")}
                        </Text>
                      )}

                      {/* Description */}
                      {club.description && (
                        <Text
                          variant="bodyMedium"
                          style={styles.clubDescription}
                          numberOfLines={2}
                        >
                          {club.description}
                        </Text>
                      )}

                      {/* Stats */}
                      <View style={styles.clubStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>
                            {club.member_count || 0}
                          </Text>
                          <Text style={styles.statLabel}>Members</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>
                            {club.event_count || 0}
                          </Text>
                          <Text style={styles.statLabel}>Events</Text>
                        </View>
                        {nextEvent && (
                          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{nextEvent}</Text>
                            <Text style={styles.statLabel}>Next Event</Text>
                          </View>
                        )}
                      </View>
                    </Card.Content>

                    <Card.Actions>
                      <Button
                        mode="text"
                        onPress={() =>
                          navigation.navigate("ClubDetails", {
                            clubId: club.id,
                          })
                        }
                      >
                        View Details
                      </Button>
                      {club.website_url && (
                        <Button
                          mode="text"
                          onPress={() => Linking.openURL(club.website_url)}
                        >
                          Website
                        </Button>
                      )}
                    </Card.Actions>
                  </Card>
                );
              })}
            </View>
          )}

          <View style={styles.spacer} />
        </ScreenContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#CCCCCC",
  },
  createClubCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: "#2A2A2A",
  },
  createClubTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  createClubDescription: {
    color: "#CCCCCC",
    lineHeight: 20,
  },
  createClubButton: {
    backgroundColor: "#2196F3",
  },
  searchBar: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: "#2A2A2A",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "#2A2A2A",
  },
  filterChipText: {
    color: "#CCCCCC",
  },
  filterChipTextActive: {
    color: "#2196F3",
    fontWeight: "600",
  },
  divider: {
    marginVertical: 16,
    backgroundColor: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#CCCCCC",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyDescription: {
    color: "#CCCCCC",
    textAlign: "center",
    lineHeight: 22,
  },
  clubsList: {
    paddingHorizontal: 16,
  },
  clubCard: {
    marginBottom: 16,
    backgroundColor: "#2A2A2A",
  },
  clubHeader: {
    marginBottom: 12,
  },
  clubTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clubName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    flex: 1,
  },
  favoriteButton: {
    marginLeft: 8,
  },
  clubLocation: {
    color: "#4CAF50",
    marginBottom: 8,
  },
  clubDescription: {
    color: "#CCCCCC",
    lineHeight: 20,
    marginBottom: 12,
  },
  clubStats: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  statItem: {
    marginRight: 24,
  },
  statValue: {
    color: "#2196F3",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  spacer: {
    height: 40,
  },
});
