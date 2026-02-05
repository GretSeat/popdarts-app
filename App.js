import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { PaperProvider, MD3LightTheme, Appbar } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Platform,
  View,
  Text as RNText,
  ActivityIndicator,
} from "react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { PlayerPreferencesProvider } from "./src/contexts/PlayerPreferencesContext";

// Screens
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MatchesScreen from "./src/screens/MatchesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NewMatchScreen from "./src/screens/NewMatchScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LocalScreen from "./src/screens/LocalScreen";
import CreateClubScreen from "./src/screens/CreateClubScreen";
import StoreScreen from "./src/screens/StoreScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Custom theme with Popdarts branding colors
 */
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2196F3", // Popdarts blue
    secondary: "#4CAF50", // Popdarts green
  },
};

/**
 * Local Stack Navigator - Handles Local tab and club screens
 */
function LocalStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="LocalHome"
        component={LocalScreen}
        options={{
          title: "Local Clubs",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateClub"
        component={CreateClubScreen}
        options={{
          title: "Create Club",
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Main navigation component
 */
function MainNavigator() {
  return (
    <Tab.Navigator
      sceneContainerStyle={
        Platform.OS === "web" ? { backgroundColor: "#f5f5f5" } : {}
      }
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#999",
        tabBarStyle:
          Platform.OS === "web"
            ? {
                height: 60,
                backgroundColor: theme.colors.primary,
                borderBottomWidth: 0,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }
            : {},
        tabBarPosition: Platform.OS === "web" ? "top" : "bottom",
        tabBarLabelStyle:
          Platform.OS === "web"
            ? {
                fontSize: 16,
                fontWeight: "600",
                textTransform: "none",
              }
            : {},
        tabBarActiveTintColor:
          Platform.OS === "web" ? "#fff" : theme.colors.primary,
        tabBarInactiveTintColor:
          Platform.OS === "web" ? "rgba(255,255,255,0.7)" : "#999",
        tabBarIndicatorStyle:
          Platform.OS === "web"
            ? {
                backgroundColor: "#fff",
                height: 3,
              }
            : {},
        lazy: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Appbar.Action icon="home" color={color} />
          ),
          tabBarShowIcon: Platform.OS !== "web",
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{
          tabBarLabel: "Store",
          tabBarIcon: ({ color }) => (
            <Appbar.Action icon="store" color={color} />
          ),
          tabBarShowIcon: Platform.OS !== "web",
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Play"
        component={NewMatchScreen}
        options={{
          title: "New Match",
          tabBarLabel: "Play",
          tabBarIcon: ({ color, size }) => (
            <Appbar.Action icon="play-circle" color={color} size={32} />
          ),
          tabBarShowIcon: Platform.OS !== "web",
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Local"
        component={LocalStack}
        options={{
          tabBarLabel: "Local",
          tabBarIcon: ({ color }) => (
            <Appbar.Action icon="map-marker" color={color} />
          ),
          tabBarShowIcon: Platform.OS !== "web",
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Appbar.Action icon="account" color={color} />
          ),
          tabBarShowIcon: Platform.OS !== "web",
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root app component with authentication logic
 */
function AppContent() {
  const { user, loading, isGuest } = useAuth();
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState(null);

  useEffect(() => {
    // Check if user has completed welcome screen
    AsyncStorage.getItem("has_completed_welcome").then((value) => {
      setHasCompletedWelcome(value === "true");
    });
  }, [user, isGuest]);

  if (loading || hasCompletedWelcome === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <RNText style={{ marginTop: 20, color: "#666" }}>
          Loading Popdarts...
        </RNText>
      </View>
    );
  }

  // Show welcome screen for first-time authenticated users
  if ((user || isGuest) && !hasCompletedWelcome) {
    return (
      <WelcomeScreen
        onComplete={async (playStyle) => {
          await AsyncStorage.setItem("play_style", playStyle || "casual");
          setHasCompletedWelcome(true);
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      {user || isGuest ? <MainNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
}

/**
 * Main App wrapper with providers
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <PlayerPreferencesProvider>
            {Platform.OS !== "web" && (
              <StatusBar
                style="auto"
                translucent
                backgroundColor="transparent"
              />
            )}
            <AppContent />
          </PlayerPreferencesProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
