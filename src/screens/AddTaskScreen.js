import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTasks } from "../state/TasksContext";
import { useTheme, LIGHT, DARK } from "../state/ThemeContext";
import { XP_PER_TASK } from "../data/treeStages";


// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDateDisplay = (date) => {
  const options = { weekday: "short", month: "short", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
};

const buildDueAt = (date) => {
  if (!date) return null;
  const localEndOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    0,
    0
  );
  return localEndOfDay.toISOString();
};

const PRIORITIES = [
  { label: "Low",    value: "low",    color: "#3a86ff", bg: "#eef3ff" },
  { label: "Medium", value: "medium", color: "#f4a261", bg: "#fff5eb" },
  { label: "High",   value: "high",   color: "#e63946", bg: "#fff0f0" }
];



// ─── Section Header ────────────────────────────────────────────────────────────
function SectionLabel({ icon, text }) {
  const { theme, isDark } = useTheme();
  const s = isDark ? darkStyles : lightStyles;
  return (
    <View style={s.sectionLabel}>
      <Ionicons name={icon} size={14} color={theme.textSub} style={{ marginRight: 5 }} />
      <Text style={s.sectionLabelText}>{text}</Text>
    </View>
  );
}


// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function AddTaskScreen() {
  const { addTask } = useTasks();
  const { theme, isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;

  const [title,          setTitle]          = useState("");
  const [notes,          setNotes]          = useState("");
  const [priority,       setPriority]       = useState("medium");
  const [dueDate,        setDueDate]        = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDaily,        setIsDaily]        = useState(false);
  const [dailyTime,      setDailyTime]      = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  // Button press animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Date picker ────────────────────────────────────────────────────────────
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (event?.type === "dismissed") return;
    if (selectedDate) setDueDate(selectedDate);
  };

  const handleClearDate = () => setDueDate(null);

  // ── Daily time picker ──────────────────────────────────────────────────────
  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (event?.type === "dismissed") return;
    if (selectedTime) setDailyTime(selectedTime);
  };

  const formatDailyTime = (d) => {
    if (!d) return null;
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };



  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleAddTask = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Missing title", "Please enter a task title.");
      return;
    }

    // Store end-of-day local time so "due today" does not become overdue.
    const dueAt = buildDueAt(dueDate);

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true })
    ]).start();

    try {
      await addTask({
        title: trimmed,
        notes: notes.trim(),
        priority,
        dueAt,
        xpValue: XP_PER_TASK,
        isDaily,
        dailyTime: isDaily && dailyTime ? formatDailyTime(dailyTime) : ""
      });
    } catch (e) {
      console.error("[AddTaskScreen] addTask failed:", e);
      Alert.alert("Error", "Could not save task. Please try again.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1400);

    // Reset
    setTitle("");
    setNotes("");
    setPriority("medium");
    setDueDate(null);
    setShowDatePicker(false);
    setIsDaily(false);
    setDailyTime(null);
    setShowTimePicker(false);
  };

  const selectedPriority = PRIORITIES.find((p) => p.value === priority);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>New Task</Text>
        <View style={styles.xpPill}>
          <Ionicons name="star" size={12} color="#2b7a3d" />
          <Text style={styles.xpPillText}>+{XP_PER_TASK} XP</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* ── Task Title ── */}
        <View style={styles.card}>
          <SectionLabel icon="create-outline" text="Task Title" />
          <TextInput
            style={styles.titleInput}
            placeholder="What do you want to accomplish?"
            placeholderTextColor="#b0aca4"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            returnKeyType="next"
          />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>

        {/* ── Notes ── */}
        <View style={styles.card}>
          <SectionLabel icon="document-text-outline" text="Notes (optional)" />
          <TextInput
            style={styles.notesInput}
            placeholder="Add details, context, or steps…"
            placeholderTextColor="#b0aca4"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
          />
        </View>

        {/* ── Priority ── */}
        <View style={styles.card}>
          <SectionLabel icon="flag-outline" text="Priority" />
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const active = priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityChip,
                    { borderColor: p.color },
                    active && { backgroundColor: p.bg }
                  ]}
                  onPress={() => setPriority(p.value)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.priorityLabel, active && { color: p.color, fontWeight: "700" }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Due Date ── */}
        <View style={styles.card}>
          <SectionLabel icon="calendar-outline" text="Due Date" />
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateButton, dueDate && styles.dateButtonActive]}
              onPress={() => setShowDatePicker((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={dueDate ? theme.green : theme.textMuted}
                style={{ marginRight: 8 }}
              />
              <Text style={dueDate ? styles.dateText : styles.datePlaceholder}>
                {dueDate ? formatDateDisplay(dueDate) : "Select date"}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearDate}>
                <Ionicons name="close-circle" size={20} color="#9f9b93" />
              </TouchableOpacity>
            )}
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* ── Daily Task ── */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="repeat-outline" size={16} color="#5c5c5c" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.switchLabel}>Daily Task</Text>
                <Text style={styles.switchSub}>Resets every day</Text>
              </View>
            </View>
            <Switch
              value={isDaily}
              onValueChange={setIsDaily}
              trackColor={{ false: theme.border, true: theme.greenMid }}
              thumbColor={isDaily ? theme.green : theme.bgCard}
            />
          </View>

          {isDaily && (
            <View style={{ marginTop: 12 }}>
              <SectionLabel icon="time-outline" text="Daily reminder time (optional)" />
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateButton, dailyTime && styles.dateButtonActive]}
                  onPress={() => setShowTimePicker((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="alarm-outline"
                    size={16}
                    color={dailyTime ? theme.green : theme.textMuted}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={dailyTime ? styles.dateText : styles.datePlaceholder}>
                    {dailyTime ? formatDailyTime(dailyTime) : "Set reminder time"}
                  </Text>
                </TouchableOpacity>
                {dailyTime && (
                  <TouchableOpacity style={styles.clearBtn} onPress={() => setDailyTime(null)}>
                    <Ionicons name="close-circle" size={20} color="#9f9b93" />
                  </TouchableOpacity>
                )}
              </View>
              {showTimePicker && (
                <DateTimePicker
                  value={dailyTime ?? new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}
        </View>

        {/* ── Submit Button ── */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !title.trim() && styles.submitButtonDisabled
            ]}
            onPress={handleAddTask}
            activeOpacity={0.85}
          >
            <View style={styles.submitInner}>
              {submitted ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Task Added!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Add Task</Text>
                  <View style={styles.submitXpTag}>
                    <Text style={styles.submitXpText}>+{XP_PER_TASK} XP</Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* priority hint */}
        {selectedPriority && (
          <Text style={styles.priorityHint}>
            <Text style={{ color: selectedPriority.color }}>● </Text>
            {selectedPriority.label} priority task
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const makeStyles = (t) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bgInput },

  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  pageTitle:  { fontSize: 26, fontWeight: "800", color: t.text, letterSpacing: -0.5 },
  xpPill:     { flexDirection: "row", alignItems: "center", backgroundColor: t.greenSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: t.greenMid, gap: 4 },
  xpPillText: { fontSize: 13, fontWeight: "700", color: t.green },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  card: { backgroundColor: t.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  sectionLabel:     { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionLabelText: { fontSize: 12, fontWeight: "600", color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },

  titleInput: { fontSize: 16, fontWeight: "600", color: t.text, paddingVertical: 4, borderBottomWidth: 1.5, borderBottomColor: t.border },
  charCount:  { fontSize: 11, color: t.textMuted, textAlign: "right", marginTop: 4 },

  notesInput: { fontSize: 14, color: t.text, minHeight: 72, lineHeight: 21, paddingTop: 2 },

  priorityRow:  { flexDirection: "row", gap: 8 },
  priorityChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: t.border, gap: 5 },
  priorityDot:  { width: 8, height: 8, borderRadius: 4 },
  priorityLabel:{ fontSize: 13, fontWeight: "600", color: t.textSub },

  dateRow:          { flexDirection: "row", alignItems: "center" },
  dateButton:       { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: t.bgInput, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: t.border },
  dateButtonActive: { borderColor: t.green, backgroundColor: t.greenSoft },
  dateText:         { fontSize: 14, fontWeight: "600", color: t.green },
  datePlaceholder:  { fontSize: 14, color: t.textMuted },
  clearBtn:         { marginLeft: 8, padding: 4 },

  rowBetween:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 15, fontWeight: "700", color: t.text },
  switchSub:   { fontSize: 12, color: t.textMuted, marginTop: 1 },

  submitButton:         { backgroundColor: t.green, borderRadius: 16, paddingVertical: 16, marginTop: 4, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  submitButtonDisabled: { backgroundColor: t.greenMid, shadowOpacity: 0 },
  submitInner:  { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  submitText:   { color: "#ffffff", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  submitXpTag:  { marginLeft: 10, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  submitXpText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },

  priorityHint: { textAlign: "center", fontSize: 12, color: t.textMuted, marginBottom: 4 }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);
