import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { loadTasks, loadXp, saveTasks, saveXp } from "../services/storage";
import {
  cancelTaskNotifications,
  scheduleTaskNotifications
} from "../services/notifications";
import { getTreeStage, XP_PER_LEVEL, XP_PER_TASK, XP_PENALTY } from "../data/treeStages";

const TasksContext = createContext(null);

const createId = () => {
  const now = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `task_${now}_${random}`;
};

const buildTask = (draft) => ({
  id: createId(),
  title: draft.title,
  notes: draft.notes || "",
  priority: draft.priority || "medium",
  dueAt: draft.dueAt || null,
  isDaily: Boolean(draft.isDaily),
  dailyTime: draft.dailyTime || "",
  timerMinutes: Number.isFinite(draft.timerMinutes) ? draft.timerMinutes : 0,
  xpValue: XP_PER_TASK,
  completedAt: null,
  penalized: false,
  notificationIds: [],
  createdAt: new Date().toISOString()
});

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [xp, setXp] = useState(0);
  const [ready, setReady] = useState(false);

  // Keep a ref so penalty check can read latest tasks without stale closure
  const tasksRef = useRef([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // ── Load from storage ────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [storedTasks, storedXp] = await Promise.all([
        loadTasks(),
        loadXp()
      ]);
      if (!mounted) return;

      const normalizedTasks = (storedTasks || []).map((task) => ({
        ...task,
        xpValue: XP_PER_TASK,
        penalized: task.penalized || false
      }));
      setTasks(normalizedTasks);
      setXp(storedXp);
      setReady(true);
    };

    load();
    return () => { mounted = false; };
  }, []);

  // ── Persist tasks ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    saveTasks(tasks);
  }, [tasks, ready]);

  useEffect(() => {
    if (!ready) return;
    saveXp(xp);
  }, [xp, ready]);

  // ── Overdue penalty: runs on mount (once ready) and every 60 seconds ─────────
  useEffect(() => {
    if (!ready) return;

    const applyOverduePenalties = () => {
      const now = new Date();
      const overdue = tasksRef.current.filter(
        (t) =>
          t.dueAt &&
          !t.isDaily &&
          !t.completedAt &&
          !t.penalized &&
          new Date(t.dueAt) < now
      );

      if (overdue.length === 0) return;

      const xpLost = overdue.length * XP_PENALTY;
      const overdueIds = new Set(overdue.map((t) => t.id));

      setTasks((curr) =>
        curr.map((t) =>
          overdueIds.has(t.id) ? { ...t, penalized: true } : t
        )
      );
      setXp((curr) => Math.max(0, curr - xpLost));

      const taskWord = overdue.length === 1 ? "task" : "tasks";
      const haveWord = overdue.length === 1 ? "has" : "have";
      Alert.alert(
        "⚠️ Deadline Missed",
        `${overdue.length} ${taskWord} ${haveWord} passed their deadline. You lost ${xpLost} XP.`,
        [{ text: "Got it" }]
      );
    };

    applyOverduePenalties();
    const intervalId = setInterval(applyOverduePenalties, 60_000);
    return () => clearInterval(intervalId);
  }, [ready]);

  // ── Task actions ─────────────────────────────────────────────────────────────
  const addTask = async (draft) => {
    const task = buildTask(draft);
    // Never let a notification error block task creation
    try {
      task.notificationIds = await scheduleTaskNotifications(task);
    } catch (e) {
      console.warn("[addTask] notification scheduling failed:", e);
      task.notificationIds = [];
    }
    setTasks((current) => [task, ...current]);
  };

  const completeTask = async (taskId) => {
    const target = tasks.find((item) => item.id === taskId);
    if (!target || target.completedAt) return;

    try {
      await cancelTaskNotifications(target.notificationIds);
    } catch (e) {
      console.warn("[completeTask] notification cancel failed:", e);
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, completedAt: new Date().toISOString() }
          : item
      )
    );
    // Award XP regardless of penalty status (late completion still counts)
    setXp((value) => value + XP_PER_TASK);
  };

  const updateTask = async (taskId, changes) => {
    // Find the current task to cancel its existing notifications
    const existing = tasksRef.current.find((t) => t.id === taskId);

    // Cancel old notifications if due date is being changed
    if (existing && (changes.dueAt !== undefined || changes.isDaily !== undefined)) {
      try {
        await cancelTaskNotifications(existing.notificationIds || []);
      } catch (e) {
        console.warn("[updateTask] cancel old notifications failed:", e);
      }
    }

    // Build the updated task to re-schedule notifications
    const updatedTask = existing ? { ...existing, ...changes } : null;
    let newNotificationIds = existing?.notificationIds || [];

    if (updatedTask && (changes.dueAt !== undefined || changes.isDaily !== undefined)) {
      try {
        newNotificationIds = await scheduleTaskNotifications(updatedTask);
      } catch (e) {
        console.warn("[updateTask] re-schedule notifications failed:", e);
        newNotificationIds = [];
      }
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, ...changes, notificationIds: newNotificationIds }
          : item
      )
    );
  };

  const deleteTask = async (taskId) => {
    const target = tasks.find((item) => item.id === taskId);
    if (target) {
      try {
        await cancelTaskNotifications(target.notificationIds);
      } catch (e) {
        console.warn("[deleteTask] notification cancel failed:", e);
      }
    }
    setTasks((current) => current.filter((item) => item.id !== taskId));
  };

  const clearCompleted = () => {
    setTasks((current) => current.filter((item) => !item.completedAt));
  };

  const resetDailyTasks = () => {
    setTasks((current) =>
      current.map((item) =>
        item.isDaily ? { ...item, completedAt: null } : item
      )
    );
  };

  const resetXp = () => {
    setXp(0);
  };

  const level = useMemo(() => Math.floor(xp / XP_PER_LEVEL), [xp]);
  const treeStage = useMemo(() => getTreeStage(level), [level]);

  const value = {
    tasks,
    xp,
    level,
    treeStage,
    ready,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    clearCompleted,
    resetDailyTasks,
    resetXp
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used inside TasksProvider");
  }
  return context;
};
