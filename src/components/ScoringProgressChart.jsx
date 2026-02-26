import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Text, IconButton } from "react-native-paper";

/**
 * Scoring Progress Chart - Shows cumulative points per round for both players
 * Displays who was winning throughout the match and reveals momentum shifts
 *
 * @param {Array} roundHistory - Array of round objects with p1Points and p2Points
 * @param {string} player1Name - Name of player 1
 * @param {string} player2Name - Name of player 2
 * @param {Object} player1Color - Color object for player 1 with colors array [start, end]
 * @param {Object} player2Color - Color object for player 2 with colors array [start, end]
 */
export default function ScoringProgressChart({
  roundHistory,
  player1Name = "Player 1",
  player2Name = "Player 2",
  player1Color = { colors: ["#2196F3", "#1976D2"] },
  player2Color = { colors: ["#4CAF50", "#388E3C"] },
}) {
  const screenWidth = Dimensions.get("window").width;
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Calculate cumulative scores for each round
  const chartData = useMemo(() => { 
    if (!roundHistory || roundHistory.length === 0) {
      return null;
    }

    let p1CumulativeScore = 0;
    let p2CumulativeScore = 0;

    const p1CumulativeScores = [];
    const p2CumulativeScores = [];
    const roundLabels = [];

    roundHistory.forEach((round, index) => {
      // Calculate net points awarded based on round winner (cancellation scoring)
      let p1RoundPointsAwarded = 0;
      let p2RoundPointsAwarded = 0;

      if (round.roundWinner === 1) {
        // Player 1 won - gets net points
        p1RoundPointsAwarded = (round.p1Points || 0) - (round.p2Points || 0);
      } else if (round.roundWinner === 2) {
        // Player 2 won - gets net points
        p2RoundPointsAwarded = (round.p2Points || 0) - (round.p1Points || 0);
      }
      // If roundWinner === 0 (wash), both get 0

      p1CumulativeScore += p1RoundPointsAwarded;
      p2CumulativeScore += p2RoundPointsAwarded;

      // Cap at 21 (winning score)
      p1CumulativeScore = Math.min(p1CumulativeScore, 21);
      p2CumulativeScore = Math.min(p2CumulativeScore, 21);

      p1CumulativeScores.push(p1CumulativeScore);
      p2CumulativeScores.push(p2CumulativeScore);

      // For compact view: only show labels for first, last, and every 5th round
      // For full screen: show more labels
      if (index === 0 || index === roundHistory.length - 1 || index % 5 === 0) {
        roundLabels.push(`R${index + 1}`);
      } else {
        roundLabels.push("");
      }
    });

    return {
      labels: roundLabels,
      datasets: [
        {
          data: p1CumulativeScores,
          color: () => player1Color.colors[0] || "#2196F3", // Player 1 line color
          strokeWidth: 3,
          fillOpacity: 0.1,
        },
        {
          data: p2CumulativeScores,
          color: () => player2Color.colors[0] || "#4CAF50", // Player 2 line color
          strokeWidth: 3,
          fillOpacity: 0.1,
        },
      ],
    };
  }, [roundHistory, player1Color, player2Color]);

  // Calculate dynamic width - minimum 60px per data point for readability
  const chartWidth = useMemo(() => {
    const dataPointWidth = Math.max(
      60,
      (screenWidth - 60) / Math.max(roundHistory.length, 1),
    );
    return Math.max(screenWidth - 40, roundHistory.length * dataPointWidth);
  }, [roundHistory.length, screenWidth]);

  // Compact width removed - using full-screen only now
  // (Feature planned: compact chart view that shows all rounds at a glance)

  if (!chartData) {
    return null;
  }

  if (!chartData) {
    return null;
  }

  // Chart rendering component (reusable for compact and full-screen)
  const renderChart = (width, height = 280, isSmall = false) => (
    <LineChart
      data={chartData}
      width={width}
      height={height}
      chartConfig={{
        backgroundColor: "#ffffff",
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.3})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
        strokeWidth: isSmall ? 1 : 2,
        propsForDots: {
          r: isSmall ? "1.5" : "4",
          strokeWidth: isSmall ? "0.5" : "2",
          stroke: "#fff",
        },
        propsForBackgroundLines: {
          strokeDasharray: "",
          stroke: "#f0f0f0",
          strokeWidth: 0.5,
        },
        propsForLabels: {
          fontSize: isSmall ? 8 : 12,
        },
        decimalPlaces: 0,
        formatYLabel: (y) => Math.round(y).toString(),
        chartPadding: isSmall
          ? { top: 0, right: 0, bottom: 0, left: 35 }
          : { top: 10, right: 10, bottom: 0, left: 0 },
      }}
      bezier
      style={styles.chart}
      yAxisInterval={3}
      segments={3}
      fromZero
      yAxisMax={21}
      xLabelsOffset={0}
      hidePointsAtIndex={[]}
    />
  );

  return (
    <>
      {/* Clickable Header to Open Full Screen */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsFullScreen(true)}
        style={styles.headerButton}
      >
        <Text variant="titleMedium" style={styles.headerText}>
          📊 Scoring Progression
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtext}>
          Tap to view detailed breakdown
        </Text>
      </TouchableOpacity>

      {/* Full-Screen Modal */}
      <Modal
        visible={isFullScreen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsFullScreen(false)}
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <Text variant="headlineMedium" style={styles.fullScreenTitle}>
              Scoring Progression
            </Text>
            <IconButton
              icon="close"
              size={28}
              onPress={() => setIsFullScreen(false)}
              style={styles.closeButton}
            />
          </View>

          <ScrollView
            style={styles.fullScreenContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: player1Color.colors[0] || "#2196F3" },
                  ]}
                />
                <Text variant="bodySmall" style={styles.legendText}>
                  {player1Name}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: player2Color.colors[0] || "#4CAF50" },
                  ]}
                />
                <Text variant="bodySmall" style={styles.legendText}>
                  {player2Name}
                </Text>
              </View>
            </View>

            <View style={styles.fullScreenChartContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
              >
                {renderChart(chartWidth, 350)}
              </ScrollView>
            </View>

            <View style={styles.analysisContainer}>
              <Text variant="bodySmall" style={styles.analysisLabel}>
                💡 Complete Analysis:
              </Text>
              <Text variant="bodySmall" style={styles.analysisText}>
                This graph shows the cumulative score progression throughout the
                match using cancellation scoring. Only the round winner's line
                moves each round, showing the net points they earned (the
                difference between their round score and opponent's round
                score).
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.analysisText, { marginTop: 8 }]}
              >
                • Steep rises = Momentum swings and comebacks
              </Text>
              <Text variant="bodySmall" style={[styles.analysisText]}>
                • Flat sections = Opponent scored while you didn't
              </Text>
              <Text variant="bodySmall" style={[styles.analysisText]}>
                • Who was winning for how long and if they "choked"
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  headerText: {
    fontWeight: "600",
    marginBottom: 4,
  },
  headerSubtext: {
    color: "#666",
  },
  container: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  chartTitleContainer: {
    marginBottom: 12,
  },
  chartTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  chartSubtitle: {
    color: "#666",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    color: "#333",
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  scrollContainer: {
    width: "100%",
  },
  chart: {
    marginVertical: 8,
  },
  analysisContainer: {
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#f0f7ff",
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
    borderRadius: 4,
  },
  analysisLabel: {
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 4,
  },
  analysisText: {
    color: "#555",
    lineHeight: 18,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fullScreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  fullScreenTitle: {
    fontWeight: "600",
    fontSize: 18,
  },
  closeButton: {
    margin: 0,
  },
  fullScreenContent: {
    flex: 1,
    padding: 16,
  },
  fullScreenChartContainer: {
    marginVertical: 16,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    overflow: "hidden",
  },
});
