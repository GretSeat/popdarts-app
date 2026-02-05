import React from "react";
import { View, StyleSheet, Platform, ScrollView } from "react-native";

/**
 * Screen Container Component
 * Wraps screen content with proper web margins and max-width
 * On mobile, renders normally without constraints
 */
export default function ScreenContainer({
  children,
  style,
  scrollable = false,
}) {
  const content = (
    <View
      style={[
        styles.container,
        Platform.OS === "web" && styles.webContainer,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (scrollable && Platform.OS === "web") {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    maxWidth: 1200, // Max content width for web
    width: "100%",
    marginHorizontal: "auto",
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
