import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
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
} from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { usePlayerPreferences } from "../contexts/PlayerPreferencesContext";

import DartColorManager from "../components/DartColorManager";
import JerseyColorManager, {
  getJerseyById,
} from "../components/JerseyColorManager";
import { LineChart } from "react-native-chart-kit";
import { POPDARTS_COLORS } from "../constants/colors";

/**
 * Profile screen - User profile, rankings, practice, and settings
 */
export default function ProfileScreen({ navigation }) {
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
  const [activeTab, setActiveTab] = useState("profile"); // "profile", "stats", "practice"
  // Secondary tab for stats: 'casual' or 'official'
  const [statsSubTab, setStatsSubTab] = useState("casual");
  // User setting for casual match tracking: 'all', 'recent', 'none'
  const [casualTracking, setCasualTracking] = useState("all");

  const displayName =
    user?.user_metadata?.display_name || guestName || "Player";
  const email = user?.email || "Guest User";

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
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: favoriteHomeColorObj.colors[0],
                marginHorizontal: 2,
                borderWidth: 1,
                borderColor: "#fff",
              }}
            />
            {favoriteHomeColorObj.colors[1] && (
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: favoriteHomeColorObj.colors[1],
                  marginHorizontal: 2,
                  borderWidth: 1,
                  borderColor: "#fff",
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

      {/* Combined General Stats - now smaller */}
      <Surface style={styles.sectionSmall}>
        <Text variant="titleSmall" style={styles.sectionTitleSmall}>
          Summary Stats
        </Text>
        <View style={styles.statsGridSmall}>
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

      {/* Trophy Room Preview */}
      <Surface style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Trophy Room
          </Text>
          <Chip mode="outlined" compact>
            Coming Soon
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.placeholderText}>
          Your tournament wins and achievements will appear here
        </Text>
      </Surface>

      {isGuest && (
        <View style={[styles.section, styles.upgradeSection]}>
          <Text variant="titleMedium" style={styles.upgradeTitle}>
            Create an Account
          </Text>
          <Text variant="bodyMedium" style={styles.upgradeDescription}>
            Save your progress and unlock competitive features
          </Text>
          <Button
            mode="contained"
            style={styles.upgradeButton}
            onPress={handleSignOut}
          >
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

  return (
    <SafeAreaView style={styles.safeArea}>
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
        </View>

        {/* Tab Content */}
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "stats" && renderStatsTab()}
        {activeTab === "practice" && renderPracticeTab()}

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
    backgroundColor: "#fff",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "#eee",
  },
  colorPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
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
});
