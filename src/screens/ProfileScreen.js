import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TreeDisplay from "../components/TreeDisplay";
import { loadProfileName, saveProfileName } from "../services/storage";
import { useTasks } from "../state/TasksContext";
import { useTheme, LIGHT, DARK } from "../state/ThemeContext";
import { getStreakDays } from "../utils/streak";
import { XP_PER_LEVEL } from "../data/treeStages";

const DEFAULT_NAME = "Grower";

// ─── styles ───────────────────────────────────────────────────────────────────
const makeStyles = (t) => StyleSheet.create({
  screen:    { flex: 1, backgroundColor: t.bg },
  container: { flexGrow: 1, alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32 },

  pageTitle: { fontSize: 24, fontWeight: "800", color: t.text, letterSpacing: -0.3, marginBottom: 16, textAlign: "center", width: "100%" },

  settingsFab: { position: "absolute", right: 16, top: 10, width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", zIndex: 10, backgroundColor: t.greenSoft },

  nameSection: { alignItems: "center", marginBottom: 16, width: "100%" },
  displayRow:  { flexDirection: "row", alignItems: "center" },
  nameText:    { fontSize: 30, fontWeight: "800", color: t.green, letterSpacing: -0.5 },
  editInlineBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginLeft: 10, backgroundColor: t.greenSoft },

  levelPill: { marginTop: 8, backgroundColor: t.greenSoft, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: t.greenMid },
  levelPillText: { fontSize: 12, fontWeight: "700", color: t.green },

  editRow:     { alignItems: "center" },
  nameInput:   { minWidth: 220, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: t.greenMid, backgroundColor: t.bgCard, fontSize: 18, color: t.text, textAlign: "center" },
  editActions: { flexDirection: "row", marginTop: 10, gap: 8 },
  editButton:      { backgroundColor: t.green, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 12 },
  editButtonText:  { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  editButtonGhost: { borderWidth: 1.5, borderColor: t.green, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 12 },
  editButtonGhostText: { color: t.green, fontSize: 13, fontWeight: "700" },

  treeSection: { alignItems: "center", marginBottom: 16 },
  stageLabel:  { fontSize: 16, fontWeight: "700", color: t.text, textAlign: "center", marginTop: 10, letterSpacing: -0.2 },

  progressCard:  { width: "100%", backgroundColor: t.bgCard, borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  progressMeta:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: "600", color: t.textMuted },
  progressVal:   { fontSize: 12, fontWeight: "700", color: t.green },
  track: { height: 10, backgroundColor: t.greenSoft, borderRadius: 10, overflow: "hidden" },
  fill:  { height: "100%", backgroundColor: t.green, borderRadius: 10 },

  statsCard:   { width: "100%", backgroundColor: t.bgCard, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-around", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2, marginBottom: 12 },
  statBlock:   { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 36, backgroundColor: t.borderLight },
  statLabel:   { fontSize: 11, color: t.textMuted, marginTop: 3, textAlign: "center" },
  statValue:   { fontSize: 22, fontWeight: "800", color: t.green, letterSpacing: -0.3 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCard:     { backgroundColor: t.bgCard, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  modalHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle:    { fontSize: 18, fontWeight: "800", color: t.text },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.bgInput, alignItems: "center", justifyContent: "center" },

  appearanceLabel: { fontSize: 12, fontWeight: "700", color: t.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  themeRow:        { flexDirection: "row", gap: 8, marginBottom: 16 },
  themeChip:       { flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: t.border, backgroundColor: t.bgInput, alignItems: "center" },
  themeChipActive: { backgroundColor: t.green, borderColor: t.green },
  themeChipText:   { fontSize: 13, fontWeight: "700", color: t.textSub },
  themeChipTextActive: { color: "#ffffff" },

  xpInfoCard:  { backgroundColor: t.greenSoft, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: t.greenMid },
  xpInfoTitle: { fontSize: 13, fontWeight: "700", color: t.green, marginBottom: 8 },
  xpInfoLine:  { fontSize: 13, color: t.text, marginBottom: 4, lineHeight: 18 },
  xpInfoGain:  { color: t.green, fontWeight: "700" },
  xpInfoLoss:  { color: t.danger, fontWeight: "700" },

  action:       { backgroundColor: t.green, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  actionDanger: { backgroundColor: t.danger, marginBottom: 0 },
  actionText:   { color: "#ffffff", fontSize: 14, fontWeight: "700", flex: 1 }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);

// ─── component ────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { tasks, xp, level, treeStage, clearCompleted, resetDailyTasks, resetXp } = useTasks();
  const { theme, isDark, mode, setThemeMode } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;

  const [name,         setName]         = useState(DEFAULT_NAME);
  const [draftName,    setDraftName]    = useState(DEFAULT_NAME);
  const [isEditing,    setIsEditing]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadProfileName().then((storedName) => {
      if (!mounted) return;
      const resolved = storedName && storedName.trim() ? storedName.trim() : DEFAULT_NAME;
      setName(resolved);
      setDraftName(resolved);
    });
    return () => { mounted = false; };
  }, []);

  const streakDays = useMemo(() => getStreakDays(tasks), [tasks]);
  const levelXp    = xp - level * XP_PER_LEVEL;
  const progress   = Math.min(1, Math.max(0, levelXp / XP_PER_LEVEL));
  const pct        = Math.round(progress * 100);
  const stageNum   = treeStage?.stageNumber ?? 1;
  const totalStages = 100;

  const startEditing  = () => { setDraftName(name); setIsEditing(true); };
  const cancelEditing = () => { setDraftName(name); setIsEditing(false); };

  const saveName = async () => {
    const trimmed  = draftName.trim();
    const resolved = trimmed || DEFAULT_NAME;
    setName(resolved); setDraftName(resolved); setIsEditing(false);
    await saveProfileName(resolved);
  };

  const confirmResetXp = () => {
    Alert.alert("Reset XP", "This will reset your XP and tree stage back to zero. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetXp }
    ]);
  };

  const confirmClearCompleted = () => {
    Alert.alert("Clear Completed Tasks", "Remove all completed tasks permanently?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearCompleted }
    ]);
  };

  const THEME_OPTIONS = [
    { key: "light",  label: "☀️ Light"  },
    { key: "dark",   label: "🌙 Dark"   },
    { key: "system", label: "⚙️ System" }
  ];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable accessibilityLabel="Open settings" accessibilityRole="button" style={styles.settingsFab} onPress={() => setShowSettings(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="settings-outline" size={22} color={theme.green} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>My Profile</Text>

        <View style={styles.nameSection}>
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput style={styles.nameInput} value={draftName} onChangeText={setDraftName} placeholder="Enter your name" placeholderTextColor={theme.textMuted} autoFocus returnKeyType="done" onSubmitEditing={saveName} />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.editButton} onPress={saveName}>
                  <Text style={styles.editButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButtonGhost} onPress={cancelEditing}>
                  <Text style={styles.editButtonGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.displayRow}>
              <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
              <TouchableOpacity style={styles.editInlineBtn} onPress={startEditing} accessibilityLabel="Edit name">
                <Ionicons name="create-outline" size={18} color={theme.green} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>Level {level}  ·  Stage {stageNum}/{totalStages}</Text>
          </View>
        </View>

        <View style={styles.treeSection}>
          <TreeDisplay stage={treeStage} size={190} />
          <Text style={styles.stageLabel}>{treeStage?.label ?? "Your Tree"}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>Progress to Level {level + 1}</Text>
            <Text style={styles.progressVal}>{levelXp} / {XP_PER_LEVEL} XP</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{streakDays > 0 ? `${streakDays}d` : "—"}</Text>
            <Text style={styles.statLabel}>{streakDays > 0 ? "Streak 🔥" : "No streak"}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{tasks.filter(t => t.completedAt).length}</Text>
            <Text style={styles.statLabel}>Done ✅</Text>
          </View>
        </View>
      </ScrollView>

      {/* Settings modal */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Pressable accessibilityLabel="Close settings" style={styles.modalCloseBtn} onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            {/* Appearance */}
            <Text style={styles.appearanceLabel}>Appearance</Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map(opt => {
                const active = mode === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.themeChip, active && styles.themeChipActive]}
                    onPress={() => setThemeMode(opt.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* XP info */}
            <View style={styles.xpInfoCard}>
              <Text style={styles.xpInfoTitle}>How XP Works</Text>
              <Text style={styles.xpInfoLine}>✅  Complete a task → <Text style={styles.xpInfoGain}>+10 XP</Text></Text>
              <Text style={styles.xpInfoLine}>⚠️  Miss a deadline → <Text style={styles.xpInfoLoss}>–10 XP</Text></Text>
              <Text style={styles.xpInfoLine}>🌳  Every 100 XP = 1 level, tree grows</Text>
            </View>

            <TouchableOpacity style={styles.action} onPress={() => { resetDailyTasks(); setShowSettings(false); }}>
              <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionText}>Reset Daily Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={() => { confirmClearCompleted(); setShowSettings(false); }}>
              <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionText}>Clear Completed Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.actionDanger]} onPress={() => { confirmResetXp(); setShowSettings(false); }}>
              <Ionicons name="warning-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionText}>Reset XP & Tree</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
