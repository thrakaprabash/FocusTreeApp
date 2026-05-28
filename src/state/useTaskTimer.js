import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { scheduleTimerDoneNotification, cancelTimerNotification } from "../services/notifications";

export const useTaskTimer = ({ onFinish } = {}) => {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const onFinishRef = useRef(onFinish);

  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef(null);
  const notificationIdRef = useRef(null);

  const scheduleBg = async (secs, title) => {
    if (notificationIdRef.current) {
      await cancelTimerNotification(notificationIdRef.current);
    }
    const finishDate = new Date(Date.now() + secs * 1000);
    notificationIdRef.current = await scheduleTimerDoneNotification(finishDate, "⏰ Task Timer Complete!", `"${title}" has finished.`);
  };

  const cancelBg = async () => {
    if (notificationIdRef.current) {
      await cancelTimerNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  };

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((value) => {
        if (value <= 1) {
          clearInterval(interval);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        if (backgroundTime.current && isRunning) {
          const elapsed = Math.floor((Date.now() - backgroundTime.current) / 1000);
          if (elapsed > 0) {
            setRemainingSeconds((prev) => Math.max(0, prev - elapsed));
          }
        }
      } else if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (isRunning) {
          backgroundTime.current = Date.now();
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isRunning]);

  useEffect(() => {
    if (remainingSeconds !== 0 || !activeTaskId) {
      return;
    }
    const finishedId = activeTaskId;
    setActiveTaskId(null);
    setIsRunning(false);
    cancelBg();
    if (onFinishRef.current) {
      onFinishRef.current(finishedId);
    }
  }, [remainingSeconds, activeTaskId]);

  const startTimer = (task) => {
    const minutes = Number(task.timerMinutes || 0);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }
    const secs = Math.floor(minutes * 60);
    setActiveTaskId(task.id);
    setRemainingSeconds(secs);
    setIsRunning(true);
    scheduleBg(secs, task.title);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    cancelBg();
  };

  const resumeTimer = () => {
    if (remainingSeconds > 0) {
      setIsRunning(true);
      // Wait, we need the task title. If we don't have it here, we just use a generic title
      scheduleBg(remainingSeconds, "Task");
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(0);
    setActiveTaskId(null);
    cancelBg();
  };

  return {
    activeTaskId,
    remainingSeconds,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer
  };
};
