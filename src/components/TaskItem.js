import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDateTime } from "../utils/time";
import EditTaskModal from "./EditTaskModal";
import { useTheme, LIGHT, DARK } from "../state/ThemeContext";

const PRIORITY_COLORS = {
  low:    { color: "#3a86ff", bg: "#eef3ff", label: "Low" },
  medium: { color: "#f4a261", bg: "#fff5eb", label: "Medium" },
  high:   { color: "#e63946", bg: "#fff0f0", label: "High" }
};

// dark priority bg variants
const PRIORITY_COLORS_DARK = {
  low:    { color: "#60a5fa", bg: "#0d1e35", label: "Low" },
  medium: { color: "#fbbf24", bg: "#2d2000", label: "Medium" },
  high:   { color: "#f87171", bg: "#2d1212", label: "High" }
};

const makeStyles = (t) => StyleSheet.create({
  card: { backgroundColor: t.bgInput, borderRadius: 14, padding: 16, marginBottom: 12, overflow: "hidden" },
  cardDone: { opacity: 0.72, borderWidth: 1, borderColor: t.greenMid },
  cardPenalized: { borderWidth: 1, borderColor: t.dangerBorder, backgroundColor: t.dangerSoft },

  stripDone:      { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t.green },
  stripPenalized: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t.danger },

  rowBetween: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  title:      { flex: 1, fontSize: 15, fontWeight: "700", color: t.text, lineHeight: 21 },
  titleDone:  { textDecorationLine: "line-through", color: t.textMuted },
  xp:         { fontSize: 13, fontWeight: "700", color: t.green, marginTop: 2 },
  xpDone:     { color: t.textMuted },

  overdueRow:    { marginTop: 6, marginBottom: 2 },
  overdueBadge:  { alignSelf: "flex-start", backgroundColor: t.dangerSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: t.dangerBorder },
  overdueBadgeText: { fontSize: 11, fontWeight: "700", color: t.danger },

  priorityBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  priorityBadgeText: { fontSize: 10, fontWeight: "700" },

  notes: { fontSize: 12, color: t.textSub, marginTop: 5, lineHeight: 17, fontStyle: "italic" },
  meta:    { fontSize: 12, color: t.textSub, marginTop: 4 },
  metaRed: { color: t.danger },
  daily:   { fontSize: 12, fontWeight: "600", color: t.green, marginTop: 4 },

  actions:       { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 },
  actionComplete: { flexDirection: "row", alignItems: "center", backgroundColor: t.green, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  actionEdit:     { flexDirection: "row", alignItems: "center", backgroundColor: t.greenSoft, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: t.greenMid },
  actionEditText: { color: t.green, fontSize: 12, fontWeight: "700" },
  actionDelete:   { flexDirection: "row", alignItems: "center", backgroundColor: t.textMuted, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  actionText:     { color: "#ffffff", fontSize: 12, fontWeight: "700" }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);

export default function TaskItem({ task, onComplete, onDelete }) {
  const { isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;
  const priorityColors = isDark ? PRIORITY_COLORS_DARK : PRIORITY_COLORS;

  const isCompleted = Boolean(task.completedAt);
  const isPenalized = Boolean(task.penalized) && !isCompleted;
  const [editVisible, setEditVisible] = useState(false);

  return (
    <>
      <View style={[styles.card, isCompleted && styles.cardDone, isPenalized && styles.cardPenalized]}>
        {isCompleted && <View style={styles.stripDone} />}
        {isPenalized && <View style={styles.stripPenalized} />}

        <View style={styles.rowBetween}>
          <Text style={[styles.title, isCompleted && styles.titleDone]} numberOfLines={2}>{task.title}</Text>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={[styles.xp, isCompleted && styles.xpDone]}>+{task.xpValue} XP</Text>
            {task.priority && priorityColors[task.priority] && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[task.priority].bg }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityColors[task.priority].color }]}>
                  {priorityColors[task.priority].label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isPenalized && (
          <View style={styles.overdueRow}>
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>⚠️ Deadline missed · –10 XP deducted</Text>
            </View>
          </View>
        )}

        {task.notes ? <Text style={styles.notes} numberOfLines={2}>{task.notes}</Text> : null}

        <Text style={[styles.meta, isPenalized && styles.metaRed]}>{formatDateTime(task.dueAt)}</Text>
        {task.isDaily && <Text style={styles.daily}>🔁 Daily task</Text>}

        <View style={styles.actions}>
          {!isCompleted && (
            <TouchableOpacity style={styles.actionComplete} onPress={onComplete}>
              <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.actionText}>Complete</Text>
            </TouchableOpacity>
          )}
          {!isCompleted && (
            <TouchableOpacity style={styles.actionEdit} onPress={() => setEditVisible(true)}>
              <Ionicons name="create-outline" size={13} color={isDark ? DARK.green : LIGHT.green} style={{ marginRight: 4 }} />
              <Text style={styles.actionEditText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionDelete} onPress={onDelete}>
            <Ionicons name="trash-outline" size={13} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <EditTaskModal visible={editVisible} task={task} onClose={() => setEditVisible(false)} />
    </>
  );
}
