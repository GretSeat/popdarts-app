/**
 * Expo app configuration with push notifications support
 * This file extends app.json with additional push notification settings
 */

export default {
  expo: {
    platforms: ["ios", "android", "web"],
    name: "popdarts-app",
    slug: "popdarts",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gretseatdev.popdarts",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      // Push notification configuration for iOS
      usesAppleSignIn: false,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.gretseatdev.popdarts",
      // Push notification configuration for Android
      useNextNotificationsApi: true,
      // Firebase configuration file (optional - add when you have it)
      // googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "42236b3a-53aa-4c32-8015-ad365f090425",
      },
    },
    owner: "gretseatdev",
    // Notification configuration (uses default icon for now)
    notification: {
      icon: "./assets/icon.png", // Using existing app icon
      color: "#2196F3",
      iosDisplayInForeground: true,
      androidMode: "default",
      androidCollapsedTitle: "Popdarts",
    },
    // Plugins for push notifications
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png", // Using existing app icon
          color: "#2196F3",
          // sounds: ["./assets/notification.wav"], // Optional custom sound
          mode: "production",
        },
      ],
    ],
  },
};
