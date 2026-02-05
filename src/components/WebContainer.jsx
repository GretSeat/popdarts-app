import React from "react";
import { View, StyleSheet, Platform } from "react-native";

/**
 * Web Container Component
 * Provides web-specific layout wrapper
 * On mobile devices, renders children normally without modifications
 */
export default function WebContainer({ children }) {
  if (Platform.OS === "web") {
    return <View style={styles.webWrapper}>{children}</View>;
  }

  return children;
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
