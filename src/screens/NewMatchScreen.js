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
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  Menu,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../contexts/AuthContext";
import { usePlayerPreferences } from "../contexts/PlayerPreferencesContext";
import { POPDARTS_COLORS } from "../constants/colors";

// Specialty shots that can be tracked in a round
const SPECIALTY_SHOTS = [
  { id: "lippy", name: "Lippy", abbr: "L" },
  { id: "wiggle-nobber", name: "Wiggle Nobber", abbr: "WN" },
  { id: "t-nobber", name: "T-Nobber", abbr: "TN" },
  { id: "tower", name: "Tower", abbr: "T" },
  { id: "fender-bender", name: "Fender Bender", abbr: "FB" },
  { id: "inch-worm", name: "Inch Worm", abbr: "IW" },
];

/**
 * New Match screen - Score a Popdarts match with advanced features
 * Supports 1v1, 2v2, tournament, and quick play modes
 */
export default function NewMatchScreen({ navigation, route }) {
  const theme = useTheme();
  const { user, isGuest, guestName } = useAuth();
  const { ownedColors, favoriteHomeColor, favoriteAwayColor } =
    usePlayerPreferences();
  const insets = useSafeAreaInsets();

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
  const [closestPlayer, setClosestPlayer] = useState(null); // 1 or 2
  const [simplifiedP1Darts, setSimplifiedP1Darts] = useState(0);
  const [simplifiedP2Darts, setSimplifiedP2Darts] = useState(0);
  const [showStatTrackerModal, setShowStatTrackerModal] = useState(false);
  const [p1SpecialtyShots, setP1SpecialtyShots] = useState([]);
  const [p2SpecialtyShots, setP2SpecialtyShots] = useState([]);

  // Dart selection with specialty shots tracking
  const [p1DartStates, setP1DartStates] = useState([
    { status: "empty", specialtyShot: null }, // 'empty', 'landed', or 'missed'
    { status: "empty", specialtyShot: null },
    { status: "empty", specialtyShot: null },
  ]);
  const [p2DartStates, setP2DartStates] = useState([
    { status: "empty", specialtyShot: null }, // 'empty', 'landed', or 'missed'
    { status: "empty", specialtyShot: null },
    { status: "empty", specialtyShot: null },
  ]);
  const [showDartSpecialtyModal, setShowDartSpecialtyModal] = useState(false);
  const [selectedDartPlayer, setSelectedDartPlayer] = useState(null); // 1 or 2
  const [selectedDartIndex, setSelectedDartIndex] = useState(null); // 0-2

  // Pre-game and first thrower
  const [showPreGame, setShowPreGame] = useState(false);
  const [firstThrower, setFirstThrower] = useState(null); // 1 or 2
  const [coinFlipWinner, setCoinFlipWinner] = useState(null); // 1 or 2
  const [preGameStage, setPreGameStage] = useState("coin-flip"); // 'coin-flip', 'winner-choice', 'winner-side-selection', 'loser-order-selection', 'winner-order-selection', 'loser-side-selection'
  const [playerSides, setPlayerSides] = useState({ 1: null, 2: null }); // 'left' or 'right'
  const [winnerFirstChoice, setWinnerFirstChoice] = useState(null); // 'side' or 'order' - what winner chose first
  const [winnerChosenSide, setWinnerChosenSide] = useState(null); // 'left' or 'right' - side chosen by winner if they picked side first
  const [winnerChosenOrder, setWinnerChosenOrder] = useState(null); // 1 or 2 - player going first if winner picked order first
  const [coinFlipAnimation, setCoinFlipAnimation] = useState(
    new Animated.Value(0),
  );

  // Round tracking for Casual Competitive
  const [currentRound, setCurrentRound] = useState(1);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [pendingRoundData, setPendingRoundData] = useState(null); // Stores round summary data
  const [showMatchSummary, setShowMatchSummary] = useState(false); // Show match summary after win
  const [roundHistory, setRoundHistory] = useState([]); // Track all rounds played
  const [showWashConfirmation, setShowWashConfirmation] = useState(false); // Wash round confirmation

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
  const [quickBracketMenuVisible, setQuickBracketMenuVisible] = useState(false);
  const [selectedBracketSize, setSelectedBracketSize] = useState(null);

  // Win dialog
  const [winner, setWinner] = useState(null);

  // Match Type Selection for 1v1 Lobby
  const [lobbyMatchType, setLobbyMatchType] = useState("friendly"); // 'friendly' or 'casual-competitive'

  // Pulsing animation for paused matches
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Hide tab bar when in active gameplay (1v1 match or viewing bracket), show it during setup/lobby
  useEffect(() => {
    const isInActiveGameplay = matchStarted || showBracket;

    if (isInActiveGameplay) {
      // Hide the tab bar during active gameplay
      navigation.setOptions({
        tabBarStyle: { display: "none" },
      });
    } else {
      // Restore tab bar with proper styling for web
      if (Platform.OS === "web") {
        navigation.setOptions({
          tabBarStyle: {
            height: 60,
            backgroundColor: theme.colors.primary,
            borderBottomWidth: 0,
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        });
      } else {
        navigation.setOptions({
          tabBarStyle: undefined,
        });
      }
    }

    // Cleanup: restore tab bar when component unmounts
    return () => {
      if (Platform.OS === "web") {
        navigation.setOptions({
          tabBarStyle: {
            height: 60,
            backgroundColor: theme.colors.primary,
            borderBottomWidth: 0,
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        });
      } else {
        navigation.setOptions({
          tabBarStyle: undefined,
        });
      }
    };
  }, [matchStarted, showBracket, navigation, theme]);

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
    // If both have darts, keep the current selection so preview updates live
    // User can manually select who is closest
    else if (simplifiedP1Darts === 0 && simplifiedP2Darts === 0) {
      setClosestPlayer(null);
    }
    // If both have darts and no selection yet, don't auto-select
    // (user will click on a player to select)
  }, [simplifiedP1Darts, simplifiedP2Darts]);

  // Auto-show simplified overlay when both players have darts recorded
  useEffect(() => {
    if (
      simplifiedMode &&
      simplifiedP1Darts > 0 &&
      simplifiedP2Darts > 0 &&
      !showSimplifiedOverlay
    ) {
      setShowSimplifiedOverlay(true);
    }
  }, [
    simplifiedP1Darts,
    simplifiedP2Darts,
    simplifiedMode,
    showSimplifiedOverlay,
  ]);

  // Sync dartStates with simplified dart counts for live preview
  useEffect(() => {
    const p1Count = p1DartStates.filter((d) => d.status === "landed").length;
    const p2Count = p2DartStates.filter((d) => d.status === "landed").length;

    setSimplifiedP1Darts(p1Count);
    setSimplifiedP2Darts(p2Count);
  }, [p1DartStates, p2DartStates]);

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

    // Calculate winner and new first thrower
    let roundWinner = 0; // 0 = tie, 1 = player1, 2 = player2
    if (p1Points > p2Points) {
      roundWinner = 1;
    } else if (p2Points > p1Points) {
      roundWinner = 2;
    }

    // Create round summary data
    const summary = {
      p1Darts,
      p2Darts,
      p1Points,
      p2Points,
      netScore,
      winner: roundWinner,
      roundNumber: currentRound,
    };

    console.log("submitSimplifiedRound: Creating summary", summary);
    // Show the summary dialog
    setPendingRoundData(summary);
    setShowRoundSummary(true);
    setShowSimplifiedOverlay(false);
    console.log("submitSimplifiedRound: Set showRoundSummary to true");
  };

  /**
   * Apply the pending round (after user confirms the summary)
   */
  const applyRound = () => {
    console.log("applyRound called! Current round:", currentRound);
    console.log("pendingRoundData:", pendingRoundData);

    if (!pendingRoundData) {
      console.log("No pending round data, returning");
      return;
    }

    const { p1Points, p2Points, netScore, winner } = pendingRoundData;
    console.log("Applying round. Winner:", winner, "Net Score:", netScore);

    // Apply points based on winner
    if (winner === 1) {
      console.log("Player 1 wins this round");
      setPlayer1Score(player1Score + netScore);
      setPlayer1Stats({
        ...player1Stats,
        roundsWon: player1Stats.roundsWon + 1,
      });
      setFirstThrower(1); // Winner goes first next round
    } else if (winner === 2) {
      console.log("Player 2 wins this round");
      setPlayer2Score(player2Score + netScore);
      setPlayer2Stats({
        ...player2Stats,
        roundsWon: player2Stats.roundsWon + 1,
      });
      setFirstThrower(2); // Winner goes first next round
    } else {
      console.log("Tie round");
    }
    // If tie (winner === 0), no points awarded, first thrower stays same

    // Increment round number
    setCurrentRound((prev) => {
      const newRound = prev + 1;
      console.log("Incrementing round from", prev, "to", newRound);
      return newRound;
    });

    // Reset round inputs
    setSimplifiedP1Darts(0);
    setSimplifiedP2Darts(0);
    setClosestPlayer(null);
    setShowRoundSummary(false);
    setPendingRoundData(null);
    console.log("Round applied and states reset");
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
    setCurrentRound(1);
    setRoundHistory([]);
  };

  /**
   * Auto-populate tournament players to reach the selected bracket size
   * @param {number} size - Target bracket size (4, 8, 16, 32, 64, 128)
   */
  const autoPopulateTournamentPlayers = (size) => {
    setSelectedBracketSize(size);

    const currentPlayers = [...tournamentPlayers];

    // If new size is smaller, trim the list
    if (currentPlayers.length > size) {
      setTournamentPlayers(currentPlayers.slice(0, size));
    }
    // If new size is larger, add more players
    else if (currentPlayers.length < size) {
      const newPlayers = [];
      for (let i = currentPlayers.length; i < size; i++) {
        newPlayers.push({
          name: "",
          color: POPDARTS_COLORS[i % POPDARTS_COLORS.length],
        });
      }
      setTournamentPlayers([...currentPlayers, ...newPlayers]);
    }
    // If same size, do nothing (just update selectedBracketSize)
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

    // Reset ALL match state before navigating to ensure fresh Quick Play
    setWinner(null);
    setShowMatchSummary(false);
    setMatchStarted(false);
    setMatchMode(null);
    setMatchType(null);
    setEditionType(null);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPlayer1Name(currentUserName);
    setPlayer2Name("");
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
    setCurrentRound(1);
    setRoundHistory([]);
    setSimplifiedP1Darts(0);
    setSimplifiedP2Darts(0);
    setClosestPlayer(null);
    setP1SpecialtyShots([]);
    setP2SpecialtyShots([]);
    setSimplifiedMode(false);
    setShowSimplifiedOverlay(false);
    setFirstThrower(null);
    setCoinFlipWinner(null);
    setPreGameStage("coin-flip");
    setPlayerSides({ 1: null, 2: null });
    setWinnerFirstChoice(null);
    setWinnerChosenSide(null);
    setWinnerChosenOrder(null);
    setPlayers([]);
    setLobbyMatchType("friendly");

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
    setCurrentRound(1); // Reset round counter
    setRoundHistory([]); // Clear round history
    setShowRoundSummary(false);
    setPendingRoundData(null);
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

  /**
   * Animated coin flip that rapidly flashes between player names,
   * then slows down and stops on a random winner
   * Total duration: ~3 seconds (fast flips, then slow, then flash winner)
   */
  const startCoinFlipAnimation = () => {
    setCoinFlipWinner(0); // Reset state

    let currentDisplay = 1;
    let iteration = 0;
    const maxIterations = 20; // Number of flashes - reduced for faster animation
    let delay = 30; // Initial milliseconds between flashes

    const runFlip = () => {
      if (iteration < maxIterations) {
        currentDisplay = currentDisplay === 1 ? 2 : 1;
        setCoinFlipWinner(currentDisplay);

        // Dramatically slow down the animation over time (ease out effect)
        // Fast at start (30ms), slow to 250ms by the end
        delay = 30 + (iteration / maxIterations) * 220;

        setTimeout(() => {
          iteration++;
          runFlip();
        }, delay);
      } else {
        // Final winner is the last displayed value
        setCoinFlipWinner(currentDisplay);

        // Flash the winner a few times with shorter duration
        let flashCount = 0;
        const flashInterval = setInterval(() => {
          if (flashCount % 2 === 0) {
            setCoinFlipWinner(0); // Hide
          } else {
            setCoinFlipWinner(currentDisplay); // Show
          }

          flashCount++;
          if (flashCount >= 4) {
            // Reduced from 6 to 4 flashes
            clearInterval(flashInterval);
            setCoinFlipWinner(currentDisplay); // Final display
            setPreGameStage("winner-choice");
          }
        }, 150); // Faster flash speed
      }
    };

    runFlip();
  };

  /**
   * Finalizes a selection (side or order) based on which stage we're in
   * Handles the two-choice system for coin flip winner
   */
  const finalizeSelection = (playerNum, choice, choiceType) => {
    if (choiceType === "side") {
      // Winner just picked their side
      if (preGameStage === "winner-side-selection") {
        const otherPlayer = playerNum === 1 ? 2 : 1;
        const oppositeSide = choice === "left" ? "right" : "left";
        setPlayerSides({
          [playerNum]: choice,
          [otherPlayer]: oppositeSide,
        });
        setWinnerChosenSide(choice);
        // Now loser picks order (First/Second)
        setPreGameStage("loser-order-selection");
      } else if (preGameStage === "loser-side-selection") {
        // Loser just picked their side after winner picked order
        const otherPlayer = playerNum === 1 ? 2 : 1;
        const oppositeSide = choice === "left" ? "right" : "left";
        setPlayerSides({
          [playerNum]: choice,
          [otherPlayer]: oppositeSide,
        });
        // Start the match
        setCoinFlipWinner(null);
        setWinnerFirstChoice(null);
        setWinnerChosenSide(null);
        setWinnerChosenOrder(null);
        setPreGameStage("coin-flip");
        setShowPreGame(false);
        setMatchStarted(true);
      }
    } else if (choiceType === "order") {
      // Someone just picked the order (who goes first)
      if (preGameStage === "winner-order-selection") {
        // Winner just picked order
        setWinnerChosenOrder(playerNum);
        setFirstThrower(playerNum);
        // Now loser picks side (Left/Right)
        setPreGameStage("loser-side-selection");
      } else if (preGameStage === "loser-order-selection") {
        // Loser just picked order after winner picked side
        setFirstThrower(playerNum);
        // Start the match
        setCoinFlipWinner(null);
        setWinnerFirstChoice(null);
        setWinnerChosenSide(null);
        setWinnerChosenOrder(null);
        setPreGameStage("coin-flip");
        setShowPreGame(false);
        setMatchStarted(true);
      }
    }
  };

  // Pre-Game Modal (rendered at component level)
  const renderPreGameModal = () => {
    const renderCoinFlipStage = () => (
      <View style={styles.preGameContainer}>
        <Text style={styles.preGameTitle}>Coin Flip</Text>

        <View style={styles.coinFlipContainer}>
          <View style={styles.playerNameContainer}>
            <Text style={styles.playerName}>{player1Name}</Text>
          </View>

          <Animated.View style={[styles.winnerFlashContainer]}>
            <View
              style={[
                styles.coinFlipDisplay,
                {
                  backgroundColor:
                    coinFlipWinner === 0
                      ? player1Color
                      : coinFlipWinner === 1
                        ? player1Color
                        : player2Color,
                },
              ]}
            >
              <Text style={styles.coinFlipText}>
                {coinFlipWinner === 0 || coinFlipWinner === 1
                  ? player1Name
                  : player2Name}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.playerNameContainer}>
            <Text style={styles.playerName}>{player2Name}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.preGameChoiceButton}
          onPress={startCoinFlipAnimation}
        >
          <Text style={styles.preGameChoiceButtonText}>Begin Coin Flip</Text>
        </TouchableOpacity>
      </View>
    );

    const renderChoiceStage = () => (
      <View style={styles.preGameContainer}>
        <Text style={styles.preGameTitle}>
          {coinFlipWinner === 1 ? player1Name : player2Name} Won!
        </Text>
        <Text style={styles.preGameInstruction}>
          What would you like to choose first?
        </Text>

        <View style={styles.preGameButtonsColumn}>
          <TouchableOpacity
            style={styles.preGameChoiceButton}
            onPress={() => {
              setWinnerFirstChoice("side");
              setPreGameStage("winner-side-selection");
            }}
          >
            <Text style={styles.preGameChoiceButtonText}>Pick Your Side</Text>
            <Text style={styles.preGameChoiceSubtext}>Left or Right</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preGameChoiceButton}
            onPress={() => {
              setWinnerFirstChoice("order");
              setPreGameStage("winner-order-selection");
            }}
          >
            <Text style={styles.preGameChoiceButtonText}>Pick Your Order</Text>
            <Text style={styles.preGameChoiceSubtext}>
              First or Second throw
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    const renderSideSelectionStage = () => {
      const isWinnerSelecting = preGameStage === "winner-side-selection";
      const playerNum = isWinnerSelecting
        ? coinFlipWinner
        : coinFlipWinner === 1
          ? 2
          : 1;
      const playerNameContent = playerNum === 1 ? player1Name : player2Name;

      return (
        <View style={styles.preGameContainer}>
          <Text style={styles.preGameTitle}>Choose Side</Text>
          <Text style={styles.preGameInstruction}>
            {playerNameContent}, choose your side:
          </Text>

          <View style={styles.preGameButtonsColumn}>
            <TouchableOpacity
              style={styles.preGameChoiceButton}
              onPress={() => {
                finalizeSelection(playerNum, "left", "side");
              }}
            >
              <Text style={styles.preGameChoiceButtonText}>← Left</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.preGameChoiceButton}
              onPress={() => {
                finalizeSelection(playerNum, "right", "side");
              }}
            >
              <Text style={styles.preGameChoiceButtonText}>Right →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    const renderOrderSelectionStage = () => {
      const isWinnerSelecting = preGameStage === "winner-order-selection";
      const playerNum = isWinnerSelecting
        ? coinFlipWinner
        : coinFlipWinner === 1
          ? 2
          : 1;
      const otherPlayerNum = playerNum === 1 ? 2 : 1;
      const playerNameContent = playerNum === 1 ? player1Name : player2Name;
      const otherPlayerName = otherPlayerNum === 1 ? player1Name : player2Name;

      return (
        <View style={styles.preGameContainer}>
          <Text style={styles.preGameTitle}>Choose Throw Order</Text>
          <Text style={styles.preGameInstruction}>
            {playerNameContent}, who goes first?
          </Text>

          <View style={styles.preGameButtonsColumn}>
            <TouchableOpacity
              style={styles.preGameChoiceButton}
              onPress={() => {
                finalizeSelection(playerNum, undefined, "order");
              }}
            >
              <Text style={styles.preGameChoiceButtonText}>
                {playerNameContent}
              </Text>
              <Text style={styles.preGameChoiceSubtext}>Throws First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.preGameChoiceButton}
              onPress={() => {
                finalizeSelection(otherPlayerNum, undefined, "order");
              }}
            >
              <Text style={styles.preGameChoiceButtonText}>
                {otherPlayerName}
              </Text>
              <Text style={styles.preGameChoiceSubtext}>Throws First</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    return (
      <Modal visible={showPreGame} animationType="slide" transparent>
        <View style={styles.preGameOverlay}>
          {preGameStage === "coin-flip" && renderCoinFlipStage()}
          {preGameStage === "winner-choice" && renderChoiceStage()}
          {(preGameStage === "winner-side-selection" ||
            preGameStage === "loser-side-selection") &&
            renderSideSelectionStage()}
          {(preGameStage === "winner-order-selection" ||
            preGameStage === "loser-order-selection") &&
            renderOrderSelectionStage()}
        </View>
      </Modal>
    );
  };

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
        <View style={styles.container}>
          <View
            style={[styles.largeButtonContainer, { paddingTop: insets.top }]}
          >
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
        </View>
      );
    }

    // Step 2: Edition Selection (Classic vs Board)
    if (!editionType) {
      return (
        <View style={styles.container}>
          <View
            style={[styles.largeButtonContainer, { paddingTop: insets.top }]}
          >
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setMatchType(null)}
              style={[styles.backButtonAbsolute, { top: 10 + insets.top }]}
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
        </View>
      );
    }

    // Step 3: Game Format Selection (Single Match vs Tournament)
    if (!gameFormat) {
      return (
        <View style={styles.container}>
          <View
            style={[styles.largeButtonContainer, { paddingTop: insets.top }]}
          >
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setEditionType(null)}
              style={[styles.backButtonAbsolute, { top: 10 + insets.top }]}
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
        </View>
      );
    }

    // Step 4: Match Mode Selection (1v1, 2v2, Party) - Only for single matches
    if (gameFormat === "single" && !matchMode) {
      return (
        <View style={styles.container}>
          <View
            style={[styles.largeButtonContainer, { paddingTop: insets.top }]}
          >
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setGameFormat(null)}
              style={[styles.backButtonAbsolute, { top: 10 + insets.top }]}
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
        </View>
      );
    }

    // Step 4b: Tournament Bracket Setup (if tournament format selected)
    if (gameFormat === "tournament") {
      // Show bracket view if bracket exists
      if (showBracket && tournamentBracket) {
        const rounds = convertToSeedsFormat();

        return (
          <View style={styles.container}>
            {/* Header */}
            <View style={[styles.bracketHeader, { paddingTop: insets.top }]}>
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
                        setRoundXOffsets((prev) => {
                          // Only update if value actually changed
                          if (prev[roundIndex] !== x) {
                            return {
                              ...prev,
                              [roundIndex]: x,
                            };
                          }
                          return prev;
                        });
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
                                setMatchPositions((prev) => {
                                  const existingPos = prev[seed.id];
                                  // Only update if position actually changed
                                  if (
                                    !existingPos ||
                                    existingPos.x !== calculatedRoundX ||
                                    existingPos.y !== y ||
                                    existingPos.width !== width ||
                                    existingPos.height !== height
                                  ) {
                                    return {
                                      ...prev,
                                      [seed.id]: {
                                        x: calculatedRoundX,
                                        y,
                                        width,
                                        height,
                                        centerY: y + height / 2,
                                        roundIndex,
                                      },
                                    };
                                  }
                                  return prev;
                                });
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
                    // console.log("=== SVG RENDERING ===");
                    // console.log(
                    //   "Total match positions tracked:",
                    //   Object.keys(matchPositions).length,
                    // );
                    // console.log("Match positions:", matchPositions);
                    // console.log("Round X offsets:", roundXOffsets);
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

                      // console.log(
                      //   `\n--- Round ${roundIndex} → ${
                      //     roundIndex + 1
                      //   }, Match ${nextMatchIndex} ---`,
                      // );
                      // console.log(
                      //   "Source Match 1:",
                      //   sourceMatch1?.id,
                      //   sourceMatch1?.teams[0]?.name,
                      // );
                      // console.log(
                      //   "Source Match 2:",
                      //   sourceMatch2?.id,
                      //   sourceMatch2?.teams[0]?.name,
                      // );
                      // console.log("Next Match:", nextSeed?.id);

                      if (!sourceMatch1 || !sourceMatch2) {
                        // console.log("❌ Missing source match(es)");
                        return;
                      }

                      const pos1 = matchPositions[sourceMatch1.id];
                      const pos2 = matchPositions[sourceMatch2.id];
                      const posNext = matchPositions[nextSeed.id];

                      // console.log("Position 1:", pos1);
                      // console.log("Position 2:", pos2);
                      // console.log("Position Next:", posNext);

                      if (!pos1 || !pos2 || !posNext) {
                        // console.log("❌ Missing position data");
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

                      // console.log(
                      //   `Junction at Y=${junctionMidY}, Next match at Y=${nextCenterY}, Diff=${Math.abs(
                      //     junctionMidY - nextCenterY,
                      //   )}`,
                      // );

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

                      // console.log(
                      //   `Round ${roundIndex} Match ${nextMatchIndex}:`,
                      //   {
                      //     match1: { x: match1RightX, y: match1CenterY },
                      //     match2: { x: match2RightX, y: match2CenterY },
                      //     next: { x: nextLeftX, y: nextCenterY },
                      //     verticalX,
                      //     junctionMidY,
                      //     distances: {
                      //       match1ToJunction: verticalX - match1RightX,
                      //       junctionToNext: nextLeftX - verticalX,
                      //     },
                      //   },
                      // );
                    });

                    return paths;
                  })}
                </Svg>
              )}
            </ScrollView>

            {/* Match Results Modal */}
            {renderMatchResultsModal()}
          </View>
        );
      }

      // Tournament player setup
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={[
              styles.setupContainer,
              { paddingTop: insets.top },
            ]}
          >
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

            {/* Quick Bracket Size Selector */}
            <Surface style={styles.quickBracketSurface}>
              <Text variant="labelLarge" style={styles.quickBracketLabel}>
                Quick Fill:
              </Text>
              <Menu
                visible={quickBracketMenuVisible}
                onDismiss={() => setQuickBracketMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setQuickBracketMenuVisible(true)}
                    icon="account-multiple-plus"
                    style={styles.quickBracketButton}
                  >
                    {selectedBracketSize
                      ? `${selectedBracketSize} Players`
                      : "Select Bracket Size"}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setQuickBracketMenuVisible(false);
                    setTimeout(() => autoPopulateTournamentPlayers(4), 100);
                  }}
                  title="4 Players"
                />
                <Menu.Item
                  onPress={() => {
                    setQuickBracketMenuVisible(false);
                    setTimeout(() => autoPopulateTournamentPlayers(8), 100);
                  }}
                  title="8 Players"
                />
                <Menu.Item
                  onPress={() => {
                    setQuickBracketMenuVisible(false);
                    setTimeout(() => autoPopulateTournamentPlayers(16), 100);
                  }}
                  title="16 Players"
                />
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setQuickBracketMenuVisible(false);
                    setTimeout(() => autoPopulateTournamentPlayers(32), 100);
                  }}
                  title="32 Players"
                  disabled={true}
                  titleStyle={{ color: "#999" }}
                />
                <Menu.Item
                  onPress={() => {
                    setQuickBracketMenuVisible(false);
                    setTimeout(() => autoPopulateTournamentPlayers(64), 100);
                  }}
                  title="64 Players"
                  disabled={true}
                  titleStyle={{ color: "#999" }}
                />
                <Menu.Item
                  onPress={() => {
                    setQuickBracketMenuVisible(false);
                    setTimeout(() => autoPopulateTournamentPlayers(128), 100);
                  }}
                  title="128 Players"
                  disabled={true}
                  titleStyle={{ color: "#999" }}
                />
              </Menu>
            </Surface>

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
        </View>
      );
    }

    // Step 5: Lobby (Player Setup)
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.lobbyCenteredContainer,
            { paddingTop: insets.top },
          ]}
        >
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              setMatchMode(null);
              setPlayers([]);
              setTeams([]);
            }}
            style={[styles.backButtonAbsolute, { top: 10 + insets.top }]}
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
                // Casual Competitive: show pre-game (coin flip animation), enable stat tracking
                setPreGameStage("coin-flip");
                setPlayerSides({ 1: null, 2: null });
                setShowPreGame(true);
              } else {
                // Default: show pre-game for other modes
                setPreGameStage("coin-flip");
                setPlayerSides({ 1: null, 2: null });
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
      </View>
    );
  }

  // Only enable stat tracking for 'casual-competitive' in 1v1 mode
  const isStatTrackingEnabled = !(
    matchMode === "1v1" &&
    typeof lobbyMatchType !== "undefined" &&
    lobbyMatchType === "friendly"
  );

  return (
    <>
      <View style={styles.fullscreenContainer}>
        {/* Top Player - 50% of screen */}
        <View
          style={[
            styles.topPlayerSection,
            firstThrower === 1 && styles.playerSectionHighlighted,
          ]}
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
                    {
                      backgroundColor:
                        player1ColorObj?.colors?.[0] || "#2A2A2A",
                    },
                  ]}
                />
              )}
            </View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setShowBackConfirmation(true)}
              style={[styles.backButtonCircle, { top: 40 + insets.top }]}
            >
              <IconButton icon="arrow-left" size={24} iconColor="#333" />
            </TouchableOpacity>

            {/* Simple Scoring Button - Hidden in Casual Competitive */}
            {lobbyMatchType !== "casual-competitive" && (
              <TouchableOpacity
                onPress={() => setShowSimplifiedOverlay(true)}
                disabled={winner !== null}
                style={[styles.simpleScoreButton, { top: 40 + insets.top }]}
              >
                <Text style={styles.simpleScoreButtonText}>QUICK</Text>
                <Text style={styles.simpleScoreButtonText}>SCORE</Text>
              </TouchableOpacity>
            )}

            {/* Player Name */}
            <Text style={styles.playerNameTop}>
              {player1Name.toUpperCase()}
            </Text>

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

            {/* Stat Track Button - Hidden in Casual Competitive */}
            {lobbyMatchType !== "casual-competitive" && (
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
            )}

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
                    {
                      backgroundColor:
                        player2ColorObj?.colors?.[0] || "#CF2740",
                    },
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

            {/* Stat Track Button - Hidden in Casual Competitive */}
            {lobbyMatchType !== "casual-competitive" && (
              <TouchableOpacity
                onPress={() => setShowStatsDialog("player2")}
                style={styles.statTrackButtonSquare}
              >
                <Text style={styles.statTrackText}>STAT</Text>
                <Text style={styles.statTrackText}>TRACK</Text>
              </TouchableOpacity>
            )}

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

        {/* Round Tracker - Centered in middle of screen */}
        {lobbyMatchType === "casual-competitive" &&
          !showRoundSummary &&
          !showBackConfirmation &&
          winner === null && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSimplifiedOverlay(true)}
              style={styles.roundTrackerContainer}
            >
              <View style={styles.roundTrackerBox}>
                <Text style={styles.roundTrackerLabel}>ROUND</Text>
                <Text style={styles.roundTrackerNumber}>{currentRound}</Text>
                <Text style={styles.roundTrackerHint}>TAP TO SCORE</Text>
              </View>
            </TouchableOpacity>
          )}

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
                        addStat(
                          showStatsDialog === "player1" ? 1 : 2,
                          "tNobbers",
                        )
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
                          setStats({
                            ...stats,
                            inchWorms: stats.inchWorms - 1,
                          });
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
                        addStat(
                          showStatsDialog === "player1" ? 1 : 2,
                          "lippies",
                        )
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

        {/* Round Summary Dialog */}
        {showRoundSummary &&
          pendingRoundData &&
          console.log(
            "Rendering Round Summary Modal with data:",
            pendingRoundData,
          )}
        <Modal
          visible={showRoundSummary && pendingRoundData !== null}
          onDismiss={() => {
            console.log("Round Summary Modal dismissed");
            setShowRoundSummary(false);
            setPendingRoundData(null);
          }}
          animationType="fade"
          transparent
        >
          <View style={styles.roundSummaryOverlay}>
            <View style={styles.roundSummaryContainer}>
              <Text style={styles.roundSummaryTitle}>
                Round {pendingRoundData?.roundNumber} Summary
              </Text>

              {/* Round Results */}
              <View style={styles.roundSummaryContent}>
                {/* Player 1 Stats */}
                <View style={styles.roundPlayerStats}>
                  <Text style={styles.roundPlayerName}>{player1Name}</Text>
                  <Text style={styles.roundDarts}>
                    {pendingRoundData?.p1Darts} dart
                    {pendingRoundData?.p1Darts !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.roundPoints}>
                    {pendingRoundData?.p1Points} point
                    {pendingRoundData?.p1Points !== 1 ? "s" : ""}
                  </Text>
                </View>

                {/* VS Divider */}
                <View style={styles.roundVsDivider}>
                  <Text style={styles.roundVsText}>VS</Text>
                </View>

                {/* Player 2 Stats */}
                <View style={styles.roundPlayerStats}>
                  <Text style={styles.roundPlayerName}>{player2Name}</Text>
                  <Text style={styles.roundDarts}>
                    {pendingRoundData?.p2Darts} dart
                    {pendingRoundData?.p2Darts !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.roundPoints}>
                    {pendingRoundData?.p2Points} point
                    {pendingRoundData?.p2Points !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Round Winner */}
              <View style={styles.roundWinnerSection}>
                {pendingRoundData?.winner === 0 ? (
                  <Text style={styles.roundTieText}>It's a Tie!</Text>
                ) : (
                  <>
                    <Text style={styles.roundWinnerLabel}>Round Winner</Text>
                    <Text style={styles.roundWinnerName}>
                      {pendingRoundData?.winner === 1
                        ? player1Name
                        : player2Name}
                    </Text>
                    <Text style={styles.roundWinnerPoints}>
                      +{pendingRoundData?.netScore} Point
                      {pendingRoundData?.netScore !== 1 ? "s" : ""}
                    </Text>
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.roundSummaryActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    console.log("EDIT button pressed");
                    setShowRoundSummary(false);
                    setPendingRoundData(null);
                    setShowSimplifiedOverlay(true); // Re-open the quick score overlay
                  }}
                  textColor="#FFFFFF"
                  style={styles.roundSummaryActionButton}
                >
                  EDIT
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    console.log("SUBMIT ROUND button pressed");
                    applyRound();
                  }}
                  buttonColor="#4CAF50"
                  textColor="#000000"
                  style={styles.roundSummaryActionButton}
                >
                  SUBMIT ROUND
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Quick Score Overlay */}
        <Modal
          visible={showSimplifiedOverlay}
          onDismiss={() => setShowSimplifiedOverlay(false)}
          animationType="fade"
          transparent
        >
          <View style={styles.quickScoreOverlay}>
            <ScrollView
              contentContainerStyle={styles.quickScoreScrollContainer}
            >
              <View style={styles.quickScoreContainer}>
                <Text style={styles.quickScoreTitle}>Quick Score</Text>
                <Text style={styles.quickScoreSubtitle}>
                  Enter dart counts for quick scoring
                </Text>

                {/* Player 1 */}
                <View style={styles.quickScorePlayerSection}>
                  <View style={styles.quickScorePlayerHeader}>
                    <Text style={styles.quickScorePlayerName}>
                      {player1Name}
                    </Text>
                    {p1DartStates.filter((d) => d.status === "landed").length >
                      0 && (
                      <Text style={styles.quickScorePlayerCalculation}>
                        {(() => {
                          const calculations = [];
                          let total = 0;

                          p1DartStates.forEach((dart, idx) => {
                            if (dart.status === "landed") {
                              let dartValue =
                                dart.specialtyShot === "tower" ? 5 : 1;

                              // Add closest bonus only to first landed dart
                              if (
                                closestPlayer === 1 &&
                                calculations.length === 0
                              ) {
                                dartValue += 2;
                              }

                              calculations.push(dartValue.toString());
                              total += dartValue;
                            }
                          });

                          return `= ${calculations.join(" + ")}`;
                        })()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.quickScoreInputRow}>
                    <Text style={styles.quickScoreLabel}>Darts Landed:</Text>
                    <View style={styles.dartSelectorGrid}>
                      {p1DartStates.map((dart, index) => (
                        <TouchableOpacity
                          key={index}
                          onLongPress={() => {
                            setSelectedDartPlayer(1);
                            setSelectedDartIndex(index);
                            setShowDartSpecialtyModal(true);
                          }}
                          onPress={() => {
                            const newStates = [...p1DartStates];
                            // Cycle through states: empty -> landed -> missed -> empty
                            const currentStatus = newStates[index].status;
                            let nextStatus = "landed";
                            if (currentStatus === "landed") {
                              nextStatus = "missed";
                            } else if (currentStatus === "missed") {
                              nextStatus = "empty";
                            }

                            newStates[index] = {
                              ...newStates[index],
                              status: nextStatus,
                              specialtyShot:
                                nextStatus === "empty"
                                  ? null
                                  : newStates[index].specialtyShot,
                            };
                            setP1DartStates(newStates);
                          }}
                          style={[
                            styles.dartSquare,
                            dart.status === "landed" &&
                              styles.dartSquareSelected,
                            dart.status === "missed" && styles.dartSquareMissed,
                            dart.specialtyShot &&
                              styles.dartSquareWithSpecialty,
                          ]}
                        >
                          {dart.status === "missed" && (
                            <Text style={styles.dartMissedX}>✕</Text>
                          )}
                          {dart.specialtyShot && dart.status === "landed" && (
                            <Text style={styles.dartSpecialtyIndicator}>
                              {SPECIALTY_SHOTS.find(
                                (s) => s.id === dart.specialtyShot,
                              )?.abbr || ""}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Player 2 */}
                <View style={styles.quickScorePlayerSection}>
                  <View style={styles.quickScorePlayerHeader}>
                    <Text style={styles.quickScorePlayerName}>
                      {player2Name}
                    </Text>
                    {p2DartStates.filter((d) => d.status === "landed").length >
                      0 && (
                      <Text style={styles.quickScorePlayerCalculation}>
                        {(() => {
                          const calculations = [];
                          let total = 0;

                          p2DartStates.forEach((dart, idx) => {
                            if (dart.status === "landed") {
                              let dartValue =
                                dart.specialtyShot === "tower" ? 5 : 1;

                              // Add closest bonus only to first landed dart
                              if (
                                closestPlayer === 2 &&
                                calculations.length === 0
                              ) {
                                dartValue += 2;
                              }

                              calculations.push(dartValue.toString());
                              total += dartValue;
                            }
                          });

                          return `= ${calculations.join(" + ")}`;
                        })()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.quickScoreInputRow}>
                    <Text style={styles.quickScoreLabel}>Darts Landed:</Text>
                    <View style={styles.dartSelectorGrid}>
                      {p2DartStates.map((dart, index) => (
                        <TouchableOpacity
                          key={index}
                          onLongPress={() => {
                            setSelectedDartPlayer(2);
                            setSelectedDartIndex(index);
                            setShowDartSpecialtyModal(true);
                          }}
                          onPress={() => {
                            const newStates = [...p2DartStates];
                            // Cycle through states: empty -> landed -> missed -> empty
                            const currentStatus = newStates[index].status;
                            let nextStatus = "landed";
                            if (currentStatus === "landed") {
                              nextStatus = "missed";
                            } else if (currentStatus === "missed") {
                              nextStatus = "empty";
                            }

                            newStates[index] = {
                              ...newStates[index],
                              status: nextStatus,
                              specialtyShot:
                                nextStatus === "empty"
                                  ? null
                                  : newStates[index].specialtyShot,
                            };
                            setP2DartStates(newStates);
                          }}
                          style={[
                            styles.dartSquare,
                            dart.status === "landed" &&
                              styles.dartSquareSelected,
                            dart.status === "missed" && styles.dartSquareMissed,
                            dart.specialtyShot &&
                              styles.dartSquareWithSpecialty,
                          ]}
                        >
                          {dart.status === "missed" && (
                            <Text style={styles.dartMissedX}>✕</Text>
                          )}
                          {dart.specialtyShot && dart.status === "landed" && (
                            <Text style={styles.dartSpecialtyIndicator}>
                              {SPECIALTY_SHOTS.find(
                                (s) => s.id === dart.specialtyShot,
                              )?.abbr || ""}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
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
                      disabled={
                        p1DartStates.filter((d) => d.status === "landed")
                          .length === 0
                      }
                      style={[
                        styles.quickScorePlayerButton,
                        closestPlayer === 1 &&
                          styles.quickScorePlayerButtonSelected,
                        p1DartStates.filter((d) => d.status === "landed")
                          .length === 0 &&
                          styles.quickScorePlayerButtonDisabled,
                      ]}
                      onPress={() => setClosestPlayer(1)}
                    >
                      <Text
                        style={[
                          styles.quickScorePlayerButtonText,
                          p1DartStates.filter((d) => d.status === "landed")
                            .length === 0 &&
                            styles.quickScorePlayerButtonTextDisabled,
                        ]}
                      >
                        {player1Name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={
                        p2DartStates.filter((d) => d.status === "landed")
                          .length === 0
                      }
                      style={[
                        styles.quickScorePlayerButton,
                        closestPlayer === 2 &&
                          styles.quickScorePlayerButtonSelected,
                        p2DartStates.filter((d) => d.status === "landed")
                          .length === 0 &&
                          styles.quickScorePlayerButtonDisabled,
                      ]}
                      onPress={() => setClosestPlayer(2)}
                    >
                      <Text
                        style={[
                          styles.quickScorePlayerButtonText,
                          p2DartStates.filter((d) => d.status === "landed")
                            .length === 0 &&
                            styles.quickScorePlayerButtonTextDisabled,
                        ]}
                      >
                        {player2Name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Calculation Preview */}
                {(p1DartStates.filter((d) => d.status === "landed").length >
                  0 ||
                  p2DartStates.filter((d) => d.status === "landed").length >
                    0) &&
                  closestPlayer && (
                    <View style={styles.quickScoreCalculationSection}>
                      <Text style={styles.quickScoreCalculationText}>
                        {(() => {
                          let p1Score = 0;
                          let p2Score = 0;

                          // Calculate score for player 1
                          p1DartStates.forEach((dart) => {
                            if (dart.status === "landed") {
                              if (dart.specialtyShot === "tower") {
                                p1Score += 5;
                              } else {
                                p1Score += 1;
                              }
                            }
                          });

                          // Calculate score for player 2
                          p2DartStates.forEach((dart) => {
                            if (dart.status === "landed") {
                              if (dart.specialtyShot === "tower") {
                                p2Score += 5;
                              } else {
                                p2Score += 1;
                              }
                            }
                          });

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
                      setP1DartStates([
                        { status: "empty", specialtyShot: null },
                        { status: "empty", specialtyShot: null },
                        { status: "empty", specialtyShot: null },
                      ]);
                      setP2DartStates([
                        { status: "empty", specialtyShot: null },
                        { status: "empty", specialtyShot: null },
                        { status: "empty", specialtyShot: null },
                      ]);
                    }}
                  >
                    <Text style={styles.quickScoreCancelButtonText}>
                      CANCEL
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.quickScoreApplyButton,
                      (p1DartStates.filter((d) => d.status === "landed")
                        .length > 0 ||
                        p2DartStates.filter((d) => d.status === "landed")
                          .length > 0) &&
                      closestPlayer === null
                        ? styles.quickScoreApplyButtonDisabled
                        : null,
                    ]}
                    onPress={() => {
                      const p1DartsLanded = p1DartStates.filter(
                        (d) => d.status === "landed",
                      ).length;
                      const p2DartsLanded = p2DartStates.filter(
                        (d) => d.status === "landed",
                      ).length;

                      // Validate that closest player is selected if darts were landed
                      if (
                        (p1DartsLanded > 0 || p2DartsLanded > 0) &&
                        closestPlayer === null
                      ) {
                        console.log(
                          "Cannot submit - darts landed but no closest player selected",
                        );
                        return;
                      }

                      console.log("APPLY button pressed in Quick Score");

                      // Check for wash round (both players with 0 darts)
                      if (p1DartsLanded === 0 && p2DartsLanded === 0) {
                        console.log(
                          "No darts landed - showing wash confirmation",
                        );
                        setShowWashConfirmation(true);
                        return;
                      }

                      // Calculate scores with cancellation scoring
                      // Score each dart: 1 point normally, 5 points if Tower
                      let p1Score = 0;
                      let p2Score = 0;
                      let p1ClosestHandled = false;
                      let p2ClosestHandled = false;

                      p1DartStates.forEach((dart) => {
                        if (dart.status === "landed") {
                          let points = dart.specialtyShot === "tower" ? 5 : 1;
                          // Add closest bonus to first dart only
                          if (closestPlayer === 1 && !p1ClosestHandled) {
                            points += 2;
                            p1ClosestHandled = true;
                          }
                          p1Score += points;
                        }
                      });

                      p2DartStates.forEach((dart) => {
                        if (dart.status === "landed") {
                          let points = dart.specialtyShot === "tower" ? 5 : 1;
                          // Add closest bonus to first dart only
                          if (closestPlayer === 2 && !p2ClosestHandled) {
                            points += 2;
                            p2ClosestHandled = true;
                          }
                          p2Score += points;
                        }
                      });

                      // Cancellation scoring: only winner gets net points
                      let newP1Score = player1Score;
                      let newP2Score = player2Score;

                      if (p1Score > p2Score) {
                        console.log(
                          "Player 1 wins this round. Adding",
                          p1Score - p2Score,
                          "points",
                        );
                        newP1Score = player1Score + (p1Score - p2Score);
                        setPlayer1Stats((prev) => ({
                          ...prev,
                          roundsWon: prev.roundsWon + 1,
                        }));
                        setFirstThrower(1); // Winner goes first next round
                      } else if (p2Score > p1Score) {
                        console.log(
                          "Player 2 wins this round. Adding",
                          p2Score - p1Score,
                          "points",
                        );
                        newP2Score = player2Score + (p2Score - p1Score);
                        setPlayer2Stats((prev) => ({
                          ...prev,
                          roundsWon: prev.roundsWon + 1,
                        }));
                        setFirstThrower(2);
                      } else {
                        console.log("Tie round - no points awarded");
                      }
                      // If tie, no points awarded, first thrower stays same

                      // Cap scores at 21
                      newP1Score = Math.min(newP1Score, 21);
                      newP2Score = Math.min(newP2Score, 21);

                      setPlayer1Score(newP1Score);
                      setPlayer2Score(newP2Score);

                      // Save round to history
                      const roundData = {
                        roundNumber: currentRound,
                        p1Darts: p1DartsLanded,
                        p2Darts: p2DartsLanded,
                        p1Points: p1Score,
                        p2Points: p2Score,
                        closestPlayer,
                        roundWinner:
                          p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0,
                        p1DartStates: [...p1DartStates],
                        p2DartStates: [...p2DartStates],
                      };
                      setRoundHistory((prev) => [...prev, roundData]);
                      console.log("Saved round to history:", roundData);

                      // Check for winner (first to 21)
                      if (newP1Score >= 21) {
                        console.log("Player 1 wins the match!");
                        setWinner(1);
                      } else if (newP2Score >= 21) {
                        console.log("Player 2 wins the match!");
                        setWinner(2);
                      } else {
                        // Increment round number only if match is still going
                        setCurrentRound((prev) => {
                          const newRound = prev + 1;
                          console.log(
                            "Incrementing round from",
                            prev,
                            "to",
                            newRound,
                          );
                          return newRound;
                        });
                      }

                      setShowSimplifiedOverlay(false);
                      setSimplifiedP1Darts(0);
                      setSimplifiedP2Darts(0);
                      setClosestPlayer(null);
                      setP1SpecialtyShots([]);
                      setP2SpecialtyShots([]);
                    }}
                  >
                    <Text style={styles.quickScoreApplyButtonText}>APPLY</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Winner Dialog - Now shows full match summary */}
        <Modal
          visible={winner !== null}
          onDismiss={() => {}}
          animationType="fade"
          transparent
        >
          <View style={styles.matchSummaryOverlay}>
            <View style={styles.matchSummaryContainer}>
              <ScrollView
                style={styles.matchSummaryScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.matchSummaryHeaderSection}>
                  <Text style={styles.matchSummaryDialogTitle}>
                    Match Summary
                  </Text>
                  <Text style={styles.matchSummaryRoundsText}>
                    {roundHistory.length} Rounds
                  </Text>
                </View>

                {/* Winner */}
                <LinearGradient
                  colors={
                    winner === 1
                      ? [
                          player1ColorObj?.colors[0] || "#2196F3",
                          player1ColorObj?.colors[1] || "#2196F3",
                        ]
                      : [
                          player2ColorObj?.colors[0] || "#4CAF50",
                          player2ColorObj?.colors[1] || "#4CAF50",
                        ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.matchWinnerSection}
                >
                  <Text style={styles.matchWinnerLabel}>🏆 WINNER 🏆</Text>
                  <Text style={styles.matchWinnerName}>
                    {winner === 1
                      ? player1Name || "Player 1"
                      : player2Name || "Player 2"}
                  </Text>
                  <Text style={styles.matchFinalScore}>
                    {player1Score} - {player2Score}
                  </Text>
                </LinearGradient>

                {/* Comparative Stats Section */}
                {roundHistory &&
                  roundHistory.length > 0 &&
                  (() => {
                    const totalRounds = roundHistory.length;
                    const p1DartsLanded = roundHistory.reduce(
                      (sum, round) => sum + round.p1Darts,
                      0,
                    );
                    const p1DartsMissed = totalRounds * 3 - p1DartsLanded;
                    const p2DartsLanded = roundHistory.reduce(
                      (sum, round) => sum + round.p2Darts,
                      0,
                    );
                    const p2DartsMissed = totalRounds * 3 - p2DartsLanded;
                    const p1RoundsWon = player1Stats.roundsWon;
                    const p2RoundsWon = player2Stats.roundsWon;

                    return (
                      <View style={styles.comparativeStatsSection}>
                        {/* Player Names Header */}
                        <View style={styles.statsHeaderRow}>
                          <Text style={styles.statsPlayerName}>
                            {player1Name || "Player 1"}
                          </Text>
                          <Text style={styles.statsPlayerName}>
                            {player2Name || "Player 2"}
                          </Text>
                        </View>

                        {/* Darts Landed */}
                        <View style={styles.statsCategory}>
                          <Text style={styles.statsCategoryLabel}>
                            Darts Landed
                          </Text>
                          <View style={styles.statsValueRow}>
                            <View
                              style={[
                                styles.statsValueBox,
                                p1DartsLanded > p2DartsLanded &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {p1DartsLanded}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statsValueBox,
                                p2DartsLanded > p1DartsLanded &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {p2DartsLanded}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Average Darts Per Round */}
                        <View style={styles.statsCategory}>
                          <Text style={styles.statsCategoryLabel}>
                            Avg Darts/Round
                          </Text>
                          <View style={styles.statsValueRow}>
                            <View
                              style={[
                                styles.statsValueBox,
                                p1DartsLanded / totalRounds >
                                  p2DartsLanded / totalRounds &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {(p1DartsLanded / totalRounds).toFixed(1)}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statsValueBox,
                                p2DartsLanded / totalRounds >
                                  p1DartsLanded / totalRounds &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {(p2DartsLanded / totalRounds).toFixed(1)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Darts Missed */}
                        <View style={styles.statsCategory}>
                          <Text style={styles.statsCategoryLabel}>
                            Darts Missed
                          </Text>
                          <View style={styles.statsValueRow}>
                            <View
                              style={[
                                styles.statsValueBox,
                                p1DartsMissed < p2DartsMissed &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {p1DartsMissed}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statsValueBox,
                                p2DartsMissed < p1DartsMissed &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {p2DartsMissed}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Landing Percentage */}
                        <View style={styles.statsCategory}>
                          <Text style={styles.statsCategoryLabel}>
                            Landing %
                          </Text>
                          <View style={styles.statsValueRow}>
                            <View
                              style={[
                                styles.statsValueBox,
                                (p1DartsLanded / (totalRounds * 3)) * 100 >
                                  (p2DartsLanded / (totalRounds * 3)) * 100 &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {(
                                  (p1DartsLanded / (totalRounds * 3)) *
                                  100
                                ).toFixed(0)}
                                %
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statsValueBox,
                                (p2DartsLanded / (totalRounds * 3)) * 100 >
                                  (p1DartsLanded / (totalRounds * 3)) * 100 &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {(
                                  (p2DartsLanded / (totalRounds * 3)) *
                                  100
                                ).toFixed(0)}
                                %
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Rounds Won */}
                        <View style={styles.statsCategory}>
                          <Text style={styles.statsCategoryLabel}>
                            Rounds Won
                          </Text>
                          <View style={styles.statsValueRow}>
                            <View
                              style={[
                                styles.statsValueBox,
                                p1RoundsWon > p2RoundsWon &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {p1RoundsWon}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statsValueBox,
                                p2RoundsWon > p1RoundsWon &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {p2RoundsWon}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Round Win Percentage */}
                        <View style={styles.statsCategory}>
                          <Text style={styles.statsCategoryLabel}>
                            Round Win %
                          </Text>
                          <View style={styles.statsValueRow}>
                            <View
                              style={[
                                styles.statsValueBox,
                                (p1RoundsWon / totalRounds) * 100 >
                                  (p2RoundsWon / totalRounds) * 100 &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {((p1RoundsWon / totalRounds) * 100).toFixed(0)}
                                %
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statsValueBox,
                                (p2RoundsWon / totalRounds) * 100 >
                                  (p1RoundsWon / totalRounds) * 100 &&
                                  styles.statsValueHighlight,
                              ]}
                            >
                              <Text style={styles.statsValueText}>
                                {((p2RoundsWon / totalRounds) * 100).toFixed(0)}
                                %
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })()}

                {/* Round-by-Round Breakdown */}
                {roundHistory && roundHistory.length > 0 && (
                  <View style={styles.roundBreakdownSection}>
                    <Text style={styles.roundBreakdownTitle}>
                      Round Breakdown
                    </Text>

                    {/* Column Headers */}
                    <View style={styles.roundBreakdownHeader}>
                      <Text
                        style={[
                          styles.roundBreakdownColumn,
                          styles.roundNumberColumn,
                          styles.roundBreakdownHeaderText,
                        ]}
                      >
                        Round
                      </Text>
                      <Text
                        style={[
                          styles.roundBreakdownColumn,
                          styles.playerDartsColumn,
                          styles.roundBreakdownHeaderText,
                        ]}
                      >
                        {player1Name || "Player 1"}
                      </Text>
                      <Text
                        style={[
                          styles.roundBreakdownColumn,
                          styles.playerDartsColumn,
                          styles.roundBreakdownHeaderText,
                        ]}
                      >
                        {player2Name || "Player 2"}
                      </Text>
                    </View>

                    {/* Round Rows */}
                    {roundHistory.map((round, index) => {
                      const p1IsClosest = round.closestPlayer === 1;
                      const p2IsClosest = round.closestPlayer === 2;

                      return (
                        <View key={index} style={styles.roundBreakdownRow}>
                          <Text
                            style={[
                              styles.roundBreakdownColumn,
                              styles.roundNumberColumn,
                              styles.roundNumberText,
                            ]}
                          >
                            {round.roundNumber}
                          </Text>
                          <View
                            style={[
                              styles.roundBreakdownColumn,
                              styles.playerDartsColumn,
                              p1IsClosest && styles.roundBreakdownClosest,
                            ]}
                          >
                            <Text style={styles.roundDartsText}>
                              {round.p1Points}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.roundBreakdownColumn,
                              styles.playerDartsColumn,
                              p2IsClosest && styles.roundBreakdownClosest,
                            ]}
                          >
                            <Text style={styles.roundDartsText}>
                              {round.p2Points}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.matchSummaryButtonContainer}>
                <Button
                  mode="contained"
                  onPress={() => {
                    console.log("Finish button pressed");
                    setWinner(null);
                    saveMatch();
                  }}
                  buttonColor="#2196F3"
                  textColor="#FFFFFF"
                  style={{ flex: 1 }}
                >
                  Finish/Home
                </Button>
                <Button
                  mode="contained"
                  onPress={resetMatch}
                  buttonColor="#4CAF50"
                  textColor="#000000"
                  style={{ flex: 1 }}
                >
                  Rematch
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Wash Round Confirmation Dialog - Now rendered last for proper layering */}
      </View>

      {/* Wash Round Confirmation Dialog - Rendered as Modal for top layering */}
      <Modal
        visible={showWashConfirmation}
        onDismiss={() => setShowWashConfirmation(false)}
        animationType="fade"
        transparent
      >
        <View style={styles.washOverlay}>
          <View style={styles.washDialogContainer}>
            <Text style={styles.washDialogTitle}>Wash Round?</Text>
            <Text style={styles.washDialogMessage}>
              No darts landed this round, and honors will change.
            </Text>

            <View style={styles.washDialogActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  console.log("Wash confirmation cancelled");
                  setShowWashConfirmation(false);
                }}
                style={styles.washButton}
              >
                No, Edit
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  console.log("Wash round confirmed");
                  // Save wash round to history
                  const roundData = {
                    roundNumber: currentRound,
                    p1Darts: 0,
                    p2Darts: 0,
                    p1Points: 0,
                    p2Points: 0,
                    closestPlayer: null,
                    roundWinner: 0,
                  };
                  setRoundHistory((prev) => [...prev, roundData]);

                  // Increment round
                  setCurrentRound((prev) => prev + 1);

                  // Toggle the first thrower for next round
                  setFirstThrower(firstThrower === 1 ? 2 : 1);

                  // Close overlay and reset
                  setShowSimplifiedOverlay(false);
                  setShowWashConfirmation(false);
                  setSimplifiedP1Darts(0);
                  setSimplifiedP2Darts(0);
                  setClosestPlayer(null);
                  setP1DartStates([
                    { status: "empty", specialtyShot: null },
                    { status: "empty", specialtyShot: null },
                    { status: "empty", specialtyShot: null },
                  ]);
                  setP2DartStates([
                    { status: "empty", specialtyShot: null },
                    { status: "empty", specialtyShot: null },
                    { status: "empty", specialtyShot: null },
                  ]);
                }}
                buttonColor="#4CAF50"
                textColor="#000000"
                style={styles.washButton}
              >
                Confirm Wash
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dart Specialty Modal - Centered */}
      <Modal
        visible={showDartSpecialtyModal}
        onRequestClose={() => setShowDartSpecialtyModal(false)}
        animationType="fade"
        transparent
      >
        <View style={styles.dartSpecialtyOverlay}>
          <View style={styles.dartSpecialtyContainer}>
            <Text style={styles.dartSpecialtyTitle}>
              {selectedDartPlayer === 1 ? player1Name : player2Name} - Dart{" "}
              {(selectedDartIndex || 0) + 1}
            </Text>
            <Text style={styles.dartSpecialtySubtitle}>
              Select a specialty shot:
            </Text>

            <View style={styles.dartSpecialtyShotsGrid}>
              {SPECIALTY_SHOTS.map((shot) => (
                <TouchableOpacity
                  key={shot.id}
                  onPress={() => {
                    const dartStates =
                      selectedDartPlayer === 1 ? p1DartStates : p2DartStates;
                    const setDartStates =
                      selectedDartPlayer === 1
                        ? setP1DartStates
                        : setP2DartStates;
                    const newStates = [...dartStates];
                    newStates[selectedDartIndex] = {
                      ...newStates[selectedDartIndex],
                      status: "landed",
                      specialtyShot: shot.id,
                    };
                    setDartStates(newStates);
                    setShowDartSpecialtyModal(false);
                  }}
                  style={styles.dartSpecialtyShotButton}
                >
                  <Text style={styles.dartSpecialtyShotName}>{shot.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                const dartStates =
                  selectedDartPlayer === 1 ? p1DartStates : p2DartStates;
                const setDartStates =
                  selectedDartPlayer === 1 ? setP1DartStates : setP2DartStates;
                const newStates = [...dartStates];
                newStates[selectedDartIndex] = {
                  ...newStates[selectedDartIndex],
                  specialtyShot: null,
                };
                setDartStates(newStates);
                setShowDartSpecialtyModal(false);
              }}
              style={styles.dartSpecialtyClearButton}
            >
              <Text style={styles.dartSpecialtyClearButtonText}>
                None / Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDartSpecialtyModal(false)}
              style={styles.dartSpecialtyCloseButton}
            >
              <Text style={styles.dartSpecialtyCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Dart selector styles
  dartSelectorGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    marginVertical: 8,
  },
  dartSquare: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#999",
    borderRadius: 8,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  dartSquareSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#2A5A2A",
    borderWidth: 3,
  },
  dartSquareWithSpecialty: {
    borderColor: "#4CAF50",
    backgroundColor: "#2A5A2A",
    borderWidth: 3,
  },
  dartSpecialtyIndicator: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  dartSquareMissed: {
    borderColor: "#FF4444",
    backgroundColor: "#5A2A2A",
    borderWidth: 3,
  },
  dartMissedX: {
    fontSize: 32,
    color: "#FF4444",
    fontWeight: "bold",
  },
  // Dart Specialty Modal Styles
  dartSpecialtyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  dartSpecialtyContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 350,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  dartSpecialtyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
    textAlign: "center",
  },
  dartSpecialtySubtitle: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 16,
    textAlign: "center",
  },
  dartSpecialtyShotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  dartSpecialtyShotButton: {
    backgroundColor: "#2A2A2A",
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: "45%",
    alignItems: "center",
  },
  dartSpecialtyShotName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  dartSpecialtyClearButton: {
    backgroundColor: "#444",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  dartSpecialtyClearButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dartSpecialtyCloseButton: {
    backgroundColor: "#666",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  dartSpecialtyCloseButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
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
    top: 40,
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
    top: 40,
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
    ...(Platform.OS === "web" && {
      maxWidth: 1200,
      alignSelf: "center",
      width: "100%",
    }),
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
  quickBracketSurface: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickBracketLabel: {
    fontWeight: "600",
    color: "#333",
  },
  quickBracketButton: {
    flex: 1,
    marginLeft: 12,
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
  quickScoreScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
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
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  quickScoreStatTrackerButton: {
    backgroundColor: "#2A2A2A",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickScoreStatTrackerText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
  },
  quickScoreStatTrackerActiveText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "bold",
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
  quickScoreApplyButtonDisabled: {
    backgroundColor: "#666666",
    opacity: 0.5,
  },
  quickScoreApplyButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Wash Round Dialog Styles
  washOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  washDialogContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
    padding: 20,
    width: "88%",
    maxWidth: 360,
  },
  washDialogTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 12,
  },
  washDialogMessage: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  washDialogActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  washButton: {
    flex: 1,
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
  coinFlipContainer: {
    width: "100%",
    height: 300,
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 30,
  },
  playerNameContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#CCC",
    textAlign: "center",
  },
  winnerFlashContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  coinFlipDisplay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  coinFlipText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    paddingHorizontal: 10,
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
  // Round Tracker Styles
  roundTrackerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -75 }],
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  roundTrackerBox: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderWidth: 3,
    borderColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  roundTrackerLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 2,
    marginBottom: 4,
  },
  roundTrackerNumber: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  roundTrackerHint: {
    fontSize: 10,
    fontWeight: "600",
    color: "#CCCCCC",
    letterSpacing: 1,
  },
  // Round Summary Dialog Styles
  roundSummaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  roundSummaryContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 420,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  roundSummaryTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1.5,
  },
  roundSummaryContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 28,
    paddingVertical: 16,
  },
  roundPlayerStats: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  roundPlayerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  roundDarts: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 8,
  },
  roundPoints: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  roundVsDivider: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
  },
  roundVsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    letterSpacing: 1,
  },
  roundWinnerSection: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#4CAF50",
    alignItems: "center",
  },
  roundWinnerLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#CCCCCC",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  roundWinnerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  roundWinnerPoints: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFD700",
  },
  roundTieText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#CCCCCC",
    letterSpacing: 1,
  },
  roundSummaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  roundSummaryActionButton: {
    flex: 1,
    borderRadius: 12,
  },
  roundCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#333333",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#555555",
    alignItems: "center",
  },
  roundCancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  roundSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    alignItems: "center",
  },
  roundSubmitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 1,
  },
  // Match Summary Modal Styles
  matchSummaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "web" ? 0 : 16,
  },
  matchSummaryContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    width: Platform.OS === "web" ? 420 : "100%",
    maxWidth:
      Platform.OS === "web" ? 420 : Dimensions.get("window").width * 0.95,
    maxHeight: Dimensions.get("window").height * 0.85,
    flexDirection: "column",
  },
  matchSummaryScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  matchSummaryButtonContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  matchSummaryDialog: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4CAF50",
    maxWidth:
      Platform.OS === "web" ? 340 : Dimensions.get("window").width * 0.9,
    width: Platform.OS === "web" ? 340 : "90%",
    alignSelf: "center",
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  matchSummaryDialogContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#1A1A1A",
    backgroundImage: null, // Will be set dynamically inline
    maxHeight: Dimensions.get("window").height * 0.7,
  },
  matchSummaryHeaderSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  matchSummaryDialogTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    letterSpacing: 1.5,
  },
  matchSummaryRoundsText: {
    fontSize: 14,
    color: "#CCCCCC",
    marginTop: 6,
    fontWeight: "500",
  },
  matchSummaryDialogActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
  },
  roundBreakdownSection: {
    marginTop: 20,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  simpleStatsSection: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  comparativeStatsSection: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  statsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
  },
  statsPlayerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
    flex: 1,
    textAlign: "center",
  },
  statsCategory: {
    marginBottom: 12,
  },
  statsCategoryLabel: {
    fontSize: 12,
    color: "#CCCCCC",
    marginBottom: 6,
    textAlign: "center",
  },
  statsValueRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  statsValueBox: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
  },
  statsValueHighlight: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  statsValueText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  statRowSimple: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  statLabelSimple: {
    fontSize: 13,
    color: "#CCCCCC",
    fontWeight: "500",
  },
  statValueSimple: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  roundBreakdownSection: {
    marginTop: 20,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  roundBreakdownTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  roundBreakdownHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
  },
  roundBreakdownHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  roundBreakdownRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#444444",
  },
  roundNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  roundBreakdownColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roundNumberColumn: {
    flex: 0.6,
  },
  playerDartsColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  roundBreakdownClosest: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 4,
  },
  roundDartsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  matchSummaryTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1.5,
  },
  matchWinnerSection: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
    alignItems: "center",
  },
  matchWinnerLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 1.5,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  matchWinnerName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  matchFinalScore: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  matchStatsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
  },
  matchPlayerStats: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    minWidth: 0, // Allow text to wrap
  },
  matchPlayerStatsName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    flexShrink: 1,
  },
  matchStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  matchStatLabel: {
    fontSize: 14,
    color: "#CCCCCC",
    fontWeight: "600",
  },
  matchStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  matchStatDivider: {
    height: 1,
    backgroundColor: "#444444",
    marginVertical: 8,
    width: "100%",
  },
  // Stat Tracker Modal Styles
  statTrackerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  statTrackerContainer: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    minHeight: "55%",
    flexDirection: "column",
  },
  statTrackerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#4CAF50",
  },
  statTrackerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  statTrackerCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  statTrackerCloseText: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  statTrackerContent: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statTrackerPlayerSection: {
    marginBottom: 24,
  },
  statTrackerPlayerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 12,
  },
  statTrackerShotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statTrackerShotButton: {
    backgroundColor: "#2A2A2A",
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: "45%",
  },
  statTrackerShotName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  statTrackerSelectedShots: {
    marginTop: 12,
  },
  statTrackerSelectedLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CCCCCC",
    marginBottom: 8,
  },
  statTrackerChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statTrackerChip: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  statTrackerChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
  },
  statTrackerChipRemove: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statTrackerChipRemoveText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "bold",
  },
  statTrackerDivider: {
    backgroundColor: "#4CAF50",
    marginVertical: 8,
  },
  statTrackerActions: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#4CAF50",
  },
  statTrackerClearButton: {
    flex: 1,
    backgroundColor: "#444444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statTrackerClearButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statTrackerDoneButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statTrackerDoneButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
});
