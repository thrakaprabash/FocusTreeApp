/**
 * Sound utility for the Focus Tree app.
 * Wraps expo-av with a clean play/stop API and graceful fallback.
 */
import { Audio } from "expo-av";

let _alarmSound = null;

/** Call once at app startup (or lazily on first use). */
export const initAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS:    true,   // play even when iOS silent switch is on
      staysActiveInBackground: false,
      shouldDuckAndroid:       false,
      allowsRecordingIOS:      false,
    });
  } catch (e) {
    console.warn("[sound] initAudio failed:", e?.message);
  }
};

/** Play the timer-done alarm. Stops any currently-playing instance first. */
export const playAlarmSound = async () => {
  await stopAlarmSound();   // clean up old instance

  try {
    const { sound } = await Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../assets/alarm.mp3"),
      { shouldPlay: true, isLooping: false, volume: 1.0 }
    );
    _alarmSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        _alarmSound = null;
      }
    });
  } catch (e) {
    console.warn("[sound] playAlarmSound failed:", e?.message);
    _alarmSound = null;
  }
};

/** Stop and unload the alarm if it's playing. */
export const stopAlarmSound = async () => {
  if (!_alarmSound) return;
  try {
    await _alarmSound.stopAsync();
    await _alarmSound.unloadAsync();
  } catch (_) {}
  _alarmSound = null;
};
