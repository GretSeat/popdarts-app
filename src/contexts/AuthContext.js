import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  useEffect(() => {
    console.log("[AuthContext] Initializing...");

    // Check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log(
          "[AuthContext] Session loaded:",
          session ? "authenticated" : "no session",
        );
        setSession(session);
        setUser(session?.user ?? null);
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[AuthContext] Auth state changed:", _event);
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign up with email and password
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

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          email: email,
          display_name: displayName,
        });

        if (profileError) throw profileError;
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
   * Sign out current user
   */
  const signOut = async () => {
    try {
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
    signUp,
    signIn,
    signOut,
    enableGuestMode,
    convertGuestToAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
