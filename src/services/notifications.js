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
      // HIGH importance = heads-up banner + system notification sound + vibration
      // Using "default" so the phone's ringer mode is respected:
      //   - Normal mode  → plays the phone's notification ringtone
      //   - Vibrate mode → vibrates only (no sound)
      //   - Silent mode  → completely silent
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
        sound:            "alarm.mp3",  // timer is intentional alarm, always plays
        enableVibrate:    true,
        showBadge:        false
      });
    }
  } catch (e) {
    console.warn("[notifications] setup skipped:", e?.message);
  }
};

// ─── Internal helper ──────────────────────────────────────────────────────────
const scheduleAt = async ({ title, body, date, channelId = "task-reminders", data = {} }) => {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound:    "default",  // respects phone ringer/vibrate/silent mode
        priority: "high",
        data: { channelId, ...data },
        ...(Platform.OS === "android" ? { channelId } : {})
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date
      }
    });
  } catch (e) {
    console.warn("[notifications] schedule skipped:", e?.message);
    return null;
  }
};

// ─── Task notifications ───────────────────────────────────────────────────────
export const scheduleTaskNotifications = async (task) => {
  const reminders = task.reminders;
  if (!Array.isArray(reminders) || reminders.length === 0) return [];

  try {
    const now = Date.now();
    const ids = [];

    for (const reminderISO of reminders) {
      const reminderDate = new Date(reminderISO);
      if (isNaN(reminderDate.getTime())) continue;
      if (reminderDate.getTime() <= now) continue;

      const id = await scheduleAt({
        title: "⏰ Task Reminder",
        body:  `"${task.title}"`,
        date:  reminderDate
      });
      if (id) ids.push(id);
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
