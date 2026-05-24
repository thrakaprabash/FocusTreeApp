import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from "../state/TasksContext";
import { useTheme, LIGHT, DARK } from "../state/ThemeContext";
import TaskItem from "../components/TaskItem";

// ─── Constants ────────────────────────────────────────────────────────────────
const MS_PER_DAY  = 24 * 60 * 60 * 1000;
const DAY_NAMES   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const PIE_SIZE    = 140;
const PIE_RADIUS  = PIE_SIZE / 2;
const STATUS_COLORS = {
  completed: "#4caf50",
  pending:   "#f39c12",
  // empty color is dynamic — use theme.bgInput
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const startOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths    = (d, delta) => new Date(d.getFullYear(), d.getMonth() + delta, 1);
const daysInMonth  = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const getDateKey   = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isSameDay    = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const buildMonthCells = (monthDate) => {
  const firstDay     = startOfMonth(monthDate);
  const startWeekday = firstDay.getDay();
  const totalDays    = daysInMonth(monthDate);
  const cells        = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `es-${i}`, date: null });
  for (let day = 1; day <= totalDays; day++) {
    cells.push({ key: `d-${day}`, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day) });
  }
  while (cells.length % 7 !== 0) cells.push({ key: `ee-${cells.length}`, date: null });
  return cells;
};

const getTaskDateKey = (task) => {
  if (task.dueAt) { const d = new Date(task.dueAt); if (!isNaN(d)) return getDateKey(d); }
  if (task.createdAt) { const d = new Date(task.createdAt); if (!isNaN(d)) return getDateKey(d); }
  return null;
};

// ─── Pie chart helpers ────────────────────────────────────────────────────────
const polarToCartesian = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};
const describeArc = (cx, cy, r, start, end) => {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? "0" : "1";
  return [`M ${cx} ${cy}`, `L ${s.x} ${s.y}`, `A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`, "Z"].join(" ");
};
const buildPieSlices = (segments, total) => {
  if (total <= 0) return [];
  let angle = 0;
  return segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const sliceAngle = (s.value / total) * 360;
      const startAngle = angle;
      angle += sliceAngle;
      return { ...s, startAngle, endAngle: angle };
    });
};

// ─── Weekly bar chart helper ──────────────────────────────────────────────────
const buildWeeklyBuckets = (tasks) => {
  const today = startOfDay(new Date());
  const days  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const counts      = new Array(7).fill(0);
  const windowStart = days[0].getTime();
  tasks.forEach((t) => {
    if (!t.completedAt) return;
    const diff = Math.floor((startOfDay(new Date(t.completedAt)).getTime() - windowStart) / MS_PER_DAY);
    if (diff >= 0 && diff < 7) counts[diff]++;
  });
  return { days, counts };
};

// ═════════════════════════════════════════════════════════════════════════════
export default function AnalysisScreen() {
  const { tasks, xp, level, completeTask, deleteTask } = useTasks();
  const { theme, isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;

  // ── Calendar state ────────────────────────────────────────────────────────
  const today        = startOfDay(new Date());
  const todayKey     = getDateKey(today);
  const [calOpen,        setCalOpen]        = useState(true);
  const [currentMonth,   setCurrentMonth]   = useState(startOfMonth(new Date()));
  const [selectedDate,   setSelectedDate]   = useState(today);

  const goToMonth = (delta) => {
    const next = addMonths(currentMonth, delta);
    setCurrentMonth(next);
    if (selectedDate.getMonth() !== next.getMonth() ||
        selectedDate.getFullYear() !== next.getFullYear()) {
      setSelectedDate(startOfMonth(next));
    }
  };

  const taskCountByDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      if (t.isDaily) { map.set(todayKey, (map.get(todayKey) || 0) + 1); return; }
      const key = getTaskDateKey(t);
      if (key) map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [tasks, todayKey]);

  const tasksForDay = useMemo(() => {
    const selKey  = getDateKey(selectedDate);
    const isToday = selKey === todayKey;
    const result  = [];
    tasks.forEach((t) => {
      if (t.isDaily) { if (isToday) result.push(t); return; }
      if (getTaskDateKey(t) === selKey) result.push(t);
    });
    result.sort((a, b) => {
      if (Boolean(a.completedAt) !== Boolean(b.completedAt)) return a.completedAt ? 1 : -1;
      if (a.dueAt && b.dueAt) return new Date(a.dueAt) - new Date(b.dueAt);
      return 0;
    });
    return result;
  }, [tasks, selectedDate, todayKey]);

  const calendarCells    = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);
  const monthLabel       = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  const isSelectedToday  = isSameDay(selectedDate, today);
  const selectedLabel    = selectedDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" });
  const completedCount   = tasksForDay.filter((t) => t.completedAt).length;
  const pendingCount     = tasksForDay.length - completedCount;

  // ── Analysis data ─────────────────────────────────────────────────────────
  const totalTasks   = tasks.length;
  const doneTasks    = tasks.filter((t) => t.completedAt).length;
  const pendingTasks = totalTasks - doneTasks;
  const hasData      = totalTasks > 0;

  const pieSegments = hasData
    ? [
        { key: "completed", label: "Completed", value: doneTasks,    color: STATUS_COLORS.completed },
        { key: "pending",   label: "Pending",   value: pendingTasks, color: STATUS_COLORS.pending   }
      ]
    : [{ key: "empty", label: "No data", value: 1, color: STATUS_COLORS.empty }];

  const pieSlices  = useMemo(
    () => buildPieSlices(pieSegments, hasData ? totalTasks : 1),
    [pieSegments, hasData, totalTasks]
  );
  const singleSlice = pieSlices.length === 1;

  const { days, counts } = useMemo(() => buildWeeklyBuckets(tasks), [tasks]);
  const maxCount         = Math.max(1, ...counts);

  // ── Render ────────────────────────────────────────────────────────────────
  const calendarSection = (
    <View style={styles.panel}>
      {/* Toggle header */}
      <TouchableOpacity
        style={styles.panelToggleRow}
        onPress={() => setCalOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.panelTitleRow}>
          <Ionicons name="calendar" size={18} color="#2b7a3d" style={{ marginRight: 8 }} />
          <Text style={styles.panelTitle}>Calendar</Text>
        </View>
        <Ionicons
          name={calOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9a9a9a"
        />
      </TouchableOpacity>

      {calOpen && (
        <>
          {/* Month navigation */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => goToMonth(-1)} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={18} color="#2b7a3d" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => goToMonth(1)} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={18} color="#2b7a3d" />
            </TouchableOpacity>
          </View>

          {/* Day-of-week labels */}
          <View style={styles.weekRow}>
            {DAY_NAMES.map((d) => (
              <Text key={d} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {calendarCells.map((cell) => {
              if (!cell.date) return <View key={cell.key} style={styles.dayCell} />;
              const dateKey    = getDateKey(cell.date);
              const isSelected = isSameDay(cell.date, selectedDate);
              const isToday    = isSameDay(cell.date, today);
              const taskCount  = taskCountByDay.get(dateKey) || 0;
              return (
                <Pressable
                  key={cell.key}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(startOfDay(cell.date))}
                  android_ripple={{ color: "#e0f0e5", borderless: true }}
                >
                  <View style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isToday && !isSelected && styles.dayCircleToday
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday
                    ]}>
                      {cell.date.getDate()}
                    </Text>
                  </View>
                  {taskCount > 0 ? (
                    <View style={[styles.taskPill, isSelected && styles.taskPillSelected]}>
                      <Text style={[styles.taskPillText, isSelected && styles.taskPillTextSelected]}>
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

          {/* Selected day tasks */}
          <View style={styles.dayTaskHeader}>
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
                    <Text style={[styles.badgeText, styles.badgeDoneText]}>{completedCount} done</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {tasksForDay.length === 0 ? (
            <View style={styles.calEmpty}>
              <Ionicons name="calendar-outline" size={32} color={theme.border} />
              <Text style={styles.calEmptyText}>No tasks for this day</Text>
            </View>
          ) : (
            tasksForDay.map((item) => (
              <TaskItem
                key={item.id}
                task={item}
                onComplete={() => completeTask(item.id)}
                onDelete={() => deleteTask(item.id)}
              />
            ))
          )}
        </>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Analysis</Text>

      {/* ── Summary cards ── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{level}</Text>
          <Text style={styles.summaryLabel}>Level</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalTasks}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardDone]}>
          <Text style={[styles.summaryValue, styles.summaryValueDone]}>{doneTasks}</Text>
          <Text style={[styles.summaryLabel, styles.summaryLabelDone]}>Done</Text>
        </View>
      </View>

      {/* ── Pie chart ── */}
      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
          <Ionicons name="pie-chart" size={18} color={theme.green} style={{ marginRight: 8 }} />
          <Text style={styles.panelTitle}>Task Completion Status</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.pieWrap}>
            <Svg width={PIE_SIZE} height={PIE_SIZE} viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}>
              <Circle cx={PIE_RADIUS} cy={PIE_RADIUS} r={PIE_RADIUS} fill={theme.bgInput} />
              {singleSlice ? (
                <Circle cx={PIE_RADIUS} cy={PIE_RADIUS} r={PIE_RADIUS} fill={pieSlices[0]?.color} />
              ) : (
                pieSlices.map((slice) => (
                  <Path
                    key={slice.key}
                    d={describeArc(PIE_RADIUS, PIE_RADIUS, PIE_RADIUS, slice.startAngle, slice.endAngle)}
                    fill={slice.color}
                  />
                ))
              )}
            </Svg>
          </View>
          <View style={styles.statusLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.completed }]} />
              <Text style={styles.legendText}>Completed: {doneTasks}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.pending }]} />
              <Text style={styles.legendText}>Pending: {pendingTasks}</Text>
            </View>
            {!hasData && <Text style={styles.legendEmpty}>No data yet</Text>}
          </View>
        </View>
      </View>

      {/* ── Weekly bar chart ── */}
      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
          <Ionicons name="bar-chart" size={18} color={theme.green} style={{ marginRight: 8 }} />
          <Text style={styles.panelTitle}>Weekly Activity</Text>
        </View>
        <View style={styles.chartRow}>
          {counts.map((count, index) => {
            const height = 10 + (count / maxCount) * 48;
            return (
              <View key={days[index].toISOString()} style={styles.chartColumn}>
                <Text style={styles.chartValue}>{count}</Text>
                <View style={[styles.chartBar, { height }]} />
                <Text style={styles.chartLabel}>{DAY_NAMES[days[index].getDay()]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Calendar ── */}
      {calendarSection}

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (t) => StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: t.bg },
  container:  { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },

  title: { fontSize: 24, fontWeight: "800", color: t.text, textAlign: "center", marginBottom: 16, letterSpacing: -0.3 },

  summaryRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  summaryCard:     { flex: 1, backgroundColor: t.greenSoft, borderRadius: 16, paddingVertical: 14, alignItems: "center", marginHorizontal: 4 },
  summaryCardDone: { backgroundColor: t.greenSoft },
  summaryValue:    { fontSize: 24, fontWeight: "700", color: t.green },
  summaryValueDone:{ color: t.green },
  summaryLabel:    { fontSize: 14, color: t.textMuted, marginTop: 4 },
  summaryLabelDone:{ color: t.green },

  panel: { backgroundColor: t.bgCard, borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  panelToggleRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 0 },
  panelTitleRow:   { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  panelTitle:      { fontSize: 16, fontWeight: "700", color: t.text },

  monthRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 12 },
  monthLabel:  { fontSize: 16, fontWeight: "700", color: t.text, letterSpacing: -0.2 },
  monthButton: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: t.greenSoft },

  weekRow:   { flexDirection: "row", marginBottom: 4 },
  weekLabel: { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "600", color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },

  grid:    { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", alignItems: "center", paddingVertical: 4 },
  dayCircle:         { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  dayCircleSelected: { backgroundColor: t.green },
  dayCircleToday:    { backgroundColor: t.greenSoft },
  dayText:           { fontSize: 13, color: t.text, fontWeight: "500" },
  dayTextSelected:   { color: "#ffffff", fontWeight: "700" },
  dayTextToday:      { color: t.green, fontWeight: "700" },
  taskPill:             { marginTop: 2, height: 15, minWidth: 15, paddingHorizontal: 3, borderRadius: 8, backgroundColor: t.greenMid, alignItems: "center", justifyContent: "center" },
  taskPillSelected:     { backgroundColor: "rgba(255,255,255,0.35)" },
  taskPillText:         { fontSize: 10, fontWeight: "700", color: t.green },
  taskPillTextSelected: { color: "#ffffff" },
  taskPillEmpty:        { marginTop: 2, height: 15 },

  dayTaskHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 10, paddingHorizontal: 2 },
  selectedDateLabel: { fontSize: 16, fontWeight: "800", color: t.text, letterSpacing: -0.3 },
  selectedDateSub:   { fontSize: 11, color: t.textMuted, marginTop: 1 },
  taskSummaryBadge:  { flexDirection: "row", gap: 6 },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: t.warnSoft },
  badgeText:     { fontSize: 11, fontWeight: "700", color: t.warn },
  badgeDone:     { backgroundColor: t.greenMid },
  badgeDoneText: { color: t.green },
  calEmpty:     { paddingVertical: 20, alignItems: "center", gap: 6 },
  calEmptyText: { fontSize: 13, color: t.textMuted },

  statusRow:    { flexDirection: "row", alignItems: "center" },
  pieWrap:      { width: PIE_SIZE, height: PIE_SIZE, alignItems: "center", justifyContent: "center" },
  statusLegend: { flex: 1, marginLeft: 16 },
  legendItem:   { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  legendDot:    { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText:   { fontSize: 13, color: t.text },
  legendEmpty:  { fontSize: 12, color: t.textMuted, marginTop: 4 },

  chartRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 8 },
  chartColumn: { alignItems: "center", flex: 1 },
  chartValue:  { fontSize: 12, color: t.text, marginBottom: 6 },
  chartBar:    { width: 26, borderRadius: 10, backgroundColor: t.green, marginBottom: 6 },
  chartLabel:  { fontSize: 11, color: t.text }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);

