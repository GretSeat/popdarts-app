import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Button,
  Switch,
  Card,
  HelperText,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

/**
 * Create Club Screen - Set up a new club page
 * Based on Scoreholio's club creation flow
 */
export default function CreateClubScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Form state
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isListed, setIsListed] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const newErrors = {};

    if (!clubName.trim()) {
      newErrors.clubName = "Club name is required";
    }

    if (!city.trim()) {
      newErrors.city = "City is required";
    }

    if (!state.trim()) {
      newErrors.state = "State is required";
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      newErrors.contactEmail = "Invalid email format";
    }

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.websiteUrl = "Invalid URL format";
    }

    if (facebookUrl && !isValidUrl(facebookUrl)) {
      newErrors.facebookUrl = "Invalid URL format";
    }

    if (instagramUrl && !isValidUrl(instagramUrl)) {
      newErrors.instagramUrl = "Invalid URL format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Email validation helper
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * URL validation helper
   */
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Create club in database
   */
  const handleCreateClub = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Validation Error",
        "Please fix the errors before submitting",
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("clubs")
        .insert([
          {
            name: clubName.trim(),
            description: description.trim() || null,
            address: address.trim() || null,
            city: city.trim(),
            state: state.trim(),
            zip_code: zipCode.trim() || null,
            contact_email: contactEmail.trim() || null,
            contact_phone: contactPhone.trim() || null,
            website_url: websiteUrl.trim() || null,
            facebook_url: facebookUrl.trim() || null,
            instagram_url: instagramUrl.trim() || null,
            is_public: isPublic,
            is_listed: isListed,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      Alert.alert("Success! 🎉", `${clubName} has been created successfully!`, [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to Local screen
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating club:", error);
      Alert.alert(
        "Error",
        "Failed to create club. Please try again.\n\n" + error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Create Club Page 🎯
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Set up your club to connect with local players
          </Text>
        </View>

        {/* General Information */}
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📋 General Information
            </Text>

            <TextInput
              label="Club Name *"
              value={clubName}
              onChangeText={setClubName}
              mode="outlined"
              style={styles.input}
              error={!!errors.clubName}
              theme={{ colors: { background: "#2A2A2A" } }}
            />
            {errors.clubName && (
              <HelperText type="error">{errors.clubName}</HelperText>
            )}

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Tell players about your club, leagues, and events..."
              theme={{ colors: { background: "#2A2A2A" } }}
            />
            <HelperText type="info">
              This will be shown on your club's about page
            </HelperText>
          </Card.Content>
        </Card>

        {/* Location */}
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📍 Location
            </Text>

            <TextInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
              placeholder="123 Main St"
              theme={{ colors: { background: "#2A2A2A" } }}
            />

            <View style={styles.row}>
              <TextInput
                label="City *"
                value={city}
                onChangeText={setCity}
                mode="outlined"
                style={[styles.input, styles.inputHalf]}
                error={!!errors.city}
                theme={{ colors: { background: "#2A2A2A" } }}
              />
              <TextInput
                label="State *"
                value={state}
                onChangeText={setState}
                mode="outlined"
                style={[styles.input, styles.inputHalf]}
                error={!!errors.state}
                placeholder="CA"
                theme={{ colors: { background: "#2A2A2A" } }}
              />
            </View>
            {(errors.city || errors.state) && (
              <HelperText type="error">
                {errors.city || errors.state}
              </HelperText>
            )}

            <TextInput
              label="ZIP Code"
              value={zipCode}
              onChangeText={setZipCode}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="90210"
              theme={{ colors: { background: "#2A2A2A" } }}
            />
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📞 Contact Information
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              This information will be displayed publicly on your club page
            </Text>

            <TextInput
              label="Contact Email"
              value={contactEmail}
              onChangeText={setContactEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.contactEmail}
              theme={{ colors: { background: "#2A2A2A" } }}
            />
            {errors.contactEmail && (
              <HelperText type="error">{errors.contactEmail}</HelperText>
            )}

            <TextInput
              label="Contact Phone"
              value={contactPhone}
              onChangeText={setContactPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="(555) 123-4567"
              theme={{ colors: { background: "#2A2A2A" } }}
            />

            <Divider style={styles.innerDivider} />

            <TextInput
              label="Website URL"
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              placeholder="https://yourclub.com"
              error={!!errors.websiteUrl}
              theme={{ colors: { background: "#2A2A2A" } }}
            />
            {errors.websiteUrl && (
              <HelperText type="error">{errors.websiteUrl}</HelperText>
            )}

            <TextInput
              label="Facebook URL"
              value={facebookUrl}
              onChangeText={setFacebookUrl}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              placeholder="https://facebook.com/yourclub"
              error={!!errors.facebookUrl}
              theme={{ colors: { background: "#2A2A2A" } }}
            />
            {errors.facebookUrl && (
              <HelperText type="error">{errors.facebookUrl}</HelperText>
            )}

            <TextInput
              label="Instagram URL"
              value={instagramUrl}
              onChangeText={setInstagramUrl}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              placeholder="https://instagram.com/yourclub"
              error={!!errors.instagramUrl}
              theme={{ colors: { background: "#2A2A2A" } }}
            />
            {errors.instagramUrl && (
              <HelperText type="error">{errors.instagramUrl}</HelperText>
            )}
          </Card.Content>
        </Card>

        {/* Club Settings */}
        <Card style={styles.section} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ⚙️ Club Settings
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={styles.settingLabel}>
                  List in "Find a Club"
                </Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Allow other players to discover your club
                </Text>
              </View>
              <Switch
                value={isListed}
                onValueChange={setIsListed}
                color="#2196F3"
              />
            </View>

            <Divider style={styles.innerDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyLarge" style={styles.settingLabel}>
                  Public Club
                </Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Anyone can view your club page and events
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                color="#2196F3"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleCreateClub}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
          >
            {loading ? "Creating Club..." : "Create Club"}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#CCCCCC",
  },
  section: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: "#2A2A2A",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    color: "#999",
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#2A2A2A",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  innerDivider: {
    marginVertical: 16,
    backgroundColor: "#333",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: "#FFFFFF",
    marginBottom: 4,
  },
  settingDescription: {
    color: "#999",
  },
  submitContainer: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: "#2196F3",
    marginBottom: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    borderColor: "#666",
  },
  spacer: {
    height: 40,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
