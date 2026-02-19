import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  registerForPushNotificationsAsync,
  savePushTokenToDatabase,
  removePushTokenFromDatabase,
} from "../services/pushNotificationService";

const AuthContext = createContext({});

/**
 * Custom hook to access auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/**
 * Authentication provider component
 * Manages user session, guest mode, and auth state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [pushToken, setPushToken] = useState(null);

  useEffect(() => {
    console.log("[AuthContext] Initializing...");

    // Handle OAuth callback (web only - check for tokens in URL)
    const handleOAuthCallback = async () => {
      try {
        if (typeof window === "undefined") return; // Not on web

        const hash = window.location.hash;
        console.log(
          "[AuthContext] URL hash check:",
          hash ? "hash present" : "no hash",
        );

        if (hash && hash.includes("access_token")) {
          console.log("[AuthContext] OAuth callback detected");

          // Parse hash parameters
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          const expiresIn = params.get("expires_in");

          if (accessToken) {
            console.log("[AuthContext] Setting session with tokens...");

            // Set the session with the returned tokens
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            console.log("[AuthContext] OAuth session established");

            // Clear the URL hash
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error handling OAuth callback:", error);
      }
    };

    handleOAuthCallback();

    // Check for existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        console.log(
          "[AuthContext] Session loaded:",
          session ? "authenticated" : "no session",
        );
        if (session?.user) {
          console.log(
            "[AuthContext] User metadata:",
            JSON.stringify(session.user.user_metadata, null, 2),
          );
          console.log(
            "[AuthContext] Picture URL from metadata:",
            session.user.user_metadata?.picture,
          );
          console.log(
            "[AuthContext] Full name from metadata:",
            session.user.user_metadata?.full_name,
          );
        }
        setSession(session);
        setUser(session?.user ?? null);

        // Register for push notifications if user is authenticated
        if (session?.user) {
          await registerPushNotifications(session.user.id);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("[AuthContext] Error loading session:", error);
        setLoading(false);
      });

    // Check for guest mode
    AsyncStorage.getItem("guest_mode")
      .then((value) => {
        if (value === "true") {
          console.log("[AuthContext] Guest mode detected");
          setIsGuest(true);
          AsyncStorage.getItem("guest_name").then((name) => {
            setGuestName(name || "");
          });
        }
      })
      .catch((error) => {
        console.error("[AuthContext] Error checking guest mode:", error);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[AuthContext] Auth state changed:", _event);
      if (session?.user) {
        console.log(
          "[AuthContext] Full user object:",
          JSON.stringify(session.user, null, 2),
        );
        console.log(
          "[AuthContext] user_metadata keys:",
          Object.keys(session.user.user_metadata || {}),
        );
        console.log(
          "[AuthContext] Google metadata after auth change:",
          JSON.stringify(session.user.user_metadata, null, 2),
        );
        console.log(
          "[AuthContext] Picture value:",
          session.user.user_metadata?.picture,
        );
        console.log(
          "[AuthContext] Full name value:",
          session.user.user_metadata?.full_name,
        );
      }
      setSession(session);
      setUser(session?.user ?? null);

      // Handle push notifications on sign in
      if (_event === "SIGNED_IN" && session?.user) {
        await registerPushNotifications(session.user.id);
      }

      // Handle push notifications on sign out
      if (_event === "SIGNED_OUT" && pushToken) {
        await removePushTokenFromDatabase(user?.id, pushToken);
        setPushToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Register device for push notifications
   * @param {string} userId - User ID from Supabase auth
   */
  const registerPushNotifications = async (userId) => {
    try {
      console.log("[AuthContext] Registering for push notifications...");
      const token = await registerForPushNotificationsAsync();

      if (token) {
        setPushToken(token);
        await savePushTokenToDatabase(userId, token);
        console.log("[AuthContext] Push notifications registered successfully");
      }
    } catch (error) {
      // Push notifications may fail on web or if VAPID key is not configured
      // This is not a critical error - app should still function
      console.warn(
        "[AuthContext] Push notifications unavailable (this is OK):",
        error.message,
      );
    }
  };

  /**
   * Sign up with email and password
   * Note: User profile is automatically created by Supabase trigger (handle_new_user)
   */
  const signUp = async (email, password, displayName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Register for push notifications after successful signup
      if (data.user) {
        await registerPushNotifications(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { data: null, error };
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { data: null, error };
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    try {
      console.log("[AuthContext] Starting Google OAuth sign in...");

      // Build OAuth options - redirectTo is only needed on web
      const oauthOptions = {
        provider: "google",
      };

      // Only add redirectTo for web (where window.location.origin exists)
      if (
        typeof window !== "undefined" &&
        window.location &&
        window.location.origin
      ) {
        oauthOptions.options = {
          redirectTo: window.location.origin,
        };
        console.log("[AuthContext] Web redirectTo:", window.location.origin);
      } else {
        console.log("[AuthContext] Mobile/Expo - using native OAuth flow");
      }

      const { data, error } = await supabase.auth.signInWithOAuth(oauthOptions);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Google sign in error:", error);
      return { data: null, error };
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      // Remove push token before signing out
      if (user?.id && pushToken) {
        await removePushTokenFromDatabase(user.id, pushToken);
        setPushToken(null);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear guest mode
      await AsyncStorage.removeItem("guest_mode");
      await AsyncStorage.removeItem("guest_name");
      setIsGuest(false);
      setGuestName("");

      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error };
    }
  };

  /**
   * Enable guest mode without creating an account
   */
  const enableGuestMode = async (name) => {
    try {
      await AsyncStorage.setItem("guest_mode", "true");
      await AsyncStorage.setItem("guest_name", name);
      setIsGuest(true);
      setGuestName(name);
      return { error: null };
    } catch (error) {
      console.error("Guest mode error:", error);
      return { error };
    }
  };

  /**
   * Convert guest user to full account
   */
  const convertGuestToAccount = async (email, password, displayName) => {
    try {
      // Sign up new account
      const { data, error } = await signUp(
        email,
        password,
        displayName || guestName,
      );
      if (error) throw error;

      // Clear guest mode
      await AsyncStorage.removeItem("guest_mode");
      await AsyncStorage.removeItem("guest_name");
      setIsGuest(false);
      setGuestName("");

      return { data, error: null };
    } catch (error) {
      console.error("Convert guest error:", error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    isGuest,
    guestName,
    pushToken,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    enableGuestMode,
    convertGuestToAccount,
    registerPushNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
