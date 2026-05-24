import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ─── Notification handler ─────────────────────────────────────────────────────
// shouldPlaySound: true → system plays the notification sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true
  })
});

// ─── Configure (request permissions + Android channel) ────────────────────────
export const configureNotifications = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (!granted) {
        console.warn("[notifications] permission denied by user");
        return;
      }
    }

    if (Platform.OS === "android") {
      // HIGH importance = heads-up banner + sound + vibration
      await Notifications.setNotificationChannelAsync("task-reminders", {
        name:              "Task Reminders",
        importance:        Notifications.AndroidImportance.HIGH,
        vibrationPattern:  [0, 250, 150, 250],
        lightColor:        "#4ade80",
        sound:             "default",
        enableVibrate:     true,
        showBadge:         true
      });

      // Separate channel for timer completion (alarm-like)
      await Notifications.setNotificationChannelAsync("timer-done", {
        name:             "Timer Complete",
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor:       "#4ade80",
        sound:            "default",
        enableVibrate:    true,
        showBadge:        false
      });
    }
  } catch (e) {
    console.warn("[notifications] setup skipped:", e?.message);
  }
};

// ─── Internal helper ──────────────────────────────────────────────────────────
const scheduleAt = async ({ title, body, date, channelId = "task-reminders" }) => {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound:     "default",   // plays default system notification sound
        priority:  "high",
        ...(Platform.OS === "android" ? { channelId } : {})
      },
      trigger: date
    });
  } catch (e) {
    console.warn("[notifications] schedule skipped:", e?.message);
    return null;
  }
};

// ─── Task notifications ───────────────────────────────────────────────────────
export const scheduleTaskNotifications = async (task) => {
  if (!task.dueAt) return [];

  try {
    const dueDate = new Date(task.dueAt);
    if (Number.isNaN(dueDate.getTime())) return [];

    const ids = [];
    const now     = Date.now();
    const dueTime = dueDate.getTime();
    const earlyTime = dueTime - 60 * 60 * 1000; // 1 hour before

    if (earlyTime > now) {
      const earlyId = await scheduleAt({
        title: "⏰ Task due in 1 hour",
        body:  `"${task.title}" is due soon`,
        date:  new Date(earlyTime)
      });
      if (earlyId) ids.push(earlyId);
    }

    if (dueTime > now) {
      const dueId = await scheduleAt({
        title: "🔔 Task due now",
        body:  `"${task.title}" deadline has arrived`,
        date:  dueDate
      });
      if (dueId) ids.push(dueId);
    }

    return ids;
  } catch (e) {
    console.warn("[notifications] scheduleTaskNotifications skipped:", e?.message);
    return [];
  }
};

// ─── Cancel task notifications ────────────────────────────────────────────────
export const cancelTaskNotifications = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  try {
    await Promise.all(
      ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
    );
  } catch (e) {
    console.warn("[notifications] cancelTaskNotifications skipped:", e?.message);
  }
};

// ─── Immediate "timer done" notification (fires instantly) ────────────────────
// Used as a fallback when the app is in foreground (sound handled by expo-av).
// When the app is in background, this fires as a real push banner with sound.
export const fireTimerDoneNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌳 Timer Complete!",
        body:  "Your focus session is done. Great work!",
        sound: "default",
        priority: "max",
        ...(Platform.OS === "android" ? { channelId: "timer-done" } : {})
      },
      trigger: null  // fires immediately
    });
  } catch (e) {
    console.warn("[notifications] fireTimerDoneNotification skipped:", e?.message);
  }
};
