import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

// ─── Constants ─────────────────────────────────────────────────────────────────
const SCREEN_HEIGHT = Dimensions.get("window").height;

const PRIORITIES = [
  { label: "Low",    value: "low",    color: "#3a86ff", bg: "#eef3ff" },
  { label: "Medium", value: "medium", color: "#f4a261", bg: "#fff5eb" },
  { label: "High",   value: "high",   color: "#e63946", bg: "#fff0f0" }
];

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
    23, 59, 0, 0
  );
  return localEndOfDay.toISOString();
};

const parseDueDate = (dueAt) => {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  return isNaN(d.getTime()) ? null : d;
};

const parseTimeString = (timeStr) => {
  if (!timeStr) return null;
  // timeStr is like "09:30 AM" or "HH:MM"
  const d = new Date();
  const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!parts) return null;
  let hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const meridiem = parts[3];
  if (meridiem) {
    if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
  }
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// ─── Section Label ─────────────────────────────────────────────────────────────
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


// ─── Main Component ────────────────────────────────────────────────────────────
export default function EditTaskModal({ visible, task, onClose }) {
  const { updateTask } = useTasks();
  const { theme, isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;

  // ── Form state ───────────────────────────────────────────────────────────────
  const [title,          setTitle]          = useState("");
  const [notes,          setNotes]          = useState("");
  const [priority,       setPriority]       = useState("medium");
  const [dueDate,        setDueDate]        = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDaily,        setIsDaily]        = useState(false);
  const [dailyTime,      setDailyTime]      = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saved,          setSaved]          = useState(false);

  // ── Sheet slide-up animation ─────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  // ── Populate form when task changes ─────────────────────────────────────────
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setNotes(task.notes || "");
      setPriority(task.priority || "medium");
      setDueDate(parseDueDate(task.dueAt));
      setIsDaily(Boolean(task.isDaily));
      setDailyTime(parseTimeString(task.dailyTime));
      setShowDatePicker(false);
      setShowTimePicker(false);
      setSaved(false);
    }
  }, [task]);

  // ── Date/time handlers ───────────────────────────────────────────────────────
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (event?.type === "dismissed") return;
    if (selectedDate) setDueDate(selectedDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (event?.type === "dismissed") return;
    if (selectedTime) setDailyTime(selectedTime);
  };

  const formatDailyTime = (d) => {
    if (!d) return null;
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const changes = {
      title: trimmed,
      notes: notes.trim(),
      priority,
      dueAt: buildDueAt(dueDate),
      isDaily,
      dailyTime: isDaily && dailyTime ? formatDailyTime(dailyTime) : ""
    };

    await updateTask(task.id, changes);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClose = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheetWrapper, { transform: [{ translateY: slideAnim }] }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Edit Task</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {task.title}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            {/* ── Title ── */}
            <View style={styles.card}>
              <SectionLabel icon="create-outline" text="Task Title" />
              <TextInput
                style={styles.titleInput}
                placeholder="What do you want to accomplish?"
                placeholderTextColor={theme.textMuted}
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
                placeholderTextColor={theme.textMuted}
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
                  <TouchableOpacity style={styles.clearBtn} onPress={() => setDueDate(null)}>
                    <Ionicons name="close-circle" size={20} color={theme.textMuted} />
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
                  <Ionicons name="repeat-outline" size={16} color={theme.textSub} style={{ marginRight: 8 }} />
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
                        <Ionicons name="close-circle" size={20} color={theme.textMuted} />
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

            {/* ── Save Button ── */}
            <TouchableOpacity
              style={[styles.saveBtn, (!title.trim() || saved) && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={!title.trim() || saved}
            >
              <View style={styles.saveBtnInner}>
                {saved ? (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Saved!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <View style={{ height: 16 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const makeStyles = (t) => StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },

  sheetWrapper: { position: "absolute", bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.90, backgroundColor: t.bgInput, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 20 },
  keyboardView: { flex: 1 },

  handleBar: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10, marginBottom: 4 },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: t.borderLight },
  headerTitle: { fontSize: 20, fontWeight: "800", color: t.text, letterSpacing: -0.4 },
  headerSub:   { fontSize: 12, color: t.textMuted, marginTop: 2, maxWidth: 260 },
  closeBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: t.borderLight, alignItems: "center", justifyContent: "center" },

  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },

  card: { backgroundColor: t.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  sectionLabel:     { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionLabelText: { fontSize: 12, fontWeight: "600", color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },

  titleInput: { fontSize: 16, fontWeight: "600", color: t.text, paddingVertical: 4, borderBottomWidth: 1.5, borderBottomColor: t.border },
  charCount:  { fontSize: 11, color: t.textMuted, textAlign: "right", marginTop: 4 },

  notesInput: { fontSize: 14, color: t.text, minHeight: 72, lineHeight: 21, paddingTop: 2 },

  priorityRow:   { flexDirection: "row", gap: 8 },
  priorityChip:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: t.border, gap: 5 },
  priorityDot:   { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: 13, fontWeight: "600", color: t.textSub },

  dateRow:          { flexDirection: "row", alignItems: "center" },
  dateButton:       { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: t.bgInput, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: t.border },
  dateButtonActive: { borderColor: t.green, backgroundColor: t.greenSoft },
  dateText:         { fontSize: 14, fontWeight: "600", color: t.green },
  datePlaceholder:  { fontSize: 14, color: t.textMuted },
  clearBtn:         { marginLeft: 8, padding: 4 },

  rowBetween:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 15, fontWeight: "700", color: t.text },
  switchSub:   { fontSize: 12, color: t.textMuted, marginTop: 1 },

  saveBtn:         { backgroundColor: t.green, borderRadius: 16, paddingVertical: 16, marginTop: 4, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  saveBtnDisabled: { backgroundColor: t.textMuted, shadowOpacity: 0 },
  saveBtnInner:    { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  saveBtnText:     { color: "#ffffff", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);

