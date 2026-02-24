import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";

/**
 * Configure how notifications are handled when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification categories for filtering and user preferences
 */
export const NotificationCategories = {
  STORE_UPDATE: "store_update",
  FLASH_SALE: "flash_sale",
  LEAGUE_NEARBY: "league_nearby",
  TOURNAMENT_TURN: "tournament_turn",
  MATCH_REMINDER: "match_reminder",
  CLUB_ANNOUNCEMENT: "club_announcement",
};

/**
 * Register device for push notifications and get Expo Push Token
 * @returns {Promise<string|null>} Expo push token or null if registration fails
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn("No EAS project ID found. Push notifications may not work.");
    }

    token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    console.log("Push token obtained:", token.data);

    // Configure Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2196F3",
      });

      // Create category-specific channels
      await Notifications.setNotificationChannelAsync("store", {
        name: "Store Updates",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4CAF50",
      });

      await Notifications.setNotificationChannelAsync("tournament", {
        name: "Tournament Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: "#FF9800",
      });

      await Notifications.setNotificationChannelAsync("league", {
        name: "League Updates",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2196F3",
      });
    }

    return token.data;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Save push token to Supabase for the current user
 * @param {string} userId - User ID from Supabase auth
 * @param {string} pushToken - Expo push token
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<boolean>} Success status
 */
export async function savePushTokenToDatabase(
  userId,
  pushToken,
  preferences = {},
) {
  try {
    const defaultPreferences = {
      pushNotificationsEnabled: false, // Master toggle - off by default
      storeUpdates: false,
      flashSales: false,
      leaguesNearby: false,
      tournamentTurns: false,
      matchReminders: false,
      clubAnnouncements: false,
      ...preferences,
    };

    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        push_token: pushToken,
        platform: Platform.OS,
        device_name: Device.deviceName || "Unknown Device",
        preferences: defaultPreferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,push_token",
      },
    );

    if (error) {
      console.error("Error saving push token to database:", error);
      return false;
    }

    console.log("Push token saved to database successfully");
    return true;
  } catch (error) {
    console.error("Error in savePushTokenToDatabase:", error);
    return false;
  }
}

/**
 * Remove push token from database (on logout or token invalidation)
 * @param {string} userId - User ID from Supabase auth
 * @param {string} pushToken - Expo push token to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removePushTokenFromDatabase(userId, pushToken) {
  try {
    const { error } = await supabase
      .from("push_tokens")
      .delete()
      .match({ user_id: userId, push_token: pushToken });

    if (error) {
      console.error("Error removing push token:", error);
      return false;
    }

    console.log("Push token removed successfully");
    return true;
  } catch (error) {
    console.error("Error in removePushTokenFromDatabase:", error);
    return false;
  }
}

/**
 * Update notification preferences for a user
 * @param {string} userId - User ID from Supabase auth
 * @param {Object} preferences - Updated preferences object
 * @returns {Promise<boolean>} Success status
 */
export async function updateNotificationPreferences(userId, preferences) {
  try {
    const { error } = await supabase
      .from("push_tokens")
      .update({
        preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating notification preferences:", error);
      return false;
    }

    console.log("Notification preferences updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateNotificationPreferences:", error);
    return false;
  }
}

/**
 * Get notification preferences for a user
 * @param {string} userId - User ID from Supabase auth
 * @returns {Promise<Object|null>} Preferences object or null
 */
export async function getNotificationPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from("push_tokens")
      .select("preferences")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching notification preferences:", error);
      return null;
    }

    return data?.preferences || null;
  } catch (error) {
    console.error("Error in getNotificationPreferences:", error);
    return null;
  }
}

/**
 * Schedule a local notification (for testing or immediate feedback)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @param {number} seconds - Delay in seconds (default: immediate)
 * @returns {Promise<string>} Notification ID
 */
export async function scheduleLocalNotification(
  title,
  body,
  data = {},
  seconds = 0,
) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds > 0 ? { seconds } : null,
    });

    return notificationId;
  } catch (error) {
    console.error("Error scheduling local notification:", error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - ID of notification to cancel
 */
export async function cancelScheduledNotification(notificationId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling all notifications:", error);
  }
}

/**
 * Enable or disable push notifications globally
 * When enabling, will first request permissions from the user
 * @param {string} userId - User ID from Supabase auth
 * @param {boolean} enabled - Whether to enable (true) or disable (false) push notifications
 * @returns {Promise<Object>} { success: boolean, message: string, permissionStatus?: string }
 */
export async function setPushNotificationsEnabled(userId, enabled) {
  try {
    if (enabled && !Device.isDevice) {
      return {
        success: false,
        message: "Push notifications are only available on physical devices",
      };
    }

    if (enabled) {
      // Request permissions when enabling
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return {
          success: false,
          message: "Push notification permissions were denied",
          permissionStatus: finalStatus,
        };
      }

      // If permissions granted, update database
      const { error } = await supabase
        .from("push_tokens")
        .update({
          preferences: {
            pushNotificationsEnabled: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error enabling push notifications:", error);
        return {
          success: false,
          message: "Failed to enable push notifications",
        };
      }

      console.log("Push notifications enabled successfully");
      return {
        success: true,
        message: "Push notifications enabled",
        permissionStatus: "granted",
      };
    } else {
      // Disable push notifications
      const { error } = await supabase
        .from("push_tokens")
        .update({
          preferences: {
            pushNotificationsEnabled: false,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error disabling push notifications:", error);
        return {
          success: false,
          message: "Failed to disable push notifications",
        };
      }

      console.log("Push notifications disabled successfully");
      return {
        success: true,
        message: "Push notifications disabled",
      };
    }
  } catch (error) {
    console.error("Error in setPushNotificationsEnabled:", error);
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Add notification listeners for receiving and responding to notifications
 * @param {Function} handleNotification - Handler for received notifications
 * @param {Function} handleNotificationResponse - Handler for notification taps
 * @returns {Object} Object containing subscription cleanup functions
 */
export function addNotificationListeners(
  handleNotification,
  handleNotificationResponse,
) {
  const notificationListener =
    Notifications.addNotificationReceivedListener(handleNotification);
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

  return {
    remove: () => {
      notificationListener.remove();
      responseListener.remove();
    },
  };
}

/**
 * Get badge count
 * @returns {Promise<number>} Current badge count
 */
export async function getBadgeCount() {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error("Error getting badge count:", error);
    return 0;
  }
}

/**
 * Set badge count
 * @param {number} count - Badge count to set
 */
export async function setBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error("Error setting badge count:", error);
  }
}

/**
 * Clear badge count
 */
export async function clearBadgeCount() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error("Error clearing badge count:", error);
  }
}
