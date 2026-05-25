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
  cardDone: { opacity: 0.6, backgroundColor: t.bgHero, borderWidth: 1, borderColor: t.borderLight },
  cardPenalized: { borderWidth: 1, borderColor: t.dangerBorder, backgroundColor: t.dangerSoft },

  stripPenalized: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t.danger },

  rowBetween: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  title:      { flex: 1, fontSize: 16, fontWeight: "600", color: t.text, lineHeight: 22 },
  titleDone:  { textDecorationLine: "line-through", color: t.textMuted },
  
  badgesRight: { alignItems: "flex-end", gap: 4 },
  xp:         { fontSize: 13, fontWeight: "700", color: t.green },
  xpDone:     { color: t.textMuted },

  overdueRow:    { marginTop: 6, marginBottom: 2 },
  overdueBadge:  { alignSelf: "flex-start", backgroundColor: t.dangerSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: t.dangerBorder },
  overdueBadgeText: { fontSize: 11, fontWeight: "700", color: t.danger },

  priorityBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  priorityBadgeText: { fontSize: 10, fontWeight: "700" },

  notes: { fontSize: 13, color: t.textSub, marginTop: 6, lineHeight: 18 },
  
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8, flexWrap: "wrap" },
  meta:    { fontSize: 12, color: t.textMuted },
  metaRed: { color: t.danger },
  daily:   { fontSize: 12, fontWeight: "600", color: t.blue },

  actionsContainer: { flexDirection: "row", alignItems: "center", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: t.borderLight, gap: 8 },
  
  btnComplete: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: t.green, paddingVertical: 8, borderRadius: 8 },
  btnCompleteText: { color: "#fff", fontSize: 13, fontWeight: "700", marginLeft: 4 },

  btnEdit: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: t.greenSoft, borderWidth: 1, borderColor: t.greenMid, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 },
  btnEditText: { color: t.green, fontSize: 13, fontWeight: "600", marginLeft: 4 },

  btnDelete: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: t.dangerSoft, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnDeleteText: { color: t.danger, fontSize: 13, fontWeight: "600", marginLeft: 4 }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);

export default function TaskItem({ task, onComplete, onDelete }) {
  const { isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;
  const colors = isDark ? DARK : LIGHT;
  const priorityColors = isDark ? PRIORITY_COLORS_DARK : PRIORITY_COLORS;

  const isCompleted = Boolean(task.completedAt);
  const isPenalized = Boolean(task.penalized) && !isCompleted;
  const [editVisible, setEditVisible] = useState(false);

  return (
    <>
      <View style={[styles.card, isCompleted && styles.cardDone, isPenalized && styles.cardPenalized]}>
        {isPenalized && <View style={styles.stripPenalized} />}

        <View style={styles.rowBetween}>
          <Text style={[styles.title, isCompleted && styles.titleDone]} numberOfLines={2}>{task.title}</Text>
          <View style={styles.badgesRight}>
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

        <View style={styles.metaRow}>
          <Text style={[styles.meta, isPenalized && styles.metaRed]}>{formatDateTime(task.dueAt)}</Text>
          {task.isDaily && <Text style={styles.daily}>· 🔁 Daily task</Text>}
        </View>

        <View style={[styles.actionsContainer, isCompleted && { justifyContent: "flex-end", borderTopWidth: 0, paddingTop: 0 }]} >
          {!isCompleted && (
            <TouchableOpacity style={styles.btnComplete} onPress={onComplete}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.btnCompleteText}>Complete</Text>
            </TouchableOpacity>
          )}
          {!isCompleted && (
            <TouchableOpacity style={styles.btnEdit} onPress={() => setEditVisible(true)}>
              <Ionicons name="create-outline" size={16} color={colors.green} />
              <Text style={styles.btnEditText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.btnDelete} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            {isCompleted && <Text style={styles.btnDeleteText}>Delete Task</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <EditTaskModal visible={editVisible} task={task} onClose={() => setEditVisible(false)} />
    </>
  );
}
