import { useEffect, useRef, useState } from "react";

export const useTaskTimer = ({ onFinish } = {}) => {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const onFinishRef = useRef(onFinish);

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
    if (remainingSeconds !== 0 || !activeTaskId) {
      return;
    }
    const finishedId = activeTaskId;
    setActiveTaskId(null);
    setIsRunning(false);
    if (onFinishRef.current) {
      onFinishRef.current(finishedId);
    }
  }, [remainingSeconds, activeTaskId]);

  const startTimer = (task) => {
    const minutes = Number(task.timerMinutes || 0);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }
    setActiveTaskId(task.id);
    setRemainingSeconds(Math.floor(minutes * 60));
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    if (remainingSeconds > 0) {
      setIsRunning(true);
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(0);
    setActiveTaskId(null);
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
