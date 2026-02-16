import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput, Button, Text, Surface, useTheme } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import ScreenContainer from "../components/ScreenContainer";

/**
 * Authentication screen with sign in, sign up, and guest mode
 */
export default function AuthScreen() {
  const theme = useTheme();
  const { signIn, signInWithGoogle, signUp, enableGuestMode } = useAuth();

  const [mode, setMode] = useState("signin"); // 'signin', 'signup', 'guest'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password || !displayName) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await signUp(email, password, displayName);

    if (error) {
      setError(error.message);
    } else {
      setError("");
      setMode("signin");
    }

    setLoading(false);
  };

  const handleGuestMode = async () => {
    if (!guestName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await enableGuestMode(guestName);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message || "Failed to sign in with Google");
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContainer maxWidth={500}>
          <View style={styles.header}>
            <Text
              variant="displayMedium"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Popdarts
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Score. Play. Compete.
            </Text>
          </View>

          <Surface style={styles.card} elevation={2}>
            {mode === "signin" && (
              <>
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  Sign In
                </Text>

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  mode="outlined"
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                  mode="outlined"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  mode="contained"
                  onPress={handleSignIn}
                  loading={loading}
                  style={styles.button}
                >
                  Sign In
                </Button>

                <Text style={styles.divider}>or</Text>

                <Button
                  mode="outlined"
                  onPress={handleGoogleSignIn}
                  loading={loading}
                  style={styles.googleButton}
                >
                  Sign In with Google
                </Button>

                <Button
                  mode="text"
                  onPress={() => {
                    setMode("signup");
                    setError("");
                  }}
                  style={styles.linkButton}
                >
                  Don't have an account? Sign Up
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => {
                    setMode("guest");
                    setError("");
                  }}
                  style={styles.guestButton}
                >
                  Continue as Guest
                </Button>
              </>
            )}

            {mode === "signup" && (
              <>
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  Create Account
                </Text>

                <TextInput
                  label="Display Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.input}
                  mode="outlined"
                />

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  mode="outlined"
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                  mode="outlined"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  mode="contained"
                  onPress={handleSignUp}
                  loading={loading}
                  style={styles.button}
                >
                  Sign Up
                </Button>

                <Text style={styles.divider}>or</Text>

                <Button
                  mode="outlined"
                  onPress={handleGoogleSignIn}
                  loading={loading}
                  style={styles.googleButton}
                >
                  Sign Up with Google
                </Button>

                <Button
                  mode="text"
                  onPress={() => {
                    setMode("signin");
                    setError("");
                  }}
                  style={styles.linkButton}
                >
                  Already have an account? Sign In
                </Button>
              </>
            )}

            {mode === "guest" && (
              <>
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  Guest Mode
                </Text>

                <Text variant="bodyMedium" style={styles.guestInfo}>
                  Try Popdarts without an account. Your matches will be saved
                  locally.
                </Text>

                <TextInput
                  label="Your Name"
                  value={guestName}
                  onChangeText={setGuestName}
                  style={styles.input}
                  mode="outlined"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  mode="contained"
                  onPress={handleGuestMode}
                  loading={loading}
                  style={styles.button}
                >
                  Start Playing
                </Button>

                <Button
                  mode="text"
                  onPress={() => {
                    setMode("signin");
                    setError("");
                  }}
                  style={styles.linkButton}
                >
                  Back to Sign In
                </Button>
              </>
            )}
          </Surface>
        </ScreenContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
  },
  card: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  cardTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  googleButton: {
    marginTop: 4,
    marginBottom: 16,
  },
  divider: {
    textAlign: "center",
    marginVertical: 12,
    color: "#999",
    fontSize: 12,
  },
  linkButton: {
    marginTop: 4,
  },
  guestButton: {
    marginTop: 16,
  },
  guestInfo: {
    marginBottom: 16,
    color: "#666",
    textAlign: "center",
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
});
