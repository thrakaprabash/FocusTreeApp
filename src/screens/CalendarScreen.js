import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from "../state/TasksContext";
import { useTaskTimer } from "../state/useTaskTimer";
import TaskItem from "../components/TaskItem";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, delta) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const daysInMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const getDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildMonthCells = (monthDate) => {
  const firstDay = startOfMonth(monthDate);
  const startWeekday = firstDay.getDay();
  const totalDays = daysInMonth(monthDate);
  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ key: `empty-start-${i}`, date: null });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      key: `day-${day}`,
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${cells.length}`, date: null });
  }
  return cells;
};

/**
 * Resolve which calendar date a task belongs to:
 *  - If it has a dueAt → use that date
 *  - Otherwise → use createdAt (the day the task was added)
 *  - Daily tasks are handled separately and shown only on today
 */
const getTaskDateKey = (task) => {
  if (task.dueAt) {
    const d = new Date(task.dueAt);
    if (!Number.isNaN(d.getTime())) return getDateKey(d);
  }
  if (task.createdAt) {
    const d = new Date(task.createdAt);
    if (!Number.isNaN(d.getTime())) return getDateKey(d);
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { tasks, completeTask, deleteTask } = useTasks();
  const today = startOfDay(new Date());
  const todayKey = getDateKey(today);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);

  const timer = useTaskTimer({
    onFinish: () => Alert.alert("Timer finished", "Task timer is complete.")
  });

  // Build a map: dateKey → task count (for calendar dots)
  // Includes: due-date tasks, created-date tasks (non-daily), daily tasks on today
  const taskCountByDay = useMemo(() => {
    const map = new Map();

    tasks.forEach((task) => {
      if (task.isDaily) {
        // Daily tasks contribute a dot only on today
        map.set(todayKey, (map.get(todayKey) || 0) + 1);
        return;
      }
      const key = getTaskDateKey(task);
      if (key) {
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [tasks, todayKey]);

  // Compute which tasks belong to the selected date
  const tasksForDay = useMemo(() => {
    const selectedKey = getDateKey(selectedDate);
    const isToday = selectedKey === todayKey;
    const result = [];

    tasks.forEach((task) => {
      if (task.isDaily) {
        // Daily tasks only show when the selected day is today
        if (isToday) result.push(task);
        return;
      }
      const key = getTaskDateKey(task);
      if (key === selectedKey) result.push(task);
    });

    // Sort: incomplete first, then by due date
    result.sort((a, b) => {
      if (Boolean(a.completedAt) !== Boolean(b.completedAt)) {
        return a.completedAt ? 1 : -1;
      }
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt) - new Date(b.dueAt);
      }
      return 0;
    });

    return result;
  }, [tasks, selectedDate, todayKey]);

  const calendarCells = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);

  const monthLabel = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const selectedLabel = selectedDate.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  const isSelectedToday = isSameDay(selectedDate, today);

  const goToMonth = (delta) => {
    const next = addMonths(currentMonth, delta);
    setCurrentMonth(next);
    // Keep selected date if it's in the new month, else move to 1st
    if (
      selectedDate.getMonth() !== next.getMonth() ||
      selectedDate.getFullYear() !== next.getFullYear()
    ) {
      setSelectedDate(startOfMonth(next));
    }
  };

  const completedCount = tasksForDay.filter((t) => t.completedAt).length;
  const pendingCount = tasksForDay.length - completedCount;

  // ── Calendar header (rendered as FlatList's ListHeaderComponent) ────────────
  const header = (
    <View style={styles.headerWrapper}>
      {/* Page title */}
      <Text style={styles.pageTitle}>Calendar</Text>

      {/* Calendar card */}
      <View style={styles.calendarCard}>
        {/* Month navigation */}
        <View style={styles.monthRow}>
          <TouchableOpacity
            accessibilityLabel="Previous month"
            onPress={() => goToMonth(-1)}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={18} color="#2b7a3d" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            accessibilityLabel="Next month"
            onPress={() => goToMonth(1)}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={18} color="#2b7a3d" />
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={styles.weekRow}>
          {DAY_NAMES.map((day) => (
            <Text key={day} style={styles.weekLabel}>
              {day}
            </Text>
          ))}
        </View>

        {/* Grid of days */}
        <View style={styles.grid}>
          {calendarCells.map((cell) => {
            if (!cell.date) {
              return <View key={cell.key} style={styles.dayCell} />;
            }

            const dateKey = getDateKey(cell.date);
            const isSelected = isSameDay(cell.date, selectedDate);
            const isToday = isSameDay(cell.date, today);
            const taskCount = taskCountByDay.get(dateKey) || 0;
            const hasTasks = taskCount > 0;

            return (
              <Pressable
                key={cell.key}
                style={styles.dayCell}
                onPress={() => setSelectedDate(startOfDay(cell.date))}
                android_ripple={{ color: "#e0f0e5", borderless: true }}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isToday && !isSelected && styles.dayCircleToday
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                </View>
                {/* Task count pill */}
                {hasTasks ? (
                  <View
                    style={[
                      styles.taskPill,
                      isSelected && styles.taskPillSelected
                    ]}
                  >
                    <Text
                      style={[
                        styles.taskPillText,
                        isSelected && styles.taskPillTextSelected
                      ]}
                    >
                      {taskCount}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.taskPillEmpty} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected date task panel header */}
      <View style={styles.taskPanelHeader}>
        <View>
          <Text style={styles.selectedDateLabel}>
            {isSelectedToday ? "Today" : selectedLabel}
          </Text>
          {!isSelectedToday && (
            <Text style={styles.selectedDateSub}>{selectedLabel}</Text>
          )}
        </View>
        {tasksForDay.length > 0 && (
          <View style={styles.taskSummaryBadge}>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount} pending</Text>
              </View>
            )}
            {completedCount > 0 && (
              <View style={[styles.badge, styles.badgeDone]}>
                <Text style={[styles.badgeText, styles.badgeDoneText]}>
                  {completedCount} done
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      data={tasksForDay}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          timerState={timer}
          onComplete={() => completeTask(item.id)}
          onDelete={() => deleteTask(item.id)}
          onStartTimer={() => timer.startTimer(item)}
          onPauseTimer={timer.pauseTimer}
          onResumeTimer={timer.resumeTimer}
          onStopTimer={timer.stopTimer}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color="#c8c4bb" />
          <Text style={styles.emptyTitle}>No tasks for this day</Text>
          <Text style={styles.emptyText}>
            {isSelectedToday
              ? "Add a task using the + tab to get started."
              : "Tasks with a due date on this day will appear here."}
          </Text>
        </View>
      }
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: "#fbfbf7"
  },
  headerWrapper: {
    marginBottom: 4
  },

  // Page title
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b1b1b",
    textAlign: "center",
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: -0.3
  },

  // Calendar card
  calendarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#1b1b1b",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 20
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1b1b1b",
    letterSpacing: -0.2
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#edf7f0"
  },

  // Day-of-week row
  weekRow: {
    flexDirection: "row",
    marginBottom: 4
  },
  weekLabel: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#9a9a9a",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 4
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  dayCircleSelected: {
    backgroundColor: "#2b7a3d"
  },
  dayCircleToday: {
    backgroundColor: "#edf7f0"
  },
  dayText: {
    fontSize: 14,
    color: "#1b1b1b",
    fontWeight: "500"
  },
  dayTextSelected: {
    color: "#ffffff",
    fontWeight: "700"
  },
  dayTextToday: {
    color: "#2b7a3d",
    fontWeight: "700"
  },

  // Task count pill below each day number
  taskPill: {
    marginTop: 3,
    height: 16,
    minWidth: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#d4edda",
    alignItems: "center",
    justifyContent: "center"
  },
  taskPillSelected: {
    backgroundColor: "rgba(255,255,255,0.35)"
  },
  taskPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2b7a3d"
  },
  taskPillTextSelected: {
    color: "#ffffff"
  },
  taskPillEmpty: {
    marginTop: 3,
    height: 16
  },

  // Task panel header (below calendar)
  taskPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 2
  },
  selectedDateLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b1b1b",
    letterSpacing: -0.3
  },
  selectedDateSub: {
    fontSize: 12,
    color: "#8a8a8a",
    marginTop: 1
  },
  taskSummaryBadge: {
    flexDirection: "row",
    gap: 6
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#fff3cd"
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#856404"
  },
  badgeDone: {
    backgroundColor: "#d4edda"
  },
  badgeDoneText: {
    color: "#155724"
  },

  // Empty state
  empty: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5c5c5c",
    textAlign: "center"
  },
  emptyText: {
    fontSize: 13,
    color: "#9a9a9a",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 19
  }
});
