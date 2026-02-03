import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Surface,
  useTheme,
  Chip,
  Dialog,
  Divider,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../contexts/AuthContext";
import { usePlayerPreferences } from "../contexts/PlayerPreferencesContext";
import { POPDARTS_COLORS } from "../constants/colors";

/**
 * New Match screen - Score a Popdarts match with advanced features
 * Supports 1v1, 2v2, tournament, and quick play modes
 */
export default function NewMatchScreen({ navigation, route }) {
  const theme = useTheme();
  const { user, isGuest, guestName } = useAuth();
  const { ownedColors, favoriteHomeColor, favoriteAwayColor } =
    usePlayerPreferences();

  const currentUserName =
    user?.user_metadata?.display_name || guestName || "You";

  // Match type selection
  const [matchType, setMatchType] = useState(null); // 'casual' or 'official'
  const [editionType, setEditionType] = useState(null); // 'classic' or 'board'
  const [gameFormat, setGameFormat] = useState(null); // 'single' or 'tournament'
  const [matchMode, setMatchMode] = useState(null); // '1v1', '2v2', or 'party'

  // Player setup
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]); // For 2v2 mode
  const [player1Name, setPlayer1Name] = useState(currentUserName);
  const [player2Name, setPlayer2Name] = useState("");
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [matchStarted, setMatchStarted] = useState(false);
  const [error, setError] = useState("");

  // Color picker modal state
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(null);

  // Scoring mode toggle
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);

  // Stats tracking - Popdarts special throws
  const [player1Stats, setPlayer1Stats] = useState({
    wiggleNobbers: 0,
    tNobbers: 0,
    fenderBenders: 0,
    inchWorms: 0,
    lippies: 0,
    tower: 0,
    roundsWon: 0,
  });
  const [player2Stats, setPlayer2Stats] = useState({
    wiggleNobbers: 0,
    tNobbers: 0,
    fenderBenders: 0,
    inchWorms: 0,
    lippies: 0,
    tower: 0,
    roundsWon: 0,
  });
  const [showStatsDialog, setShowStatsDialog] = useState(null); // null, 'player1', or 'player2'
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);

  // Simplified scoring inputs (overlay)
  const [showSimplifiedOverlay, setShowSimplifiedOverlay] = useState(false);
  const [simplifiedP1Darts, setSimplifiedP1Darts] = useState(0);
  const [simplifiedP2Darts, setSimplifiedP2Darts] = useState(0);
  const [closestPlayer, setClosestPlayer] = useState(null); // 1 or 2

  // Pre-game and first thrower
  const [showPreGame, setShowPreGame] = useState(false);
  const [firstThrower, setFirstThrower] = useState(null); // 1 or 2
  const [coinFlipWinner, setCoinFlipWinner] = useState(null); // 1 or 2

  // Player colors for progress bars and backgrounds
  const [player1Color, setPlayer1Color] = useState("#2196F3");
  const [player2Color, setPlayer2Color] = useState("#4CAF50");
  const [player1ColorObj, setPlayer1ColorObj] = useState(POPDARTS_COLORS[0]);
  const [player2ColorObj, setPlayer2ColorObj] = useState(POPDARTS_COLORS[1]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);

  // Tournament state
  const [tournamentPlayers, setTournamentPlayers] = useState([]);
  const [tournamentBracket, setTournamentBracket] = useState(null);
  const [currentTournamentMatch, setCurrentTournamentMatch] = useState(null);
  const [pausedTournamentMatch, setPausedTournamentMatch] = useState(null); // Match paused but in progress
  const [showBracket, setShowBracket] = useState(false);
  const [bracketZoom, setBracketZoom] = useState(1);
  const [showMatchResults, setShowMatchResults] = useState(false);
  const [selectedMatchResults, setSelectedMatchResults] = useState(null);
  const [matchPositions, setMatchPositions] = useState({});
  const [roundXOffsets, setRoundXOffsets] = useState({});
  const [calculatedYPositions, setCalculatedYPositions] = useState({}); // Store measured positions for SVG lines

  // Win dialog
  const [winner, setWinner] = useState(null);

  // Match Type Selection for 1v1 Lobby
  const [lobbyMatchType, setLobbyMatchType] = useState("friendly"); // 'friendly' or 'casual-competitive'

  // Pulsing animation for paused matches
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Hide tab bar when in active game, show it in lobby
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: matchStarted ? { display: "none" } : undefined,
    });
  }, [matchStarted, navigation]);

  // Auto-select closest player logic
  useEffect(() => {
    // If only Player 1 has darts, auto-select them
    if (simplifiedP1Darts > 0 && simplifiedP2Darts === 0) {
      setClosestPlayer(1);
    }
    // If only Player 2 has darts, auto-select them
    else if (simplifiedP2Darts > 0 && simplifiedP1Darts === 0) {
      setClosestPlayer(2);
    }
    // If both have darts, clear selection (require manual selection)
    else if (simplifiedP1Darts > 0 && simplifiedP2Darts > 0) {
      setClosestPlayer(null);
    }
    // If neither has darts, clear selection
    else {
      setClosestPlayer(null);
    }
  }, [simplifiedP1Darts, simplifiedP2Darts]);

  /**
   * Handle Quick Play navigation params
   * Automatically sets up game format for immediate play
   */
  useEffect(() => {
    if (route?.params?.quickPlay) {
      const { gameFormat, edition, matchType } = route.params;

      // Set all states to skip directly to 1v1 lobby
      setMatchType(matchType || "casual");
      setEditionType(edition || "classic");
      setGameFormat("single"); // Single match, not tournament
      setMatchMode(gameFormat || "1v1");

      // Set Player 1's color to favorite home color if available (using index)
      const player1ColorIndex =
        favoriteHomeColor !== null && typeof favoriteHomeColor === "number"
          ? favoriteHomeColor
          : 0;
      const player1ColorObject = POPDARTS_COLORS[player1ColorIndex];

      // Initialize player names
      setPlayer1Name(currentUserName);
      setPlayer2Name("");

      // Set color objects - Player 1 has color, Player 2 starts with none
      setPlayer1ColorObj(player1ColorObject);
      setPlayer2ColorObj(null);
      setPlayer1Color(player1ColorObject.colors[0]);
      setPlayer2Color("#CCCCCC"); // Gray default for unselected

      // Initialize players array for 1v1 lobby (matching initializeLobby behavior)
      setPlayers([
        {
          id: 1,
          name: currentUserName,
          color: player1ColorObject,
        },
        {
          id: 2,
          name: "",
          color: null, // Player 2 starts with no color
        },
      ]);
    }
  }, [route?.params]);

  /**
   * Convert internal bracket to GitHub README format (seeds/teams)
   */
  const convertToSeedsFormat = () => {
    if (!tournamentBracket) return [];

    return tournamentBracket.rounds.map((round, roundIndex) => ({
      title:
        roundIndex === tournamentBracket.totalRounds - 1
          ? "🏆 Finals"
          : roundIndex === tournamentBracket.totalRounds - 2
            ? "Semi-Finals"
            : roundIndex === tournamentBracket.totalRounds - 3
              ? "Quarter-Finals"
              : `Round ${roundIndex + 1}`,
      seeds: round.map((match) => ({
        id: match.id,
        teams: [
          match.player1 && match.player1.name
            ? {
                id: match.player1.name,
                name: match.player1.name,
                color: match.player1.color,
              }
            : {},
          match.player2 && match.player2.name
            ? {
                id: match.player2.name,
                name: match.player2.name,
                color: match.player2.color,
              }
            : {},
        ],
        winnerId: match.winner?.name || null,
        scores: [
          pausedTournamentMatch && pausedTournamentMatch.id === match.id
            ? pausedTournamentMatch.pausedPlayer1Score
            : match.player1Score,
          pausedTournamentMatch && pausedTournamentMatch.id === match.id
            ? pausedTournamentMatch.pausedPlayer2Score
            : match.player2Score,
        ],
        completed: match.completed,
        inProgress:
          pausedTournamentMatch && pausedTournamentMatch.id === match.id,
        matchData: match, // Store full match data
        onPress: () => {
          if (match.completed) {
            // View completed match results
            setSelectedMatchResults(match);
            setShowMatchResults(true);
          } else if (
            pausedTournamentMatch &&
            pausedTournamentMatch.id === match.id
          ) {
            // Resume paused match
            resumeTournamentMatch();
          } else if (
            match.player1 &&
            match.player2 &&
            !match.player1.isBye &&
            !match.player2.isBye &&
            match.player1.name &&
            match.player2.name
          ) {
            // Start new match
            startTournamentMatch(match);
          }
        },
      })),
    }));
  };

  // Initialize tournament with current user when tournament format is selected
  useEffect(() => {
    if (gameFormat === "tournament" && tournamentPlayers.length === 0) {
      // Find the home color object from POPDARTS_COLORS
      const homeColorObj = favoriteHomeColor
        ? POPDARTS_COLORS.find((c) => c.name === favoriteHomeColor) ||
          POPDARTS_COLORS[0]
        : POPDARTS_COLORS[0];

      setTournamentPlayers([
        {
          name: currentUserName,
          color: homeColorObj,
        },
      ]);
    }
  }, [gameFormat]);

  // Pulsing animation for paused tournament matches
  useEffect(() => {
    if (pausedTournamentMatch) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [pausedTournamentMatch]);

  // Check for winner when scores change
  useEffect(() => {
    if (player1Score >= 21) {
      setWinner(1);
    } else if (player2Score >= 21) {
      setWinner(2);
    }
  }, [player1Score, player2Score]);

  const startMatch = () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      setError("Please enter both player names");
      return;
    }
    setError("");
    setMatchStarted(true);
  };

  const addPoints = (player, points) => {
    if (player === 1) {
      const newScore = Math.min(player1Score + points, 21);
      setPlayer1Score(newScore);
    } else {
      const newScore = Math.min(player2Score + points, 21);
      setPlayer2Score(newScore);
    }
  };

  const incrementScore = (player) => {
    addPoints(player, 1);
  };

  const decrementScore = (player) => {
    if (player === 1 && player1Score > 0) {
      setPlayer1Score(player1Score - 1);
    } else if (player === 2 && player2Score > 0) {
      setPlayer2Score(player2Score - 1);
    }
  };

  const submitSimplifiedRound = () => {
    const p1Darts = simplifiedP1Darts;
    const p2Darts = simplifiedP2Darts;

    if (p1Darts === 0 && p2Darts === 0) {
      setError("Please select dart counts");
      return;
    }

    if (closestPlayer === null && p1Darts > 0 && p2Darts > 0) {
      setError("Please select who was closest");
      return;
    }

    setError("");

    // Scoring: Each dart = 1 point, but if closest, ONE dart is worth 3 points instead of 1
    // So closest bonus is +2 points (making one dart worth 3 instead of 1)
    let p1Points = p1Darts;
    let p2Points = p2Darts;

    if (closestPlayer === 1) {
      p1Points += 2; // One dart becomes 3pts instead of 1pt
    } else if (closestPlayer === 2) {
      p2Points += 2; // One dart becomes 3pts instead of 1pt
    }

    // Calculate net score (cancellation)
    const netScore = Math.abs(p1Points - p2Points);

    if (p1Points > p2Points) {
      setPlayer1Score(player1Score + netScore);
      setPlayer1Stats({
        ...player1Stats,
        roundsWon: player1Stats.roundsWon + 1,
      });
    } else if (p2Points > p1Points) {
      setPlayer2Score(player2Score + netScore);
      setPlayer2Stats({
        ...player2Stats,
        roundsWon: player2Stats.roundsWon + 1,
      });
    }

    // Reset round inputs and close overlay
    setSimplifiedP1Darts(0);
    setSimplifiedP2Darts(0);
    setClosestPlayer(null);
    setShowSimplifiedOverlay(false);
  };

  const addStat = (player, statType) => {
    if (player === 1) {
      setPlayer1Stats({
        ...player1Stats,
        [statType]: player1Stats[statType] + 1,
      });
    } else {
      setPlayer2Stats({
        ...player2Stats,
        [statType]: player2Stats[statType] + 1,
      });
    }
  };

  const resetMatch = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPlayer1Stats({
      wiggleNobbers: 0,
      tNobbers: 0,
      fenderBenders: 0,
      inchWorms: 0,
      lippies: 0,
      tower: 0,
      roundsWon: 0,
    });
    setPlayer2Stats({
      wiggleNobbers: 0,
      tNobbers: 0,
      fenderBenders: 0,
      inchWorms: 0,
      lippies: 0,
      tower: 0,
      roundsWon: 0,
    });
    setSimplifiedP1Darts(0);
    setSimplifiedP2Darts(0);
    setClosestPlayer(null);
    setWinner(null);
    setShowSimplifiedOverlay(false);
  };

  const saveMatch = async () => {
    // Tournament mode: advance winner
    if (gameFormat === "tournament" && currentTournamentMatch) {
      advanceTournamentWinner();
      return;
    }

    // Regular match save
    // TODO: Save match to Supabase with stats
    console.log("Saving match:", {
      player1Name,
      player1Score,
      player1Stats,
      player2Name,
      player2Score,
      player2Stats,
    });

    // Close dialog first
    setWinner(null);

    // Navigate back home
    navigation.navigate("Home");
  };

  /**
   * Generate tournament bracket from players
   */
  const generateBracket = (players) => {
    // Shuffle players for randomization
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Determine bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
    const byesNeeded = bracketSize - shuffled.length;

    const totalRounds = Math.log2(bracketSize);
    const allRounds = [];

    // Create first round matches
    // Players who get BYEs will be placed in Round 2 directly
    const firstRoundPlayers = [];
    const byePlayers = [];

    // Distribute BYEs at the top and bottom of bracket for balance
    for (let i = 0; i < shuffled.length; i++) {
      if (
        byePlayers.length < byesNeeded &&
        (i < Math.ceil(byesNeeded / 2) ||
          i >= shuffled.length - Math.floor(byesNeeded / 2))
      ) {
        byePlayers.push(shuffled[i]);
      } else {
        firstRoundPlayers.push(shuffled[i]);
      }
    }

    // Create first round matches (only real players, no BYE vs BYE)
    const firstRound = [];
    for (let i = 0; i < firstRoundPlayers.length; i += 2) {
      if (i + 1 < firstRoundPlayers.length) {
        firstRound.push({
          id: `r1-m${i / 2}`,
          round: 1,
          matchNumber: i / 2,
          player1: firstRoundPlayers[i],
          player2: firstRoundPlayers[i + 1],
          player1Score: null,
          player2Score: null,
          winner: null,
          completed: false,
        });
      }
    }

    allRounds.push(firstRound);

    // Create ALL subsequent rounds with placeholder matches
    for (let roundNum = 2; roundNum <= totalRounds; roundNum++) {
      const previousRound = allRounds[roundNum - 2];
      const roundMatches = [];
      const matchesInRound = Math.pow(2, totalRounds - roundNum);

      for (let i = 0; i < matchesInRound; i++) {
        // For round 2, inject BYE players
        let player1 = null;
        let player2 = null;
        let sourceMatch1 = null;
        let sourceMatch2 = null;

        if (roundNum === 2) {
          // Match first round winners with BYE players
          const prevMatchIndex1 = i * 2;
          const prevMatchIndex2 = i * 2 + 1;

          if (prevMatchIndex1 < previousRound.length) {
            sourceMatch1 = previousRound[prevMatchIndex1].id;
            player1 = previousRound[prevMatchIndex1].winner;
          } else if (byePlayers[prevMatchIndex1 - previousRound.length]) {
            // This position gets a BYE player
            player1 = byePlayers[prevMatchIndex1 - previousRound.length];
          }

          if (prevMatchIndex2 < previousRound.length) {
            sourceMatch2 = previousRound[prevMatchIndex2].id;
            player2 = previousRound[prevMatchIndex2].winner;
          } else if (byePlayers[prevMatchIndex2 - previousRound.length]) {
            // This position gets a BYE player
            player2 = byePlayers[prevMatchIndex2 - previousRound.length];
          }
        } else {
          // Subsequent rounds reference previous round matches
          const prevMatchIndex1 = i * 2;
          const prevMatchIndex2 = i * 2 + 1;

          if (prevMatchIndex1 < previousRound.length) {
            sourceMatch1 = previousRound[prevMatchIndex1].id;
            player1 = previousRound[prevMatchIndex1].winner;
          }

          if (prevMatchIndex2 < previousRound.length) {
            sourceMatch2 = previousRound[prevMatchIndex2].id;
            player2 = previousRound[prevMatchIndex2].winner;
          }
        }

        roundMatches.push({
          id: `r${roundNum}-m${i}`,
          round: roundNum,
          matchNumber: i,
          player1: player1,
          player2: player2,
          player1Score: null,
          player2Score: null,
          winner: null,
          completed: false,
          sourceMatch1: sourceMatch1,
          sourceMatch2: sourceMatch2,
        });
      }

      allRounds.push(roundMatches);
    }

    return {
      rounds: allRounds,
      currentRound: 1,
      totalRounds: totalRounds,
    };
  };

  /**
   * Start tournament match
   */
  const startTournamentMatch = (match) => {
    if (match.player1.isBye || match.player2.isBye || match.completed) return;

    setCurrentTournamentMatch(match);
    setPlayer1Name(match.player1.name);
    setPlayer2Name(match.player2.name);
    setPlayer1ColorObj(match.player1.color);
    setPlayer2ColorObj(match.player2.color);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setMatchStarted(true);
    setShowBracket(false);
    setPausedTournamentMatch(null); // Clear any paused match
  };

  /**
   * Resume paused tournament match
   */
  const resumeTournamentMatch = () => {
    if (!pausedTournamentMatch) return;

    setCurrentTournamentMatch(pausedTournamentMatch);
    setPlayer1Name(pausedTournamentMatch.player1.name);
    setPlayer2Name(pausedTournamentMatch.player2.name);
    setPlayer1ColorObj(pausedTournamentMatch.player1.color);
    setPlayer2ColorObj(pausedTournamentMatch.player2.color);
    setPlayer1Score(pausedTournamentMatch.pausedPlayer1Score || 0);
    setPlayer2Score(pausedTournamentMatch.pausedPlayer2Score || 0);
    setMatchStarted(true);
    setShowBracket(false);
  };

  /**
   * Advance tournament winner to next round
   */
  const advanceTournamentWinner = () => {
    const winnerPlayer =
      winner === 1
        ? { ...currentTournamentMatch.player1 }
        : { ...currentTournamentMatch.player2 };

    // Update current match with scores
    const updatedBracket = { ...tournamentBracket };
    const currentRoundMatches =
      updatedBracket.rounds[currentTournamentMatch.round - 1];
    const matchIndex = currentRoundMatches.findIndex(
      (m) => m.id === currentTournamentMatch.id,
    );
    currentRoundMatches[matchIndex].winner = winnerPlayer;
    currentRoundMatches[matchIndex].player1Score = player1Score;
    currentRoundMatches[matchIndex].player2Score = player2Score;
    currentRoundMatches[matchIndex].completed = true;

    // Update next round matches with the winner
    if (currentTournamentMatch.round < updatedBracket.totalRounds) {
      const nextRoundIndex = currentTournamentMatch.round;
      const nextRound = updatedBracket.rounds[nextRoundIndex];

      // Find which match in next round this winner advances to
      nextRound.forEach((nextMatch) => {
        if (nextMatch.sourceMatch1 === currentTournamentMatch.id) {
          nextMatch.player1 = winnerPlayer;
        } else if (nextMatch.sourceMatch2 === currentTournamentMatch.id) {
          nextMatch.player2 = winnerPlayer;
        }
      });
    }

    setTournamentBracket(updatedBracket);
    setWinner(null);
    setMatchStarted(false);
    setShowBracket(true);
    setPausedTournamentMatch(null); // Clear paused state when match completes

    // Check if tournament is complete
    if (currentTournamentMatch.round === updatedBracket.totalRounds) {
      // Tournament winner!
      alert(`🏆 Tournament Champion: ${winnerPlayer.name}! 🏆`);
    }
  };

  /**
   * Get next unplayed match in tournament
   */
  const getNextTournamentMatch = () => {
    for (const round of tournamentBracket.rounds) {
      for (const match of round) {
        if (!match.completed && !match.player1.isBye && !match.player2.isBye) {
          return match;
        }
      }
    }
    return null;
  };

  const backToSetup = () => {
    setMatchStarted(false);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPlayer1Stats({
      wiggleNobbers: 0,
      tNobbers: 0,
      fenderBenders: 0,
      inchWorms: 0,
      lippies: 0,
      tower: 0,
      roundsWon: 0,
    });
    setPlayer2Stats({
      wiggleNobbers: 0,
      tNobbers: 0,
      fenderBenders: 0,
      inchWorms: 0,
      lippies: 0,
      tower: 0,
      roundsWon: 0,
    });
    setWinner(null);
    setShowBackConfirmation(false);
  };

  const initializeLobby = (mode) => {
    setMatchMode(mode);
    if (mode === "1v1") {
      // Set Player 1's color to favorite home color if available
      const player1ColorIndex =
        favoriteHomeColor !== null ? favoriteHomeColor : 0;
      const player1ColorObject = POPDARTS_COLORS[player1ColorIndex];

      setPlayers([
        { id: 1, name: currentUserName, color: player1ColorObject },
        { id: 2, name: "", color: null }, // Player 2 starts with no color
      ]);
      setPlayer1Color(player1ColorObject.colors[0]);
      setPlayer2Color("#CCCCCC"); // Gray default for unselected
      setPlayer1ColorObj(player1ColorObject);
      setPlayer2ColorObj(null);
    } else if (mode === "2v2") {
      setTeams([
        {
          id: 1,
          name: "Team 1",
          color: POPDARTS_COLORS[0],
          players: [
            { id: 1, name: currentUserName },
            { id: 2, name: "" },
          ],
        },
        {
          id: 2,
          name: "Team 2",
          color: POPDARTS_COLORS[1],
          players: [
            { id: 3, name: "" },
            { id: 4, name: "" },
          ],
        },
      ]);
      setPlayer1Color(POPDARTS_COLORS[0].colors[0]);
      setPlayer2Color(POPDARTS_COLORS[1].colors[0]);
      setPlayer1ColorObj(POPDARTS_COLORS[0]);
      setPlayer2ColorObj(POPDARTS_COLORS[1]);
    } else if (mode === "party") {
      setPlayers([
        { id: 1, name: currentUserName, color: POPDARTS_COLORS[0] },
        { id: 2, name: "", color: POPDARTS_COLORS[1] },
        { id: 3, name: "", color: POPDARTS_COLORS[2] },
      ]);
      setPlayer1Color(POPDARTS_COLORS[0].colors[0]);
      setPlayer2Color(POPDARTS_COLORS[1].colors[0]);
      setPlayer1ColorObj(POPDARTS_COLORS[0]);
      setPlayer2ColorObj(POPDARTS_COLORS[9]);
    }
  };

  // Pre-Game Modal (rendered at component level)
  const renderPreGameModal = () => (
    <Modal visible={showPreGame} animationType="slide" transparent>
      <View style={styles.preGameOverlay}>
        <View style={styles.preGameContainer}>
          <Text style={styles.preGameTitle}>Pre-Game Setup</Text>
          <Text style={styles.preGameInstruction}>
            Flip a coin or play Rock-Paper-Scissors to determine who gets first
            choice
          </Text>

          {/* Winner Selection */}
          {coinFlipWinner === null ? (
            <View style={styles.preGameWinnerSection}>
              <Text style={styles.preGameLabel}>Who won?</Text>
              <View style={styles.preGameButtonsRow}>
                <TouchableOpacity
                  style={styles.preGamePlayerButton}
                  onPress={() => setCoinFlipWinner(1)}
                >
                  <Text style={styles.preGamePlayerButtonText}>
                    {player1Name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.preGamePlayerButton}
                  onPress={() => setCoinFlipWinner(2)}
                >
                  <Text style={styles.preGamePlayerButtonText}>
                    {player2Name}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.preGameWinnerText}>
                {coinFlipWinner === 1 ? player1Name : player2Name} won!
              </Text>
              <Text style={styles.preGameChoiceLabel}>What do you choose?</Text>
              <View style={styles.preGameButtonsColumn}>
                <TouchableOpacity
                  style={styles.preGameChoiceButton}
                  onPress={() => {
                    setFirstThrower(coinFlipWinner);
                    setCoinFlipWinner(null);
                    setShowPreGame(false);
                    setMatchStarted(true);
                  }}
                >
                  <Text style={styles.preGameChoiceButtonText}>Go First</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.preGameChoiceButton}
                  onPress={() => {
                    // If winner chooses side, opponent goes first
                    setFirstThrower(coinFlipWinner === 1 ? 2 : 1);
                    setCoinFlipWinner(null);
                    setShowPreGame(false);
                    setMatchStarted(true);
                  }}
                >
                  <Text style={styles.preGameChoiceButtonText}>
                    Choose Side
                  </Text>
                  <Text style={styles.preGameChoiceSubtext}>
                    (Opponent goes first)
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderMatchResultsModal = () => {
    if (!selectedMatchResults) return null;

    const match = selectedMatchResults;
    const isCasual = matchType === "casual";

    return (
      <Modal visible={showMatchResults} animationType="slide" transparent>
        <View style={styles.preGameOverlay}>
          <View style={styles.preGameContainer}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={styles.preGameTitle}>Match Results</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  setShowMatchResults(false);
                  setSelectedMatchResults(null);
                  setCurrentTournamentMatch(null); // Clear to prevent auto-complete bug
                }}
              />
            </View>

            {/* Winner Banner */}
            <Surface style={styles.winnerBanner} elevation={2}>
              <Text style={styles.winnerLabel}>🏆 Winner</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                {match.winner?.color && (
                  <View style={[styles.colorIndicator, { marginRight: 10 }]}>
                    {match.winner.color.isGradient ? (
                      <LinearGradient
                        colors={match.winner.color.colors}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.colorGradient}
                      />
                    ) : (
                      <View
                        style={[
                          styles.colorSolid,
                          { backgroundColor: match.winner.color.colors[0] },
                        ]}
                      />
                    )}
                  </View>
                )}
                <Text style={styles.winnerName}>{match.winner?.name}</Text>
              </View>
            </Surface>

            {/* Match Summary */}
            <View style={styles.matchSummaryCard}>
              <Text style={styles.matchSummaryTitle}>Final Score</Text>

              {/* Player 1 */}
              <View
                style={[
                  styles.playerResultRow,
                  match.winner?.name === match.player1.name &&
                    styles.playerResultRowWinner,
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  {match.player1.color && (
                    <View
                      style={[
                        styles.colorIndicator,
                        { marginRight: 8, width: 16, height: 16 },
                      ]}
                    >
                      {match.player1.color.isGradient ? (
                        <LinearGradient
                          colors={match.player1.color.colors}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.colorGradient}
                        />
                      ) : (
                        <View
                          style={[
                            styles.colorSolid,
                            { backgroundColor: match.player1.color.colors[0] },
                          ]}
                        />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.playerResultName,
                      match.winner?.name === match.player1.name &&
                        styles.playerResultNameWinner,
                    ]}
                  >
                    {match.player1.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.playerResultScore,
                    match.winner?.name === match.player1.name &&
                      styles.playerResultScoreWinner,
                  ]}
                >
                  {match.player1Score}
                </Text>
              </View>

              {/* Player 2 */}
              <View
                style={[
                  styles.playerResultRow,
                  match.winner?.name === match.player2.name &&
                    styles.playerResultRowWinner,
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  {match.player2.color && (
                    <View
                      style={[
                        styles.colorIndicator,
                        { marginRight: 8, width: 16, height: 16 },
                      ]}
                    >
                      {match.player2.color.isGradient ? (
                        <LinearGradient
                          colors={match.player2.color.colors}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.colorGradient}
                        />
                      ) : (
                        <View
                          style={[
                            styles.colorSolid,
                            { backgroundColor: match.player2.color.colors[0] },
                          ]}
                        />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.playerResultName,
                      match.winner?.name === match.player2.name &&
                        styles.playerResultNameWinner,
                    ]}
                  >
                    {match.player2.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.playerResultScore,
                    match.winner?.name === match.player2.name &&
                      styles.playerResultScoreWinner,
                  ]}
                >
                  {match.player2Score}
                </Text>
              </View>
            </View>

            {/* Mode-specific details */}
            {!isCasual && (
              <View style={styles.statsComingSoon}>
                <Text style={styles.statsComingSoonTitle}>
                  📊 Detailed Statistics
                </Text>
                <Text style={styles.statsComingSoonText}>
                  Round breakdowns, accuracy %, and advanced stats coming soon!
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={() => {
                setShowMatchResults(false);
                setSelectedMatchResults(null);
              }}
              style={{ marginTop: 20 }}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
    );
  };

  if (!matchStarted) {
    // Step 1: Match Type Selection (Casual vs Official)
    if (!matchType) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.largeButtonContainer}>
            <Text variant="headlineLarge" style={styles.titleCentered}>
              Select Match Type
            </Text>

            <TouchableOpacity
              onPress={() => setMatchType("casual")}
              style={styles.largeImageButton}
            >
              <ImageBackground
                source={require("../../assets/image_22600.jpg")}
                style={styles.imageBackground}
                resizeMode="cover"
              >
                <View style={styles.imageOverlay}>
                  <Text style={styles.overlayText}>Casual</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              disabled
              style={[styles.largeImageButton, styles.largeImageButtonDisabled]}
            >
              <ImageBackground
                source={require("../../assets/APL_Hero_2.0_Banner.jpg")}
                style={styles.imageBackground}
                resizeMode="cover"
              >
                <View style={styles.imageOverlay}>
                  <Text style={styles.overlayText}>Official</Text>
                  <Text style={styles.comingSoonText}>(Coming Soon)</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.cancelButtonAbsolute}
            >
              Cancel
            </Button>
          </View>
          {renderPreGameModal()}
        </SafeAreaView>
      );
    }

    // Step 2: Edition Selection (Classic vs Board)
    if (!editionType) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.largeButtonContainer}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setMatchType(null)}
              style={styles.backButtonAbsolute}
            />
            <Text variant="headlineLarge" style={styles.titleCentered}>
              Select Edition
            </Text>

            <TouchableOpacity
              onPress={() => setEditionType("classic")}
              style={styles.largeImageButton}
            >
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>📸 Image Coming Soon</Text>
              </View>
              <Text style={styles.largeButtonText}>Classic Edition</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled
              style={[styles.largeImageButton, styles.largeImageButtonDisabled]}
            >
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>📸 Image Coming Soon</Text>
              </View>
              <Text style={[styles.largeButtonText, styles.disabledButtonText]}>
                Board Edition (Coming Soon)
              </Text>
            </TouchableOpacity>
          </View>
          {renderPreGameModal()}
        </SafeAreaView>
      );
    }

    // Step 3: Game Format Selection (Single Match vs Tournament)
    if (!gameFormat) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.largeButtonContainer}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setEditionType(null)}
              style={styles.backButtonAbsolute}
            />
            <Text variant="headlineLarge" style={styles.titleCentered}>
              Select Game Format
            </Text>

            <TouchableOpacity
              onPress={() => setGameFormat("single")}
              style={styles.largeImageButton}
            >
              <Image
                source={require("../../assets/versus.jpg")}
                style={styles.buttonImage}
                resizeMode="cover"
              />
              <Text style={styles.largeButtonText}>Single Match</Text>
              <Text style={styles.largeButtonSubtext}>
                Play one match (1v1, 2v2, or Party)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setGameFormat("tournament")}
              style={styles.largeImageButton}
            >
              <Image
                source={require("../../assets/tournament-bracket.jpg")}
                style={styles.buttonImage}
                resizeMode="cover"
              />
              <Text style={styles.largeButtonText}>Tournament Bracket</Text>
              <Text style={styles.largeButtonSubtext}>
                Quick tournament with friends
              </Text>
            </TouchableOpacity>
          </View>
          {renderPreGameModal()}
        </SafeAreaView>
      );
    }

    // Step 4: Match Mode Selection (1v1, 2v2, Party) - Only for single matches
    if (gameFormat === "single" && !matchMode) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.largeButtonContainer}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setGameFormat(null)}
              style={styles.backButtonAbsolute}
            />
            <Text variant="headlineLarge" style={styles.titleCentered}>
              Select Match Mode
            </Text>

            <TouchableOpacity
              onPress={() => initializeLobby("1v1")}
              style={styles.mediumImageButton}
            >
              <View style={styles.imagePlaceholderSmall}>
                <Text style={styles.placeholderTextSmall}>
                  📸 Image Coming Soon
                </Text>
              </View>
              <Text style={styles.mediumButtonText}>1v1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled
              style={[
                styles.mediumImageButton,
                styles.largeImageButtonDisabled,
              ]}
            >
              <View style={styles.imagePlaceholderSmall}>
                <Text style={styles.placeholderTextSmall}>
                  📸 Image Coming Soon
                </Text>
              </View>
              <Text
                style={[styles.mediumButtonText, styles.disabledButtonText]}
              >
                2v2 (Coming Soon)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled
              style={[
                styles.mediumImageButton,
                styles.largeImageButtonDisabled,
              ]}
            >
              <View style={styles.imagePlaceholderSmall}>
                <Text style={styles.placeholderTextSmall}>
                  📸 Image Coming Soon
                </Text>
              </View>
              <Text
                style={[styles.mediumButtonText, styles.disabledButtonText]}
              >
                Party (Coming Soon)
              </Text>
            </TouchableOpacity>
          </View>
          {renderPreGameModal()}
        </SafeAreaView>
      );
    }

    // Step 4b: Tournament Bracket Setup (if tournament format selected)
    if (gameFormat === "tournament") {
      // Show bracket view if bracket exists
      if (showBracket && tournamentBracket) {
        const rounds = convertToSeedsFormat();

        return (
          <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.bracketHeader}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => {
                  setShowBracket(false);
                  setTournamentBracket(null);
                  setTournamentPlayers([]);
                }}
              />
              <Text variant="headlineMedium" style={styles.bracketHeaderTitle}>
                Tournament Bracket
              </Text>
            </View>

            {/* Bracket Display */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ padding: 20 }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                {rounds.map((round, roundIndex) => {
                  const matchHeight = 150; // Even larger to accommodate all content variations
                  const matchGap = 50; // Much larger gap for proper visual separation
                  const cardWidth = 220; // Match card width
                  const connectorWidth = 80; // Space between rounds (marginRight)

                  // Calculate grid row positions for each match in this round
                  // Round 1: matches at rows 0, 1, 2, 3...
                  // Round 2: matches at rows 0.5, 2.5, 4.5... (midpoints between R1 matches)
                  // Round 3: matches at rows 1.5, 5.5... (midpoints between R2 matches)
                  const getMatchRow = (matchIndex) => {
                    // Each subsequent round is staggered by half
                    const offset = Math.pow(2, roundIndex) - 1; // 0, 1, 3, 7...
                    const spacing = Math.pow(2, roundIndex); // 1, 2, 4, 8...
                    return offset + matchIndex * spacing;
                  };

                  // Convert row to Y position
                  const rowToY = (row) => row * (matchHeight + matchGap);

                  // Calculate minimum height needed for this round
                  const lastMatchRow =
                    round.seeds.length > 0
                      ? getMatchRow(round.seeds.length - 1)
                      : 0;
                  const minHeight = rowToY(lastMatchRow) + matchHeight + 50; // +50 for padding

                  return (
                    <View
                      key={roundIndex}
                      style={{
                        marginRight: connectorWidth,
                        minWidth: cardWidth,
                        minHeight: minHeight,
                      }}
                      onLayout={(event) => {
                        const { x } = event.nativeEvent.layout;
                        setRoundXOffsets((prev) => ({
                          ...prev,
                          [roundIndex]: x,
                        }));
                      }}
                    >
                      {/* Round Title */}
                      <Text style={styles.roundLabel}>{round.title}</Text>

                      {/* Seeds (Matches) */}
                      <View
                        style={{
                          marginTop: 15,
                          position: "relative",
                          minHeight: minHeight - 50,
                        }}
                      >
                        {round.seeds.map((seed, seedIndex) => {
                          const team1 = seed.teams[0] || {};
                          const team2 = seed.teams[1] || {};

                          // Calculate Y position dynamically based on source matches
                          let yPosition;

                          if (roundIndex === 0) {
                            // First round: use grid-based position
                            const gridRow = getMatchRow(seedIndex);
                            yPosition = rowToY(gridRow);
                          } else {
                            // Subsequent rounds: center between source matches
                            const roundData =
                              tournamentBracket.rounds[roundIndex];
                            const matchData = roundData[seedIndex];

                            if (
                              matchData?.sourceMatch1 &&
                              matchData?.sourceMatch2
                            ) {
                              // Find source match IDs
                              const prevRound = rounds[roundIndex - 1];
                              const sourceIndex1 = seedIndex * 2;
                              const sourceIndex2 = seedIndex * 2 + 1;
                              const source1 = prevRound.seeds[sourceIndex1];
                              const source2 = prevRound.seeds[sourceIndex2];

                              if (source1 && source2) {
                                const pos1 = matchPositions[source1.id];
                                const pos2 = matchPositions[source2.id];

                                if (pos1 && pos2) {
                                  // Center this match between source matches
                                  const junctionY =
                                    (pos1.centerY + pos2.centerY) / 2;

                                  // Check if we have a previous measurement for this match's height
                                  const existingPos = matchPositions[seed.id];
                                  const estimatedHalfHeight = existingPos
                                    ? existingPos.height / 2
                                    : 60;

                                  yPosition = junctionY - estimatedHalfHeight;
                                }
                              }
                            }

                            // Fallback to grid if we couldn't calculate from sources
                            if (yPosition === undefined) {
                              const gridRow = getMatchRow(seedIndex);
                              yPosition = rowToY(gridRow);
                            }
                          }

                          // Get source match IDs for better placeholder text
                          const roundData =
                            tournamentBracket.rounds[roundIndex];
                          const matchData = roundData[seedIndex];
                          const team1Label =
                            team1.name ||
                            (matchData?.sourceMatch1
                              ? `Winner of ${matchData.sourceMatch1.toUpperCase()}`
                              : "TBD");
                          const team2Label =
                            team2.name ||
                            (matchData?.sourceMatch2
                              ? `Winner of ${matchData.sourceMatch2.toUpperCase()}`
                              : "TBD");

                          const CardWrapper = seed.inProgress
                            ? Animated.View
                            : View;
                          const animatedStyle = seed.inProgress
                            ? {
                                transform: [{ scale: pulseAnim }],
                              }
                            : {};

                          return (
                            <CardWrapper
                              key={seed.id}
                              style={[
                                animatedStyle,
                                {
                                  position: "absolute",
                                  top: yPosition,
                                  width: cardWidth,
                                },
                              ]}
                              onLayout={(event) => {
                                const { x, y, width, height } =
                                  event.nativeEvent.layout;
                                // Calculate round X position: Round 0 = 0, Round 1 = 300, Round 2 = 600, etc.
                                const calculatedRoundX =
                                  roundIndex * (cardWidth + connectorWidth);
                                setMatchPositions((prev) => ({
                                  ...prev,
                                  [seed.id]: {
                                    x: calculatedRoundX,
                                    y,
                                    width,
                                    height,
                                    centerY: y + height / 2,
                                    roundIndex,
                                  },
                                }));
                              }}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.seedCard,
                                  seed.completed && styles.seedCardCompleted,
                                  seed.inProgress && styles.seedCardInProgress,
                                  (!team1.name || !team2.name) &&
                                    !seed.inProgress &&
                                    styles.seedCardFuture,
                                  !seed.completed &&
                                    team1.name &&
                                    team2.name &&
                                    !seed.inProgress &&
                                    styles.seedCardNextUp,
                                ]}
                                onPress={seed.onPress}
                                disabled={!team1.name || !team2.name}
                                activeOpacity={0.7}
                              >
                                {/* Team 1 */}
                                <View
                                  style={[
                                    styles.teamRow,
                                    seed.winnerId === team1.id &&
                                      styles.teamRowWinner,
                                  ]}
                                >
                                  {team1.name && team1.color && (
                                    <View style={styles.teamColorDot}>
                                      {team1.color.isGradient ? (
                                        <LinearGradient
                                          colors={team1.color.colors}
                                          start={{ x: 0, y: 0.5 }}
                                          end={{ x: 1, y: 0.5 }}
                                          style={styles.colorGradient}
                                        />
                                      ) : (
                                        <View
                                          style={[
                                            styles.colorSolid,
                                            {
                                              backgroundColor:
                                                team1.color.colors[0],
                                            },
                                          ]}
                                        />
                                      )}
                                    </View>
                                  )}
                                  <Text
                                    style={[
                                      styles.teamName,
                                      seed.winnerId === team1.id &&
                                        styles.teamNameWinner,
                                      !team1.name && styles.teamNameTbd,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {team1Label}
                                  </Text>
                                  {seed.scores &&
                                    seed.scores[0] !== null &&
                                    team1.name && (
                                      <Text
                                        style={[
                                          styles.teamScore,
                                          seed.winnerId === team1.id &&
                                            styles.teamScoreWinner,
                                        ]}
                                      >
                                        {seed.scores[0]}
                                      </Text>
                                    )}
                                </View>

                                <View style={styles.seedDivider} />

                                {/* Team 2 */}
                                <View
                                  style={[
                                    styles.teamRow,
                                    seed.winnerId === team2.id &&
                                      styles.teamRowWinner,
                                  ]}
                                >
                                  {team2.name && team2.color && (
                                    <View style={styles.teamColorDot}>
                                      {team2.color.isGradient ? (
                                        <LinearGradient
                                          colors={team2.color.colors}
                                          start={{ x: 0, y: 0.5 }}
                                          end={{ x: 1, y: 0.5 }}
                                          style={styles.colorGradient}
                                        />
                                      ) : (
                                        <View
                                          style={[
                                            styles.colorSolid,
                                            {
                                              backgroundColor:
                                                team2.color.colors[0],
                                            },
                                          ]}
                                        />
                                      )}
                                    </View>
                                  )}
                                  <Text
                                    style={[
                                      styles.teamName,
                                      seed.winnerId === team2.id &&
                                        styles.teamNameWinner,
                                      !team2.name && styles.teamNameTbd,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {team2Label}
                                  </Text>
                                  {seed.scores &&
                                    seed.scores[1] !== null &&
                                    team2.name && (
                                      <Text
                                        style={[
                                          styles.teamScore,
                                          seed.winnerId === team2.id &&
                                            styles.teamScoreWinner,
                                        ]}
                                      >
                                        {seed.scores[1]}
                                      </Text>
                                    )}
                                </View>

                                {/* Play/Resume Indicator */}
                                {!seed.completed &&
                                  team1.name &&
                                  team2.name && (
                                    <View
                                      style={[
                                        styles.playIndicator,
                                        seed.inProgress &&
                                          styles.playIndicatorInProgress,
                                      ]}
                                    >
                                      <Text style={styles.playText}>
                                        {seed.inProgress
                                          ? "TAP TO RESUME ▶▶"
                                          : "TAP TO PLAY ▶"}
                                      </Text>
                                    </View>
                                  )}
                              </TouchableOpacity>
                            </CardWrapper>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* SVG Overlay for Connector Lines - positioned absolutely, doesn't block touches */}
              {Object.keys(matchPositions).length > 0 && (
                <Svg
                  pointerEvents="box-none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: -1,
                  }}
                >
                  {(() => {
                    console.log("=== SVG RENDERING ===");
                    console.log(
                      "Total match positions tracked:",
                      Object.keys(matchPositions).length,
                    );
                    console.log("Match positions:", matchPositions);
                    console.log("Round X offsets:", roundXOffsets);
                    return null;
                  })()}
                  {rounds.map((round, roundIndex) => {
                    if (roundIndex >= rounds.length - 1) return null;

                    const nextRound = rounds[roundIndex + 1];
                    const paths = [];

                    // Generate paths for each connection
                    nextRound.seeds.forEach((nextSeed, nextMatchIndex) => {
                      const sourceMatch1 = round.seeds[nextMatchIndex * 2];
                      const sourceMatch2 = round.seeds[nextMatchIndex * 2 + 1];

                      console.log(
                        `\n--- Round ${roundIndex} → ${
                          roundIndex + 1
                        }, Match ${nextMatchIndex} ---`,
                      );
                      console.log(
                        "Source Match 1:",
                        sourceMatch1?.id,
                        sourceMatch1?.teams[0]?.name,
                      );
                      console.log(
                        "Source Match 2:",
                        sourceMatch2?.id,
                        sourceMatch2?.teams[0]?.name,
                      );
                      console.log("Next Match:", nextSeed?.id);

                      if (!sourceMatch1 || !sourceMatch2) {
                        console.log("❌ Missing source match(es)");
                        return;
                      }

                      const pos1 = matchPositions[sourceMatch1.id];
                      const pos2 = matchPositions[sourceMatch2.id];
                      const posNext = matchPositions[nextSeed.id];

                      console.log("Position 1:", pos1);
                      console.log("Position 2:", pos2);
                      console.log("Position Next:", posNext);

                      if (!pos1 || !pos2 || !posNext) {
                        console.log("❌ Missing position data");
                        return;
                      }

                      // Calculate positions for connector (scrollPadding accounts for ScrollView padding)
                      const scrollPadding = 20;
                      const roundTitleHeight = 35; // Space for "Quarter Finals", etc.

                      // Right edge center of source matches (use stored centerY + offsets)
                      const match1RightX = pos1.x + pos1.width + scrollPadding;
                      const match1CenterY =
                        pos1.centerY + scrollPadding + roundTitleHeight;

                      const match2RightX = pos2.x + pos2.width + scrollPadding;
                      const match2CenterY =
                        pos2.centerY + scrollPadding + roundTitleHeight;

                      // Left edge center of next match
                      const nextLeftX = posNext.x + scrollPadding;
                      const nextCenterY =
                        posNext.centerY + scrollPadding + roundTitleHeight;

                      // Junction midpoint - this is where the next match SHOULD be vertically centered
                      const junctionMidY = (match1CenterY + match2CenterY) / 2;

                      // Vertical line X position (midpoint between rounds)
                      const verticalX = (match1RightX + nextLeftX) / 2;

                      console.log(
                        `Junction at Y=${junctionMidY}, Next match at Y=${nextCenterY}, Diff=${Math.abs(
                          junctionMidY - nextCenterY,
                        )}`,
                      );

                      // Determine line color based on completion
                      const bothCompleted =
                        sourceMatch1.completed && sourceMatch2.completed;
                      const strokeColor = bothCompleted ? "#BDBDBD" : "#2196F3";
                      const strokeOpacity = bothCompleted ? 0.4 : 1;

                      // Path strategy: Standard bracket connector
                      // 1. Horizontal from match1 right → vertical junction
                      // 2. Vertical line connecting match1 and match2 levels
                      // 3. Horizontal from match2 right → vertical junction (separate segment)
                      // 4. Horizontal from junction midpoint → next match left

                      paths.push(
                        <Path
                          key={`connector-${sourceMatch1.id}-${sourceMatch2.id}-v`}
                          d={`
                          M ${match1RightX} ${match1CenterY}
                          L ${verticalX} ${match1CenterY}
                          L ${verticalX} ${match2CenterY}
                        `}
                          stroke={strokeColor}
                          strokeWidth={2}
                          strokeOpacity={strokeOpacity}
                          fill="none"
                        />,
                      );

                      paths.push(
                        <Path
                          key={`connector-${sourceMatch1.id}-${sourceMatch2.id}-m2`}
                          d={`
                          M ${match2RightX} ${match2CenterY}
                          L ${verticalX} ${match2CenterY}
                        `}
                          stroke={strokeColor}
                          strokeWidth={2}
                          strokeOpacity={strokeOpacity}
                          fill="none"
                        />,
                      );

                      // Draw from junction to next match using right angles only
                      paths.push(
                        <Path
                          key={`connector-${sourceMatch1.id}-${sourceMatch2.id}-next`}
                          d={`
                          M ${verticalX} ${junctionMidY}
                          L ${nextLeftX} ${junctionMidY}
                          L ${nextLeftX} ${nextCenterY}
                        `}
                          stroke={strokeColor}
                          strokeWidth={2}
                          strokeOpacity={strokeOpacity}
                          fill="none"
                        />,
                      );

                      console.log(
                        `Round ${roundIndex} Match ${nextMatchIndex}:`,
                        {
                          match1: { x: match1RightX, y: match1CenterY },
                          match2: { x: match2RightX, y: match2CenterY },
                          next: { x: nextLeftX, y: nextCenterY },
                          verticalX,
                          junctionMidY,
                          distances: {
                            match1ToJunction: verticalX - match1RightX,
                            junctionToNext: nextLeftX - verticalX,
                          },
                        },
                      );
                    });

                    return paths;
                  })}
                </Svg>
              )}
            </ScrollView>

            {/* Match Results Modal */}
            {renderMatchResultsModal()}
          </SafeAreaView>
        );
      }

      // Tournament player setup
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView contentContainerStyle={styles.setupContainer}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setGameFormat(null)}
              style={styles.backButton}
            />
            <Text variant="headlineLarge" style={styles.titleCentered}>
              Tournament Setup
            </Text>
            <Text variant="bodyMedium" style={styles.subtitleCentered}>
              Add 4-16 players (min 4 to start)
            </Text>

            {/* Player List */}
            {tournamentPlayers.map((player, index) => (
              <Surface key={index} style={styles.playerSetupCard}>
                <View style={styles.playerRow}>
                  <TouchableOpacity
                    style={styles.colorIndicatorRounded}
                    onPress={() => {
                      setSelectedPlayerIndex(index);
                      setColorPickerVisible(true);
                    }}
                  >
                    {player.color.isGradient ? (
                      <LinearGradient
                        colors={player.color.colors}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        locations={[0, 1]}
                        style={styles.colorIndicatorFull}
                      />
                    ) : (
                      <View
                        style={[
                          styles.colorIndicatorFull,
                          { backgroundColor: player.color.colors[0] },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                  <TextInput
                    label={`Player ${index + 1}`}
                    value={player.name}
                    onChangeText={(text) => {
                      const updated = [...tournamentPlayers];
                      updated[index].name = text;
                      setTournamentPlayers(updated);
                    }}
                    style={styles.playerNameInput}
                    mode="outlined"
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => {
                      setTournamentPlayers(
                        tournamentPlayers.filter((_, i) => i !== index),
                      );
                    }}
                  />
                </View>
              </Surface>
            ))}

            {/* Add Player Button */}
            {tournamentPlayers.length < 16 && (
              <Button
                mode="outlined"
                onPress={() => {
                  setTournamentPlayers([
                    ...tournamentPlayers,
                    {
                      name: "",
                      color:
                        POPDARTS_COLORS[
                          tournamentPlayers.length % POPDARTS_COLORS.length
                        ],
                    },
                  ]);
                }}
                style={styles.addPlayerButton}
                icon="plus"
              >
                Add Player
              </Button>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            {/* Start Tournament Button */}
            <Button
              mode="contained"
              onPress={() => {
                if (tournamentPlayers.length < 4) {
                  setError("Need at least 4 players to start tournament");
                  return;
                }
                if (tournamentPlayers.some((p) => !p.name.trim())) {
                  setError("All players need names");
                  return;
                }
                setError("");
                const bracket = generateBracket(tournamentPlayers);
                setTournamentBracket(bracket);
                setShowBracket(true);
              }}
              style={styles.startButton}
              disabled={tournamentPlayers.length < 4}
            >
              Start Tournament
            </Button>
          </ScrollView>

          {/* Color Picker Modal */}
          <Modal
            visible={colorPickerVisible}
            onDismiss={() => setColorPickerVisible(false)}
            contentContainerStyle={styles.colorPickerModal}
          >
            <Text variant="titleLarge" style={styles.colorPickerTitle}>
              Select Dart Color
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {POPDARTS_COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (selectedPlayerIndex !== null) {
                      const updated = [...tournamentPlayers];
                      updated[selectedPlayerIndex].color = color;
                      setTournamentPlayers(updated);
                    }
                    setColorPickerVisible(false);
                  }}
                  style={styles.colorOption}
                >
                  {color.isGradient ? (
                    <LinearGradient
                      colors={color.colors}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      locations={[0, 1]}
                      style={styles.colorOptionInner}
                    />
                  ) : (
                    <View
                      style={[
                        styles.colorOptionInner,
                        { backgroundColor: color.colors[0] },
                      ]}
                    />
                  )}
                  <Text style={styles.colorOptionName}>{color.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              mode="text"
              onPress={() => setColorPickerVisible(false)}
              style={styles.closeButton}
            >
              Close
            </Button>
          </Modal>
        </SafeAreaView>
      );
    }

    // Step 5: Lobby (Player Setup)
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.lobbyCenteredContainer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              setMatchMode(null);
              setPlayers([]);
              setTeams([]);
            }}
            style={styles.backButtonAbsolute}
          />
          <Text variant="headlineMedium" style={styles.titleCentered}>
            {matchMode === "1v1"
              ? "1v1 Lobby"
              : matchMode === "2v2"
                ? "2v2 Team Lobby"
                : "Party Lobby"}
          </Text>

          {/* Match Type Selection (only for 1v1) */}
          {matchMode === "1v1" && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginVertical: 16,
              }}
            >
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    marginRight: 8,
                    backgroundColor:
                      lobbyMatchType === "friendly" ? "#2196F3" : "#E0E0E0",
                  },
                ]}
                onPress={() => setLobbyMatchType("friendly")}
              >
                <Text
                  style={{
                    color: lobbyMatchType === "friendly" ? "#fff" : "#333",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Friendly
                </Text>
                <Text
                  style={{
                    color: lobbyMatchType === "friendly" ? "#fff" : "#333",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Quick, just for fun
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    marginLeft: 8,
                    backgroundColor:
                      lobbyMatchType === "casual-competitive"
                        ? "#2196F3"
                        : "#E0E0E0",
                  },
                ]}
                onPress={() => setLobbyMatchType("casual-competitive")}
              >
                <Text
                  style={{
                    color:
                      lobbyMatchType === "casual-competitive" ? "#fff" : "#333",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Casual Competitive
                </Text>
                <Text
                  style={{
                    color:
                      lobbyMatchType === "casual-competitive" ? "#fff" : "#333",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Practice w/ stats & RPS
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 1v1 and Party Mode - Individual Players */}
          {(matchMode === "1v1" || matchMode === "party") &&
            players.map((player, index) => (
              <View key={player.id} style={styles.playerSetupCard}>
                <View style={styles.playerSetupRowReordered}>
                  {/* Profile Picture Placeholder (Left) */}
                  <TouchableOpacity
                    style={styles.profilePicPlaceholder}
                    disabled
                  >
                    <Text style={styles.profileIconText}>👤</Text>
                  </TouchableOpacity>

                  {/* Player Name (Center) */}
                  <TextInput
                    label={`Player ${index + 1} Name`}
                    value={player.name}
                    onChangeText={(text) => {
                      const newPlayers = [...players];
                      newPlayers[index].name = text;
                      setPlayers(newPlayers);
                      if (index === 0) setPlayer1Name(text);
                      if (index === 1) setPlayer2Name(text);
                    }}
                    style={styles.playerNameInput}
                    mode="outlined"
                  />

                  {/* Color Indicator (Right) */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPlayerIndex(index);
                      setSelectedTeamIndex(null);

                      // Auto-select favorite color only for Player 1 (home)
                      if (index === 0 && favoriteHomeColor !== null) {
                        setSelectedColorIndex(favoriteHomeColor);
                      } else {
                        setSelectedColorIndex(null); // No auto-select for others
                      }

                      setColorPickerVisible(true);
                    }}
                    style={styles.colorIndicatorRounded}
                  >
                    {player.color ? (
                      player.color.isGradient ? (
                        <LinearGradient
                          colors={player.color.colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.colorIndicatorGradient}
                        />
                      ) : (
                        <View
                          style={[
                            styles.colorIndicatorFull,
                            { backgroundColor: player.color.colors[0] },
                          ]}
                        />
                      )
                    ) : (
                      <View
                        style={[
                          styles.colorIndicatorFull,
                          { backgroundColor: "#CCCCCC" },
                        ]}
                      />
                    )}
                  </TouchableOpacity>

                  {((matchMode === "party" && players.length > 3) ||
                    (matchMode === "1v1" &&
                      players.length > 2 &&
                      index >= 2)) && (
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => {
                        setPlayers(players.filter((p) => p.id !== player.id));
                      }}
                    />
                  )}
                </View>
              </View>
            ))}

          {/* 2v2 Mode - Teams */}
          {matchMode === "2v2" &&
            teams.map((team, teamIndex) => (
              <View key={team.id} style={styles.teamSetupCard}>
                <TextInput
                  label={`Team ${teamIndex + 1} Name`}
                  value={team.name}
                  onChangeText={(text) => {
                    const newTeams = [...teams];
                    newTeams[teamIndex].name = text;
                    setTeams(newTeams);
                  }}
                  style={styles.input}
                  mode="outlined"
                />

                {/* Team Color Picker Button */}
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSelectedTeamIndex(teamIndex);
                    setSelectedPlayerIndex(null);
                    setColorPickerVisible(true);
                  }}
                  style={styles.selectColorButton}
                  icon="palette"
                >
                  Select Team Color
                </Button>

                {/* Team Players */}
                {team.players.map((player, playerIndex) => (
                  <TextInput
                    key={player.id}
                    label={`Player ${playerIndex + 1}`}
                    value={player.name}
                    onChangeText={(text) => {
                      const newTeams = [...teams];
                      newTeams[teamIndex].players[playerIndex].name = text;
                      setTeams(newTeams);
                      if (teamIndex === 0 && playerIndex === 0)
                        setPlayer1Name(text);
                      if (teamIndex === 1 && playerIndex === 0)
                        setPlayer2Name(text);
                    }}
                    style={styles.input}
                    mode="outlined"
                  />
                ))}
              </View>
            ))}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Add Player Button (for Party mode) */}
          {matchMode === "party" && (
            <Button
              mode="outlined"
              onPress={() => {
                const newId = Math.max(...players.map((p) => p.id)) + 1;
                const colorIndex = players.length % POPDARTS_COLORS.length;
                setPlayers([
                  ...players,
                  { id: newId, name: "", color: POPDARTS_COLORS[colorIndex] },
                ]);
              }}
              style={styles.addPlayerButton}
              icon="account-plus"
            >
              Add Another Player
            </Button>
          )}

          {/* Color Picker Modal */}
          <Modal
            visible={colorPickerVisible}
            onDismiss={() => setColorPickerVisible(false)}
            contentContainerStyle={styles.colorPickerModal}
          >
            <View style={styles.colorPickerContainer}>
              <Text variant="headlineSmall" style={styles.colorPickerTitle}>
                Select Your Dart Color
              </Text>
              <ScrollView style={styles.colorScrollView}>
                <View style={styles.colorListVertical}>
                  {/* Sort colors: owned first for Player 1, all colors visible for everyone */}
                  {POPDARTS_COLORS.map((colorObj, originalIndex) => ({
                    colorObj,
                    originalIndex,
                    isOwned: ownedColors.includes(originalIndex),
                  }))
                    .sort((a, b) => {
                      // For Player 1, show owned colors first
                      if (selectedPlayerIndex === 0) {
                        if (a.isOwned && !b.isOwned) return -1;
                        if (!a.isOwned && b.isOwned) return 1;
                      }
                      return 0;
                    })
                    .map(({ colorObj, originalIndex, isOwned }) => {
                      const colorIndex = originalIndex;
                      const isSelected = selectedColorIndex === colorIndex;
                      const otherPlayerIndex =
                        selectedPlayerIndex === 0 ? 1 : 0;
                      const isOtherPlayerColor =
                        selectedPlayerIndex !== null &&
                        players[otherPlayerIndex]?.color?.name ===
                          colorObj.name;

                      // Only show green "owned" border for Player 1 (index 0)
                      const showOwnedBorder =
                        isOwned && selectedPlayerIndex === 0;

                      return (
                        <TouchableOpacity
                          key={colorIndex}
                          disabled={isOtherPlayerColor}
                          onPress={() => setSelectedColorIndex(colorIndex)}
                          style={[
                            styles.colorItemLarge,
                            showOwnedBorder &&
                              !isSelected &&
                              !isOtherPlayerColor &&
                              styles.colorItemOwned,
                            isSelected && styles.colorItemSelected,
                            isOtherPlayerColor && styles.colorItemTaken,
                          ]}
                        >
                          {/* Gradient or Solid Background */}
                          {colorObj.isGradient ? (
                            <LinearGradient
                              colors={colorObj.colors}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              locations={[0, 1]}
                              style={styles.colorItemGradient}
                            />
                          ) : (
                            <View
                              style={[
                                styles.colorItemGradient,
                                { backgroundColor: colorObj.colors[0] },
                              ]}
                            />
                          )}

                          {/* Selection Indicator with Name */}
                          {isSelected && (
                            <>
                              {/* Vertical Color Name on Left - Only when selected */}
                              <View style={styles.colorNameVerticalContainer}>
                                <Text style={styles.colorNameVertical}>
                                  {colorObj.name}
                                </Text>
                              </View>

                              {/* Checkmark */}
                              <View style={styles.selectionIndicator}>
                                <View style={styles.checkmarkCircle}>
                                  <Text style={styles.checkmarkText}>✓</Text>
                                </View>
                              </View>
                            </>
                          )}

                          {/* Other Player Selected Overlay */}
                          {isOtherPlayerColor && (
                            <View style={styles.otherPlayerOverlay}>
                              <View style={styles.checkmarkCircle}>
                                <Text style={styles.checkmarkText}>✓</Text>
                              </View>
                              <Text style={styles.takenText}>TAKEN</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </ScrollView>

              {/* Continue Button */}
              <Button
                mode="contained"
                onPress={() => {
                  if (selectedColorIndex !== null) {
                    const colorObj = POPDARTS_COLORS[selectedColorIndex];
                    if (selectedPlayerIndex !== null) {
                      const newPlayers = [...players];
                      newPlayers[selectedPlayerIndex].color = colorObj;
                      setPlayers(newPlayers);
                      if (selectedPlayerIndex === 0) {
                        setPlayer1Name(newPlayers[0].name);
                        setPlayer1Color(colorObj.colors[0]);
                        setPlayer1ColorObj(colorObj);
                      }
                      if (selectedPlayerIndex === 1) {
                        setPlayer2Name(newPlayers[1].name);
                        setPlayer2Color(colorObj.colors[0]);
                        setPlayer2ColorObj(colorObj);
                      }
                    } else if (selectedTeamIndex !== null) {
                      const newTeams = [...teams];
                      newTeams[selectedTeamIndex].color = colorObj;
                      setTeams(newTeams);
                      if (selectedTeamIndex === 0) {
                        setPlayer1Color(colorObj.colors[0]);
                        setPlayer1ColorObj(colorObj);
                      }
                      if (selectedTeamIndex === 1) {
                        setPlayer2Color(colorObj.colors[0]);
                        setPlayer2ColorObj(colorObj);
                      }
                    }
                    setColorPickerVisible(false);
                    setSelectedColorIndex(null);
                  }
                }}
                disabled={selectedColorIndex === null}
                style={styles.continueButton}
                buttonColor="#007AFF"
              >
                Continue
              </Button>
            </View>
          </Modal>

          {/* Continue Button */}

          <Button
            mode="contained"
            onPress={() => {
              // Validation
              if (
                matchMode === "1v1" &&
                (!players[0]?.name.trim() || !players[1]?.name.trim())
              ) {
                setError("Please enter names for both players");
                return;
              }
              if (matchMode === "2v2") {
                const allPlayersFilled = teams.every((team) =>
                  team.players.every((player) => player.name.trim()),
                );
                if (!allPlayersFilled) {
                  setError("Please enter names for all players");
                  return;
                }
              }
              if (matchMode === "party") {
                const filledPlayers = players.filter((p) => p.name.trim());
                if (filledPlayers.length < 2) {
                  setError("Please enter names for at least 2 players");
                  return;
                }
                // Remove empty players
                setPlayers(filledPlayers);
              }

              // Set player names for scoring
              if (matchMode === "1v1") {
                setPlayer1Name(players[0].name);
                setPlayer2Name(players[1].name);
              } else if (matchMode === "2v2") {
                setPlayer1Name(teams[0].name);
                setPlayer2Name(teams[1].name);
              }

              setError("");

              // --- Branch match start logic based on match type ---
              if (matchMode === "1v1" && lobbyMatchType === "friendly") {
                // Friendly: skip pre-game, just start match (no stats, no RPS)
                setFirstThrower(null);
                setShowPreGame(false);
                setMatchStarted(true);
              } else if (
                matchMode === "1v1" &&
                lobbyMatchType === "casual-competitive"
              ) {
                // Casual Competitive: show pre-game (RPS/side pick), enable stat tracking
                setShowPreGame(true);
              } else {
                // Default: show pre-game for other modes
                setShowPreGame(true);
              }
            }}
            style={styles.startButton}
          >
            Continue to Match
          </Button>

          <Button
            mode="text"
            onPress={() => {
              setMatchMode(null);
              setPlayers([]);
              setTeams([]);
            }}
            style={styles.cancelButton}
          >
            Back
          </Button>
        </ScrollView>
        {renderPreGameModal()}
      </SafeAreaView>
    );
  }

  // Only enable stat tracking for 'casual-competitive' in 1v1 mode
  const isStatTrackingEnabled = !(
    matchMode === "1v1" &&
    typeof lobbyMatchType !== "undefined" &&
    lobbyMatchType === "friendly"
  );

  return (
    <View style={styles.fullscreenContainer}>
      {/* Top Player - 50% of screen */}
      <View
        style={[
          styles.topPlayerSection,
          firstThrower === 1 && styles.playerSectionHighlighted,
        ]}>
      >
        <View style={styles.whiteBackground}>
          {/* Progressive Gradient Reveal - Width Only */}
          <View
            style={[
              styles.gradientClipContainer,
              { width: `${(player1Score / 21) * 100}%` },
            ]}
          >
            {player1ColorObj?.isGradient ? (
              <LinearGradient
                colors={player1ColorObj.colors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                locations={[0, 1]}
                style={styles.gradientFull}
              />
            ) : (
              <View
                style={[
                  styles.gradientFull,
                  { backgroundColor: player1ColorObj?.colors?.[0] || "#2A2A2A" },
                ]}
              />
            )}
          </View>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => setShowBackConfirmation(true)}
            style={styles.backButtonCircle}
          >
            <IconButton icon="arrow-left" size={24} iconColor="#333" />
          </TouchableOpacity>

          {/* Simple Scoring Button */}
          <TouchableOpacity
            onPress={() => setShowSimplifiedOverlay(true)}
            disabled={winner !== null}
            style={styles.simpleScoreButton}
          >
            <Text style={styles.simpleScoreButtonText}>QUICK</Text>
            <Text style={styles.simpleScoreButtonText}>SCORE</Text>
          </TouchableOpacity>

          {/* Player Name */}
          <Text style={styles.playerNameTop}>{player1Name.toUpperCase()}</Text>

          {/* Large Tap Areas for Score */}
          <View style={styles.scoreSectionFullscreen}>
            {/* Left Half - Minus */}
            <TouchableOpacity
              onPress={() => decrementScore(1)}
              disabled={winner !== null}
              style={styles.scoreHalfTapArea}
            >
              <Text style={styles.minusPlusTextLarge}>–</Text>
            </TouchableOpacity>

            {/* Center - Score */}
            <View style={styles.scoreCenter}>
              <Text style={styles.scoreNumberLarge}>{player1Score}</Text>
            </View>

            {/* Right Half - Plus */}
            <TouchableOpacity
              onPress={() => incrementScore(1)}
              disabled={winner !== null}
              style={styles.scoreHalfTapArea}
            >
              <Text style={styles.minusPlusTextLarge}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Stat Track Button */}
          <TouchableOpacity
            onPress={() =>
              isStatTrackingEnabled && setShowStatsDialog("player1")
            }
            style={[
              styles.statTrackButtonSquare,
              !isStatTrackingEnabled && { opacity: 0.4 },
            ]}
            disabled={!isStatTrackingEnabled}
          >
            <Text style={styles.statTrackText}>STAT</Text>
            <Text style={styles.statTrackText}>TRACK</Text>
          </TouchableOpacity>

          {/* +2, +3, +4, +5 Grid */}
          <View style={styles.incrementGrid}>
            {[2, 3, 4, 5].map((points) => (
              <TouchableOpacity
                key={points}
                onPress={() => addPoints(1, points)}
                disabled={winner !== null}
                style={styles.incrementButton}
              >
                <Text style={styles.incrementButtonText}>+{points}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Bottom Player - 50% of screen */}
      <View
        style={[
          styles.bottomPlayerSection,
          firstThrower === 2 && styles.playerSectionHighlighted,
        ]}
      >
        <View style={styles.whiteBackground}>
          {/* Progressive Gradient Reveal - Width Only */}
          <View
            style={[
              styles.gradientClipContainer,
              { width: `${(player2Score / 21) * 100}%` },
            ]}
          >
            {player2ColorObj?.isGradient ? (
              <LinearGradient
                colors={player2ColorObj.colors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                locations={[0, 1]}
                style={styles.gradientFull}
              />
            ) : (
              <View
                style={[
                  styles.gradientFull,
                  { backgroundColor: player2ColorObj?.colors?.[0] || "#CF2740" },
                ]}
              />
            )}
          </View>

          {/* Player Name */}
          <Text style={styles.playerNameBottom}>
            {player2Name.toUpperCase()}
          </Text>

          {/* Large Tap Areas for Score */}
          <View style={styles.scoreSectionFullscreen}>
            {/* Left Half - Minus */}
            <TouchableOpacity
              onPress={() => decrementScore(2)}
              disabled={winner !== null}
              style={styles.scoreHalfTapArea}
            >
              <Text style={styles.minusPlusTextLarge}>–</Text>
            </TouchableOpacity>

            {/* Center - Score */}
            <View style={styles.scoreCenter}>
              <Text style={styles.scoreNumberLarge}>{player2Score}</Text>
            </View>

            {/* Right Half - Plus */}
            <TouchableOpacity
              onPress={() => incrementScore(2)}
              disabled={winner !== null}
              style={styles.scoreHalfTapArea}
            >
              <Text style={styles.minusPlusTextLarge}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Stat Track Button */}
          <TouchableOpacity
            onPress={() => setShowStatsDialog("player2")}
            style={styles.statTrackButtonSquare}
          >
            <Text style={styles.statTrackText}>STAT</Text>
            <Text style={styles.statTrackText}>TRACK</Text>
          </TouchableOpacity>

          {/* +2, +3, +4, +5 Grid */}
          <View style={styles.incrementGrid}>
            {[2, 3, 4, 5].map((points) => (
              <TouchableOpacity
                key={points}
                onPress={() => addPoints(2, points)}
                disabled={winner !== null}
                style={styles.incrementButton}
              >
                <Text style={styles.incrementButtonText}>+{points}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Stats Dialog */}
      <Modal
        visible={showStatsDialog !== null}
        onDismiss={() => setShowStatsDialog(null)}
        animationType="slide"
        transparent
      >
        <View style={styles.statTrackModal}>
          <View style={styles.statTrackContainer}>
            <Text style={styles.statTrackTitle}>Stat Track</Text>
            <Text style={styles.statTrackSubtitle}>
              Track the number of trick shots players achieve during the game
            </Text>
            <Text style={styles.statTrackPlayerName}>
              {showStatsDialog === "player1" ? player1Name : player2Name}
            </Text>

            {/* Grid Layout */}
            <View style={styles.statGrid}>
              {/* Wiggle Nobbers */}
              <View style={styles.statGridItem}>
                <Text style={styles.statGridLabel}>Wiggle Nobbers</Text>
                <View style={styles.statGridControls}>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() => {
                      const stats =
                        showStatsDialog === "player1"
                          ? player1Stats
                          : player2Stats;
                      const setStats =
                        showStatsDialog === "player1"
                          ? setPlayer1Stats
                          : setPlayer2Stats;
                      if (stats.wiggleNobbers > 0) {
                        setStats({
                          ...stats,
                          wiggleNobbers: stats.wiggleNobbers - 1,
                        });
                      }
                    }}
                  >
                    <Text style={styles.statButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.statGridValue}>
                    {showStatsDialog === "player1"
                      ? player1Stats.wiggleNobbers
                      : player2Stats.wiggleNobbers}
                  </Text>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() =>
                      addStat(
                        showStatsDialog === "player1" ? 1 : 2,
                        "wiggleNobbers",
                      )
                    }
                  >
                    <Text style={styles.statButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* T-Nobbers */}
              <View style={styles.statGridItem}>
                <Text style={styles.statGridLabel}>T-Nobbers</Text>
                <View style={styles.statGridControls}>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() => {
                      const stats =
                        showStatsDialog === "player1"
                          ? player1Stats
                          : player2Stats;
                      const setStats =
                        showStatsDialog === "player1"
                          ? setPlayer1Stats
                          : setPlayer2Stats;
                      if (stats.tNobbers > 0) {
                        setStats({ ...stats, tNobbers: stats.tNobbers - 1 });
                      }
                    }}
                  >
                    <Text style={styles.statButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.statGridValue}>
                    {showStatsDialog === "player1"
                      ? player1Stats.tNobbers
                      : player2Stats.tNobbers}
                  </Text>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() =>
                      addStat(showStatsDialog === "player1" ? 1 : 2, "tNobbers")
                    }
                  >
                    <Text style={styles.statButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fender Benders */}
              <View style={styles.statGridItem}>
                <Text style={styles.statGridLabel}>Fender Benders</Text>
                <View style={styles.statGridControls}>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() => {
                      const stats =
                        showStatsDialog === "player1"
                          ? player1Stats
                          : player2Stats;
                      const setStats =
                        showStatsDialog === "player1"
                          ? setPlayer1Stats
                          : setPlayer2Stats;
                      if (stats.fenderBenders > 0) {
                        setStats({
                          ...stats,
                          fenderBenders: stats.fenderBenders - 1,
                        });
                      }
                    }}
                  >
                    <Text style={styles.statButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.statGridValue}>
                    {showStatsDialog === "player1"
                      ? player1Stats.fenderBenders
                      : player2Stats.fenderBenders}
                  </Text>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() =>
                      addStat(
                        showStatsDialog === "player1" ? 1 : 2,
                        "fenderBenders",
                      )
                    }
                  >
                    <Text style={styles.statButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inch Worms */}
              <View style={styles.statGridItem}>
                <Text style={styles.statGridLabel}>Inch Worms</Text>
                <View style={styles.statGridControls}>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() => {
                      const stats =
                        showStatsDialog === "player1"
                          ? player1Stats
                          : player2Stats;
                      const setStats =
                        showStatsDialog === "player1"
                          ? setPlayer1Stats
                          : setPlayer2Stats;
                      if (stats.inchWorms > 0) {
                        setStats({ ...stats, inchWorms: stats.inchWorms - 1 });
                      }
                    }}
                  >
                    <Text style={styles.statButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.statGridValue}>
                    {showStatsDialog === "player1"
                      ? player1Stats.inchWorms
                      : player2Stats.inchWorms}
                  </Text>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() =>
                      addStat(
                        showStatsDialog === "player1" ? 1 : 2,
                        "inchWorms",
                      )
                    }
                  >
                    <Text style={styles.statButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Lippies */}
              <View style={styles.statGridItem}>
                <Text style={styles.statGridLabel}>Lippies</Text>
                <View style={styles.statGridControls}>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() => {
                      const stats =
                        showStatsDialog === "player1"
                          ? player1Stats
                          : player2Stats;
                      const setStats =
                        showStatsDialog === "player1"
                          ? setPlayer1Stats
                          : setPlayer2Stats;
                      if (stats.lippies > 0) {
                        setStats({ ...stats, lippies: stats.lippies - 1 });
                      }
                    }}
                  >
                    <Text style={styles.statButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.statGridValue}>
                    {showStatsDialog === "player1"
                      ? player1Stats.lippies
                      : player2Stats.lippies}
                  </Text>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() =>
                      addStat(showStatsDialog === "player1" ? 1 : 2, "lippies")
                    }
                  >
                    <Text style={styles.statButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tower */}
              <View style={styles.statGridItem}>
                <Text style={styles.statGridLabel}>Tower</Text>
                <View style={styles.statGridControls}>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() => {
                      const stats =
                        showStatsDialog === "player1"
                          ? player1Stats
                          : player2Stats;
                      const setStats =
                        showStatsDialog === "player1"
                          ? setPlayer1Stats
                          : setPlayer2Stats;
                      if (stats.tower > 0) {
                        setStats({ ...stats, tower: stats.tower - 1 });
                      }
                    }}
                  >
                    <Text style={styles.statButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.statGridValue}>
                    {showStatsDialog === "player1"
                      ? player1Stats.tower
                      : player2Stats.tower}
                  </Text>
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={() =>
                      addStat(showStatsDialog === "player1" ? 1 : 2, "tower")
                    }
                  >
                    <Text style={styles.statButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.statTrackSaveButton}
              onPress={() => setShowStatsDialog(null)}
            >
              <Text style={styles.statTrackSaveButtonText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Back Confirmation Dialog */}
      <Dialog
        visible={showBackConfirmation}
        onDismiss={() => setShowBackConfirmation(false)}
        style={styles.backConfirmDialog}
      >
        <Dialog.Content style={styles.backConfirmContent}>
          <Text variant="titleLarge" style={styles.backConfirmText}>
            {gameFormat === "tournament"
              ? "Pause match and return to bracket?"
              : "Are you sure you want to return to the lobby?"}
          </Text>
          <Text variant="bodyMedium" style={styles.backConfirmSubtext}>
            {gameFormat === "tournament"
              ? "Your progress will be saved and you can resume later."
              : "All progress in this match will be lost."}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.backConfirmActions}>
          <Button
            onPress={() => {
              if (gameFormat === "tournament" && currentTournamentMatch) {
                // Save current match state as paused
                const pausedMatch = {
                  ...currentTournamentMatch,
                  pausedPlayer1Score: player1Score,
                  pausedPlayer2Score: player2Score,
                };
                setPausedTournamentMatch(pausedMatch);
                setMatchStarted(false);
                setShowBracket(true);
                setShowBackConfirmation(false);
              } else {
                backToSetup();
              }
            }}
            mode="contained"
            buttonColor={gameFormat === "tournament" ? "#2196F3" : "#FF0000"}
            style={styles.confirmBackButton}
          >
            {gameFormat === "tournament"
              ? "Return to Bracket"
              : "Return to Lobby"}
          </Button>
          <Button
            onPress={() => setShowBackConfirmation(false)}
            textColor="#FFFFFF"
            style={styles.cancelBackButton}
          >
            Cancel
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Quick Score Overlay */}
      <Modal
        visible={showSimplifiedOverlay}
        onDismiss={() => setShowSimplifiedOverlay(false)}
        animationType="fade"
        transparent
      >
        <View style={styles.quickScoreOverlay}>
          <View style={styles.quickScoreContainer}>
            <Text style={styles.quickScoreTitle}>Quick Score</Text>
            <Text style={styles.quickScoreSubtitle}>
              Enter dart counts for quick scoring
            </Text>

            {/* Player 1 */}
            <View style={styles.quickScorePlayerSection}>
              <View style={styles.quickScorePlayerHeader}>
                <Text style={styles.quickScorePlayerName}>{player1Name}</Text>
                {simplifiedP1Darts > 0 && (
                  <Text style={styles.quickScorePlayerCalculation}>
                    {(() => {
                      const isClosest = closestPlayer === 1;
                      if (simplifiedP1Darts === 1) {
                        return isClosest ? "= 3" : "= 1";
                      }
                      let calc = isClosest ? "3" : "1";
                      for (let i = 1; i < simplifiedP1Darts; i++) {
                        calc += " + 1";
                      }
                      return `= ${calc}`;
                    })()}
                  </Text>
                )}
              </View>
              <View style={styles.quickScoreInputRow}>
                <Text style={styles.quickScoreLabel}>Darts Landed:</Text>
                <View style={styles.quickScoreControls}>
                  <TouchableOpacity
                    style={styles.quickScoreButton}
                    onPress={() =>
                      setSimplifiedP1Darts(Math.max(0, simplifiedP1Darts - 1))
                    }
                  >
                    <Text style={styles.quickScoreButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quickScoreValue}>
                    {simplifiedP1Darts}
                  </Text>
                  <TouchableOpacity
                    style={styles.quickScoreButton}
                    onPress={() =>
                      setSimplifiedP1Darts(Math.min(3, simplifiedP1Darts + 1))
                    }
                    disabled={simplifiedP1Darts >= 3}
                  >
                    <Text style={styles.quickScoreButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Player 2 */}
            <View style={styles.quickScorePlayerSection}>
              <View style={styles.quickScorePlayerHeader}>
                <Text style={styles.quickScorePlayerName}>{player2Name}</Text>
                {simplifiedP2Darts > 0 && (
                  <Text style={styles.quickScorePlayerCalculation}>
                    {(() => {
                      const isClosest = closestPlayer === 2;
                      if (simplifiedP2Darts === 1) {
                        return isClosest ? "= 3" : "= 1";
                      }
                      let calc = isClosest ? "3" : "1";
                      for (let i = 1; i < simplifiedP2Darts; i++) {
                        calc += " + 1";
                      }
                      return `= ${calc}`;
                    })()}
                  </Text>
                )}
              </View>
              <View style={styles.quickScoreInputRow}>
                <Text style={styles.quickScoreLabel}>Darts Landed:</Text>
                <View style={styles.quickScoreControls}>
                  <TouchableOpacity
                    style={styles.quickScoreButton}
                    onPress={() =>
                      setSimplifiedP2Darts(Math.max(0, simplifiedP2Darts - 1))
                    }
                  >
                    <Text style={styles.quickScoreButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quickScoreValue}>
                    {simplifiedP2Darts}
                  </Text>
                  <TouchableOpacity
                    style={styles.quickScoreButton}
                    onPress={() =>
                      setSimplifiedP2Darts(Math.min(3, simplifiedP2Darts + 1))
                    }
                    disabled={simplifiedP2Darts >= 3}
                  >
                    <Text style={styles.quickScoreButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Closest Player */}
            <View style={styles.quickScoreClosestSection}>
              <Text style={styles.quickScoreLabel}>
                Closest to Target Marker:
              </Text>
              <View style={styles.quickScoreClosestButtons}>
                <TouchableOpacity
                  disabled={simplifiedP1Darts === 0}
                  style={[
                    styles.quickScorePlayerButton,
                    closestPlayer === 1 &&
                      styles.quickScorePlayerButtonSelected,
                    simplifiedP1Darts === 0 &&
                      styles.quickScorePlayerButtonDisabled,
                  ]}
                  onPress={() => setClosestPlayer(1)}
                >
                  <Text
                    style={[
                      styles.quickScorePlayerButtonText,
                      simplifiedP1Darts === 0 &&
                        styles.quickScorePlayerButtonTextDisabled,
                    ]}
                  >
                    {player1Name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={simplifiedP2Darts === 0}
                  style={[
                    styles.quickScorePlayerButton,
                    closestPlayer === 2 &&
                      styles.quickScorePlayerButtonSelected,
                    simplifiedP2Darts === 0 &&
                      styles.quickScorePlayerButtonDisabled,
                  ]}
                  onPress={() => setClosestPlayer(2)}
                >
                  <Text
                    style={[
                      styles.quickScorePlayerButtonText,
                      simplifiedP2Darts === 0 &&
                        styles.quickScorePlayerButtonTextDisabled,
                    ]}
                  >
                    {player2Name}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stat Tracker Button */}
            <View style={styles.quickScoreStatTrackerSection}>
              <TouchableOpacity
                disabled={true}
                style={styles.quickScoreStatTrackerButton}
              >
                <Text style={styles.quickScoreStatTrackerText}>
                  Stat Tracker
                </Text>
                <Text style={styles.quickScoreComingSoonText}>COMING SOON</Text>
              </TouchableOpacity>
            </View>

            {/* Calculation Preview */}
            {(simplifiedP1Darts > 0 || simplifiedP2Darts > 0) &&
              closestPlayer && (
                <View style={styles.quickScoreCalculationSection}>
                  <Text style={styles.quickScoreCalculationText}>
                    {(() => {
                      let p1Score = simplifiedP1Darts;
                      let p2Score = simplifiedP2Darts;

                      // Add bonus for closest
                      if (closestPlayer === 1 && p1Score > 0) {
                        p1Score += 2;
                      } else if (closestPlayer === 2 && p2Score > 0) {
                        p2Score += 2;
                      }

                      // Calculate net score
                      const netPoints = Math.abs(p1Score - p2Score);
                      const winner =
                        p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0;

                      if (winner === 0) {
                        return "Tie - No points awarded";
                      }

                      const winnerName =
                        winner === 1 ? player1Name : player2Name;

                      return `${netPoints} Point${
                        netPoints !== 1 ? "s" : ""
                      } for ${winnerName}`;
                    })()}
                  </Text>
                </View>
              )}

            {/* Action Buttons */}
            <View style={styles.quickScoreActions}>
              <TouchableOpacity
                style={styles.quickScoreCancelButton}
                onPress={() => {
                  setShowSimplifiedOverlay(false);
                  setSimplifiedP1Darts(0);
                  setSimplifiedP2Darts(0);
                  setClosestPlayer(null);
                }}
              >
                <Text style={styles.quickScoreCancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickScoreApplyButton}
                onPress={() => {
                  // Calculate scores with cancellation scoring
                  let p1Score = simplifiedP1Darts;
                  let p2Score = simplifiedP2Darts;

                  // Add 3 points for closest dart (if any darts landed)
                  if (closestPlayer === 1 && p1Score > 0) {
                    p1Score += 2; // +2 because closest is worth 3 total (1 for landing + 2 bonus)
                  } else if (closestPlayer === 2 && p2Score > 0) {
                    p2Score += 2;
                  }

                  // Cancellation scoring: only winner gets net points
                  if (p1Score > p2Score) {
                    setPlayer1Score(player1Score + (p1Score - p2Score));
                    setFirstThrower(1); // Winner goes first next round
                  } else if (p2Score > p1Score) {
                    setPlayer2Score(player2Score + (p2Score - p1Score));
                    setFirstThrower(2);
                  }
                  // If tie, no points awarded, first thrower stays same

                  setShowSimplifiedOverlay(false);
                  setSimplifiedP1Darts(0);
                  setSimplifiedP2Darts(0);
                  setClosestPlayer(null);
                }}
              >
                <Text style={styles.quickScoreApplyButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Winner Dialog */}
      <Dialog
        visible={winner !== null}
        onDismiss={() => {}}
        style={styles.victoryDialog}
      >
        <Dialog.Content style={styles.victoryContent}>
          <Text variant="headlineLarge" style={styles.victoryTitle}>
            {winner === 1 ? player1Name : player2Name} Wins!
          </Text>
          <Text variant="displayLarge" style={styles.victoryScore}>
            {player1Score} - {player2Score}
          </Text>
          <Text variant="bodyLarge" style={styles.victorySubtext}>
            {gameFormat === "tournament"
              ? "Continue tournament or view bracket"
              : "Select Finish to See Match Results or Select Rematch to Play Again"}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.victoryActions}>
          {gameFormat === "tournament" ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                mode="contained"
                onPress={() => {
                  const nextMatch = getNextTournamentMatch();
                  if (nextMatch) {
                    advanceTournamentWinner();
                    startTournamentMatch(nextMatch);
                  } else {
                    advanceTournamentWinner();
                  }
                }}
                buttonColor="#4CAF50"
                style={styles.victoryButton}
              >
                Next Match
              </Button>
              <Button
                mode="contained"
                onPress={advanceTournamentWinner}
                buttonColor="#2196F3"
                style={styles.victoryButton}
              >
                View Bracket
              </Button>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                mode="contained"
                onPress={saveMatch}
                buttonColor="#2196F3"
                style={styles.victoryButton}
              >
                Finish
              </Button>
              <Button
                mode="contained"
                onPress={resetMatch}
                buttonColor="#4CAF50"
                style={styles.victoryButton}
              >
                Rematch
              </Button>
            </View>
          )}
        </Dialog.Actions>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fullscreen split layout
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  topPlayerSection: {
    flex: 1,
  },
  bottomPlayerSection: {
    flex: 1,
  },
  playerSectionHighlighted: {
    borderWidth: 4,
    borderColor: "#FFD700", // Gold border for first thrower
    borderRadius: 10,
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  gradientClipContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  gradientFull: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Fills the gradientClipContainer which is sized by score percentage
    borderRadius: 20,
  },
  backButtonCircle: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  simpleScoreButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#000000",
  },
  simpleScoreButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 1,
  },
  playerNameTop: {
    position: "absolute",
    top: "25%",
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    letterSpacing: 2,
    zIndex: 5,
    textShadowColor: "#FFFFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  playerNameBottom: {
    position: "absolute",
    top: "25%",
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    letterSpacing: 2,
    zIndex: 5,
    textShadowColor: "#FFFFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  scoreSectionFullscreen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  scoreHalfTapArea: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCenter: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    pointerEvents: "none",
  },
  minusPlusTextLarge: {
    fontSize: 80,
    color: "#333",
    fontWeight: "bold",
    textShadowColor: "#FFFFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  scoreNumberLarge: {
    fontSize: 140,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    textShadowColor: "#FFFFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  statTrackButtonSquare: {
    position: "absolute",
    bottom: 30,
    left: 20,
    width: 70,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#000000",
  },
  statTrackText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 1,
  },
  incrementGrid: {
    position: "absolute",
    bottom: 30,
    right: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 140,
    gap: 8,
    zIndex: 10,
  },
  incrementButton: {
    width: 66,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },
  incrementButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  // Existing styles for setup screens
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  setupContainer: {
    padding: 20,
    justifyContent: "center",
  },
  lobbyCenteredContainer: {
    padding: 20,
    justifyContent: "center",
    minHeight: "100%",
  },
  largeButtonContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "stretch",
  },
  largeImageButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
  },
  largeImageButtonDisabled: {
    opacity: 0.5,
  },
  buttonImage: {
    width: "100%",
    height: "70%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "#000000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
    textShadowColor: "#000000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mediumImageButton: {
    flex: 0.3,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: "70%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imagePlaceholderSmall: {
    width: "100%",
    height: "60%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  placeholderText: {
    fontSize: 18,
    color: "#999",
    fontStyle: "italic",
  },
  placeholderTextSmall: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  largeButtonText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 15,
  },
  mediumButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 12,
  },
  disabledButtonText: {
    color: "#999",
  },
  titleCentered: {
    textAlign: "center",
    marginBottom: 20,
    marginTop: 40,
    fontWeight: "bold",
  },
  subtitleCentered: {
    textAlign: "center",
    marginBottom: 16,
    color: "#666",
  },
  featureDescription: {
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  featureList: {
    paddingHorizontal: 24,
  },
  featureItem: {
    color: "#666",
    fontSize: 16,
    paddingVertical: 6,
    lineHeight: 24,
  },
  backButtonAbsolute: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
  },
  cancelButtonAbsolute: {
    marginTop: 20,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    marginBottom: 16,
  },
  playerSetupCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  playerSetupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playerSetupRowReordered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profilePicPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#CCC",
  },
  profileIconText: {
    fontSize: 28,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  colorIndicatorRounded: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  colorIndicatorFull: {
    width: "100%",
    height: "100%",
  },
  colorIndicatorGradient: {
    width: "100%",
    height: "100%",
  },
  playerNameInput: {
    flex: 1,
  },
  colorPicker: {
    flexDirection: "row",
    marginTop: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    marginRight: 8,
    minWidth: 40,
  },
  addPlayerButton: {
    marginBottom: 12,
  },
  matchTypeButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  teamSetupCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  colorLabel: {
    marginTop: 8,
    marginBottom: 4,
    color: "#666",
  },
  startButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  scoreContainer: {
    padding: 20,
  },
  playerCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
  },
  playerCardGradient: {
    width: "100%",
    borderRadius: 12,
  },
  playerCardContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  winnerCard: {
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  playerName: {
    marginBottom: 12,
    fontWeight: "bold",
    color: "white",
  },
  progressBarContainer: {
    width: "100%",
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    transition: "width 0.3s ease",
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  score: {
    marginHorizontal: 20,
    fontWeight: "bold",
    minWidth: 80,
    textAlign: "center",
    color: "white",
  },
  quickScoreContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  quickScoreLeft: {
    flex: 1,
  },
  quickScoreRight: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "space-between",
  },
  quickScoreChip: {
    width: "48%",
    marginBottom: 4,
    borderColor: "white",
  },
  statTrackButton: {
    height: "100%",
  },
  statsButton: {
    marginTop: 8,
  },
  vs: {
    textAlign: "center",
    color: "#999",
    fontWeight: "bold",
    marginVertical: 8,
  },
  actions: {
    padding: 20,
    paddingTop: 0,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  simplifiedOverlay: {
    padding: 20,
    justifyContent: "center",
  },
  overlayContent: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "white",
  },
  overlayTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  overlayDescription: {
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  overlayPlayerSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  overlayPlayerName: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  overlayLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#666",
  },
  dartButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  dartChip: {
    minWidth: 60,
  },
  overlayInput: {
    marginBottom: 12,
  },
  closestButton: {
    width: "100%",
  },
  overlayActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  overlayActionButton: {
    flex: 1,
  },
  statsInstruction: {
    marginBottom: 16,
    color: "#666",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  statControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    minWidth: 40,
    textAlign: "center",
  },
  winnerText: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
    color: "#FFD700",
  },
  finalScore: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 18,
  },
  victoryDialog: {
    backgroundColor: "white",
  },
  victoryContent: {
    alignItems: "center",
    paddingVertical: 50,
    paddingTop: 60,
    backgroundColor: "white",
  },
  victoryTitle: {
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  victoryScore: {
    fontSize: 72,
    fontWeight: "bold",
    marginBottom: 24,
    marginTop: 10,
    color: "#1976d2",
  },
  victorySubtext: {
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  victoryActions: {
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "white",
  },
  victoryButton: {
    minWidth: 120,
  },
  selectColorButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  // Color Picker Modal - New Design
  colorPickerModal: {
    backgroundColor: "#000000",
    margin: 0,
    width: "100%",
    height: "100%",
  },
  colorPickerContainer: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 60,
    paddingBottom: 20,
  },
  colorPickerTitle: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    paddingHorizontal: 20,
  },
  colorScrollView: {
    flex: 1,
  },
  colorListVertical: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorItemLarge: {
    width: "44%",
    height: 160,
    marginBottom: 25,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#888888",
    overflow: "hidden",
    position: "relative",
  },
  colorItemOwned: {
    borderColor: "#4CAF50",
    borderWidth: 3,
  },
  colorItemSelected: {
    borderColor: "#007AFF",
    borderWidth: 4,
  },
  colorItemTaken: {
    borderColor: "#1A237E",
    borderWidth: 3,
    opacity: 0.5,
  },
  colorItemFaded: {
    opacity: 0.5,
  },
  colorItemGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  colorNameVerticalContainer: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 30,
  },
  colorNameVertical: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    transform: [{ rotate: "-90deg" }],
    transformOrigin: "center",
    width: 120,
    textAlign: "center",
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  otherPlayerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  takenText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  continueButton: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 8,
  },
  // Back Confirmation Dialog
  backConfirmDialog: {
    backgroundColor: "#000000",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  backConfirmContent: {
    paddingVertical: 20,
  },
  backConfirmText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  backConfirmSubtext: {
    color: "#CCCCCC",
    textAlign: "center",
  },
  backConfirmActions: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  cancelBackButton: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    width: "100%",
  },
  confirmBackButton: {
    width: "100%",
    paddingVertical: 4,
  },
  // Stat Track Styles
  statTrackModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  statTrackContainer: {
    backgroundColor: "#000000",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 500,
  },
  statTrackTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  statTrackSubtitle: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 12,
  },
  statTrackPlayerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statGridItem: {
    width: "48%",
    marginBottom: 20,
  },
  statGridLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  statGridControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statButton: {
    width: 40,
    height: 40,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  statGridValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    minWidth: 40,
    textAlign: "center",
  },
  statTrackSaveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#000000",
  },
  statTrackSaveButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Quick Score Styles
  quickScoreOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  quickScoreContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  quickScoreTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  quickScoreSubtitle: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 24,
  },
  quickScorePlayerSection: {
    marginBottom: 24,
  },
  quickScorePlayerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quickScorePlayerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  quickScorePlayerCalculation: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    fontFamily: "monospace",
  },
  quickScoreInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickScoreLabel: {
    fontSize: 14,
    color: "#CCCCCC",
  },
  quickScoreControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quickScoreButton: {
    width: 40,
    height: 40,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  quickScoreButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  quickScoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    minWidth: 40,
    textAlign: "center",
  },
  quickScoreClosestSection: {
    marginBottom: 24,
  },
  quickScoreClosestButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  quickScorePlayerButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#333333",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#555555",
  },
  quickScorePlayerButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  quickScorePlayerButtonDisabled: {
    backgroundColor: "#333",
    borderColor: "#555",
    opacity: 0.5,
  },
  quickScorePlayerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  quickScorePlayerButtonTextDisabled: {
    color: "#666",
  },
  quickScoreStatTrackerSection: {
    marginTop: 20,
    alignItems: "center",
  },
  quickScoreStatTrackerButton: {
    backgroundColor: "#444",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#666",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickScoreStatTrackerText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  quickScoreComingSoonText: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
  quickScoreCalculationSection: {
    marginTop: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  quickScoreCalculationText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  quickScoreActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickScoreCancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#333333",
    borderRadius: 12,
  },
  quickScoreCancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  quickScoreApplyButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
  },
  quickScoreApplyButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Pre-Game Modal Styles
  preGameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  preGameContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    maxWidth: 450,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  preGameTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 15,
    textAlign: "center",
  },
  preGameInstruction: {
    fontSize: 16,
    color: "#CCC",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  preGameWinnerSection: {
    width: "100%",
    alignItems: "center",
  },
  preGameLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 15,
  },
  preGameButtonsRow: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
  },
  preGamePlayerButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  preGamePlayerButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  preGameWinnerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 25,
    textAlign: "center",
  },
  preGameChoiceLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 20,
    textAlign: "center",
  },
  preGameButtonsColumn: {
    width: "100%",
    gap: 15,
  },
  preGameChoiceButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  preGameChoiceButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  preGameChoiceSubtext: {
    color: "#000",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  // Tournament Styles
  tournamentRound: {
    marginBottom: 24,
  },
  roundTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#2196F3",
  },
  bracketMatch: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  bracketMatchCompleted: {
    backgroundColor: "#F5F5F5",
    borderColor: "#4CAF50",
  },
  bracketMatchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  bracketPlayerName: {
    fontSize: 16,
    color: "#333",
  },
  bracketWinner: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  winnerIcon: {
    fontSize: 20,
  },
  tapToPlayText: {
    textAlign: "center",
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  colorPickerModal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  colorPickerTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  colorOption: {
    alignItems: "center",
    marginRight: 16,
  },
  colorOptionInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  colorOptionName: {
    fontSize: 12,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 16,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // Tournament Bracket Styles
  bracketHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  bracketHeaderTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  zoomControlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  zoomText: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: "center",
  },
  bracketContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  roundLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  matchCardCompleted: {
    borderColor: "#4CAF50",
    backgroundColor: "#FAFAFA",
  },
  matchCardFuture: {
    borderColor: "#BDBDBD",
    backgroundColor: "#F5F5F5",
    opacity: 0.8,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  winnerRow: {
    backgroundColor: "#E8F5E9",
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  colorGradient: {
    width: "100%",
    height: "100%",
  },
  colorSolid: {
    width: "100%",
    height: "100%",
  },
  playerText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  winnerText: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  tbdText: {
    fontStyle: "italic",
    color: "#999",
    fontSize: 13,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginLeft: 10,
  },
  winnerScore: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  matchDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 6,
  },
  playIndicator: {
    marginTop: 8,
    paddingVertical: 4,
    backgroundColor: "#E3F2FD",
    borderRadius: 5,
    alignItems: "center",
  },
  playIndicatorInProgress: {
    backgroundColor: "#FFE0B2",
  },
  playText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1976D2",
    letterSpacing: 0.5,
  },
  // Seed (Match) Card Styles
  seedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  seedCardCompleted: {
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  seedCardFuture: {
    borderColor: "#BDBDBD",
    backgroundColor: "#F5F5F5",
    opacity: 0.7,
  },
  seedCardNextUp: {
    borderColor: "#2196F3",
    borderWidth: 3,
    backgroundColor: "#E3F2FD",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  seedCardInProgress: {
    borderColor: "#FF9800",
    borderWidth: 3,
    backgroundColor: "#FFF3E0",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  teamRowWinner: {
    backgroundColor: "#E8F5E9",
  },
  teamColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  teamNameWinner: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  teamNameTbd: {
    fontStyle: "italic",
    color: "#999",
    fontSize: 12,
  },
  teamScore: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  teamScoreWinner: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  seedDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 6,
  },
  // Match Results Modal Styles
  winnerBanner: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  matchSummaryCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: "100%",
    minWidth: 300,
  },
  matchSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  playerResultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
    minWidth: 250,
    width: "100%",
  },
  playerResultRowWinner: {
    backgroundColor: "#E8F5E9",
  },
  playerResultName: {
    fontSize: 16,
    color: "#333",
  },
  playerResultNameWinner: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  playerResultScore: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    minWidth: 50,
    textAlign: "right",
  },
  playerResultScoreWinner: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  statsComingSoon: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  statsComingSoonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: 8,
  },
  statsComingSoonText: {
    fontSize: 14,
    color: "#E65100",
    fontStyle: "italic",
  },
});
