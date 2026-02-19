# Push Notifications Setup Guide - Popdarts App

## Overview

This guide explains the push notification system implemented for the Popdarts app. The system uses Expo's push notification service to send notifications for store updates, flash sales, nearby leagues, tournament turns, match reminders, and club announcements.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Database Schema](#database-schema)
5. [Testing](#testing)
6. [Sending Notifications](#sending-notifications)
7. [Troubleshooting](#troubleshooting)

---

## Features

### Notification Types

The app supports six types of push notifications:

1. **Store Updates** - New items and restocks in the store
2. **Flash Sales** - Limited time discounts and offers
3. **Leagues Nearby** - New leagues starting in the user's state or nearby areas
4. **Tournament Turn** - Alerts when it's the user's turn to play in a tournament
5. **Match Reminders** - Upcoming scheduled matches
6. **Club Announcements** - Updates from clubs the user is a member of

### User Control

- Users can enable/disable each notification type individually
- Preferences are stored per device in the database
- Settings accessible via Profile > Settings tab
- Real-time preference updates

---

## Architecture

### File Structure

```
src/
├── services/
│   └── pushNotificationService.js    # Core notification logic
├── contexts/
│   └── AuthContext.js                # Handles token registration on auth
├── screens/
│   └── ProfileScreen.js              # Notification preferences UI
└── App.js                            # Global notification listeners
```

### Data Flow

1. **Registration**: When user signs up/in → Register device for push notifications → Get Expo push token → Save to Supabase
2. **Preferences**: User changes settings → Update in Supabase with user preferences
3. **Sending**: Backend/Admin → Query Supabase for user tokens → Filter by preferences → Send via Expo Push API
4. **Receiving**: Expo delivers notification → App handles foreground/background behavior → User taps → Navigate to relevant screen

---

## Setup Instructions

### 1. Install Dependencies

Already completed via npm:

```bash
npm install expo-notifications expo-device expo-constants
```

### 2. Configure EAS (Expo Application Services)

You need to set up EAS for push notifications to work:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure the project
eas build:configure
```

Update `app.json` or `app.config.js` with:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json" // For FCM
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.popdarts"
    }
  }
}
```

### 3. Set up Supabase Database

Run the SQL schema file to create necessary tables:

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste contents of: supabase-push-notifications-schema.sql
```

This creates:

- `push_tokens` table - Stores device tokens and preferences
- `notification_logs` table - Tracks sent notifications
- Helper functions for sending notifications
- Row Level Security (RLS) policies

### 4. Android Configuration (FCM)

For Android, you need Firebase Cloud Messaging:

1. Create a Firebase project at https://console.firebase.google.com
2. Add your Android app
3. Download `google-services.json`
4. Place it in your project root
5. Add to `.gitignore`:

```
google-services.json
```

### 5. iOS Configuration (APNs)

For iOS, you need Apple Push Notification service credentials:

1. Go to Apple Developer Portal
2. Create an APN Key
3. Upload to Expo via:

```bash
eas credentials
```

---

## Database Schema

### push_tokens Table

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  push_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  preferences JSONB DEFAULT {...},
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, push_token)
);
```

### Preferences Structure

```json
{
  "storeUpdates": true,
  "flashSales": true,
  "leaguesNearby": true,
  "tournamentTurns": true,
  "matchReminders": true,
  "clubAnnouncements": true
}
```

---

## Testing

### Test on Physical Device

Push notifications **only work on physical devices**, not simulators/emulators.

### 1. Test Local Notification (No Backend Needed)

Use the test function in `pushNotificationService.js`:

```javascript
import { scheduleLocalNotification } from "./src/services/pushNotificationService";

// Test immediately
await scheduleLocalNotification(
  "Test Notification",
  "This is a test notification!",
  { type: "test" },
  0, // Immediate
);

// Test delayed (5 seconds)
await scheduleLocalNotification(
  "Delayed Test",
  "This notification was scheduled 5 seconds ago",
  { type: "test" },
  5,
);
```

### 2. Test Push Notification via Expo

Get your device token from the logs when app starts, then use Expo's push notification tool:

```bash
# Send a test notification
curl -H "Content-Type: application/json" \
     -X POST "https://exp.host/--/api/v2/push/send" \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
       "title": "Test from Expo",
       "body": "This is a test notification",
       "data": { "type": "test" }
     }'
```

Or use the web tool: https://expo.dev/notifications

### 3. Verify Database

Check tokens are being saved:

```sql
SELECT * FROM push_tokens WHERE user_id = 'YOUR_USER_ID';
```

---

## Sending Notifications

### Option 1: Using Supabase Function (Basic)

The database includes a `send_push_notification` function:

```sql
SELECT send_push_notification(
  'user-id-here',
  'flash_sale',
  '🔥 Flash Sale!',
  '50% off all dart colors for the next 2 hours!',
  '{"saleId": "sale123", "discount": 50}'::jsonb
);
```

### Option 2: Backend Service (Recommended)

Create a backend service (Node.js, Python, etc.) to send notifications:

**Example: Node.js with Expo SDK**

```javascript
const { Expo } = require("expo-server-sdk");
const { createClient } = require("@supabase/supabase-js");

const expo = new Expo();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendFlashSaleNotification() {
  // Get all users with flash sale notifications enabled
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("push_token, preferences")
    .eq("preferences->>flashSales", true);

  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t.push_token))
    .map((t) => ({
      to: t.push_token,
      sound: "default",
      title: "🔥 Flash Sale!",
      body: "50% off all dart colors for 2 hours!",
      data: { type: "flash_sale", saleId: "sale123" },
    }));

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log(receipts);
    } catch (error) {
      console.error(error);
    }
  }
}
```

### Option 3: Scheduled Notifications

For recurring notifications (league reminders, match times), set up a cron job:

```javascript
// Example: Daily league check (run at 9 AM)
async function checkForNewLeagues(userId, userState) {
  const { data: leagues } = await supabase
    .from("leagues")
    .select("*")
    .eq("state", userState)
    .gte("start_date", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  if (leagues && leagues.length > 0) {
    await sendPushNotification(
      userId,
      "league_nearby",
      "New Leagues in Your Area!",
      `${leagues.length} new leagues starting soon in ${userState}`,
      { leagues: leagues.map((l) => l.id) },
    );
  }
}
```

---

## Notification Handling in App

### Foreground Notifications

When app is open, notifications show as alerts:

```javascript
// In App.js
const handleNotification = (notification) => {
  const { title, body } = notification.request.content;
  Alert.alert(title, body);
};
```

### Background/Tapped Notifications

When user taps a notification, navigate to relevant screen:

```javascript
const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;

  switch (data.type) {
    case "tournament_turn":
      navigation.navigate("Matches");
      break;
    case "flash_sale":
    case "store_update":
      navigation.navigate("Store");
      break;
    case "league_nearby":
      navigation.navigate("Local");
      break;
    default:
      navigation.navigate("Home");
  }
};
```

---

## Troubleshooting

### Common Issues

**1. "Push notifications require a physical device"**

- Solution: Test on real Android/iOS device, not simulator

**2. Tokens not being saved to database**

- Check: User is authenticated (not guest)
- Check: RLS policies allow insert
- Check: Supabase connection working
- Look at console logs for errors

**3. Notifications not received**

- Verify token in database is valid
- Check user preferences (notification type enabled?)
- Test with Expo's notification tool first
- Check device notification settings (OS level)
- Ensure app has notification permissions

**4. "No EAS project ID found"**

- Run `eas build:configure`
- Add projectId to app.json/expo.extra.eas.projectId

**5. Android: FCM configuration missing**

- Add google-services.json to project
- Rebuild app after adding

**6. iOS: APNs authentication issues**

- Upload APNs key via `eas credentials`
- Ensure correct bundle identifier

### Debug Mode

Enable debug logs:

```javascript
// In pushNotificationService.js
console.log("[PushNotifications] Token:", token);
console.log("[PushNotifications] Preferences:", preferences);
```

Check Supabase logs:

```sql
SELECT * FROM notification_logs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY sent_at DESC
LIMIT 10;
```

---

## Security Considerations

1. **Never expose service keys** - Use Supabase service role key only in backend
2. **Validate input** - Sanitize notification content to prevent injection
3. **Rate limiting** - Implement limits to prevent notification spam
4. **User privacy** - Respect user preferences and allow opt-out
5. **Token cleanup** - Remove expired tokens (>90 days inactive)

---

## Next Steps

### Future Enhancements

1. **Rich notifications** - Images, buttons, categories
2. **Notification history** - Show past notifications in-app
3. **Quiet hours** - Don't send notifications during specific times
4. **Location-based** - Geofencing for nearby leagues
5. **Analytics** - Track open rates, conversion metrics
6. **A/B testing** - Test notification copy and timing

---

## Resources

- [Expo Push Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)

---

## Support

For issues or questions:

1. Check console logs for errors
2. Test with Expo notification tool
3. Verify database schema is correct
4. Review this documentation
5. Check Expo forums for similar issues

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Fully Implemented
