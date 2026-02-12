/**
 * Quick Reference: Sending Push Notifications
 *
 * This file contains example code for sending push notifications
 * from a backend service or admin panel.
 */

// ============================================
// OPTION 1: Using Expo Push Notification API
// ============================================

const { Expo } = require("expo-server-sdk");
const { createClient } = require("@supabase/supabase-js");

const expo = new Expo();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

/**
 * Send flash sale notification to all opted-in users
 */
async function sendFlashSaleNotification(saleDetails) {
  try {
    // Get all users with flash sale notifications enabled
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("push_token, user_id, preferences")
      .eq("preferences->>flashSales", true)
      .gte(
        "last_used_at",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (error) throw error;

    // Filter valid Expo push tokens
    const validTokens = tokens.filter((t) =>
      Expo.isExpoPushToken(t.push_token),
    );

    // Create notification messages
    const messages = validTokens.map(({ push_token, user_id }) => ({
      to: push_token,
      sound: "default",
      title: "🔥 Flash Sale Alert!",
      body: `${saleDetails.discount}% off ${saleDetails.items} - Limited time!`,
      data: {
        type: "flash_sale",
        saleId: saleDetails.id,
        discount: saleDetails.discount,
        screen: "Store",
      },
      priority: "high",
      channelId: "store", // Android channel
    }));

    // Send in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending notification chunk:", error);
      }
    }

    // Log to database
    await logNotifications(tokens, "flash_sale", tickets);

    console.log(`Sent ${tickets.length} flash sale notifications`);
    return { success: true, sent: tickets.length };
  } catch (error) {
    console.error("Error in sendFlashSaleNotification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send tournament turn notification to specific user
 */
async function sendTournamentTurnNotification(userId, tournamentDetails) {
  try {
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("push_token, preferences")
      .eq("user_id", userId)
      .eq("preferences->>tournamentTurns", true);

    if (!tokens || tokens.length === 0) {
      console.log("No tokens found for user or notifications disabled");
      return { success: false, reason: "no_tokens" };
    }

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.push_token))
      .map(({ push_token }) => ({
        to: push_token,
        sound: "default",
        title: "🎯 Your Turn to Play!",
        body: `${tournamentDetails.name} - Table ${tournamentDetails.table}`,
        data: {
          type: "tournament_turn",
          tournamentId: tournamentDetails.id,
          matchId: tournamentDetails.matchId,
          table: tournamentDetails.table,
          screen: "Matches",
        },
        priority: "high",
        vibrate: [0, 500, 250, 500],
        channelId: "tournament",
      }));

    const tickets = await expo.sendPushNotificationsAsync(messages);

    await logNotifications(
      tokens.map((t) => ({ user_id: userId, push_token: t.push_token })),
      "tournament_turn",
      tickets,
    );

    return { success: true, sent: tickets.length };
  } catch (error) {
    console.error("Error in sendTournamentTurnNotification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send nearby league notification based on user location
 */
async function sendNearbyLeagueNotification(state, leagueDetails) {
  try {
    // Get users in the same state with league notifications enabled
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("state", state);

    if (!users || users.length === 0) return;

    const userIds = users.map((u) => u.id);
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("push_token, user_id, preferences")
      .in("user_id", userIds)
      .eq("preferences->>leaguesNearby", true);

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.push_token))
      .map(({ push_token }) => ({
        to: push_token,
        sound: "default",
        title: "📍 New League in Your Area!",
        body: `${leagueDetails.name} starts ${leagueDetails.startDate} in ${leagueDetails.city}`,
        data: {
          type: "league_nearby",
          leagueId: leagueDetails.id,
          state: state,
          city: leagueDetails.city,
          screen: "Local",
        },
        channelId: "league",
      }));

    const chunks = expo.chunkPushNotifications(messages);
    let totalSent = 0;

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      totalSent += tickets.length;
    }

    console.log(`Sent ${totalSent} nearby league notifications to ${state}`);
    return { success: true, sent: totalSent };
  } catch (error) {
    console.error("Error in sendNearbyLeagueNotification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send match reminder notification
 */
async function sendMatchReminder(userId, matchDetails, minutesBefore = 30) {
  try {
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("push_token")
      .eq("user_id", userId)
      .eq("preferences->>matchReminders", true);

    if (!tokens || tokens.length === 0) return;

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.push_token))
      .map(({ push_token }) => ({
        to: push_token,
        sound: "default",
        title: "⏰ Match Starting Soon",
        body: `Your match vs ${matchDetails.opponent} starts in ${minutesBefore} minutes`,
        data: {
          type: "match_reminder",
          matchId: matchDetails.id,
          opponent: matchDetails.opponent,
          time: matchDetails.time,
          screen: "Matches",
        },
      }));

    await expo.sendPushNotificationsAsync(messages);
    return { success: true };
  } catch (error) {
    console.error("Error in sendMatchReminder:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send club announcement to all members
 */
async function sendClubAnnouncement(clubId, announcement) {
  try {
    // Get all club members
    const { data: members } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", clubId);

    if (!members || members.length === 0) return;

    const userIds = members.map((m) => m.user_id);
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("push_token, user_id")
      .in("user_id", userIds)
      .eq("preferences->>clubAnnouncements", true);

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.push_token))
      .map(({ push_token }) => ({
        to: push_token,
        sound: "default",
        title: `📢 ${announcement.clubName}`,
        body: announcement.message,
        data: {
          type: "club_announcement",
          clubId: clubId,
          announcementId: announcement.id,
          screen: "Local",
        },
      }));

    const chunks = expo.chunkPushNotifications(messages);
    let totalSent = 0;

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      totalSent += tickets.length;
    }

    return { success: true, sent: totalSent };
  } catch (error) {
    console.error("Error in sendClubAnnouncement:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Log notifications to database
 */
async function logNotifications(tokens, type, tickets) {
  try {
    const logs = tokens.map((token, index) => ({
      user_id: token.user_id,
      push_token: token.push_token,
      notification_type: type,
      status: tickets[index]?.status === "ok" ? "sent" : "failed",
      error_message: tickets[index]?.message || null,
    }));

    await supabase.from("notification_logs").insert(logs);
  } catch (error) {
    console.error("Error logging notifications:", error);
  }
}

// ============================================
// OPTION 2: Using Supabase Edge Function
// ============================================

// Create this as a Supabase Edge Function (Deno)
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId, type, title, body, data } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get user tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('push_token')
    .eq('user_id', userId)
    .eq(`preferences->>${ type}`, true)

  // Send via Expo
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      tokens.map(t => ({
        to: t.push_token,
        title,
        body,
        data
      }))
    )
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
*/

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Flash Sale
/*
await sendFlashSaleNotification({
  id: 'sale_123',
  discount: 50,
  items: 'All Dart Colors',
  duration: '2 hours'
});
*/

// Example 2: Tournament Turn
/*
await sendTournamentTurnNotification('user-id-here', {
  id: 'tournament_456',
  name: 'Friday Night Doubles',
  matchId: 'match_789',
  table: 3
});
*/

// Example 3: Nearby League
/*
await sendNearbyLeagueNotification('California', {
  id: 'league_101',
  name: 'Summer League 2026',
  city: 'San Francisco',
  startDate: 'June 1st'
});
*/

// Example 4: Scheduled Match Reminder (use cron job)
/*
// Check for matches starting in 30 minutes
const upcomingMatches = await getUpcomingMatches(30);
for (const match of upcomingMatches) {
  await sendMatchReminder(match.userId, match, 30);
}
*/

// Example 5: Club Announcement
/*
await sendClubAnnouncement('club_xyz', {
  id: 'announcement_1',
  clubName: 'Downtown Darts Club',
  message: 'Weekly tournament tomorrow at 7 PM!'
});
*/

module.exports = {
  sendFlashSaleNotification,
  sendTournamentTurnNotification,
  sendNearbyLeagueNotification,
  sendMatchReminder,
  sendClubAnnouncement,
};
