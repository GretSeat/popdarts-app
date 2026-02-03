import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PaperProvider, MD3LightTheme, Appbar } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { PlayerPreferencesProvider } from "./src/contexts/PlayerPreferencesContext";

// Screens
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MatchesScreen from "./src/screens/MatchesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NewMatchScreen from "./src/screens/NewMatchScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";

const Tab = createBottomTabNavigator();

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
 * Main navigation component
 */
function MainNavigator() {
  return (
    <Tab.Navigator
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
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Appbar.Action icon="home" color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Store"
        component={HomeScreen}
        options={{
          tabBarLabel: "Store",
          tabBarIcon: ({ color }) => (
            <Appbar.Action icon="store" color="#999" />
          ),
          tabBarActiveTintColor: "#999",
          tabBarInactiveTintColor: "#999",
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // Could show a toast/alert here: "Coming Soon!"
          },
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
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "bold",
          },
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Local"
        component={HomeScreen}
        options={{
          tabBarLabel: "Local",
          tabBarIcon: ({ color }) => <Appbar.Action icon="lan" color="#999" />,
          tabBarActiveTintColor: "#999",
          tabBarInactiveTintColor: "#999",
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // Could show a toast/alert here: "Coming Soon!"
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Appbar.Action icon="account" color={color} />
          ),
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
    return null; // TODO: Add loading screen
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
            <StatusBar style="auto" translucent backgroundColor="transparent" />
            <AppContent />
          </PlayerPreferencesProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
