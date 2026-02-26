import React, { useState, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
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
import styles from "../styles/newMatchScreen.styles";
import PartyVanillaSprinkles from "../components/PartyVanillaSprinkles";
import ScoringProgressChart from "../components/ScoringProgressChart";

// Specialty shots that can be tracked in a round
const SPECIALTY_SHOTS = [
  { id: "lippy", name: "Lippy", abbr: "L" },
  { id: "wiggle-nobber", name: "Wiggle Nobber", abbr: "WN" },
  { id: "t-nobber", name: "T-Nobber", abbr: "TN" },
  { id: "triple-nobber", name: "Triple Nobber", abbr: "TNX" },
  { id: "tower", name: "Tower", abbr: "T" },
  { id: "fender-bender", name: "Fender Bender", abbr: "FB" },
  { id: "inch-worm", name: "Inch Worm", abbr: "IW" },
];

/**
 * Calculate relative luminance of a hex color using WCAG formula
 * @param {string} hexColor - Hex color code (e.g., "#2196F3")
 * @returns {number} Luminance value between 0 and 1
 */
const getColorLuminance = (hexColor) => {
  // Convert hex to RGB
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // WCAG relative luminance formula
  const getRGB = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * getRGB(r) + 0.7152 * getRGB(g) + 0.0722 * getRGB(b);
};

/**
 * Get contrasting text color (black or white) based on background luminance
 * @param {string} backgroundColor - Hex color code (e.g., "#2196F3")
 * @returns {string} Either "#000000" or "#FFFFFF" for best readability
 */
const getContrastingTextColor = (backgroundColor) => {
  const luminance = getColorLuminance(backgroundColor);
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

/**
 * New Match screen - Score a Popdarts match with advanced features
 * Supports 1v1, 2v2, tournament, and quick play modes
 */
export default function NewMatchScreen({ navigation, route }) {
  const theme = useTheme();
  const { user, isGuest, guestName } = useAuth();
  const {
    ownedColors,
    favoriteHomeColor,
    favoriteAwayColor,
    advancedClosestTracking,
  } = usePlayerPreferences();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;

  // Prefer display_name, then Google given_name, then full_name, then guestName, then 'You'
  const userMeta = user?.user_metadata || {};
  const currentUserName =
    userMeta.display_name ||
    userMeta.given_name ||
    (userMeta.full_name ? userMeta.full_name.split(" ")[0] : null) ||
    guestName ||
    "You";

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
  const [scoreboardHeight, setScoreboardHeight] = useState(200); // Default scoreboard height for sprinkles
  const [colorItemWidth, setColorItemWidth] = useState(220); // For color selection sprinkles

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
  const [closestPlayer, setClosestPlayer] = useState(null); // 1 or 2 (casual mode)
  const [closestDart, setClosestDart] = useState(null); // { playerNum: 1|2, dartIndex: 0-2 } (advanced mode)
  const [simplifiedP1Darts, setSimplifiedP1Darts] = useState(0);
  const [simplifiedP2Darts, setSimplifiedP2Darts] = useState(0);
  const [showStatTrackerModal, setShowStatTrackerModal] = useState(false);
  const [p1SpecialtyShots, setP1SpecialtyShots] = useState([]);
  const [p2SpecialtyShots, setP2SpecialtyShots] = useState([]);

  // Dart selection with specialty shots tracking
  const [p1DartStates, setP1DartStates] = useState([
    {
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    }, // 'empty', 'landed', or 'missed'
    {
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    },
    {
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    },
  ]);
  const [p2DartStates, setP2DartStates] = useState([
    {
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    }, // 'empty', 'landed', or 'missed'
    {
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    },
    {
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    },
  ]);
  const [showDartSpecialtyModal, setShowDartSpecialtyModal] = useState(false);
  const [showWiggleNobberTargetModal, setShowWiggleNobberTargetModal] =
    useState(false);
  const [selectedDartPlayer, setSelectedDartPlayer] = useState(null); // 1 or 2
  const [selectedDartIndex, setSelectedDartIndex] = useState(null); // 0-2

  // Pre-game and first thrower
  const [showPreGame, setShowPreGame] = useState(false);
  const [firstThrower, setFirstThrower] = useState(null); // 1 or 2
  const [coinFlipWinner, setCoinFlipWinner] = useState(0); // 0 = show "FLIP", 1 or 2 = winner, null/cleanup
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
  const [isEditingRound, setIsEditingRound] = useState(false); // Track if currently editing a previous round
  const [editingRoundNumber, setEditingRoundNumber] = useState(null); // Track which round is being edited

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
  const [bracketContainerDimensions, setBracketContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const bracketScrollViewRef = useRef(null);

  // Win dialog
  const [winner, setWinner] = useState(null);
  const [isRematch, setIsRematch] = useState(false); // Track if we're in a rematch flow

  // Match Type Selection for 1v1 Lobby
  const [lobbyMatchType, setLobbyMatchType] = useState("friendly"); // 'friendly' or 'casual-competitive'

  // Pulsing animation for paused matches
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * Helper function to get the closest player number for scoring
   * In advanced mode, derives from closestDart; in casual mode, uses closestPlayer
   */
  const getClosestPlayerNum = () => {
    if (advancedClosestTracking && closestDart?.playerNum) {
      return closestDart.playerNum;
    }
    return closestPlayer;
  };

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

  /**
   * Close all modals when the screen loses focus (user navigates away)
   * This ensures modals don't persist when going back to dashboard
   */
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - do nothing
      return () => {
        // Screen is about to lose focus - close all modals
        setShowPreGame(false);
        setCoinFlipWinner(0);
        setPreGameStage("coin-flip");
      };
    }, []),
  );

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

    // Helper function: Calculate the base value of a dart
    const getDartValue = (dart, playerNum, isFirstLanded) => {
      if (dart.specialtyShot === "lippy") {
        return closestPlayer === playerNum &&
          !p1DartStates.some(
            (d) =>
              d.specialtyShot === "t-nobber" || d.specialtyShot === "inch-worm",
          ) &&
          !p2DartStates.some(
            (d) =>
              d.specialtyShot === "t-nobber" || d.specialtyShot === "inch-worm",
          )
          ? 4
          : 2;
      } else if (dart.specialtyShot === "tower") {
        return 5;
      } else if (dart.specialtyShot === "fender-bender") {
        return 2;
      } else if (dart.specialtyShot === "t-nobber") {
        return 10;
      } else if (dart.specialtyShot === "inch-worm") {
        return 11;
      } else if (dart.specialtyShot === "triple-nobber") {
        return 20;
      } else if (dart.specialtyShot === "wiggle-nobber") {
        // Wiggle Nobber: will be handled separately (doubles target)
        return 0;
      } else {
        // Regular dart: 3pts if closest player's first landed, otherwise 1pt
        return closestPlayer === playerNum &&
          isFirstLanded &&
          !p1DartStates.some(
            (d) =>
              d.specialtyShot === "t-nobber" || d.specialtyShot === "inch-worm",
          ) &&
          !p2DartStates.some(
            (d) =>
              d.specialtyShot === "t-nobber" || d.specialtyShot === "inch-worm",
          )
          ? 3
          : 1;
      }
    };

    // Calculate points for each player considering specialty shots
    let p1Points = 0;
    let p2Points = 0;
    let p1FirstLandedIndex = -1;
    let p2FirstLandedIndex = -1;

    // Find first landed dart for each player
    for (let i = 0; i < p1DartStates.length; i++) {
      if (p1DartStates[i].status === "landed") {
        p1FirstLandedIndex = i;
        break;
      }
    }
    for (let i = 0; i < p2DartStates.length; i++) {
      if (p2DartStates[i].status === "landed") {
        p2FirstLandedIndex = i;
        break;
      }
    }

    // Calculate Player 1 points
    p1DartStates.forEach((dart, index) => {
      if (dart.status === "landed") {
        if (dart.specialtyShot === "wiggle-nobber") {
          // Wiggle Nobber: double the target dart's value
          if (
            dart.landingOnDart?.playerNum &&
            dart.landingOnDart?.dartIndex !== undefined
          ) {
            const targetStates =
              dart.landingOnDart.playerNum === 1 ? p1DartStates : p2DartStates;
            const targetDart = targetStates[dart.landingOnDart.dartIndex];
            const isTargetFirstLanded =
              dart.landingOnDart.playerNum === 1
                ? index === p1FirstLandedIndex
                : dart.landingOnDart.dartIndex === p2FirstLandedIndex;
            const targetValue = getDartValue(
              targetDart,
              dart.landingOnDart.playerNum,
              isTargetFirstLanded,
            );
            p1Points += targetValue * 2;
          }
        } else {
          const isFirstLanded = index === p1FirstLandedIndex;
          p1Points += getDartValue(dart, 1, isFirstLanded);
        }
      } else if (dart.status === "missed") {
        p1Points += 0;
      }
    });

    // Calculate Player 2 points
    p2DartStates.forEach((dart, index) => {
      if (dart.status === "landed") {
        if (dart.specialtyShot === "wiggle-nobber") {
          // Wiggle Nobber: double the target dart's value
          if (
            dart.landingOnDart?.playerNum &&
            dart.landingOnDart?.dartIndex !== undefined
          ) {
            const targetStates =
              dart.landingOnDart.playerNum === 1 ? p1DartStates : p2DartStates;
            const targetDart = targetStates[dart.landingOnDart.dartIndex];
            const isTargetFirstLanded =
              dart.landingOnDart.playerNum === 1
                ? dart.landingOnDart.dartIndex === p1FirstLandedIndex
                : index === p2FirstLandedIndex;
            const targetValue = getDartValue(
              targetDart,
              dart.landingOnDart.playerNum,
              isTargetFirstLanded,
            );
            p2Points += targetValue * 2;
          }
        } else {
          const isFirstLanded = index === p2FirstLandedIndex;
          p2Points += getDartValue(dart, 2, isFirstLanded);
        }
      } else if (dart.status === "missed") {
        p2Points += 0;
      }
    });

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
    console.log("matchStarted:", matchStarted);
    console.log("showPreGame before close:", showPreGame);

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

    // Close the round summary modal
    setShowRoundSummary(false);
    setPendingRoundData(null);

    // Close any pre-game modals that might be showing
    setShowPreGame(false);

    // Create fresh empty dart state for each dart (important: use new objects, not shared references)
    const createEmptyDart = () => ({
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    });

    // Reset all round inputs and dart states for next round
    console.log("Resetting dart states...");

    // IMPORTANT: Set all states to their reset values FIRST
    setP1DartStates([createEmptyDart(), createEmptyDart(), createEmptyDart()]);
    setP2DartStates([createEmptyDart(), createEmptyDart(), createEmptyDart()]);
    setSimplifiedP1Darts(0);
    setSimplifiedP2Darts(0);
    setClosestPlayer(null);
    setClosestDart(null);
    setSelectedDartPlayer(null);
    setSelectedDartIndex(null);
    setP1SpecialtyShots([]);
    setP2SpecialtyShots([]);
    setShowDartSpecialtyModal(false);
    setShowWiggleNobberTargetModal(false);
    setShowStatTrackerModal(false);

    // Ensure overlay is closed before reopening with fresh state
    setShowSimplifiedOverlay(false);

    console.log(
      "Round applied and all states reset. Reopening overlay with fresh state...",
    );

    // Reopen overlay after a brief delay to ensure React has processed all state updates
    setTimeout(() => {
      setShowSimplifiedOverlay(true);
    }, 100);
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
    setP1DartStates([
      {
        status: "empty",
        specialtyShot: null,
        landingOnDart: null,
        isClosest: false,
      },
      {
        status: "empty",
        specialtyShot: null,
        landingOnDart: null,
        isClosest: false,
      },
      {
        status: "empty",
        specialtyShot: null,
        landingOnDart: null,
        isClosest: false,
      },
    ]);
    setP2DartStates([
      {
        status: "empty",
        specialtyShot: null,
        landingOnDart: null,
        isClosest: false,
      },
      {
        status: "empty",
        specialtyShot: null,
        landingOnDart: null,
        isClosest: false,
      },
      {
        status: "empty",
        specialtyShot: null,
        landingOnDart: null,
        isClosest: false,
      },
    ]);
    // Close the match summary modal and reset pregame flow for rematch
    setShowMatchSummary(false);
    // Set the loser as the "coin flip winner" so they get first choice
    const loser = winner === 1 ? 2 : 1;
    setCoinFlipWinner(loser);
    // Skip coin flip animation, go straight to choice stage
    setPreGameStage("winner-choice");
    setWinnerFirstChoice(null);
    setWinnerChosenSide(null);
    setWinnerChosenOrder(null);
    setPlayerSides({ 1: null, 2: null });
    setP1SpecialtyShots([]);
    setP2SpecialtyShots([]);
    setFirstThrower(null);
    // Change to casual-competitive to ensure pre-game modal shows
    setLobbyMatchType("casual-competitive");
    // Mark this as a rematch for custom messaging
    setIsRematch(true);
    // Show the pre-game modal with choice stage (skip coin flip)
    setShowPreGame(true);
  };

  /**
   * Load a previous round for editing
   * @param {number} roundNumber - The round number to edit (1-based)
   */
  const loadRoundForEditing = (roundNumber) => {
    if (roundNumber < 1 || roundNumber > roundHistory.length) {
      console.log("Invalid round number for editing:", roundNumber);
      return;
    }

    const roundToEdit = roundHistory[roundNumber - 1]; // roundHistory is 0-based
    console.log("Loading round for editing:", roundToEdit);

    // Set the edit mode flags
    setIsEditingRound(true);
    setEditingRoundNumber(roundNumber);

    // Populate the dart states from the saved round
    setP1DartStates(roundToEdit.p1DartStates);
    setP2DartStates(roundToEdit.p2DartStates);
    setClosestPlayer(roundToEdit.closestPlayer);

    // Open the overlay for editing
    setShowSimplifiedOverlay(true);
  };

  /**
   * Save the edited round back to history and update scores
   * This function recalculates player scores based on the edited round
   */
  const saveEditedRound = () => {
    console.log("saveEditedRound called for round:", editingRoundNumber);

    if (!isEditingRound || !editingRoundNumber) {
      console.log("Not in edit mode or no round selected");
      return;
    }

    const roundIndex = editingRoundNumber - 1;
    const oldRound = roundHistory[roundIndex];

    // Calculate the new scores from the current dart states
    const p1DartsLanded = p1DartStates.filter(
      (d) => d.status === "landed",
    ).length;
    const p2DartsLanded = p2DartStates.filter(
      (d) => d.status === "landed",
    ).length;

    // Recalculate scores (similar logic to applyRound but for replacement)
    let newP1Score = 0;
    let newP2Score = 0;

    // Check if any dart is a T-Nobber or Inch Worm (disables closest bonus)
    const hasT_Nobber =
      p1DartStates.some(
        (d) =>
          d.specialtyShot === "t-nobber" || d.specialtyShot === "inch-worm",
      ) ||
      p2DartStates.some(
        (d) =>
          d.specialtyShot === "t-nobber" || d.specialtyShot === "inch-worm",
      );

    // Helper function: Calculate the base value of a dart
    const getDartValue = (dart, playerNum, isFirstLanded) => {
      if (dart.specialtyShot === "lippy") {
        return closestPlayer === playerNum && !hasT_Nobber ? 4 : 2;
      } else if (dart.specialtyShot === "tower") {
        return 5;
      } else if (dart.specialtyShot === "fender-bender") {
        return 2;
      } else if (dart.specialtyShot === "t-nobber") {
        return 10;
      } else if (dart.specialtyShot === "inch-worm") {
        return 11;
      } else if (dart.specialtyShot === "triple-nobber") {
        return 20;
      } else if (dart.specialtyShot === "wiggle-nobber") {
        // Wiggle Nobber: will be handled separately (doubles target)
        return 0;
      } else {
        // Regular dart: 3pts if closest player's first landed, otherwise 1pt
        return closestPlayer === playerNum && isFirstLanded && !hasT_Nobber
          ? 3
          : 1;
      }
    };

    // Find first landed dart for each player
    let p1FirstLandedIndex = -1;
    let p2FirstLandedIndex = -1;
    for (let i = 0; i < p1DartStates.length; i++) {
      if (p1DartStates[i].status === "landed") {
        p1FirstLandedIndex = i;
        break;
      }
    }
    for (let i = 0; i < p2DartStates.length; i++) {
      if (p2DartStates[i].status === "landed") {
        p2FirstLandedIndex = i;
        break;
      }
    }

    // Score calculation for Player 1
    p1DartStates.forEach((dart, index) => {
      if (dart.status === "landed") {
        if (dart.specialtyShot === "wiggle-nobber") {
          // Wiggle Nobber: double the target dart's value
          if (
            dart.landingOnDart?.playerNum &&
            dart.landingOnDart?.dartIndex !== undefined
          ) {
            const targetStates =
              dart.landingOnDart.playerNum === 1 ? p1DartStates : p2DartStates;
            const targetDart = targetStates[dart.landingOnDart.dartIndex];
            const isTargetFirstLanded =
              dart.landingOnDart.playerNum === 1
                ? dart.landingOnDart.dartIndex === p1FirstLandedIndex
                : dart.landingOnDart.dartIndex === p2FirstLandedIndex;
            const targetValue = getDartValue(
              targetDart,
              dart.landingOnDart.playerNum,
              isTargetFirstLanded,
            );
            newP1Score += targetValue * 2;
          }
        } else {
          const isFirstLanded = index === p1FirstLandedIndex;
          newP1Score += getDartValue(dart, 1, isFirstLanded);
        }
      } else if (dart.status === "missed") {
        newP1Score += 0;
      }
    });

    // Score calculation for Player 2
    p2DartStates.forEach((dart, index) => {
      if (dart.status === "landed") {
        if (dart.specialtyShot === "wiggle-nobber") {
          // Wiggle Nobber: double the target dart's value
          if (
            dart.landingOnDart?.playerNum &&
            dart.landingOnDart?.dartIndex !== undefined
          ) {
            const targetStates =
              dart.landingOnDart.playerNum === 1 ? p1DartStates : p2DartStates;
            const targetDart = targetStates[dart.landingOnDart.dartIndex];
            const isTargetFirstLanded =
              dart.landingOnDart.playerNum === 1
                ? dart.landingOnDart.dartIndex === p1FirstLandedIndex
                : dart.landingOnDart.dartIndex === p2FirstLandedIndex;
            const targetValue = getDartValue(
              targetDart,
              dart.landingOnDart.playerNum,
              isTargetFirstLanded,
            );
            newP2Score += targetValue * 2;
          }
        } else {
          const isFirstLanded = index === p2FirstLandedIndex;
          newP2Score += getDartValue(dart, 2, isFirstLanded);
        }
      } else if (dart.status === "missed") {
        newP2Score += 0;
      }
    });

    // Determine the winner of this edited round
    let roundWinner = 0;
    if (newP1Score > newP2Score) roundWinner = 1;
    else if (newP2Score > newP1Score) roundWinner = 2;

    // Calculate the score difference (old vs new)
    const oldNetScore = oldRound.p1Points - oldRound.p2Points;
    const newNetScore = newP1Score - newP2Score;
    const scoreDifference = newNetScore - oldNetScore;

    // Update the updated round in history
    const updatedRound = {
      ...oldRound,
      p1Darts: p1DartsLanded,
      p2Darts: p2DartsLanded,
      p1Points: newP1Score,
      p2Points: newP2Score,
      closestPlayer,
      roundWinner,
      p1DartStates: [...p1DartStates],
      p2DartStates: [...p2DartStates],
    };

    const updatedHistory = [...roundHistory];
    updatedHistory[roundIndex] = updatedRound;
    setRoundHistory(updatedHistory);

    console.log("Updated round in history:", updatedRound);

    // Now recalculate all scores from the beginning using cancellation scoring
    let recalcP1Score = 0;
    let recalcP2Score = 0;
    let recalcP1RoundsWon = 0;
    let recalcP2RoundsWon = 0;

    updatedHistory.forEach((round) => {
      if (round.roundWinner === 1) {
        // Player 1 wins: gets the net score difference
        recalcP1Score += round.p1Points - round.p2Points;
        recalcP1RoundsWon++;
      } else if (round.roundWinner === 2) {
        // Player 2 wins: gets the net score difference
        recalcP2Score += round.p2Points - round.p1Points;
        recalcP2RoundsWon++;
      }
      // If roundWinner === 0 (wash), no points awarded
    });

    // Cap scores at 21
    recalcP1Score = Math.min(recalcP1Score, 21);
    recalcP2Score = Math.min(recalcP2Score, 21);

    // Update player scores and stats
    setPlayer1Score(recalcP1Score);
    setPlayer2Score(recalcP2Score);
    setPlayer1Stats({
      ...player1Stats,
      roundsWon: recalcP1RoundsWon,
    });
    setPlayer2Stats({
      ...player2Stats,
      roundsWon: recalcP2RoundsWon,
    });

    console.log(
      "Scores recalculated. P1:",
      recalcP1Score,
      "P2:",
      recalcP2Score,
    );

    // If the round winner changed, update firstThrower for the next round
    if (oldRound.roundWinner !== roundWinner) {
      console.log(
        "Round winner changed from",
        oldRound.roundWinner,
        "to",
        roundWinner,
      );
      if (roundWinner === 1 || roundWinner === 2) {
        setFirstThrower(roundWinner);
      }
      // If it's a wash (roundWinner === 0), firstThrower stays the same
    }

    // Exit edit mode and close the overlay
    setIsEditingRound(false);
    setEditingRoundNumber(null);
    setShowSimplifiedOverlay(false);

    // Reset dart states for normal play
    const createEmptyDart = () => ({
      status: "empty",
      specialtyShot: null,
      landingOnDart: null,
      isClosest: false,
    });
    setP1DartStates([createEmptyDart(), createEmptyDart(), createEmptyDart()]);
    setP2DartStates([createEmptyDart(), createEmptyDart(), createEmptyDart()]);
    setSimplifiedP1Darts(0);
    setSimplifiedP2Darts(0);
    setClosestPlayer(null);
    setClosestDart(null);
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
    setCoinFlipWinner(0);
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

    // Determine the random winner BEFORE animation starts (50/50 chance)
    const randomWinner = Math.random() < 0.5 ? 1 : 2;

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
        // Final winner is the randomly determined value
        setCoinFlipWinner(randomWinner);

        // Flash the winner a few times with shorter duration
        let flashCount = 0;
        const flashInterval = setInterval(() => {
          if (flashCount % 2 === 0) {
            setCoinFlipWinner(randomWinner); // Show random winner
          } else {
            setCoinFlipWinner(null); // Briefly hide
          }

          flashCount++;
          if (flashCount >= 4) {
            // Reduced from 6 to 4 flashes
            clearInterval(flashInterval);
            setCoinFlipWinner(randomWinner); // Final display of random winner
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
        setCoinFlipWinner(0);
        setWinnerFirstChoice(null);
        setWinnerChosenSide(null);
        setWinnerChosenOrder(null);
        setPreGameStage("coin-flip");
        setIsRematch(false);
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
        setCoinFlipWinner(0);
        setWinnerFirstChoice(null);
        setWinnerChosenSide(null);
        setWinnerChosenOrder(null);
        setPreGameStage("coin-flip");
        setIsRematch(false);
        setShowPreGame(false);
        setMatchStarted(true);
      }
    }
  };

  // Pre-Game Modal (rendered at component level)
  const renderPreGameModal = () => {
    const renderCoinFlipStage = () => {
      const displayColorObj =
        coinFlipWinner === 0
          ? player1ColorObj
          : coinFlipWinner === 1
            ? player1ColorObj
            : player2ColorObj;
      const displayColor =
        coinFlipWinner === 0
          ? player1Color
          : coinFlipWinner === 1
            ? player1Color
            : player2Color;

      return (
        <View style={styles.preGameContainer}>
          <Text style={styles.preGameTitle}>
            Flip a Coin to Find out Who Throws First
          </Text>

          <View style={styles.coinFlipContainer}>
            <View style={styles.playerNameContainer}>
              <Text style={styles.playerName}>{player1Name}</Text>
            </View>

            <Animated.View style={[styles.winnerFlashContainer]}>
              {displayColorObj?.isGradient ? (
                <View style={{ position: "relative" }}>
                  <PartyVanillaSprinkles
                    colorObj={displayColorObj}
                    width={120}
                    height={120}
                    isCircular={true}
                  />
                  <LinearGradient
                    colors={displayColorObj.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.coinFlipDisplay}
                  >
                    <TouchableOpacity
                      onPress={startCoinFlipAnimation}
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {coinFlipWinner === 0 ? (
                        <Text style={styles.coinFlipButtonText}>FLIP</Text>
                      ) : coinFlipWinner === null ? (
                        <Text style={styles.coinFlipText}></Text>
                      ) : (
                        <Text style={styles.coinFlipText}>
                          {coinFlipWinner === 1 ? player1Name : player2Name}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <View style={{ position: "relative" }}>
                  <PartyVanillaSprinkles
                    colorObj={displayColorObj}
                    width={120}
                    height={120}
                    isCircular={true}
                  />
                  <TouchableOpacity
                    onPress={startCoinFlipAnimation}
                    style={[
                      styles.coinFlipDisplay,
                      {
                        backgroundColor: displayColor,
                      },
                    ]}
                  >
                    {coinFlipWinner === 0 ? (
                      <Text style={styles.coinFlipButtonText}>FLIP</Text>
                    ) : coinFlipWinner === null ? (
                      <Text style={styles.coinFlipText}></Text>
                    ) : (
                      <Text style={styles.coinFlipText}>
                        {coinFlipWinner === 1 ? player1Name : player2Name}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            <View style={styles.playerNameContainer}>
              <Text style={styles.playerName}>{player2Name}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setShowPreGame(false);
              setIsRematch(false);
              setCoinFlipWinner(null);
              setPreGameStage("coin-flip");
              setWinnerFirstChoice(null);
              setWinnerChosenSide(null);
              setWinnerChosenOrder(null);
              setPlayerSides({ 1: null, 2: null });
            }}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    const renderChoiceStage = () => {
      const winnerName = coinFlipWinner === 1 ? player1Name : player2Name;
      const titleText = isRematch
        ? `For this Rematch...`
        : `${winnerName} Won!`;
      const instructionText = isRematch
        ? `${winnerName}, choose the setup this round`
        : "What would you like to choose first?";

      return (
        <View style={styles.preGameContainer}>
          <Text style={styles.preGameTitle}>{titleText}</Text>
          <Text style={styles.preGameInstruction}>{instructionText}</Text>

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
              <Text style={styles.preGameChoiceButtonText}>
                Pick Your Order
              </Text>
              <Text style={styles.preGameChoiceSubtext}>
                First or Second throw
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              setShowPreGame(false);
              setIsRematch(false);
              setCoinFlipWinner(null);
              setPreGameStage("coin-flip");
              setWinnerFirstChoice(null);
              setWinnerChosenSide(null);
              setWinnerChosenOrder(null);
              setPlayerSides({ 1: null, 2: null });
            }}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

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

          <View style={styles.preGameButtonsRow}>
            <TouchableOpacity
              style={styles.preGameSideButton}
              onPress={() => {
                finalizeSelection(playerNum, "left", "side");
              }}
            >
              <Text style={styles.preGameChoiceButtonText}>← Left</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.preGameSideButton}
              onPress={() => {
                finalizeSelection(playerNum, "right", "side");
              }}
            >
              <Text style={styles.preGameChoiceButtonText}>Right →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              setShowPreGame(false);
              setIsRematch(false);
              setCoinFlipWinner(null);
              setPreGameStage("coin-flip");
              setWinnerFirstChoice(null);
              setWinnerChosenSide(null);
              setWinnerChosenOrder(null);
              setPlayerSides({ 1: null, 2: null });
            }}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
              Cancel
            </Text>
          </TouchableOpacity>
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

          <TouchableOpacity
            onPress={() => {
              setShowPreGame(false);
              setIsRematch(false);
              setCoinFlipWinner(null);
              setPreGameStage("coin-flip");
              setWinnerFirstChoice(null);
              setWinnerChosenSide(null);
              setWinnerChosenOrder(null);
              setPlayerSides({ 1: null, 2: null });
            }}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
              Cancel
            </Text>
          </TouchableOpacity>
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
                  <View
                    style={[
                      styles.colorIndicator,
                      { marginRight: 10, position: "relative" },
                    ]}
                  >
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
                    <PartyVanillaSprinkles
                      colorObj={match.winner.color}
                      width={32}
                      height={32}
                    />
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
                        {
                          marginRight: 8,
                          width: 16,
                          height: 16,
                          position: "relative",
                        },
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
                      <PartyVanillaSprinkles
                        colorObj={match.player1.color}
                        width={16}
                        height={16}
                      />
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
                        {
                          marginRight: 8,
                          width: 16,
                          height: 16,
                          position: "relative",
                        },
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
                      <PartyVanillaSprinkles
                        colorObj={match.player2.color}
                        width={16}
                        height={16}
                      />
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
              <Image
                source={require("../../assets/boards/APLTableAngle.webp")}
                style={styles.buttonImage}
                resizeMode="cover"
              />
              <Text style={styles.largeButtonText}>Classic Edition</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled
              style={[styles.largeImageButton, styles.largeImageButtonDisabled]}
            >
              <Image
                source={require("../../assets/boards/classicBoardEdition.webp")}
                style={styles.buttonImage}
                resizeMode="cover"
              />
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

            {/* Bracket Display - Vertical scroll wrapper with nested horizontal scroll */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ padding: 20 }}
                nestedScrollEnabled={true}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
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
                                    seed.inProgress &&
                                      styles.seedCardInProgress,
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
                {Object.keys(matchPositions).length > 0 &&
                  (() => {
                    // Calculate total bracket dimensions for SVG
                    const cardWidth = 220;
                    const connectorWidth = 80;
                    const scrollPadding = 40; // padding: 20 × 2 (left + right)
                    const totalWidth =
                      rounds.length * (cardWidth + connectorWidth) +
                      scrollPadding;

                    const matchHeight = 150;
                    const matchGap = 50;
                    const roundTitleHeight = 35;
                    const scrollPaddingVertical = 40; // padding: 20 × 2 (top + bottom)

                    // Calculate max height by finding the tallest round
                    let maxHeight = 0;
                    rounds.forEach((round, roundIndex) => {
                      if (round.seeds.length === 0) return;

                      const offset = Math.pow(2, roundIndex) - 1;
                      const spacing = Math.pow(2, roundIndex);
                      const lastMatchRow =
                        offset + (round.seeds.length - 1) * spacing;
                      const minHeight =
                        lastMatchRow * (matchHeight + matchGap) +
                        matchHeight +
                        50;
                      maxHeight = Math.max(maxHeight, minHeight);
                    });

                    // Add extra padding for connector lines that might extend beyond matches
                    const totalHeight =
                      maxHeight +
                      roundTitleHeight +
                      scrollPaddingVertical +
                      100;

                    return (
                      <Svg
                        pointerEvents="box-none"
                        width={totalWidth}
                        height={totalHeight}
                        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          zIndex: -1,
                          overflow: "visible",
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
                          nextRound.seeds.forEach(
                            (nextSeed, nextMatchIndex) => {
                              const sourceMatch1 =
                                round.seeds[nextMatchIndex * 2];
                              const sourceMatch2 =
                                round.seeds[nextMatchIndex * 2 + 1];

                              // console.log(
                              //   `\n--- Round ${roundIndex} → ${
                              //     roundIndex + 1
                              //   }, Match ${nextMatchIndex} ---`
                              // );
                              // console.log(
                              //   "Source Match 1:",
                              //   sourceMatch1?.id,
                              //   sourceMatch1?.teams[0]?.name
                              // );
                              // console.log(
                              //   "Source Match 2:",
                              //   sourceMatch2?.id,
                              //   sourceMatch2?.teams[0]?.name
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
                              const match1RightX =
                                pos1.x + pos1.width + scrollPadding;
                              const match1CenterY =
                                pos1.centerY + scrollPadding + roundTitleHeight;

                              const match2RightX =
                                pos2.x + pos2.width + scrollPadding;
                              const match2CenterY =
                                pos2.centerY + scrollPadding + roundTitleHeight;

                              // Left edge center of next match
                              const nextLeftX = posNext.x + scrollPadding;
                              const nextCenterY =
                                posNext.centerY +
                                scrollPadding +
                                roundTitleHeight;

                              // Validate all coordinates are valid numbers and reasonable
                              if (
                                !Number.isFinite(match1RightX) ||
                                !Number.isFinite(match1CenterY) ||
                                !Number.isFinite(match2RightX) ||
                                !Number.isFinite(match2CenterY) ||
                                !Number.isFinite(nextLeftX) ||
                                !Number.isFinite(nextCenterY)
                              ) {
                                console.warn(
                                  `Invalid coordinates detected for connector from round ${roundIndex}:`,
                                  {
                                    match1RightX,
                                    match1CenterY,
                                    match2RightX,
                                    match2CenterY,
                                    nextLeftX,
                                    nextCenterY,
                                  },
                                );
                                return;
                              }

                              // Junction midpoint - this is where the next match SHOULD be vertically centered
                              const junctionMidY =
                                (match1CenterY + match2CenterY) / 2;

                              // Vertical line X position (midpoint between rounds)
                              const verticalX = (match1RightX + nextLeftX) / 2;

                              // console.log(
                              //   `Junction at Y=${junctionMidY}, Next match at Y=${nextCenterY}, Diff=${Math.abs(
                              //     junctionMidY - nextCenterY,
                              //   )}`,
                              // );

                              // Determine line color based on completion
                              const bothCompleted =
                                sourceMatch1.completed &&
                                sourceMatch2.completed;
                              const strokeColor = bothCompleted
                                ? "#BDBDBD"
                                : "#2196F3";
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
                            },
                          );

                          return paths;
                        })}
                      </Svg>
                    );
                  })()}
              </ScrollView>
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
                <View style={styles.playerSetupRowReordered}>
                  {/* Player Name (Left) */}
                  <TextInput
                    label={`Player ${index + 1} Name`}
                    value={player.name}
                    onChangeText={(text) => {
                      const updated = [...tournamentPlayers];
                      updated[index].name = text;
                      setTournamentPlayers(updated);
                    }}
                    style={styles.playerNameInput}
                    mode="outlined"
                  />

                  {/* Color Indicator (Right) */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPlayerIndex(index);
                      setColorPickerVisible(true);
                    }}
                    style={styles.colorIndicatorRounded}
                  >
                    {player.color ? (
                      <View
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        {player.color.isGradient ? (
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
                        )}
                        <PartyVanillaSprinkles
                          colorObj={player.color}
                          width={50}
                          height={50}
                          scale={0.5}
                        />
                      </View>
                    ) : null}
                  </TouchableOpacity>

                  {/* Remove Button (far right) */}
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
            <View style={styles.colorPickerContainer}>
              <Text variant="headlineSmall" style={styles.colorPickerTitle}>
                Select Dart Color
              </Text>
              <ScrollView style={styles.colorScrollView}>
                <View style={styles.colorListVertical}>
                  {POPDARTS_COLORS.map((colorObj, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        if (selectedPlayerIndex !== null) {
                          const updated = [...tournamentPlayers];
                          updated[selectedPlayerIndex].color = colorObj;
                          setTournamentPlayers(updated);
                        }
                        setColorPickerVisible(false);
                      }}
                      style={styles.colorItemLarge}
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

                      {/* Party Vanilla Sprinkles Overlay */}
                      <PartyVanillaSprinkles
                        colorObj={colorObj}
                        width={220}
                        height={160}
                      />

                      {/* Vertical Color Name on Left */}
                      <View style={styles.colorNameVerticalContainer}>
                        <Text style={styles.colorNameVertical}>
                          {colorObj.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
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
                  Quick, Just for Fun
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
                  Resembles a League Match
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
                      <View
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        {player.color.isGradient ? (
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
                        )}
                        <PartyVanillaSprinkles
                          colorObj={player.color}
                          width={50}
                          height={50}
                          scale={0.5}
                        />
                      </View>
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
                          onLayout={(event) => {
                            const { width } = event.nativeEvent.layout;
                            setColorItemWidth(width);
                          }}
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

                          {/* Party Vanilla Sprinkles Overlay */}
                          <PartyVanillaSprinkles
                            colorObj={colorObj}
                            width={colorItemWidth}
                            height={160}
                          />

                          {/* Vertical Color Name on Left - Always visible */}
                          <View style={styles.colorNameVerticalContainer}>
                            <Text style={styles.colorNameVertical}>
                              {colorObj.name}
                            </Text>
                          </View>

                          {/* Selection Checkmark - Only when selected */}
                          {isSelected && (
                            <View style={styles.selectionIndicator}>
                              <View style={styles.checkmarkCircle}>
                                <Text style={styles.checkmarkText}>✓</Text>
                              </View>
                            </View>
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
          <View
            style={styles.whiteBackground}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setScoreboardHeight(height);
            }}
          >
            {/* Progressive Gradient Reveal - Width Only */}
            <View
              style={[
                styles.gradientClipContainer,
                { width: `${(player1Score / 21) * 100}%` },
              ]}
              onLayout={(event) => {
                // Sprinkles are positioned relative to parent
              }}
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
              <PartyVanillaSprinkles
                colorObj={player1ColorObj}
                width={screenWidth}
                height={scoreboardHeight}
              />
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

            {/* Large Tap Areas for Score - Hidden in Casual Competitive */}
            {lobbyMatchType !== "casual-competitive" && (
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
            )}

            {/* Center Score Display for Casual Competitive */}
            {lobbyMatchType === "casual-competitive" && (
              <View style={styles.scoreCenter}>
                <Text style={styles.scoreNumberLarge}>{player1Score}</Text>
              </View>
            )}

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

            {/* +2, +3, +4, +5 Grid - Hidden in Casual Competitive */}
            {lobbyMatchType !== "casual-competitive" && (
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
            )}
          </View>
        </View>

        {/* Bottom Player - 50% of screen */}
        <View
          style={[
            styles.bottomPlayerSection,
            firstThrower === 2 && styles.playerSectionHighlighted,
          ]}
        >
          <View
            style={styles.whiteBackground}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setScoreboardHeight(height);
            }}
          >
            {/* Progressive Gradient Reveal - Width Only */}
            <View
              style={[
                styles.gradientClipContainer,
                { width: `${(player2Score / 21) * 100}%` },
              ]}
              onLayout={(event) => {
                // Sprinkles are positioned relative to parent
              }}
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
              <PartyVanillaSprinkles
                colorObj={player2ColorObj}
                width={screenWidth}
                height={scoreboardHeight}
              />
            </View>

            {/* Player Name */}
            <Text style={styles.playerNameBottom}>
              {player2Name.toUpperCase()}
            </Text>

            {/* Large Tap Areas for Score - Hidden in Casual Competitive */}
            {lobbyMatchType !== "casual-competitive" && (
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
            )}

            {/* Center Score Display for Casual Competitive */}
            {lobbyMatchType === "casual-competitive" && (
              <View style={styles.scoreCenter}>
                <Text style={styles.scoreNumberLarge}>{player2Score}</Text>
              </View>
            )}

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

            {/* +2, +3, +4, +5 Grid - Hidden in Casual Competitive */}
            {lobbyMatchType !== "casual-competitive" && (
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
            )}
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
                  <Text style={styles.roundTieText}>It's a Wash</Text>
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
                    // If it's a wash round (winner === 0) and no darts landed, auto-fill all darts as missed
                    if (
                      (!pendingRoundData?.p1Darts ||
                        pendingRoundData?.p1Darts === 0) &&
                      (!pendingRoundData?.p2Darts ||
                        pendingRoundData?.p2Darts === 0)
                    ) {
                      if (pendingRoundData?.winner === 0) {
                        // Auto-fill all darts as missed for both players
                        setP1DartStates([
                          {
                            status: "missed",
                            specialtyShot: null,
                            landingOnDart: null,
                            isClosest: false,
                          },
                          {
                            status: "missed",
                            specialtyShot: null,
                            landingOnDart: null,
                            isClosest: false,
                          },
                          {
                            status: "missed",
                            specialtyShot: null,
                            landingOnDart: null,
                            isClosest: false,
                          },
                        ]);
                        setP2DartStates([
                          {
                            status: "missed",
                            specialtyShot: null,
                            landingOnDart: null,
                            isClosest: false,
                          },
                          {
                            status: "missed",
                            specialtyShot: null,
                            landingOnDart: null,
                            isClosest: false,
                          },
                          {
                            status: "missed",
                            specialtyShot: null,
                            landingOnDart: null,
                            isClosest: false,
                          },
                        ]);
                        setError("");
                        console.log(
                          "SUBMIT ROUND button pressed (auto-filled wash round)",
                        );
                        applyRound();
                        return;
                      } else {
                        setError(
                          "Make sure you add how many darts were landed before submitting the round.",
                        );
                        return;
                      }
                    }
                    setError("");
                    console.log("SUBMIT ROUND button pressed");
                    applyRound();
                  }}
                  buttonColor="#4CAF50"
                  textColor="#000000"
                  style={styles.roundSummaryActionButton}
                >
                  SUBMIT ROUND
                </Button>
                {/* Error message for quick score validation */}
                {error && (
                  <View
                    style={{
                      padding: 8,
                      backgroundColor: "#ffcccc",
                      borderRadius: 6,
                      margin: 8,
                    }}
                  >
                    <Text style={{ color: "#b00020", fontWeight: "bold" }}>
                      {error}
                    </Text>
                  </View>
                )}
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
              <View style={styles.quickScoreContainerModal}>
                <Text style={styles.quickScoreTitle}>
                  {isEditingRound
                    ? `Edit Round ${editingRoundNumber}`
                    : "Quick Score"}
                </Text>
                <Text style={styles.quickScoreSubtitle}>
                  {isEditingRound
                    ? "Adjust the scored darts for this round"
                    : "Enter dart counts for quick scoring"}
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

                          // Check if any dart is a T-Nobber or Inch Worm (disables closest bonus)
                          const hasT_Nobber =
                            p1DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            ) ||
                            p2DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            );

                          // Check if Lippies are present for competitive closest logic
                          const p1HasLippy = p1DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const p2HasLippy = p2DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const lippiesPresent = p1HasLippy || p2HasLippy;

                          p1DartStates.forEach((dart, dartIndex) => {
                            if (dart.status === "landed") {
                              if (dart.specialtyShot === "wiggle-nobber") {
                                // Wiggle Nobber: double the target dart's value
                                if (
                                  dart.landingOnDart?.playerNum &&
                                  dart.landingOnDart?.dartIndex !== undefined
                                ) {
                                  const targetStates =
                                    dart.landingOnDart.playerNum === 1
                                      ? p1DartStates
                                      : p2DartStates;
                                  const targetDart =
                                    targetStates[dart.landingOnDart.dartIndex];

                                  // Find first landed dart of target player
                                  let targetFirstLandedIndex = -1;
                                  for (
                                    let i = 0;
                                    i < targetStates.length;
                                    i++
                                  ) {
                                    if (targetStates[i].status === "landed") {
                                      targetFirstLandedIndex = i;
                                      break;
                                    }
                                  }

                                  let targetValue = 1;
                                  if (targetDart?.specialtyShot === "lippy") {
                                    targetValue =
                                      closestPlayer ===
                                        dart.landingOnDart.playerNum &&
                                      !hasT_Nobber
                                        ? 4
                                        : 2;
                                  } else if (
                                    targetDart?.specialtyShot === "tower"
                                  ) {
                                    targetValue = 5;
                                  } else if (
                                    targetDart?.specialtyShot ===
                                    "fender-bender"
                                  ) {
                                    targetValue = 2;
                                  } else if (
                                    targetDart?.specialtyShot === "t-nobber"
                                  ) {
                                    targetValue = 10;
                                  } else if (
                                    targetDart?.specialtyShot === "inch-worm"
                                  ) {
                                    targetValue = 11;
                                  } else if (
                                    targetDart?.specialtyShot ===
                                    "triple-nobber"
                                  ) {
                                    targetValue = 20;
                                  } else {
                                    // Regular dart: only first landed gets 3pt
                                    const isTargetFirstLanded =
                                      dart.landingOnDart.dartIndex ===
                                      targetFirstLandedIndex;
                                    targetValue =
                                      closestPlayer ===
                                        dart.landingOnDart.playerNum &&
                                      isTargetFirstLanded &&
                                      !hasT_Nobber
                                        ? 3
                                        : 1;
                                  }
                                  calculations.push(`(${targetValue}*2)`);
                                }
                              } else if (dart.specialtyShot === "lippy") {
                                // Lippy: competes for closest status (but not if T-Nobber disables it)
                                if (closestPlayer === 1 && !hasT_Nobber) {
                                  calculations.push("(3+1)");
                                } else {
                                  calculations.push("(1+1)");
                                }
                              } else if (
                                dart.specialtyShot === "fender-bender"
                              ) {
                                // Fender Bender: show breakdown
                                let parts = ["1", "+1"];
                                if (
                                  closestPlayer === 1 &&
                                  calculations.length === 0 &&
                                  !hasT_Nobber &&
                                  !lippiesPresent
                                ) {
                                  parts.push("+2");
                                }
                                calculations.push(`(${parts.join("")})`);
                              } else if (dart.specialtyShot === "tower") {
                                // Tower: just 5 in parentheses
                                calculations.push("(5)");
                              } else if (dart.specialtyShot === "t-nobber") {
                                // T-Nobber: 10 points flat
                                calculations.push("(10)");
                              } else if (dart.specialtyShot === "inch-worm") {
                                // Inch Worm: 10+1 breakdown
                                calculations.push("(10+1)");
                              } else if (
                                dart.specialtyShot === "triple-nobber"
                              ) {
                                // Triple Nobber: 20 points flat
                                calculations.push("(20)");
                              } else if (dart.specialtyShot) {
                                // Other specialty shots: in parentheses (value TBD)
                                calculations.push("(?)");
                              } else {
                                // Regular dart
                                let value = 1;
                                if (
                                  closestPlayer === 1 &&
                                  calculations.length === 0 &&
                                  !hasT_Nobber &&
                                  !lippiesPresent
                                ) {
                                  value = 3;
                                }
                                calculations.push(value.toString());
                              }
                            } else if (dart.status === "missed") {
                              // Missed dart contributes 0 points
                              calculations.push("0");
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
                            const currentStatus = newStates[index].status;

                            if (advancedClosestTracking) {
                              // Advanced mode: 3-tap interaction
                              // Empty → Landed → Closest → Missed → Empty
                              let nextStatus = "landed";
                              let isClosest = false;

                              if (currentStatus === "empty") {
                                nextStatus = "landed";
                                isClosest = false;
                              } else if (currentStatus === "landed") {
                                // Tap 2: Make this dart closest (remove closest from others)
                                nextStatus = "landed";
                                isClosest = true;
                                // Update closestDart for scoring purposes
                                setClosestDart({
                                  playerNum: 1,
                                  dartIndex: index,
                                });
                                // Clear closest from other darts
                                newStates.forEach((d) => (d.isClosest = false));
                                p2DartStates.forEach(
                                  (d) => (d.isClosest = false),
                                );
                              } else if (currentStatus === "missed") {
                                nextStatus = "empty";
                                isClosest = false;
                              } else {
                                // From closest or landed, next is missed
                                nextStatus = "missed";
                                isClosest = false;
                                // Clear closestDart if this was the closest dart
                                if (newStates[index].isClosest) {
                                  setClosestDart(null);
                                }
                              }

                              newStates[index] = {
                                ...newStates[index],
                                status: nextStatus,
                                isClosest,
                                specialtyShot:
                                  nextStatus === "empty"
                                    ? null
                                    : newStates[index].specialtyShot,
                              };
                            } else {
                              // Casual mode: Position-based smart fill
                              // Tapping at position N means "N+1 darts landed"
                              if (currentStatus === "empty") {
                                // Mark darts 0 to index as landed, index+1 onwards as missed
                                for (let i = 0; i < newStates.length; i++) {
                                  if (i <= index) {
                                    if (newStates[i].status === "empty") {
                                      newStates[i].status = "landed";
                                    }
                                  } else {
                                    if (newStates[i].status === "empty") {
                                      newStates[i].status = "missed";
                                    }
                                  }
                                }
                              } else if (currentStatus === "landed") {
                                // Change to missed and cascade: all darts from this point onwards become missed
                                for (let i = index; i < newStates.length; i++) {
                                  newStates[i].status = "missed";
                                }
                              } else if (currentStatus === "missed") {
                                // Change to landed and cascade: all darts up to this point become landed
                                for (let i = 0; i <= index; i++) {
                                  newStates[i].status = "landed";
                                }
                              }
                            }

                            setP1DartStates(newStates);
                          }}
                          style={[
                            styles.dartSquare,
                            dart.status === "landed" &&
                              !dart.isClosest &&
                              styles.dartSquareSelected,
                            dart.isClosest && styles.dartSquareClosest,
                            dart.status === "missed" && styles.dartSquareMissed,
                            dart.specialtyShot &&
                              dart.status === "landed" &&
                              styles.dartSquareWithSpecialty,
                          ]}
                        >
                          {dart.status === "missed" && (
                            <Text style={styles.dartMissedX}>✕</Text>
                          )}
                          {dart.isClosest && (
                            <Text style={styles.dartClosestCheckmark}>✓</Text>
                          )}
                          {dart.specialtyShot &&
                            dart.status === "landed" &&
                            !dart.isClosest && (
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

                          // Check if any dart is a T-Nobber or Inch Worm (disables closest bonus)
                          const hasT_Nobber =
                            p1DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            ) ||
                            p2DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            );

                          // Check if Lippies are present for competitive closest logic
                          const p1HasLippy = p1DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const p2HasLippy = p2DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const lippiesPresent = p1HasLippy || p2HasLippy;

                          p2DartStates.forEach((dart, dartIndex) => {
                            if (dart.status === "landed") {
                              if (dart.specialtyShot === "wiggle-nobber") {
                                // Wiggle Nobber: double the target dart's value
                                if (
                                  dart.landingOnDart?.playerNum &&
                                  dart.landingOnDart?.dartIndex !== undefined
                                ) {
                                  const targetStates =
                                    dart.landingOnDart.playerNum === 1
                                      ? p1DartStates
                                      : p2DartStates;
                                  const targetDart =
                                    targetStates[dart.landingOnDart.dartIndex];

                                  // Find first landed dart of target player
                                  let targetFirstLandedIndex = -1;
                                  for (
                                    let i = 0;
                                    i < targetStates.length;
                                    i++
                                  ) {
                                    if (targetStates[i].status === "landed") {
                                      targetFirstLandedIndex = i;
                                      break;
                                    }
                                  }

                                  let targetValue = 1;
                                  if (targetDart?.specialtyShot === "lippy") {
                                    targetValue =
                                      closestPlayer ===
                                        dart.landingOnDart.playerNum &&
                                      !hasT_Nobber
                                        ? 4
                                        : 2;
                                  } else if (
                                    targetDart?.specialtyShot === "tower"
                                  ) {
                                    targetValue = 5;
                                  } else if (
                                    targetDart?.specialtyShot ===
                                    "fender-bender"
                                  ) {
                                    targetValue = 2;
                                  } else if (
                                    targetDart?.specialtyShot === "t-nobber"
                                  ) {
                                    targetValue = 10;
                                  } else if (
                                    targetDart?.specialtyShot === "inch-worm"
                                  ) {
                                    targetValue = 11;
                                  } else if (
                                    targetDart?.specialtyShot ===
                                    "triple-nobber"
                                  ) {
                                    targetValue = 20;
                                  } else {
                                    // Regular dart: only first landed gets 3pt
                                    const isTargetFirstLanded =
                                      dart.landingOnDart.dartIndex ===
                                      targetFirstLandedIndex;
                                    targetValue =
                                      closestPlayer ===
                                        dart.landingOnDart.playerNum &&
                                      isTargetFirstLanded &&
                                      !hasT_Nobber
                                        ? 3
                                        : 1;
                                  }
                                  calculations.push(`(${targetValue}*2)`);
                                }
                              } else if (dart.specialtyShot === "lippy") {
                                // Lippy: competes for closest status (but not if T-Nobber disables it)
                                if (closestPlayer === 2 && !hasT_Nobber) {
                                  calculations.push("(3+1)");
                                } else {
                                  calculations.push("(1+1)");
                                }
                              } else if (
                                dart.specialtyShot === "fender-bender"
                              ) {
                                // Fender Bender: show breakdown
                                let parts = ["1", "+1"];
                                if (
                                  closestPlayer === 2 &&
                                  calculations.length === 0 &&
                                  !hasT_Nobber &&
                                  !lippiesPresent
                                ) {
                                  parts.push("+2");
                                }
                                calculations.push(`(${parts.join("")})`);
                              } else if (dart.specialtyShot === "tower") {
                                // Tower: just 5 in parentheses
                                calculations.push("(5)");
                              } else if (dart.specialtyShot === "t-nobber") {
                                // T-Nobber: 10 points flat
                                calculations.push("(10)");
                              } else if (dart.specialtyShot === "inch-worm") {
                                // Inch Worm: 10+1 breakdown
                                calculations.push("(10+1)");
                              } else if (
                                dart.specialtyShot === "triple-nobber"
                              ) {
                                // Triple Nobber: 20 points flat
                                calculations.push("(20)");
                              } else if (dart.specialtyShot) {
                                // Other specialty shots: in parentheses (value TBD)
                                calculations.push("(?)");
                              } else {
                                // Regular dart
                                let value = 1;
                                if (
                                  closestPlayer === 2 &&
                                  calculations.length === 0 &&
                                  !hasT_Nobber &&
                                  !lippiesPresent
                                ) {
                                  value = 3;
                                }
                                calculations.push(value.toString());
                              }
                            } else if (dart.status === "missed") {
                              // Missed dart contributes 0 points
                              calculations.push("0");
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
                            const currentStatus = newStates[index].status;

                            if (advancedClosestTracking) {
                              // Advanced mode: 3-tap interaction
                              // Empty → Landed → Closest → Missed → Empty
                              let nextStatus = "landed";
                              let isClosest = false;

                              if (currentStatus === "empty") {
                                nextStatus = "landed";
                                isClosest = false;
                              } else if (currentStatus === "landed") {
                                // Tap 2: Make this dart closest (remove closest from others)
                                nextStatus = "landed";
                                isClosest = true;
                                // Update closestDart for scoring purposes
                                setClosestDart({
                                  playerNum: 2,
                                  dartIndex: index,
                                });
                                // Clear closest from other darts
                                p1DartStates.forEach(
                                  (d) => (d.isClosest = false),
                                );
                                newStates.forEach((d) => (d.isClosest = false));
                              } else if (currentStatus === "missed") {
                                nextStatus = "empty";
                                isClosest = false;
                              } else {
                                // From closest or landed, next is missed
                                nextStatus = "missed";
                                isClosest = false;
                                // Clear closestDart if this was the closest dart
                                if (newStates[index].isClosest) {
                                  setClosestDart(null);
                                }
                              }

                              newStates[index] = {
                                ...newStates[index],
                                status: nextStatus,
                                isClosest,
                                specialtyShot:
                                  nextStatus === "empty"
                                    ? null
                                    : newStates[index].specialtyShot,
                              };
                            } else {
                              // Casual mode: Position-based smart fill
                              // Tapping at position N means "N+1 darts landed"
                              if (currentStatus === "empty") {
                                // Mark darts 0 to index as landed, index+1 onwards as missed
                                for (let i = 0; i < newStates.length; i++) {
                                  if (i <= index) {
                                    if (newStates[i].status === "empty") {
                                      newStates[i].status = "landed";
                                    }
                                  } else {
                                    if (newStates[i].status === "empty") {
                                      newStates[i].status = "missed";
                                    }
                                  }
                                }
                              } else if (currentStatus === "landed") {
                                // Change to missed and cascade: all darts from this point onwards become missed
                                for (let i = index; i < newStates.length; i++) {
                                  newStates[i].status = "missed";
                                }
                              } else if (currentStatus === "missed") {
                                // Change to landed and cascade: all darts up to this point become landed
                                for (let i = 0; i <= index; i++) {
                                  newStates[i].status = "landed";
                                }
                              }
                            }

                            setP2DartStates(newStates);
                          }}
                          style={[
                            styles.dartSquare,
                            dart.status === "landed" &&
                              !dart.isClosest &&
                              styles.dartSquareSelected,
                            dart.isClosest && styles.dartSquareClosest,
                            dart.status === "missed" && styles.dartSquareMissed,
                            dart.specialtyShot &&
                              dart.status === "landed" &&
                              styles.dartSquareWithSpecialty,
                          ]}
                        >
                          {dart.status === "missed" && (
                            <Text style={styles.dartMissedX}>✕</Text>
                          )}
                          {dart.isClosest && (
                            <Text style={styles.dartClosestCheckmark}>✓</Text>
                          )}
                          {dart.specialtyShot &&
                            dart.status === "landed" &&
                            !dart.isClosest && (
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
                {(() => {
                  const hasT_Nobber =
                    p1DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    ) ||
                    p2DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    );
                  return (
                    <View style={styles.quickScoreClosestSection}>
                      <Text
                        style={[
                          styles.quickScoreLabel,
                          hasT_Nobber && { opacity: 0.4, color: "#999" },
                        ]}
                      >
                        Closest to Target Marker:
                      </Text>
                      <View
                        style={[
                          styles.quickScoreClosestButtons,
                          hasT_Nobber && { opacity: 0.4 },
                        ]}
                      >
                        <TouchableOpacity
                          disabled={
                            p1DartStates.filter((d) => d.status === "landed")
                              .length === 0 || hasT_Nobber
                          }
                          style={[
                            styles.quickScorePlayerButton,
                            closestPlayer === 1 &&
                              styles.quickScorePlayerButtonSelected,
                            (p1DartStates.filter((d) => d.status === "landed")
                              .length === 0 ||
                              hasT_Nobber) &&
                              styles.quickScorePlayerButtonDisabled,
                          ]}
                          onPress={() => setClosestPlayer(1)}
                        >
                          <Text
                            style={[
                              styles.quickScorePlayerButtonText,
                              (p1DartStates.filter((d) => d.status === "landed")
                                .length === 0 ||
                                hasT_Nobber) &&
                                styles.quickScorePlayerButtonTextDisabled,
                            ]}
                          >
                            {player1Name}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={
                            p2DartStates.filter((d) => d.status === "landed")
                              .length === 0 || hasT_Nobber
                          }
                          style={[
                            styles.quickScorePlayerButton,
                            closestPlayer === 2 &&
                              styles.quickScorePlayerButtonSelected,
                            (p2DartStates.filter((d) => d.status === "landed")
                              .length === 0 ||
                              hasT_Nobber) &&
                              styles.quickScorePlayerButtonDisabled,
                          ]}
                          onPress={() => setClosestPlayer(2)}
                        >
                          <Text
                            style={[
                              styles.quickScorePlayerButtonText,
                              (p2DartStates.filter((d) => d.status === "landed")
                                .length === 0 ||
                                hasT_Nobber) &&
                                styles.quickScorePlayerButtonTextDisabled,
                            ]}
                          >
                            {player2Name}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                {/* Calculation Preview */}
                {(p1DartStates.filter((d) => d.status === "landed").length >
                  0 ||
                  p2DartStates.filter((d) => d.status === "landed").length >
                    0) &&
                  closestPlayer && (
                    <View style={styles.quickScoreCalculationSection}>
                      <Text style={styles.quickScoreCalculationText}>
                        {(() => {
                          // Check if any dart is a T-Nobber or Inch Worm (disables closest bonus)
                          const hasT_Nobber =
                            p1DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            ) ||
                            p2DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            );

                          // Check if Lippies are present
                          const p1HasLippy = p1DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const p2HasLippy = p2DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const lippiesPresent = p1HasLippy || p2HasLippy;

                          // Calculate score for player 1
                          let p1Score = 0;
                          let p2Score = 0;
                          let p1FirstLandedIdx = -1;
                          let p2FirstLandedIdx = -1;

                          // Find first landed dart for each player
                          for (let i = 0; i < p1DartStates.length; i++) {
                            if (p1DartStates[i].status === "landed") {
                              p1FirstLandedIdx = i;
                              break;
                            }
                          }
                          for (let i = 0; i < p2DartStates.length; i++) {
                            if (p2DartStates[i].status === "landed") {
                              p2FirstLandedIdx = i;
                              break;
                            }
                          }

                          p1DartStates.forEach((dart, dartIndex) => {
                            if (dart.status === "landed") {
                              let points = 1;
                              if (
                                dart.specialtyShot === "wiggle-nobber" &&
                                dart.landingOnDart?.playerNum &&
                                dart.landingOnDart?.dartIndex !== undefined
                              ) {
                                // Wiggle Nobber: double the target dart's value
                                const targetStates =
                                  dart.landingOnDart.playerNum === 1
                                    ? p1DartStates
                                    : p2DartStates;
                                const targetDart =
                                  targetStates[dart.landingOnDart.dartIndex];
                                const isTargetFirstLanded =
                                  dart.landingOnDart.playerNum === 1
                                    ? dart.landingOnDart.dartIndex ===
                                      p1FirstLandedIdx
                                    : dart.landingOnDart.dartIndex ===
                                      p2FirstLandedIdx;
                                let targetValue = 1;
                                if (targetDart?.specialtyShot === "lippy") {
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    !hasT_Nobber
                                      ? 4
                                      : 2;
                                } else if (
                                  targetDart?.specialtyShot === "tower"
                                ) {
                                  targetValue = 5;
                                } else if (
                                  targetDart?.specialtyShot === "fender-bender"
                                ) {
                                  targetValue = 2;
                                } else if (
                                  targetDart?.specialtyShot === "t-nobber"
                                ) {
                                  targetValue = 10;
                                } else if (
                                  targetDart?.specialtyShot === "inch-worm"
                                ) {
                                  targetValue = 11;
                                } else if (
                                  targetDart?.specialtyShot === "triple-nobber"
                                ) {
                                  targetValue = 20;
                                } else {
                                  // Regular dart: only first landed gets 3pt
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    isTargetFirstLanded &&
                                    !hasT_Nobber
                                      ? 3
                                      : 1;
                                }
                                points = targetValue * 2;
                              } else if (dart.specialtyShot === "lippy") {
                                // Lippy: 1+1 base, or 3+1 if closest (but not if T-Nobber disables it)
                                points =
                                  closestPlayer === 1 && !hasT_Nobber ? 4 : 2;
                              } else if (dart.specialtyShot === "tower") {
                                points = 5;
                              } else if (
                                dart.specialtyShot === "fender-bender"
                              ) {
                                points = 2;
                              } else if (dart.specialtyShot === "t-nobber") {
                                points = 10;
                              } else if (dart.specialtyShot === "inch-worm") {
                                points = 11;
                              } else if (
                                dart.specialtyShot === "triple-nobber"
                              ) {
                                points = 20;
                              } else {
                                // Regular dart: 3pts if closest and first landed (but not if lippies present)
                                points =
                                  closestPlayer === 1 &&
                                  dartIndex === p1FirstLandedIdx &&
                                  !hasT_Nobber &&
                                  !lippiesPresent
                                    ? 3
                                    : 1;
                              }
                              p1Score += points;
                            }
                          });

                          // Calculate score for player 2
                          p2DartStates.forEach((dart, dartIndex) => {
                            if (dart.status === "landed") {
                              let points = 1;
                              if (
                                dart.specialtyShot === "wiggle-nobber" &&
                                dart.landingOnDart?.playerNum &&
                                dart.landingOnDart?.dartIndex !== undefined
                              ) {
                                // Wiggle Nobber: double the target dart's value
                                const targetStates =
                                  dart.landingOnDart.playerNum === 1
                                    ? p1DartStates
                                    : p2DartStates;
                                const targetDart =
                                  targetStates[dart.landingOnDart.dartIndex];
                                const isTargetFirstLanded =
                                  dart.landingOnDart.playerNum === 1
                                    ? dart.landingOnDart.dartIndex ===
                                      p1FirstLandedIdx
                                    : dart.landingOnDart.dartIndex ===
                                      p2FirstLandedIdx;
                                let targetValue = 1;
                                if (targetDart?.specialtyShot === "lippy") {
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    !hasT_Nobber
                                      ? 4
                                      : 2;
                                } else if (
                                  targetDart?.specialtyShot === "tower"
                                ) {
                                  targetValue = 5;
                                } else if (
                                  targetDart?.specialtyShot === "fender-bender"
                                ) {
                                  targetValue = 2;
                                } else if (
                                  targetDart?.specialtyShot === "t-nobber"
                                ) {
                                  targetValue = 10;
                                } else if (
                                  targetDart?.specialtyShot === "inch-worm"
                                ) {
                                  targetValue = 11;
                                } else if (
                                  targetDart?.specialtyShot === "triple-nobber"
                                ) {
                                  targetValue = 20;
                                } else {
                                  // Regular dart: only first landed gets 3pt
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    isTargetFirstLanded &&
                                    !hasT_Nobber
                                      ? 3
                                      : 1;
                                }
                                points = targetValue * 2;
                              } else if (dart.specialtyShot === "lippy") {
                                // Lippy: 1+1 base, or 3+1 if closest (but not if T-Nobber disables it)
                                points =
                                  closestPlayer === 2 && !hasT_Nobber ? 4 : 2;
                              } else if (dart.specialtyShot === "tower") {
                                points = 5;
                              } else if (
                                dart.specialtyShot === "fender-bender"
                              ) {
                                points = 2;
                              } else if (dart.specialtyShot === "t-nobber") {
                                points = 10;
                              } else if (dart.specialtyShot === "inch-worm") {
                                points = 11;
                              } else if (
                                dart.specialtyShot === "triple-nobber"
                              ) {
                                points = 20;
                              } else {
                                // Regular dart: 3pts if closest and first landed (but not if lippies present)
                                points =
                                  closestPlayer === 2 &&
                                  dartIndex === p2FirstLandedIdx &&
                                  !hasT_Nobber &&
                                  !lippiesPresent
                                    ? 3
                                    : 1;
                              }
                              p2Score += points;
                            }
                          });

                          // Add bonus for closest (only if no T-Nobber/Inch Worm and no Lippies present)

                          // Calculate net score
                          const netPoints = Math.abs(p1Score - p2Score);
                          const winner =
                            p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0;

                          if (winner === 0) {
                            return "Wash - No Points Awarded";
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
                {isEditingRound ? (
                  // Edit mode buttons: CANCEL and CONFIRM EDIT
                  <View style={styles.quickScoreActions}>
                    <TouchableOpacity
                      style={styles.quickScoreCancelButton}
                      onPress={() => {
                        setIsEditingRound(false);
                        setEditingRoundNumber(null);
                        setShowSimplifiedOverlay(false);
                        setSimplifiedP1Darts(0);
                        setSimplifiedP2Darts(0);
                        setClosestPlayer(null);
                        setClosestDart(null);
                        // Reset dart states
                        const createEmptyDart = () => ({
                          status: "empty",
                          specialtyShot: null,
                          landingOnDart: null,
                          isClosest: false,
                        });
                        setP1DartStates([
                          createEmptyDart(),
                          createEmptyDart(),
                          createEmptyDart(),
                        ]);
                        setP2DartStates([
                          createEmptyDart(),
                          createEmptyDart(),
                          createEmptyDart(),
                        ]);
                      }}
                    >
                      <Text style={styles.quickScoreCancelButtonText}>
                        CANCEL
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickScoreApplyButton}
                      onPress={() => {
                        saveEditedRound();
                      }}
                    >
                      <Text style={styles.quickScoreApplyButtonText}>
                        CONFIRM EDIT
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Normal mode buttons
                  <View>
                    {/* Edit Previous Round button - shown on Round 2 and beyond */}
                    {currentRound > 1 && (
                      <TouchableOpacity
                        style={[
                          styles.quickScoreApplyButton,
                          styles.editPreviousRoundButton,
                        ]}
                        onPress={() => {
                          loadRoundForEditing(currentRound - 1);
                        }}
                      >
                        <Text
                          style={[
                            styles.quickScoreApplyButtonText,
                            styles.editPreviousRoundButtonText,
                          ]}
                        >
                          ✎ EDIT PREVIOUS ROUND
                        </Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.quickScoreActions}>
                      <TouchableOpacity
                        style={styles.quickScoreCancelButton}
                        onPress={() => {
                          setShowSimplifiedOverlay(false);
                          setSimplifiedP1Darts(0);
                          setSimplifiedP2Darts(0);
                          setClosestPlayer(null);
                          setClosestDart(null);
                          setP1DartStates([
                            {
                              status: "empty",
                              specialtyShot: null,
                              landingOnDart: null,
                              isClosest: false,
                            },
                            {
                              status: "empty",
                              specialtyShot: null,
                              landingOnDart: null,
                              isClosest: false,
                            },
                            {
                              status: "empty",
                              specialtyShot: null,
                              landingOnDart: null,
                              isClosest: false,
                            },
                          ]);
                          setP2DartStates([
                            {
                              status: "empty",
                              specialtyShot: null,
                              landingOnDart: null,
                              isClosest: false,
                            },
                            {
                              status: "empty",
                              specialtyShot: null,
                              landingOnDart: null,
                              isClosest: false,
                            },
                            {
                              status: "empty",
                              specialtyShot: null,
                              landingOnDart: null,
                              isClosest: false,
                            },
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
                          // Score each dart: 1 point normally, 2 for Fender Bender, 5 for Tower, 10 for T-Nobber
                          let p1Score = 0;
                          let p2Score = 0;
                          let p1ClosestHandled = false;
                          let p2ClosestHandled = false;

                          // Check if any dart is a T-Nobber or Inch Worm (disables closest bonus)
                          const hasT_Nobber =
                            p1DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            ) ||
                            p2DartStates.some(
                              (d) =>
                                d.specialtyShot === "t-nobber" ||
                                d.specialtyShot === "inch-worm",
                            );

                          // Check if Lippies are present (competes for closest)
                          const p1HasLippy = p1DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const p2HasLippy = p2DartStates.some(
                            (d) => d.specialtyShot === "lippy",
                          );
                          const lippiesPresent = p1HasLippy || p2HasLippy;

                          p1DartStates.forEach((dart) => {
                            if (dart.status === "landed") {
                              let points = 1;
                              if (
                                dart.specialtyShot === "wiggle-nobber" &&
                                dart.landingOnDart?.playerNum &&
                                dart.landingOnDart?.dartIndex !== undefined
                              ) {
                                // Wiggle Nobber: double the target dart's value
                                const targetStates =
                                  dart.landingOnDart.playerNum === 1
                                    ? p1DartStates
                                    : p2DartStates;
                                const targetDart =
                                  targetStates[dart.landingOnDart.dartIndex];
                                let targetValue = 1;
                                if (targetDart?.specialtyShot === "lippy") {
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    !hasT_Nobber
                                      ? 4
                                      : 2;
                                } else if (
                                  targetDart?.specialtyShot === "tower"
                                ) {
                                  targetValue = 5;
                                } else if (
                                  targetDart?.specialtyShot === "fender-bender"
                                ) {
                                  targetValue = 2;
                                } else if (
                                  targetDart?.specialtyShot === "t-nobber"
                                ) {
                                  targetValue = 10;
                                } else if (
                                  targetDart?.specialtyShot === "inch-worm"
                                ) {
                                  targetValue = 11;
                                } else if (
                                  targetDart?.specialtyShot === "triple-nobber"
                                ) {
                                  targetValue = 20;
                                } else {
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    !hasT_Nobber
                                      ? 3
                                      : 1;
                                }
                                points = targetValue * 2;
                              } else if (dart.specialtyShot === "lippy") {
                                // Lippy: 4 if closest (and no T-Nobber), 2 otherwise
                                points =
                                  closestPlayer === 1 && !hasT_Nobber ? 4 : 2;
                              } else if (dart.specialtyShot === "tower") {
                                points = 5;
                              } else if (
                                dart.specialtyShot === "fender-bender"
                              ) {
                                points = 2;
                              } else if (dart.specialtyShot === "t-nobber") {
                                points = 10;
                              } else if (dart.specialtyShot === "inch-worm") {
                                points = 11;
                              } else if (
                                dart.specialtyShot === "triple-nobber"
                              ) {
                                points = 20;
                              }
                              // Add closest bonus to first dart only (if no T-Nobber, not a Lippy, and no lippies present)
                              if (
                                closestPlayer === 1 &&
                                !p1ClosestHandled &&
                                !hasT_Nobber &&
                                dart.specialtyShot !== "lippy" &&
                                !lippiesPresent
                              ) {
                                points += 2;
                                p1ClosestHandled = true;
                              }
                              p1Score += points;
                            }
                          });

                          p2DartStates.forEach((dart) => {
                            if (dart.status === "landed") {
                              let points = 1;
                              if (
                                dart.specialtyShot === "wiggle-nobber" &&
                                dart.landingOnDart?.playerNum &&
                                dart.landingOnDart?.dartIndex !== undefined
                              ) {
                                // Wiggle Nobber: double the target dart's value
                                const targetStates =
                                  dart.landingOnDart.playerNum === 1
                                    ? p1DartStates
                                    : p2DartStates;
                                const targetDart =
                                  targetStates[dart.landingOnDart.dartIndex];
                                let targetValue = 1;
                                if (targetDart?.specialtyShot === "lippy") {
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    !hasT_Nobber
                                      ? 4
                                      : 2;
                                } else if (
                                  targetDart?.specialtyShot === "tower"
                                ) {
                                  targetValue = 5;
                                } else if (
                                  targetDart?.specialtyShot === "fender-bender"
                                ) {
                                  targetValue = 2;
                                } else if (
                                  targetDart?.specialtyShot === "t-nobber"
                                ) {
                                  targetValue = 10;
                                } else if (
                                  targetDart?.specialtyShot === "inch-worm"
                                ) {
                                  targetValue = 11;
                                } else if (
                                  targetDart?.specialtyShot === "triple-nobber"
                                ) {
                                  targetValue = 20;
                                } else {
                                  targetValue =
                                    closestPlayer ===
                                      dart.landingOnDart.playerNum &&
                                    !hasT_Nobber
                                      ? 3
                                      : 1;
                                }
                                points = targetValue * 2;
                              } else if (dart.specialtyShot === "lippy") {
                                // Lippy: 4 if closest (and no T-Nobber), 2 otherwise
                                points =
                                  closestPlayer === 2 && !hasT_Nobber ? 4 : 2;
                              } else if (dart.specialtyShot === "tower") {
                                points = 5;
                              } else if (
                                dart.specialtyShot === "fender-bender"
                              ) {
                                points = 2;
                              } else if (dart.specialtyShot === "t-nobber") {
                                points = 10;
                              } else if (dart.specialtyShot === "inch-worm") {
                                points = 11;
                              } else if (
                                dart.specialtyShot === "triple-nobber"
                              ) {
                                points = 20;
                              }
                              // Add closest bonus to first dart only (if no T-Nobber, not a Lippy, and no lippies present)
                              if (
                                closestPlayer === 2 &&
                                !p2ClosestHandled &&
                                !hasT_Nobber &&
                                dart.specialtyShot !== "lippy" &&
                                !lippiesPresent
                              ) {
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
                            console.log("Wash - No Points Awarded");
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
                            p1SpecialtyShots: p1DartStates.filter(
                              (d) => d.specialtyShot,
                            ),
                            p2SpecialtyShots: p2DartStates.filter(
                              (d) => d.specialtyShot,
                            ),
                            firstThrower,
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
                          setClosestDart(null);
                          setP1SpecialtyShots([]);
                          setP2SpecialtyShots([]);
                          setSelectedDartPlayer(null);
                          setSelectedDartIndex(null);

                          // Reset dart states for next round
                          const createEmptyDart = () => ({
                            status: "empty",
                            specialtyShot: null,
                            landingOnDart: null,
                            isClosest: false,
                          });
                          setP1DartStates([
                            createEmptyDart(),
                            createEmptyDart(),
                            createEmptyDart(),
                          ]);
                          setP2DartStates([
                            createEmptyDart(),
                            createEmptyDart(),
                            createEmptyDart(),
                          ]);
                          setShowDartSpecialtyModal(false);
                          setShowWiggleNobberTargetModal(false);
                          setShowStatTrackerModal(false);
                        }}
                      >
                        <Text style={styles.quickScoreApplyButtonText}>
                          APPLY
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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

                {/* Scoring Progression Chart */}
                {roundHistory && roundHistory.length > 0 && (
                  <ScoringProgressChart
                    roundHistory={roundHistory}
                    player1Name={player1Name || "Player 1"}
                    player2Name={player2Name || "Player 2"}
                    player1Color={
                      player1ColorObj || { colors: ["#2196F3", "#1976D2"] }
                    }
                    player2Color={
                      player2ColorObj || { colors: ["#4CAF50", "#388E3C"] }
                    }
                  />
                )}

                {/* Comparative Stats Section */}
                {roundHistory &&
                  roundHistory.length > 0 &&
                  (() => {
                    try {
                      const totalRounds = roundHistory.length;

                      // Guard: validate roundHistory entries have required fields
                      const validRounds = roundHistory.filter(
                        (round) =>
                          round &&
                          typeof round.p1Darts === "number" &&
                          typeof round.p2Darts === "number",
                      );

                      if (validRounds.length === 0) {
                        console.warn(
                          "No valid round data found in roundHistory",
                        );
                        return null;
                      }

                      const p1DartsLanded = validRounds.reduce(
                        (sum, round) => sum + (round.p1Darts || 0),
                        0,
                      );
                      const p1DartsMissed = totalRounds * 3 - p1DartsLanded;
                      const p2DartsLanded = validRounds.reduce(
                        (sum, round) => sum + (round.p2Darts || 0),
                        0,
                      );
                      const p2DartsMissed = totalRounds * 3 - p2DartsLanded;

                      // Guard: ensure stats objects exist and have roundsWon property
                      const p1RoundsWon = player1Stats?.roundsWon || 0;
                      const p2RoundsWon = player2Stats?.roundsWon || 0;

                      // Pre-calculate landing percentages and landing flex values
                      const totalDartsThrown = totalRounds * 3;
                      const p1LandingPercent =
                        totalDartsThrown > 0
                          ? (p1DartsLanded / totalDartsThrown) * 100
                          : 0;
                      const p2LandingPercent =
                        totalDartsThrown > 0
                          ? (p2DartsLanded / totalDartsThrown) * 100
                          : 0;
                      const landingTotalPercent = Math.max(
                        p1LandingPercent + p2LandingPercent,
                        1,
                      ); // Avoid division by zero
                      const p1LandingFlex =
                        landingTotalPercent > 0
                          ? p1LandingPercent / landingTotalPercent
                          : 0.5;
                      const p2LandingFlex =
                        landingTotalPercent > 0
                          ? p2LandingPercent / landingTotalPercent
                          : 0.5;

                      // Pre-calculate rounds won flex values
                      const totalRoundsWon = p1RoundsWon + p2RoundsWon || 1; // Avoid division by zero
                      const p1RoundsFlex =
                        totalRoundsWon > 0 ? p1RoundsWon / totalRoundsWon : 0.5;
                      const p2RoundsFlex =
                        totalRoundsWon > 0 ? p2RoundsWon / totalRoundsWon : 0.5;

                      // Pre-calculate darts landed flex values (higher is better)
                      const totalDartsLanded =
                        p1DartsLanded + p2DartsLanded || 1;
                      const p1DartsLandedFlex =
                        totalDartsLanded > 0
                          ? p1DartsLanded / totalDartsLanded
                          : 0.5;
                      const p2DartsLandedFlex =
                        totalDartsLanded > 0
                          ? p2DartsLanded / totalDartsLanded
                          : 0.5;

                      // Pre-calculate avg darts per round for flex (higher is better)
                      const p1AvgDarts = p1DartsLanded / totalRounds;
                      const p2AvgDarts = p2DartsLanded / totalRounds;
                      const totalAvgDarts = Math.max(
                        p1AvgDarts + p2AvgDarts,
                        0.1,
                      );
                      const p1AvgDartsFlex =
                        totalAvgDarts > 0 ? p1AvgDarts / totalAvgDarts : 0.5;
                      const p2AvgDartsFlex =
                        totalAvgDarts > 0 ? p2AvgDarts / totalAvgDarts : 0.5;

                      // Pre-calculate darts missed flex values (lower is better - flip the display)
                      const totalDartsMissed =
                        p1DartsMissed + p2DartsMissed || 1;
                      const p1DartsMissedFlex =
                        totalDartsMissed > 0
                          ? p1DartsMissed / totalDartsMissed
                          : 0.5;
                      const p2DartsMissedFlex =
                        totalDartsMissed > 0
                          ? p2DartsMissed / totalDartsMissed
                          : 0.5;

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
                            <View style={styles.divergingBarContainer}>
                              <View
                                style={[
                                  styles.divergingBarLeft,
                                  {
                                    flex: p1DartsLandedFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player1ColorObj?.colors || [
                                      "#2196F3",
                                      "#1976D2",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player1ColorObj?.colors?.[0] ||
                                            "#2196F3",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p1DartsLanded}
                                  </Text>
                                </LinearGradient>
                              </View>
                              <View style={styles.divergingBarCenter} />
                              <View
                                style={[
                                  styles.divergingBarRight,
                                  {
                                    flex: p2DartsLandedFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player2ColorObj?.colors || [
                                      "#4CAF50",
                                      "#388E3C",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player2ColorObj?.colors?.[0] ||
                                            "#4CAF50",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p2DartsLanded}
                                  </Text>
                                </LinearGradient>
                              </View>
                            </View>
                          </View>

                          {/* Average Darts Per Round */}
                          <View style={styles.statsCategory}>
                            <Text style={styles.statsCategoryLabel}>
                              Avg Darts/Round
                            </Text>
                            <View style={styles.divergingBarContainer}>
                              <View
                                style={[
                                  styles.divergingBarLeft,
                                  {
                                    flex: p1AvgDartsFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player1ColorObj?.colors || [
                                      "#2196F3",
                                      "#1976D2",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player1ColorObj?.colors?.[0] ||
                                            "#2196F3",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p1AvgDarts.toFixed(1)}
                                  </Text>
                                </LinearGradient>
                              </View>
                              <View style={styles.divergingBarCenter} />
                              <View
                                style={[
                                  styles.divergingBarRight,
                                  {
                                    flex: p2AvgDartsFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player2ColorObj?.colors || [
                                      "#4CAF50",
                                      "#388E3C",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player2ColorObj?.colors?.[0] ||
                                            "#4CAF50",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p2AvgDarts.toFixed(1)}
                                  </Text>
                                </LinearGradient>
                              </View>
                            </View>
                          </View>

                          {/* Darts Missed */}
                          <View style={styles.statsCategory}>
                            <Text style={styles.statsCategoryLabel}>
                              Darts Missed
                            </Text>
                            <View style={styles.divergingBarContainer}>
                              <View
                                style={[
                                  styles.divergingBarLeft,
                                  {
                                    flex: p1DartsMissedFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player1ColorObj?.colors || [
                                      "#2196F3",
                                      "#1976D2",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player1ColorObj?.colors?.[0] ||
                                            "#2196F3",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p1DartsMissed}
                                  </Text>
                                </LinearGradient>
                              </View>
                              <View style={styles.divergingBarCenter} />
                              <View
                                style={[
                                  styles.divergingBarRight,
                                  {
                                    flex: p2DartsMissedFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player2ColorObj?.colors || [
                                      "#4CAF50",
                                      "#388E3C",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player2ColorObj?.colors?.[0] ||
                                            "#4CAF50",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p2DartsMissed}
                                  </Text>
                                </LinearGradient>
                              </View>
                            </View>
                          </View>

                          {/* Landing Percentage */}
                          <View style={styles.statsCategory}>
                            <Text style={styles.statsCategoryLabel}>
                              Landing %
                            </Text>
                            <View style={styles.divergingBarContainer}>
                              <View
                                style={[
                                  styles.divergingBarLeft,
                                  {
                                    flex: p1LandingFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player1ColorObj?.colors || [
                                      "#2196F3",
                                      "#1976D2",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player1ColorObj?.colors?.[0] ||
                                            "#2196F3",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p1LandingPercent.toFixed(0)}%
                                  </Text>
                                </LinearGradient>
                              </View>
                              <View style={styles.divergingBarCenter} />
                              <View
                                style={[
                                  styles.divergingBarRight,
                                  {
                                    flex: p2LandingFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player2ColorObj?.colors || [
                                      "#4CAF50",
                                      "#388E3C",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player2ColorObj?.colors?.[0] ||
                                            "#4CAF50",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p2LandingPercent.toFixed(0)}%
                                  </Text>
                                </LinearGradient>
                              </View>
                            </View>
                          </View>

                          {/* Rounds Won / Win % */}
                          <View style={styles.statsCategory}>
                            <Text style={styles.statsCategoryLabel}>
                              Rounds Won / Win %
                            </Text>
                            <View style={styles.divergingBarContainer}>
                              <View
                                style={[
                                  styles.divergingBarLeft,
                                  {
                                    flex: p1RoundsFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player1ColorObj?.colors || [
                                      "#2196F3",
                                      "#1976D2",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player1ColorObj?.colors?.[0] ||
                                            "#2196F3",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p1RoundsWon} /{" "}
                                    {(
                                      (p1RoundsWon / totalRounds) *
                                      100
                                    ).toFixed(0)}
                                    %
                                  </Text>
                                </LinearGradient>
                              </View>
                              <View style={styles.divergingBarCenter} />
                              <View
                                style={[
                                  styles.divergingBarRight,
                                  {
                                    flex: p2RoundsFlex,
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={
                                    player2ColorObj?.colors || [
                                      "#4CAF50",
                                      "#388E3C",
                                    ]
                                  }
                                  start={{ x: 0, y: 0.5 }}
                                  end={{ x: 1, y: 0.5 }}
                                  style={[
                                    styles.divergingBarFill,
                                    {
                                      borderRadius: 4,
                                      width: "95%",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.divergingBarText,
                                      {
                                        color: getContrastingTextColor(
                                          player2ColorObj?.colors?.[0] ||
                                            "#4CAF50",
                                        ),
                                      },
                                    ]}
                                  >
                                    {p2RoundsWon} /{" "}
                                    {(
                                      (p2RoundsWon / totalRounds) *
                                      100
                                    ).toFixed(0)}
                                    %
                                  </Text>
                                </LinearGradient>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    } catch (error) {
                      console.error(
                        "Error rendering comparative stats:",
                        error,
                      );
                      console.error("roundHistory:", roundHistory);
                      console.error("player1Stats:", player1Stats);
                      console.error("player2Stats:", player2Stats);
                      return (
                        <View
                          style={{ padding: 16, backgroundColor: "#ffebee" }}
                        >
                          <Text
                            style={{ color: "#c62828", fontWeight: "bold" }}
                          >
                            Error rendering stats
                          </Text>
                          <Text style={{ color: "#d32f2f", fontSize: 12 }}>
                            {error.message}
                          </Text>
                        </View>
                      );
                    }
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
                      const p1Specialty = Array.isArray(round.p1SpecialtyShots)
                        ? round.p1SpecialtyShots
                        : round.p1DartStates
                          ? round.p1DartStates.filter((d) => d.specialtyShot)
                          : [];
                      const p2Specialty = Array.isArray(round.p2SpecialtyShots)
                        ? round.p2SpecialtyShots
                        : round.p2DartStates
                          ? round.p2DartStates.filter((d) => d.specialtyShot)
                          : [];

                      // First thrower gradient box
                      let roundBoxStyle = [
                        styles.roundBreakdownColumn,
                        styles.roundNumberColumn,
                        styles.roundNumberText,
                      ];
                      let gradientColors = null;
                      if (
                        round.firstThrower === 1 &&
                        player1ColorObj &&
                        player1ColorObj.isGradient
                      ) {
                        gradientColors = player1ColorObj.colors;
                      } else if (
                        round.firstThrower === 2 &&
                        player2ColorObj &&
                        player2ColorObj.isGradient
                      ) {
                        gradientColors = player2ColorObj.colors;
                      }

                      return (
                        <View key={index} style={styles.roundBreakdownRow}>
                          <View style={{ position: "relative" }}>
                            {gradientColors ? (
                              <LinearGradient
                                colors={gradientColors}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  right: 0,
                                  bottom: 0,
                                  borderRadius: 6,
                                  zIndex: 0,
                                }}
                              />
                            ) : null}
                            <Text
                              style={[
                                ...roundBoxStyle,
                                {
                                  zIndex: 1,
                                  color: gradientColors ? "#fff" : undefined,
                                },
                              ]}
                            >
                              {round.roundNumber}
                            </Text>
                          </View>
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
                            {p1Specialty.length > 0 && (
                              <Text style={styles.roundSpecialtyShotsText}>
                                {p1Specialty
                                  .map(
                                    (s) =>
                                      s.specialtyShot?.abbr ||
                                      s.abbr ||
                                      s.specialtyShot?.name ||
                                      s.name,
                                  )
                                  .join(", ")}
                              </Text>
                            )}
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
                            {p2Specialty.length > 0 && (
                              <Text style={styles.roundSpecialtyShotsText}>
                                {p2Specialty
                                  .map(
                                    (s) =>
                                      s.specialtyShot?.abbr ||
                                      s.abbr ||
                                      s.specialtyShot?.name ||
                                      s.name,
                                  )
                                  .join(", ")}
                              </Text>
                            )}
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
                  setClosestDart(null);
                  setP1DartStates([
                    {
                      status: "empty",
                      specialtyShot: null,
                      landingOnDart: null,
                      isClosest: false,
                    },
                    {
                      status: "empty",
                      specialtyShot: null,
                      landingOnDart: null,
                      isClosest: false,
                    },
                    {
                      status: "empty",
                      specialtyShot: null,
                      landingOnDart: null,
                      isClosest: false,
                    },
                  ]);
                  setP2DartStates([
                    {
                      status: "empty",
                      specialtyShot: null,
                      landingOnDart: null,
                      isClosest: false,
                    },
                    {
                      status: "empty",
                      specialtyShot: null,
                      landingOnDart: null,
                      isClosest: false,
                    },
                    {
                      status: "empty",
                      specialtyShot: null,
                      landingOnDart: null,
                      isClosest: false,
                    },
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
              {SPECIALTY_SHOTS.map((shot) => {
                // Hide wiggle-nobber if there are no other darts on the board
                const totalDartsLanded =
                  p1DartStates.filter((d) => d.status === "landed").length +
                  p2DartStates.filter((d) => d.status === "landed").length;
                if (shot.id === "wiggle-nobber" && totalDartsLanded < 1) {
                  return null;
                }
                // Check for T-Nobber and Inch Worm presence
                const hasInchWorm =
                  p1DartStates.some((d) => d.specialtyShot === "inch-worm") ||
                  p2DartStates.some((d) => d.specialtyShot === "inch-worm");
                const hasTNobber =
                  p1DartStates.some((d) => d.specialtyShot === "t-nobber") ||
                  p2DartStates.some((d) => d.specialtyShot === "t-nobber");
                const hasTripleNobber =
                  p1DartStates.some(
                    (d) => d.specialtyShot === "triple-nobber",
                  ) ||
                  p2DartStates.some((d) => d.specialtyShot === "triple-nobber");
                const hasTower =
                  p1DartStates.some((d) => d.specialtyShot === "tower") ||
                  p2DartStates.some((d) => d.specialtyShot === "tower");

                // Hide T-Nobber if Inch Worm OR another T-Nobber is on board
                if (shot.id === "t-nobber" && (hasInchWorm || hasTNobber)) {
                  return null;
                }
                // Hide Triple Nobber unless T-Nobber is on board, or if one is already on board
                if (
                  shot.id === "triple-nobber" &&
                  (!hasTNobber || hasTripleNobber)
                ) {
                  return null;
                }
                // Hide Inch Worm if one is already on the board
                if (shot.id === "inch-worm" && hasInchWorm) {
                  return null;
                }
                // Hide Tower if one is already on the board
                if (shot.id === "tower" && hasTower) {
                  return null;
                }

                return (
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
                        landingOnDart: null,
                      };
                      setDartStates(newStates);

                      // If Wiggle Nobber, show target selection modal
                      if (shot.id === "wiggle-nobber") {
                        setShowDartSpecialtyModal(false);
                        setShowWiggleNobberTargetModal(true);
                      } else {
                        setShowDartSpecialtyModal(false);
                      }
                    }}
                    style={[
                      styles.dartSpecialtyShotButton,
                      shot.id === "triple-nobber" && {
                        backgroundColor: "#FFD700",
                        borderWidth: 3,
                        borderColor: "#FF8C00",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dartSpecialtyShotName,
                        shot.id === "triple-nobber" && {
                          color: "#FF8C00",
                          fontWeight: "bold",
                        },
                      ]}
                    >
                      {shot.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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

      {/* Wiggle Nobber Target Selection Modal */}
      <Modal
        visible={showWiggleNobberTargetModal}
        onRequestClose={() => setShowWiggleNobberTargetModal(false)}
        animationType="fade"
        transparent
      >
        <View style={styles.dartSpecialtyOverlay}>
          <View style={styles.dartSpecialtyContainer}>
            <Text style={styles.dartSpecialtyTitle}>Wiggle Nobber Target</Text>
            <Text style={styles.dartSpecialtySubtitle}>
              Which dart does it land on?
            </Text>

            <View style={styles.dartSpecialtyShotsGrid}>
              {/* Player 1 darts */}
              {p1DartStates.map((dart, index) => {
                const targetLanded = dart.status === "landed";
                // Don't allow Wiggle Nobber to target itself
                const isCurrentDart =
                  selectedDartPlayer === 1 && selectedDartIndex === index;
                if (!targetLanded || isCurrentDart) return null;

                // Calculate value of target dart for preview
                let targetValue = 1;
                if (dart.specialtyShot === "lippy") {
                  const isClosest = closestPlayer === 1;
                  targetValue =
                    isClosest &&
                    !p1DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    ) &&
                    !p2DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    )
                      ? 4
                      : 2;
                } else if (dart.specialtyShot === "tower") {
                  targetValue = 5;
                } else if (dart.specialtyShot === "fender-bender") {
                  targetValue = 2;
                } else if (dart.specialtyShot === "t-nobber") {
                  targetValue = 10;
                } else if (dart.specialtyShot === "inch-worm") {
                  targetValue = 11;
                } else if (dart.specialtyShot === "triple-nobber") {
                  targetValue = 20;
                } else {
                  const isClosest = closestPlayer === 1;
                  const isFirstLandedFromClosest = !p1DartStates.some(
                    (d, i) => i < index && d.status === "landed",
                  );
                  targetValue =
                    isClosest &&
                    isFirstLandedFromClosest &&
                    !p1DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    ) &&
                    !p2DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    )
                      ? 3
                      : 1;
                }

                return (
                  <TouchableOpacity
                    key={`p1-${index}`}
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
                        landingOnDart: { playerNum: 1, dartIndex: index },
                      };
                      setDartStates(newStates);
                      setShowWiggleNobberTargetModal(false);
                    }}
                    style={styles.dartSpecialtyShotButton}
                  >
                    <Text style={styles.dartSpecialtyShotName}>
                      {player1Name} Dart {index + 1} ({targetValue}pt)
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Player 2 darts */}
              {p2DartStates.map((dart, index) => {
                const targetLanded = dart.status === "landed";
                // Don't allow Wiggle Nobber to target itself
                const isCurrentDart =
                  selectedDartPlayer === 2 && selectedDartIndex === index;
                if (!targetLanded || isCurrentDart) return null;

                // Calculate value of target dart for preview
                let targetValue = 1;
                if (dart.specialtyShot === "lippy") {
                  const isClosest = closestPlayer === 2;
                  targetValue =
                    isClosest &&
                    !p1DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    ) &&
                    !p2DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    )
                      ? 4
                      : 2;
                } else if (dart.specialtyShot === "tower") {
                  targetValue = 5;
                } else if (dart.specialtyShot === "fender-bender") {
                  targetValue = 2;
                } else if (dart.specialtyShot === "t-nobber") {
                  targetValue = 10;
                } else if (dart.specialtyShot === "inch-worm") {
                  targetValue = 11;
                } else if (dart.specialtyShot === "triple-nobber") {
                  targetValue = 20;
                } else {
                  const isClosest = closestPlayer === 2;
                  const isFirstLandedFromClosest = !p2DartStates.some(
                    (d, i) => i < index && d.status === "landed",
                  );
                  targetValue =
                    isClosest &&
                    isFirstLandedFromClosest &&
                    !p1DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    ) &&
                    !p2DartStates.some(
                      (d) =>
                        d.specialtyShot === "t-nobber" ||
                        d.specialtyShot === "inch-worm",
                    )
                      ? 3
                      : 1;
                }

                return (
                  <TouchableOpacity
                    key={`p2-${index}`}
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
                        landingOnDart: { playerNum: 2, dartIndex: index },
                      };
                      setDartStates(newStates);
                      setShowWiggleNobberTargetModal(false);
                    }}
                    style={styles.dartSpecialtyShotButton}
                  >
                    <Text style={styles.dartSpecialtyShotName}>
                      {player2Name} Dart {index + 1} ({targetValue}pt)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setShowWiggleNobberTargetModal(false)}
              style={styles.dartSpecialtyClearButton}
            >
              <Text style={styles.dartSpecialtyClearButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {renderPreGameModal()}
    </>
  );
}

// Styles are now imported from external stylesheet
