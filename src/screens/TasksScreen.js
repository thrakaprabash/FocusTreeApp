import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from "../state/TasksContext";
import { useTheme, LIGHT, DARK } from "../state/ThemeContext";
import { XP_PER_LEVEL } from "../data/treeStages";
import TaskItem from "../components/TaskItem";
import TreeDisplay from "../components/TreeDisplay";
import { loadProfileName } from "../services/storage";
import { getStreakDays } from "../utils/streak";

// ─── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_NAME = "Grower";
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const STATUS_FILTERS = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "completed", label: "Done" },
  { key: "daily",     label: "🔁 Daily" }
];

const PRIORITY_FILTERS = [
  { key: "all",    label: "Any" },
  { key: "high",   label: "🔴 High" },
  { key: "medium", label: "🟡 Med" },
  { key: "low",    label: "🔵 Low" }
];

const SORT_OPTIONS = [
  { key: "default",   label: "Default",    icon: "list-outline" },
  { key: "dueDate",   label: "Due Date",   icon: "calendar-outline" },
  { key: "priority",  label: "Priority",   icon: "flag-outline" },
  { key: "newest",    label: "Newest",     icon: "time-outline" }
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

// ─── Chip component ────────────────────────────────────────────────────────────
function Chip({ label, active, onPress, color }) {
  const { theme, isDark } = useTheme();
  const chipStyles = isDark ? darkStyles : lightStyles;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true })
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          chipStyles.chip,
          active && { backgroundColor: color || theme.green, borderColor: color || theme.green }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}


// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { tasks, xp, level, treeStage, completeTask, deleteTask } = useTasks();
  const { theme, isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;
  const [name, setName] = useState(DEFAULT_NAME);

  // ── Filter & Sort state ────────────────────────────────────────────────────
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy,         setSortBy]         = useState("default");
  const [sortOpen,       setSortOpen]       = useState(false);

  useEffect(() => {
    let mounted = true;
    loadProfileName().then((storedName) => {
      if (!mounted) return;
      setName(storedName && storedName.trim() ? storedName.trim() : DEFAULT_NAME);
    });
    return () => { mounted = false; };
  }, []);

  const streakDays  = useMemo(() => getStreakDays(tasks), [tasks]);
  const levelXp     = xp - level * XP_PER_LEVEL;
  const progress    = clamp(levelXp / XP_PER_LEVEL, 0, 1);
  const pct         = Math.round(progress * 100);
  const greeting    = getGreeting();
  const stageNum    = treeStage?.stageNumber ?? 1;
  const totalStages = 100;

  // ── Filter + Sort logic ────────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (statusFilter === "pending")   result = result.filter(t => !t.completedAt);
    if (statusFilter === "completed") result = result.filter(t =>  t.completedAt);
    if (statusFilter === "daily")     result = result.filter(t =>  t.isDaily);

    // Priority filter
    if (priorityFilter !== "all")
      result = result.filter(t => t.priority === priorityFilter);

    // Sort
    if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt) - new Date(b.dueAt);
      });
    } else if (sortBy === "priority") {
      result.sort((a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      );
    } else if (sortBy === "newest") {
      result.sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    } else {
      // Default: pending first, then completed; within each group newest first
      result.sort((a, b) => {
        const aDone = Boolean(a.completedAt);
        const bDone = Boolean(b.completedAt);
        if (aDone !== bDone) return aDone ? 1 : -1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }

    return result;
  }, [tasks, statusFilter, priorityFilter, sortBy]);

  const activeFiltersCount =
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (sortBy !== "default" ? 1 : 0);

  const currentSort = SORT_OPTIONS.find(o => o.key === sortBy);

  // ── Reset filters ──────────────────────────────────────────────────────────
  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("default");
  };

  // ── Filter/Sort bar (part of header) ──────────────────────────────────────
  const filterBar = (
    <View style={styles.filterSection}>

      {/* Row 1: Status chips + Sort button */}
      <View style={styles.filterTopRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {STATUS_FILTERS.map(f => (
            <Chip
              key={f.key}
              label={f.label}
              active={statusFilter === f.key}
              onPress={() => setStatusFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* Sort button */}
        <TouchableOpacity
          style={[styles.sortBtn, sortBy !== "default" && styles.sortBtnActive]}
          onPress={() => setSortOpen(v => !v)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={currentSort.icon}
            size={14}
            color={sortBy !== "default" ? theme.green : theme.textSub}
          />
          <Text style={[styles.sortBtnText, sortBy !== "default" && styles.sortBtnTextActive]}>
            {sortBy !== "default" ? currentSort.label : "Sort"}
          </Text>
          <Ionicons
            name={sortOpen ? "chevron-up" : "chevron-down"}
            size={12}
            color={sortBy !== "default" ? theme.green : theme.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {sortOpen && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
              onPress={() => { setSortBy(opt.key); setSortOpen(false); }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={opt.icon}
                size={15}
                color={sortBy === opt.key ? theme.green : theme.textSub}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextActive]}>
                {opt.label}
              </Text>
              {sortBy === opt.key && (
                <Ionicons name="checkmark" size={14} color={theme.green} style={{ marginLeft: "auto" }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Row 2: Priority chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsScroll, { marginTop: 8 }]}
      >
        {PRIORITY_FILTERS.map(f => {
          const colors = { high: "#e63946", medium: "#f4a261", low: "#3a86ff", all: "#2b7a3d" };
          return (
            <Chip
              key={f.key}
              label={f.label}
              active={priorityFilter === f.key}
              onPress={() => setPriorityFilter(f.key)}
              color={colors[f.key]}
            />
          );
        })}
      </ScrollView>

      {/* Results row */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredAndSorted.length} task{filteredAndSorted.length !== 1 ? "s" : ""}
          {activeFiltersCount > 0 ? " matched" : ""}
        </Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={resetFilters} style={styles.clearFiltersBtn}>
            <Ionicons name="close-circle" size={13} color={theme.textMuted} style={{ marginRight: 3 }} />
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── Header ─────────────────────────────────────────────────────────────────
  const header = (
    <View style={styles.hero}>

      {/* Greeting */}
      <View style={styles.greetingRow}>
        <Text style={styles.greetingSub}>{greeting},</Text>
        <Text style={styles.greetingName} numberOfLines={1}>{name} 🌱</Text>
      </View>

      {/* Tree */}
      <View style={styles.treeSection}>
        <TreeDisplay stage={treeStage} size={180} />
      </View>

      {/* Stage label + level pill */}
      <Text style={styles.stageLabel}>{treeStage?.label ?? "Your Tree"}</Text>
      <View style={styles.levelPill}>
        <Text style={styles.levelPillText}>Level {level}</Text>
      </View>

      {/* XP card */}
      <View style={styles.xpCard}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>Progress to Level {level + 1}</Text>
          <Text style={styles.progressVal}>{levelXp} / {XP_PER_LEVEL} XP</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {streakDays > 0 ? `${streakDays}` : "—"}
            </Text>
            <Text style={styles.statLabel}>
              {streakDays > 0 ? "Day Streak 🔥" : "No streak yet"}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stageNum}/{totalStages}</Text>
            <Text style={styles.statLabel}>Tree Stage</Text>
          </View>
        </View>
      </View>

      {/* Section title + filter bar */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Your Tasks</Text>
        {activeFiltersCount > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{activeFiltersCount} active</Text>
          </View>
        )}
      </View>

      {filterBar}
    </View>
  );

  // ── Empty state ─────────────────────────────────────────────────────────────
  const emptyComponent = (
    <View style={styles.empty}>
      {activeFiltersCount > 0 ? (
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No tasks match</Text>
          <Text style={styles.emptyText}>
            Try changing your filters or clear them to see all tasks.
          </Text>
          <TouchableOpacity style={styles.emptyResetBtn} onPress={resetFilters}>
            <Text style={styles.emptyResetText}>Clear Filters</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptyText}>
            Add your first task and start growing your tree!
          </Text>
        </>
      )}
    </View>
  );

  return (
    <FlatList
      data={filteredAndSorted}
      keyExtractor={(item) => item.id}
      style={{ flex: 1, backgroundColor: styles.list.backgroundColor }}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          onComplete={() => completeTask(item.id)}
          onDelete={() => deleteTask(item.id)}
        />
      )}
      ListEmptyComponent={emptyComponent}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (t) => StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, backgroundColor: t.bg },

  hero: { paddingBottom: 4 },

  greetingRow: { marginTop: 8, marginBottom: 4 },
  greetingSub: { fontSize: 14, color: t.textSub, fontWeight: "500", letterSpacing: 0.2 },
  greetingName: { fontSize: 26, fontWeight: "800", color: t.text, letterSpacing: -0.5, marginTop: 2 },

  treeSection: { alignItems: "center", marginVertical: 16 },

  stageLabel:    { fontSize: 18, fontWeight: "700", color: t.text, textAlign: "center", letterSpacing: -0.2 },
  levelPill:     { alignSelf: "center", marginTop: 6, marginBottom: 16, backgroundColor: t.greenSoft, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: t.greenMid },
  levelPillText: { fontSize: 13, fontWeight: "700", color: t.green },

  xpCard:       { backgroundColor: t.bgCard, borderRadius: 20, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel:{ fontSize: 12, fontWeight: "600", color: t.textMuted },
  progressVal:  { fontSize: 12, fontWeight: "700", color: t.green },
  track: { height: 10, backgroundColor: t.greenSoft, borderRadius: 10, overflow: "hidden", marginBottom: 16 },
  fill:  { height: "100%", backgroundColor: t.green, borderRadius: 10 },
  statsRow:   { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  statItem:   { flex: 1, alignItems: "center" },
  statDivider:{ width: 1, height: 32, backgroundColor: t.borderLight },
  statValue:  { fontSize: 18, fontWeight: "800", color: t.green, letterSpacing: -0.3 },
  statLabel:  { fontSize: 11, color: t.textMuted, marginTop: 2, textAlign: "center" },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: t.text, letterSpacing: -0.2 },
  activeBadge:     { marginLeft: 8, backgroundColor: t.green, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeText: { fontSize: 11, fontWeight: "700", color: "#ffffff" },

  filterSection: { marginBottom: 12 },
  filterTopRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  chipsScroll:   { flexDirection: "row", gap: 6, paddingRight: 4 },

  chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: t.border, backgroundColor: t.bgInput },
  chipText:      { fontSize: 12, fontWeight: "600", color: t.textMuted },
  chipTextActive:{ color: "#ffffff" },

  sortBtn:          { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: t.border, backgroundColor: t.bgInput, flexShrink: 0 },
  sortBtnActive:    { borderColor: t.greenMid, backgroundColor: t.greenSoft },
  sortBtnText:      { fontSize: 12, fontWeight: "600", color: t.textMuted },
  sortBtnTextActive:{ color: t.green },

  sortDropdown:         { backgroundColor: t.bgCard, borderRadius: 14, marginTop: 8, paddingVertical: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6, borderWidth: 1, borderColor: t.borderLight },
  sortOption:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11 },
  sortOptionActive:     { backgroundColor: t.greenSoft },
  sortOptionText:       { fontSize: 14, fontWeight: "600", color: t.text },
  sortOptionTextActive: { color: t.green, fontWeight: "700" },

  resultsRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 2 },
  resultsText:     { fontSize: 12, fontWeight: "600", color: t.textMuted },
  clearFiltersBtn: { flexDirection: "row", alignItems: "center" },
  clearFiltersText:{ fontSize: 12, fontWeight: "600", color: t.textMuted },

  empty:         { paddingVertical: 32, alignItems: "center" },
  emptyIcon:     { fontSize: 40, marginBottom: 10 },
  emptyTitle:    { fontSize: 16, fontWeight: "700", color: t.textSub },
  emptyText:     { fontSize: 13, color: t.textMuted, textAlign: "center", marginTop: 6, lineHeight: 19 },
  emptyResetBtn: { marginTop: 14, backgroundColor: t.green, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 9 },
  emptyResetText:{ color: "#ffffff", fontSize: 13, fontWeight: "700" }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);

