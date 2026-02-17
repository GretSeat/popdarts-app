import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Button,
  List,
  Divider,
  Avatar,
  Card,
  ProgressBar,
  Surface,
  Chip,
  Switch,
} from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { usePlayerPreferences } from "../contexts/PlayerPreferencesContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../services/pushNotificationService";

import DartColorManager from "../components/DartColorManager";
import JerseyColorManager, {
  getJerseyById,
} from "../components/JerseyColorManager";
import ScreenContainer from "../components/ScreenContainer";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { POPDARTS_COLORS } from "../constants/colors";

/**
 * Profile screen - User profile, rankings, practice, and settings
 */
export default function ProfileScreen() {
  const { user, isGuest, guestName, signOut } = useAuth();
  const {
    ownedColors,
    setOwnedColors,
    favoriteHomeColor,
    setFavoriteHomeColor,
    favoriteAwayColor,
    setFavoriteAwayColor,
    ownedJerseys,
    setOwnedJerseys,
    favoriteJersey,
    setFavoriteJersey,
    advancedClosestTracking,
    setAdvancedClosestTracking,
  } = usePlayerPreferences();

  // Use favorite home dart color for avatar and preview
  const favoriteHomeColorObj =
    typeof favoriteHomeColor === "number" && POPDARTS_COLORS[favoriteHomeColor]
      ? POPDARTS_COLORS[favoriteHomeColor]
      : (typeof favoriteHomeColor === "string" &&
          POPDARTS_COLORS.find((c) => c.name === favoriteHomeColor)) ||
        POPDARTS_COLORS[0];

  // Get jersey background color if favorite jersey is set
  const selectedJersey =
    favoriteJersey !== null ? getJerseyById(favoriteJersey) : null;
  const jerseyBackgroundColor = selectedJersey
    ? selectedJersey.backgroundColor
    : POPDARTS_COLORS[0].colors[0]; // Default to black if no jersey selected

  // Use favorite away color as jersey color preview (fallback to blue)
  const jerseyColorObj =
    typeof favoriteAwayColor === "number" && POPDARTS_COLORS[favoriteAwayColor]
      ? POPDARTS_COLORS[favoriteAwayColor]
      : (typeof favoriteAwayColor === "string" &&
          POPDARTS_COLORS.find((c) => c.name === favoriteAwayColor)) ||
        POPDARTS_COLORS[0];

  // Color manager modal visibility
  const [colorManagerVisible, setColorManagerVisible] = useState(false);
  const [jerseyManagerVisible, setJerseyManagerVisible] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState("profile"); // "profile", "stats", "practice", "settings"
  // Secondary tab for stats: 'casual' or 'official'
  const [statsSubTab, setStatsSubTab] = useState("casual");
  // User setting for casual match tracking: 'all', 'recent', 'none'
  const [casualTracking, setCasualTracking] = useState("all");
  // Chart container width for responsive chart
  const [chartContainerWidth, setChartContainerWidth] = useState(300);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    storeUpdates: true,
    flashSales: true,
    leaguesNearby: true,
    tournamentTurns: true,
    matchReminders: true,
    clubAnnouncements: true,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  const displayName =
    user?.user_metadata?.display_name || guestName || "Player";
  const email = user?.email || "Guest User";

  // Load notification preferences when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadNotificationPreferences();
    }
  }, [user]);

  const loadNotificationPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences(user.id);
      if (prefs) {
        setNotificationPrefs(prefs);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  };

  const handleNotificationPrefChange = async (key, value) => {
    const updatedPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updatedPrefs);

    if (user?.id) {
      setLoadingPrefs(true);
      const success = await updateNotificationPreferences(
        user.id,
        updatedPrefs,
      );
      setLoadingPrefs(false);

      if (!success) {
        Alert.alert("Error", "Failed to update notification preferences");
        // Revert on error
        setNotificationPrefs(notificationPrefs);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Mock data for stats (will be replaced with real data from Supabase)
  const mockStats = {
    totalMatches: 24,
    wins: 15,
    losses: 9,
    winRate: 62.5,
    roundsWon: 87,
    tNobbers: 12,
    wiggleNobbers: 8,
    fenderBenders: 5,
    inchWorms: 15,
    lippies: 7,
    tower: 2,
    clubName: "Downtown Darts Club",
    clubRank: 3,
  };

  // Mock ranking data (placeholder for ELO system)
  const mockRankingData = {
    currentRank: "Pro II",
    mmr: 1788,
    globalRank: 47,
    totalPlayers: 400,
    percentile: 12,
    divisionColor: "#9D4EDD",
    nextTierName: "Elite",
    nextTierMMR: 1900,
    mmrToNextTier: 112,
  };

  // Mock leaderboard data (top 10 shown, Elite = top 20)
  const mockLeaderboard = [
    { rank: 1, name: "TheDartKing", mmr: 2156, tier: "Elite" },
    { rank: 2, name: "BullseyeQueen", mmr: 2098, tier: "Elite" },
    { rank: 3, name: "PrecisionMaster", mmr: 2044, tier: "Elite" },
    { rank: 4, name: "DartNinja", mmr: 1998, tier: "Elite" },
    { rank: 5, name: "TargetLock", mmr: 1945, tier: "Elite" },
    { rank: 6, name: "ThrowMaster", mmr: 1922, tier: "Elite" },
    { rank: 7, name: "BullseyeBoss", mmr: 1910, tier: "Elite" },
    { rank: 8, name: "AimAssist", mmr: 1905, tier: "Elite" },
    { rank: 9, name: "SharpShooter", mmr: 1899, tier: "Elite" },
    { rank: 10, name: "LocalLegend", mmr: 1894, tier: "Elite" },
    { rank: 11, name: "BullseyeBandit", mmr: 1889, tier: "Elite" },
    { rank: 12, name: "DartDemon", mmr: 1885, tier: "Elite" },
    { rank: 13, name: "PrecisionPro", mmr: 1880, tier: "Elite" },
    { rank: 14, name: "TargetTerror", mmr: 1876, tier: "Elite" },
    { rank: 15, name: "AceAimer", mmr: 1872, tier: "Elite" },
    { rank: 16, name: "ThrowGod", mmr: 1868, tier: "Elite" },
    { rank: 17, name: "DartMaestro", mmr: 1864, tier: "Elite" },
    { rank: 18, name: "BullseyeBeast", mmr: 1860, tier: "Elite" },
    { rank: 19, name: "SniperShot", mmr: 1856, tier: "Elite" },
    { rank: 20, name: "EliteEnder", mmr: 1852, tier: "Elite" },
  ];

  // Mock seasonal badges (achieved ranks from previous seasons)
  const mockSeasonalBadges = [
    { season: 1, rank: "Gold I", mmr: 1320, color: "#FFD700" },
    { season: 2, rank: "Platinum III", mmr: 1380, color: "#E5E4E2" },
    { season: 3, rank: "Diamond II", mmr: 1600, color: "#B9F2FF" },
    { season: 4, rank: "Pro II", mmr: 1788, color: "#9D4EDD" },
  ];

  // Mock recent play history
  const recentMatches = [
    {
      id: 1,
      opponent: "John Doe",
      result: "Win",
      score: "21-15",
      date: "2 days ago",
    },
    {
      id: 2,
      opponent: "Jane Smith",
      result: "Loss",
      score: "18-21",
      date: "3 days ago",
    },
    {
      id: 3,
      opponent: "Mike Johnson",
      result: "Win",
      score: "21-12",
      date: "5 days ago",
    },
  ];

  // Mock improvement chart data
  const improvementData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        data: [55, 58, 62, 60, 65, 68],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // --- SUMMARY TAB: Combined stats ---
  const renderProfileTab = () => (
    <ScrollView>
      {/* Header with Avatar, Name, Club, Dart/Jersey Colors */}
      <View style={[styles.header, { backgroundColor: jerseyBackgroundColor }]}>
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          {/* Avatar with favorite home dart color */}
          <View style={styles.avatarPreviewBox}>
            <Text
              style={{
                fontSize: 44,
                fontWeight: "bold",
                color: favoriteHomeColorObj.colors[0],
                letterSpacing: 1,
              }}
            >
              {displayName.substring(0, 1).toUpperCase()}
            </Text>
            {displayName.length > 1 && (
              <Text
                style={{
                  fontSize: 44,
                  fontWeight: "bold",
                  color:
                    favoriteHomeColorObj.colors[1] ||
                    favoriteHomeColorObj.colors[0],
                  letterSpacing: 1,
                  marginLeft: -6,
                }}
              >
                {displayName.substring(1, 2).toUpperCase()}
              </Text>
            )}
          </View>
        </View>
        <Text variant="headlineMedium" style={styles.name}>
          {displayName}
        </Text>
        {!isGuest && (
          <Text variant="bodyMedium" style={styles.email}>
            {email}
          </Text>
        )}
        {mockStats.clubName && (
          <Chip icon="home-group" style={styles.clubChip}>
            {mockStats.clubName}
          </Chip>
        )}
        {/* Dart/Jersey Color Previews */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          <TouchableOpacity
            style={[styles.colorPreviewBox, { marginRight: 8 }]}
            onPress={() => setColorManagerVisible(true)}
          >
            {favoriteHomeColorObj.isGradient ? (
              <LinearGradient
                colors={favoriteHomeColorObj.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 40,
                  height: 20,
                  borderRadius: 10,
                }}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: favoriteHomeColorObj.colors[0],
                }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.colorPreviewBox,
              { minWidth: selectedJersey ? 80 : 36 },
            ]}
            onPress={() => setJerseyManagerVisible(true)}
          >
            {selectedJersey ? (
              <Text style={{ fontSize: 10, fontWeight: "600", color: "#333" }}>
                {selectedJersey.name}
              </Text>
            ) : (
              <View
                style={{
                  width: 36,
                  height: 18,
                  borderRadius: 6,
                  backgroundColor: jerseyBackgroundColor,
                  borderWidth: 1,
                  borderColor: "#fff",
                }}
              />
            )}
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 2,
          }}
        >
          <Text style={{ fontSize: 12, color: "#fff", marginRight: 12 }}>
            Dart Color
          </Text>
          <Text style={{ fontSize: 12, color: "#fff" }}>Jersey Color</Text>
        </View>
      </View>

      {/* Compact Summary Stats */}
      <View style={styles.quickStatsContainerCompact}>
        <View style={styles.quickStatMiniCard}>
          <Text style={styles.statLabelMini}>Win Rate</Text>
          <Text style={styles.statValueMini}>{mockStats.winRate}%</Text>
        </View>
        <View style={styles.quickStatMiniCard}>
          <Text style={styles.statLabelMini}>Matches</Text>
          <Text style={styles.statValueMini}>{mockStats.totalMatches}</Text>
        </View>
        <View style={styles.quickStatMiniCard}>
          <Text style={styles.statLabelMini}>W-L</Text>
          <Text style={styles.statValueMini}>
            {mockStats.wins}-{mockStats.losses}
          </Text>
        </View>
      </View>

      {/* Responsive row for stats and chart */}
      <View style={styles.responsiveRow}>
        {/* Combined General Stats - now smaller */}
        <Surface style={styles.cardHalf}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Summary Stats
          </Text>
          <View style={styles.statsGridFull}>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>{mockStats.roundsWon}</Text>
              <Text style={styles.statItemLabelSmall}>Rounds Won</Text>
            </View>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>{mockStats.tNobbers}</Text>
              <Text style={styles.statItemLabelSmall}>T-Nobbers</Text>
            </View>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>
                {mockStats.wiggleNobbers}
              </Text>
              <Text style={styles.statItemLabelSmall}>Wiggle Nobbers</Text>
            </View>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>{mockStats.lippies}</Text>
              <Text style={styles.statItemLabelSmall}>Lippies</Text>
            </View>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>
                {mockStats.fenderBenders}
              </Text>
              <Text style={styles.statItemLabelSmall}>Fender Benders</Text>
            </View>
            <View style={styles.statItemSmall}>
              <Text style={styles.statNumberSmall}>{mockStats.inchWorms}</Text>
              <Text style={styles.statItemLabelSmall}>Inch Worms</Text>
            </View>
          </View>
        </Surface>

        {/* Improvement Chart */}
        <Surface
          style={styles.cardHalf}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setChartContainerWidth(width - 32); // Account for padding
          }}
        >
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Win Rate Trend
          </Text>
          <LineChart
            data={improvementData}
            width={chartContainerWidth}
            height={200}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#2196F3",
              },
            }}
            bezier
            style={styles.chart}
          />
        </Surface>
      </View>

      {/* Responsive row container for ranking and trophy sections */}
      <View style={styles.responsiveRow}>
        {/* Ranking Preview */}
        <Surface style={styles.cardHalf}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Competitive Ranking
            </Text>
            <Chip mode="outlined" compact>
              Preview
            </Chip>
          </View>
          <View style={styles.rankingPreviewContainer}>
            <View style={styles.currentRankCard}>
              <Text style={styles.currentRankLabel}>Current Rank</Text>
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: mockRankingData.divisionColor },
                ]}
              >
                <Text style={styles.rankBadgeText}>
                  {mockRankingData.currentRank}
                </Text>
              </View>
              <Text style={styles.mmrText}>{mockRankingData.mmr} MMR</Text>
              <Text style={styles.globalRankText}>
                #{mockRankingData.globalRank} of {mockRankingData.totalPlayers}{" "}
                (Top {mockRankingData.percentile}%)
              </Text>
              <View style={styles.progressToNextTier}>
                <Text style={styles.progressLabel}>
                  {mockRankingData.mmrToNextTier} MMR to{" "}
                  {mockRankingData.nextTierName}
                </Text>
                <ProgressBar
                  progress={
                    (mockRankingData.mmr - 1700) /
                    (mockRankingData.nextTierMMR - 1700)
                  }
                  color={mockRankingData.divisionColor}
                  style={styles.progressBarRank}
                />
              </View>
            </View>
          </View>
        </Surface>

        {/* Leaderboard Preview */}
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Global Leaderboard
            </Text>
            <Chip mode="outlined" compact>
              Top 20
            </Chip>
          </View>
          <View style={styles.leaderboardContainer}>
            {mockLeaderboard.map((player, index) => (
              <View
                key={player.rank}
                style={[
                  styles.leaderboardRow,
                  index % 2 === 0 && styles.leaderboardRowAlt,
                  player.name === displayName && styles.leaderboardRowHighlight,
                ]}
              >
                <View style={styles.leaderboardRankCol}>
                  {player.rank <= 3 ? (
                    <Text style={styles.leaderboardRankMedal}>
                      {player.rank === 1
                        ? "🥇"
                        : player.rank === 2
                          ? "🥈"
                          : "🥉"}
                    </Text>
                  ) : (
                    <Text style={styles.leaderboardRankText}>
                      {player.rank}
                    </Text>
                  )}
                </View>
                <Text style={styles.leaderboardName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.leaderboardMMR}>{player.mmr}</Text>
                <View
                  style={[
                    styles.leaderboardTierBadge,
                    {
                      backgroundColor:
                        player.tier === "Elite" ? "#FFD60A" : "#9D4EDD",
                    },
                  ]}
                >
                  <Text style={styles.leaderboardTierText}>{player.tier}</Text>
                </View>
              </View>
            ))}
            {mockRankingData.globalRank > 10 && (
              <View style={styles.leaderboardEllipsis}>
                <Text style={styles.leaderboardEllipsisText}>...</Text>
              </View>
            )}
            {mockRankingData.globalRank > 10 && (
              <View
                style={[styles.leaderboardRow, styles.leaderboardRowHighlight]}
              >
                <View style={styles.leaderboardRankCol}>
                  <Text style={styles.leaderboardRankText}>
                    {mockRankingData.globalRank}
                  </Text>
                </View>
                <Text style={styles.leaderboardName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.leaderboardMMR}>{mockRankingData.mmr}</Text>
                <View
                  style={[
                    styles.leaderboardTierBadge,
                    { backgroundColor: mockRankingData.divisionColor },
                  ]}
                >
                  <Text style={styles.leaderboardTierText}>
                    {mockRankingData.currentRank}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <Text style={styles.leaderboardNote}>
            This is a preview of the competitive ranking system. Full rankings
            will be available when official matches are enabled.
          </Text>
        </Surface>

        {/* Trophy Room - Seasonal Badges */}
        <Surface style={styles.cardHalf}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Trophy Room
            </Text>
            <Chip mode="outlined" compact>
              Preview
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.trophyRoomSubtitle}>
            Seasonal Achievement Badges
          </Text>
          <View style={styles.seasonalBadgesContainer}>
            {mockSeasonalBadges.map((badge) => (
              <View key={badge.season} style={styles.seasonalBadgeCard}>
                <View
                  style={[
                    styles.seasonalBadge,
                    { backgroundColor: badge.color },
                  ]}
                >
                  <Text style={styles.seasonalBadgeRank}>{badge.rank}</Text>
                </View>
                <Text style={styles.seasonalBadgeSeason}>
                  Season {badge.season}
                </Text>
                <Text style={styles.seasonalBadgeMMR}>{badge.mmr} MMR</Text>
              </View>
            ))}
          </View>
          <Text variant="bodyMedium" style={styles.placeholderText}>
            Tournament trophies and special achievements will also appear here
          </Text>
        </Surface>
      </View>

      {isGuest && (
        <View style={[styles.section, styles.upgradeSection]}>
          <Text variant="titleMedium" style={styles.upgradeTitle}>
            Create an Account
          </Text>
          <Text variant="bodyMedium" style={styles.upgradeDescription}>
            Save your progress and unlock competitive features
          </Text>
          <Button mode="contained" style={styles.upgradeButton}>
            Sign Up
          </Button>
        </View>
      )}

      <View style={styles.section}>
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          {isGuest ? "Exit Guest Mode" : "Sign Out"}
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.version}>
          Popdarts v1.0.0 (MVP)
        </Text>
      </View>
    </ScrollView>
  );

  const renderRankingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Surface style={styles.placeholderContainer}>
        <List.Icon icon="trophy-outline" size={80} color="#999" />
        <Text variant="headlineSmall" style={styles.placeholderTitle}>
          Rankings Coming Soon
        </Text>
        <Text variant="bodyMedium" style={styles.placeholderDescription}>
          View your rankings across different levels:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>
            • Local Ranking (Players in your area)
          </Text>
          <Text style={styles.featureItem}>• Club Ranking</Text>
          <Text style={styles.featureItem}>• State Ranking</Text>
          <Text style={styles.featureItem}>• Regional Ranking</Text>
          <Text style={styles.featureItem}>• Conference Ranking</Text>
          <Text style={styles.featureItem}>• National Ranking</Text>
          <Text style={styles.featureItem}>• Global Ranking</Text>
        </View>
      </Surface>
    </ScrollView>
  );

  const renderPracticeTab = () => (
    <ScrollView style={styles.tabContent}>
      <Surface style={styles.placeholderContainer}>
        <List.Icon icon="bullseye-arrow" size={80} color="#999" />
        <Text variant="headlineSmall" style={styles.placeholderTitle}>
          Practice Mode Coming Soon
        </Text>
        <Text variant="bodyMedium" style={styles.placeholderDescription}>
          Track your practice sessions and improve:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>
            • View your dart placement heatmaps
          </Text>
          <Text style={styles.featureItem}>
            • Track accuracy improvements over time
          </Text>
          <Text style={styles.featureItem}>
            • Analyze your throwing patterns
          </Text>
          <Text style={styles.featureItem}>• Set personal practice goals</Text>
          <Text style={styles.featureItem}>
            • Compare practice vs match performance
          </Text>
        </View>
      </Surface>
    </ScrollView>
  );

  // --- STATS TAB: Casual/Official breakdown ---
  const renderStatsTab = () => (
    <ScrollView>
      {/* --- Secondary Tabs: Casual / Official --- */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginVertical: 12,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: statsSubTab === "casual" ? "#2196F3" : "#E0E0E0",
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
          onPress={() => setStatsSubTab("casual")}
        >
          <Text
            style={{
              color: statsSubTab === "casual" ? "#fff" : "#333",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Casual
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: statsSubTab === "official" ? "#2196F3" : "#E0E0E0",
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          }}
          onPress={() => setStatsSubTab("official")}
        >
          <Text
            style={{
              color: statsSubTab === "official" ? "#fff" : "#333",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Official
          </Text>
        </TouchableOpacity>
      </View>

      {/* Improvement Chart (contextual) */}
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Win Rate Trend
        </Text>
        <LineChart
          data={improvementData}
          width={Dimensions.get("window").width - 48}
          height={180}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#2196F3",
            },
          }}
          bezier
          style={styles.chart}
        />
      </Surface>

      {/* --- CASUAL TAB CONTENT --- */}
      {statsSubTab === "casual" && (
        <>
          {/* Quick Stats Cards */}
          <View style={styles.quickStatsContainer}>
            <Card style={styles.quickStatCard}>
              <Card.Content>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Win Rate
                </Text>
                <Text variant="headlineLarge" style={styles.statValue}>
                  {mockStats.winRate}%
                </Text>
                <ProgressBar
                  progress={mockStats.winRate / 100}
                  color="#4CAF50"
                  style={styles.progressBar}
                />
              </Card.Content>
            </Card>
            <Card style={styles.quickStatCard}>
              <Card.Content>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Matches
                </Text>
                <Text variant="headlineLarge" style={styles.statValue}>
                  {mockStats.totalMatches}
                </Text>
                <Text variant="bodySmall" style={styles.statSubtext}>
                  {mockStats.wins}W - {mockStats.losses}L
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Toggle for casual match tracking */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginVertical: 8,
            }}
          >
            <Text style={{ marginRight: 8, alignSelf: "center" }}>Track:</Text>
            <Chip
              selected={casualTracking === "all"}
              onPress={() => setCasualTracking("all")}
              style={{ marginRight: 4 }}
            >
              All
            </Chip>
            <Chip
              selected={casualTracking === "recent"}
              onPress={() => setCasualTracking("recent")}
              style={{ marginRight: 4 }}
            >
              Last 10
            </Chip>
            <Chip
              selected={casualTracking === "none"}
              onPress={() => setCasualTracking("none")}
            >
              None
            </Chip>
          </View>

          {/* General Stats */}
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              General Stats
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {mockStats.roundsWon}
                </Text>
                <Text variant="bodySmall" style={styles.statItemLabel}>
                  Rounds Won
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {mockStats.tNobbers}
                </Text>
                <Text variant="bodySmall" style={styles.statItemLabel}>
                  T-Nobbers
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {mockStats.wiggleNobbers}
                </Text>
                <Text variant="bodySmall" style={styles.statItemLabel}>
                  Wiggle Nobbers
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {mockStats.lippies}
                </Text>
                <Text variant="bodySmall" style={styles.statItemLabel}>
                  Lippies
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {mockStats.fenderBenders}
                </Text>
                <Text variant="bodySmall" style={styles.statItemLabel}>
                  Fender Benders
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {mockStats.inchWorms}
                </Text>
                <Text variant="bodySmall" style={styles.statItemLabel}>
                  Inch Worms
                </Text>
              </View>
            </View>
          </Surface>

          {/* Recent Play History (hide if tracking is 'none') */}
          {casualTracking !== "none" && (
            <Surface style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Recent Matches
              </Text>
              {(casualTracking === "recent"
                ? recentMatches.slice(0, 10)
                : recentMatches
              ).map((match, index) => (
                <View key={match.id}>
                  <List.Item
                    title={`vs ${match.opponent}`}
                    description={`${match.score} • ${match.date}`}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          match.result === "Win"
                            ? "trophy"
                            : "close-circle-outline"
                        }
                        color={match.result === "Win" ? "#4CAF50" : "#F44336"}
                      />
                    )}
                    right={() => (
                      <Chip
                        style={[
                          styles.resultChip,
                          match.result === "Win"
                            ? styles.winChip
                            : styles.lossChip,
                        ]}
                        textStyle={styles.resultChipText}
                      >
                        {match.result}
                      </Chip>
                    )}
                  />
                  {index < recentMatches.length - 1 && <Divider />}
                </View>
              ))}
            </Surface>
          )}
        </>
      )}

      {/* --- OFFICIAL TAB CONTENT --- */}
      {statsSubTab === "official" && (
        <Surface style={styles.section}>
          {isGuest ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Official Stats
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: "#888", marginBottom: 8 }}
              >
                Not registered for official play.
              </Text>
              {/* Global ranking teaser */}
              <View
                style={{
                  alignItems: "center",
                  marginVertical: 16,
                  opacity: 0.5,
                }}
              >
                <List.Icon icon="earth" size={48} color="#999" />
                <Text variant="headlineSmall" style={{ color: "#999" }}>
                  Global Ranking
                </Text>
                <Text variant="bodyMedium" style={{ color: "#aaa" }}>
                  ???
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: "#aaa", marginTop: 4 }}
                >
                  Register to see your global rank!
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={() => {
                  /* open www.iplayapl.com */
                }}
                style={{ marginTop: 8 }}
              >
                Register at iplayapl.com
              </Button>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Official Stats
              </Text>
              {/* Official stats would go here if registered */}
              <Text
                variant="bodyMedium"
                style={{ color: "#888", marginBottom: 8 }}
              >
                Coming soon: Your official stats and global ranking.
              </Text>
            </>
          )}
        </Surface>
      )}
    </ScrollView>
  );

  // --- SETTINGS TAB: Notifications and Preferences ---
  const renderSettingsTab = () => (
    <ScrollView>
      {/* Notification Preferences Section */}
      {!isGuest && (
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🔔 Push Notifications
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: "#666", marginBottom: 16 }}>
            Choose which notifications you want to receive
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Store Updates</Text>
              <Text style={styles.settingDescription}>
                New items and restocks
              </Text>
            </View>
            <Switch
              value={notificationPrefs.storeUpdates}
              onValueChange={(value) =>
                handleNotificationPrefChange("storeUpdates", value)
              }
              disabled={loadingPrefs}
            />
          </View>
          <Divider />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Flash Sales</Text>
              <Text style={styles.settingDescription}>
                Limited time discounts and offers
              </Text>
            </View>
            <Switch
              value={notificationPrefs.flashSales}
              onValueChange={(value) =>
                handleNotificationPrefChange("flashSales", value)
              }
              disabled={loadingPrefs}
            />
          </View>
          <Divider />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Leagues Nearby</Text>
              <Text style={styles.settingDescription}>
                New leagues in your area
              </Text>
            </View>
            <Switch
              value={notificationPrefs.leaguesNearby}
              onValueChange={(value) =>
                handleNotificationPrefChange("leaguesNearby", value)
              }
              disabled={loadingPrefs}
            />
          </View>
          <Divider />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Tournament Turn</Text>
              <Text style={styles.settingDescription}>
                When it's your turn to play
              </Text>
            </View>
            <Switch
              value={notificationPrefs.tournamentTurns}
              onValueChange={(value) =>
                handleNotificationPrefChange("tournamentTurns", value)
              }
              disabled={loadingPrefs}
            />
          </View>
          <Divider />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Match Reminders</Text>
              <Text style={styles.settingDescription}>
                Upcoming scheduled matches
              </Text>
            </View>
            <Switch
              value={notificationPrefs.matchReminders}
              onValueChange={(value) =>
                handleNotificationPrefChange("matchReminders", value)
              }
              disabled={loadingPrefs}
            />
          </View>
          <Divider />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Club Announcements</Text>
              <Text style={styles.settingDescription}>
                Updates from your clubs
              </Text>
            </View>
            <Switch
              value={notificationPrefs.clubAnnouncements}
              onValueChange={(value) =>
                handleNotificationPrefChange("clubAnnouncements", value)
              }
              disabled={loadingPrefs}
            />
          </View>
        </Surface>
      )}

      {/* Competitive Settings */}
      <Surface style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🏆 Competitive Settings
          </Text>
        </View>
        <Text variant="bodySmall" style={{ color: "#666", marginBottom: 16 }}>
          Advanced options for tracking play-by-play data
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Advanced Closest Tracking</Text>
            <Text style={styles.settingDescription}>
              Track which specific dart is closest (enables 3-tap dart entry)
            </Text>
          </View>
          <Switch
            value={advancedClosestTracking}
            onValueChange={setAdvancedClosestTracking}
          />
        </View>
      </Surface>

      {/* Account Settings */}
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account Settings
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Display Name</Text>
            <Text style={styles.settingDescription}>{displayName}</Text>
          </View>
        </View>
        <Divider />

        {!isGuest && (
          <>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingDescription}>{email}</Text>
              </View>
            </View>
            <Divider />
          </>
        )}

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Account Type</Text>
            <Text style={styles.settingDescription}>
              {isGuest ? "Guest Account" : "Registered Account"}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Sign Out Button */}
      <View style={styles.section}>
        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenContainer>
        <View style={styles.container}>
          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "profile" && styles.activeTab]}
              onPress={() => setActiveTab("profile")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "profile" && styles.activeTabText,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "stats" && styles.activeTab]}
              onPress={() => setActiveTab("stats")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "stats" && styles.activeTabText,
                ]}
              >
                Stats
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "practice" && styles.activeTab]}
              onPress={() => setActiveTab("practice")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "practice" && styles.activeTabText,
                ]}
              >
                Practice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "settings" && styles.activeTab]}
              onPress={() => setActiveTab("settings")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "settings" && styles.activeTabText,
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === "profile" && renderProfileTab()}
          {activeTab === "stats" && renderStatsTab()}
          {activeTab === "practice" && renderPracticeTab()}
          {activeTab === "settings" && renderSettingsTab()}

          {/* Dart Color Manager Modal */}
          <DartColorManager
            visible={colorManagerVisible}
            onDismiss={() => setColorManagerVisible(false)}
            ownedColors={ownedColors}
            setOwnedColors={setOwnedColors}
            favoriteHomeColor={favoriteHomeColor}
            setFavoriteHomeColor={setFavoriteHomeColor}
            favoriteAwayColor={favoriteAwayColor}
            setFavoriteAwayColor={setFavoriteAwayColor}
          />

          {/* Jersey Color Manager Modal */}
          <JerseyColorManager
            visible={jerseyManagerVisible}
            onDismiss={() => setJerseyManagerVisible(false)}
            ownedJerseys={ownedJerseys}
            setOwnedJerseys={setOwnedJerseys}
            favoriteJersey={favoriteJersey}
            setFavoriteJersey={setFavoriteJersey}
          />
        </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f5f5",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  colorPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#e8e8e8",
    borderWidth: 1,
    borderColor: "#ccc",
    minWidth: 36,
    minHeight: 20,
    justifyContent: "center",
  },
  quickStatsContainerCompact: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  quickStatMiniCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 1,
    minWidth: 60,
  },
  statLabelMini: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  statValueMini: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#2196F3",
  },
  tabContent: {
    flex: 1,
  },
  // header: duplicate removed
  avatar: {
    backgroundColor: "#1976d2",
    marginBottom: 12,
  },
  name: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    color: "#666",
    marginBottom: 8,
  },
  clubChip: {
    marginTop: 8,
    backgroundColor: "#E3F2FD",
  },
  quickStatsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    elevation: 2,
  },
  statLabel: {
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "bold",
    color: "#2196F3",
  },
  statSubtext: {
    color: "#999",
    marginTop: 4,
  },
  progressBar: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
  },
  section: {
    marginTop: 16,
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  responsiveRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 8,
    marginTop: 0,
  },
  cardHalf: {
    flex: 1,
    minWidth: 320,
    maxWidth: "100%",
    margin: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  sectionTitle: {
    paddingVertical: 12,
    fontWeight: "bold",
  },
  placeholderText: {
    color: "#999",
    paddingVertical: 16,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 8,
  },
  statItem: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: 16,
  },
  statNumber: {
    fontWeight: "bold",
    color: "#2196F3",
  },
  statItemLabel: {
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  resultChip: {
    marginRight: 8,
  },
  winChip: {
    backgroundColor: "#E8F5E9",
  },
  lossChip: {
    backgroundColor: "#FFEBEE",
  },
  resultChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  upgradeSection: {
    padding: 16,
    backgroundColor: "#e3f2fd",
  },
  upgradeTitle: {
    color: "#1976d2",
    fontWeight: "bold",
    marginBottom: 8,
  },
  upgradeDescription: {
    color: "#424242",
    marginBottom: 16,
  },
  upgradeButton: {
    marginTop: 8,
  },
  signOutButton: {
    margin: 16,
  },
  footer: {
    alignItems: "center",
    padding: 24,
  },
  version: {
    color: "#999",
  },
  // Placeholder styles for Rankings and Practice tabs
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    margin: 16,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 2,
  },
  placeholderTitle: {
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  placeholderDescription: {
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  featureList: {
    alignSelf: "stretch",
    paddingHorizontal: 16,
  },
  featureItem: {
    color: "#666",
    fontSize: 14,
    paddingVertical: 4,
    lineHeight: 20,
  },
  // Small summary stats styles
  sectionSmall: {
    marginTop: 12,
    backgroundColor: "#fafafa",
    paddingVertical: 4,
    paddingHorizontal: 8,
    elevation: 0,
    borderRadius: 8,
  },
  sectionTitleSmall: {
    paddingVertical: 6,
    fontWeight: "bold",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  statsGridSmall: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 2,
  },
  statsGridFull: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 8,
    width: "100%",
  },
  statItemSmall: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: 6,
  },
  statNumberSmall: {
    fontWeight: "bold",
    color: "#888",
    fontSize: 14,
  },
  statItemLabelSmall: {
    color: "#aaa",
    marginTop: 2,
    fontSize: 10,
    textAlign: "center",
  },
  // Ranking preview styles
  rankingPreviewContainer: {
    paddingVertical: 12,
  },
  currentRankCard: {
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
  },
  currentRankLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  rankBadge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
  },
  rankBadgeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  mmrText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  globalRankText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  progressToNextTier: {
    width: "100%",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
    textAlign: "center",
  },
  progressBarRank: {
    height: 8,
    borderRadius: 4,
  },
  // Leaderboard styles
  leaderboardContainer: {
    paddingVertical: 8,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 2,
  },
  leaderboardRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  leaderboardRowHighlight: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  leaderboardRankCol: {
    width: 40,
    alignItems: "center",
  },
  leaderboardRankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  leaderboardRankMedal: {
    fontSize: 20,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  leaderboardMMR: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  leaderboardTierBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  leaderboardTierText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  leaderboardEllipsis: {
    alignItems: "center",
    paddingVertical: 8,
  },
  leaderboardEllipsisText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },
  leaderboardNote: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  // Trophy room / seasonal badges styles
  trophyRoomSubtitle: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 12,
  },
  seasonalBadgesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  seasonalBadgeCard: {
    alignItems: "center",
    width: 80,
  },
  seasonalBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    elevation: 3,
  },
  seasonalBadgeRank: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  seasonalBadgeSeason: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  seasonalBadgeMMR: {
    fontSize: 10,
    color: "#888",
  },
  // Settings tab styles
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
  },
});
