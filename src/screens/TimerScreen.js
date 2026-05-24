import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import TreeDisplay from "../components/TreeDisplay";
import { getTreeStage, TREE_STAGES } from "../data/treeStages";
import { useTheme, LIGHT, DARK } from "../state/ThemeContext";
import { fireTimerDoneNotification } from "../services/notifications";
import { playAlarmSound, stopAlarmSound } from "../services/sound";


// ─── helpers ──────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const fmt = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const fmtInterval = (secs) => {
  if (secs >= 3600) return `${(secs / 3600).toFixed(1)} hr`;
  if (secs >= 60)   return `${(secs / 60).toFixed(1)} min`;
  if (Number.isInteger(secs)) return `${secs} sec`;
  return `${secs.toFixed(2)} sec`;
};

// ─── styles ───────────────────────────────────────────────────────────────────
const makeStyles = (t) => StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: t.bg },
  container:  { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, alignItems: "stretch" },

  header:     { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: t.text, letterSpacing: -0.5 },
  headerSub:   { fontSize: 14, color: t.textSub, marginTop: 4, fontWeight: "500" },

  card: {
    backgroundColor: t.bgCard, borderRadius: 24, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 4
  },
  cardLabel: {
    fontSize: 11, fontWeight: "700", color: t.textMuted,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10
  },

  presetRow:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  presetChip:       { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: t.greenMid, backgroundColor: t.greenSoft },
  presetChipActive: { backgroundColor: t.green, borderColor: t.green },
  presetChipText:   { fontSize: 13, fontWeight: "700", color: t.green },
  presetChipTextActive: { color: "#ffffff" },

  hmsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 16 },
  hmsField: { flex: 1, alignItems: "center", backgroundColor: t.bgInput, borderRadius: 14, borderWidth: 1.5, borderColor: t.border, paddingVertical: 10, paddingHorizontal: 6 },
  hmsInput:  { fontSize: 32, fontWeight: "800", color: t.text, textAlign: "center", width: "100%" },
  hmsUnit:   { fontSize: 12, fontWeight: "700", color: t.textMuted, marginTop: 2 },
  hmsColon:  { fontSize: 28, fontWeight: "800", color: t.border, marginHorizontal: 2 },

  infoBox:     { backgroundColor: t.greenSoft, borderRadius: 14, borderWidth: 1, borderColor: t.greenMid, padding: 14, marginBottom: 20 },
  infoRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoDivider: { height: 1, backgroundColor: t.greenMid, marginVertical: 8 },
  infoKey:     { fontSize: 13, fontWeight: "600", color: t.textSub },
  infoVal:     { fontSize: 13, fontWeight: "800", color: t.green },

  startBtn:         { backgroundColor: t.green, borderRadius: 16, paddingVertical: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  startBtnDisabled: { backgroundColor: t.greenMid, shadowOpacity: 0 },
  startBtnText:     { color: "#ffffff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },

  countdownCard: { backgroundColor: t.bgCard, borderRadius: 24, padding: 20, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4, marginBottom: 20 },
  countdown:     { fontSize: 64, fontWeight: "800", color: t.text, letterSpacing: -2 },
  growBadge:     { marginTop: 6, marginBottom: 16, backgroundColor: t.greenSoft, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: t.greenMid },
  growBadgeText: { fontSize: 13, fontWeight: "700", color: t.green },

  trackWrap:    { width: "100%", alignItems: "center" },
  track:        { width: "100%", height: 10, backgroundColor: t.greenSoft, borderRadius: 10, overflow: "hidden", marginBottom: 6 },
  fill:         { height: "100%", backgroundColor: t.green, borderRadius: 10 },
  progressText: { fontSize: 12, color: t.textMuted, fontWeight: "600" },

  treeSection: { alignItems: "center", marginVertical: 8 },
  stageLabel:  { fontSize: 18, fontWeight: "700", color: t.text, textAlign: "center", letterSpacing: -0.2, marginTop: 8 },
  stagePill:   { alignSelf: "center", marginTop: 6, marginBottom: 20, backgroundColor: t.greenSoft, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: t.greenMid },
  stagePillText: { fontSize: 13, fontWeight: "700", color: t.green },

  controlRow: { flexDirection: "row", gap: 12 },
  ctrlBtn:    { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  pauseBtn:   { backgroundColor: t.warnSoft,  borderWidth: 1.5, borderColor: t.warn },
  resumeBtn:  { backgroundColor: t.greenSoft, borderWidth: 1.5, borderColor: t.greenMid },
  resetBtn:   { backgroundColor: t.bgInput,   borderWidth: 1.5, borderColor: t.border },
  ctrlBtnText:  { fontSize: 15, fontWeight: "800", color: t.text },
  resetBtnText: { color: t.textMuted }
});

const lightStyles = makeStyles(LIGHT);
const darkStyles  = makeStyles(DARK);

// ─── component ────────────────────────────────────────────────────────────────
export default function TimerScreen() {
  const { isDark } = useTheme();
  const styles = isDark ? darkStyles : lightStyles;

  const [inputH, setInputH] = useState("0");
  const [inputM, setInputM] = useState("1");
  const [inputS, setInputS] = useState("40");

  const [totalSeconds,     setTotalSeconds]     = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning,        setIsRunning]        = useState(false);
  const [started,          setStarted]          = useState(false);
  const [treeStageIndex,   setTreeStageIndex]   = useState(0);

  const growAnim    = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  const totalStages  = TREE_STAGES.length;
  const currentStage = getTreeStage(treeStageIndex);
  const elapsed      = totalSeconds - remainingSeconds;
  const progressPct  = totalSeconds > 0 ? clamp((elapsed / totalSeconds) * 100, 0, 100) : 0;
  const growInterval = totalSeconds > 0 ? totalSeconds / 100 : 1;

  // ── Cleanup alarm on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => { stopAlarmSound(); };
  }, []);

  const playAlarm = useCallback(() => playAlarmSound(), []);
  const stopAlarm = useCallback(() => stopAlarmSound(), []);


  // ── Countdown tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isRunning]);

  // ── Tree growth + completion ─────────────────────────────────────────────────
  useEffect(() => {
    if (!started || totalSeconds === 0) return;
    const elapsedNow = totalSeconds - remainingSeconds;
    const newIndex = clamp(Math.floor(elapsedNow / growInterval), 0, totalStages - 1);
    setTreeStageIndex((prev) => {
      if (newIndex > prev) {
        Animated.sequence([
          Animated.timing(growAnim, { toValue: 1.13, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(growAnim, { toValue: 1,    duration: 280, easing: Easing.in(Easing.quad),  useNativeDriver: true })
        ]).start();
      }
      return newIndex;
    });

    if (remainingSeconds === 0 && elapsedNow > 0) {
      setTreeStageIndex(totalStages - 1);
      // 🔔 Play alarm sound + send notification
      playAlarm();
      fireTimerDoneNotification();
      Alert.alert(
        "🌳 Timer Complete!",
        "Your tree has fully grown!\nGreat focus session! 🎉",
        [{ text: "Awesome! 🎉", onPress: stopAlarm }]
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  // ── Controls ────────────────────────────────────────────────────────────────
  const handleStart = () => {
    const secs = (parseInt(inputH, 10) || 0) * 3600 + (parseInt(inputM, 10) || 0) * 60 + (parseInt(inputS, 10) || 0);
    if (secs <= 0) { Alert.alert("Invalid time", "Please enter at least 1 second."); return; }
    setTotalSeconds(secs); setRemainingSeconds(secs);
    setTreeStageIndex(0); setStarted(true); setIsRunning(true);
  };

  const handlePause  = () => setIsRunning(false);
  const handleResume = () => { if (remainingSeconds > 0) setIsRunning(true); };
  const handleReset  = () => {
    stopAlarm();
    setIsRunning(false); setStarted(false);
    setRemainingSeconds(0); setTotalSeconds(0); setTreeStageIndex(0);
  };

  const PRESETS = [
    { label: "1 min 40 s", h: 0, m: 1,  s: 40 },
    { label: "25 min",     h: 0, m: 25, s: 0  },
    { label: "45 min",     h: 0, m: 45, s: 0  },
    { label: "1 hr",       h: 1, m: 0,  s: 0  },
    { label: "2 hr",       h: 2, m: 0,  s: 0  }
  ];

  const applyPreset = (p) => { setInputH(String(p.h)); setInputM(String(p.m)); setInputS(String(p.s)); };

  const previewH = parseInt(inputH, 10) || 0;
  const previewM = parseInt(inputM, 10) || 0;
  const previewS = parseInt(inputS, 10) || 0;
  const previewTotal    = previewH * 3600 + previewM * 60 + previewS;
  const previewInterval = previewTotal > 0 ? previewTotal / 100 : 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Focus Timer 🌱</Text>
        <Text style={styles.headerSub}>Your tree grows in 100 equal stages across your session</Text>
      </View>

      {!started && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Quick Presets</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p) => {
              const active = previewH === p.h && previewM === p.m && previewS === p.s;
              return (
                <TouchableOpacity key={p.label} style={[styles.presetChip, active && styles.presetChipActive]} onPress={() => applyPreset(p)} activeOpacity={0.75}>
                  <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.cardLabel, { marginTop: 16 }]}>Custom Duration</Text>
          <View style={styles.hmsRow}>
            {[{ val: inputH, set: setInputH, unit: "h" }, { val: inputM, set: setInputM, unit: "m" }, { val: inputS, set: setInputS, unit: "s" }].map(({ val, set, unit }, i) => (
              <React.Fragment key={unit}>
                {i > 0 && <Text style={styles.hmsColon}>:</Text>}
                <View style={styles.hmsField}>
                  <TextInput style={styles.hmsInput} value={val} onChangeText={set} keyboardType="number-pad" maxLength={2} selectTextOnFocus />
                  <Text style={styles.hmsUnit}>{unit}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {previewTotal > 0 && (
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Total duration</Text>
                <Text style={styles.infoVal}>{previewTotal} seconds</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>100 tree stages</Text>
                <Text style={styles.infoVal}>1 stage every {fmtInterval(previewInterval)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.startBtn, previewTotal === 0 && styles.startBtnDisabled]} onPress={handleStart} activeOpacity={0.85} disabled={previewTotal === 0}>
            <Text style={styles.startBtnText}>▶  Start Growing</Text>
          </TouchableOpacity>
        </View>
      )}

      {started && (
        <>
          <View style={styles.countdownCard}>
            <Text style={styles.countdown}>{fmt(remainingSeconds)}</Text>
            <View style={styles.growBadge}>
              <Text style={styles.growBadgeText}>🌿 1 stage every {fmtInterval(growInterval)}</Text>
            </View>
            <View style={styles.trackWrap}>
              <View style={styles.track}>
                <Animated.View style={[styles.fill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progressPct)}% — Stage {treeStageIndex + 1} / {totalStages}</Text>
            </View>
          </View>

          <Animated.View style={[styles.treeSection, { transform: [{ scale: growAnim }] }]}>
            <TreeDisplay stage={currentStage} size={180} />
          </Animated.View>
          <Text style={styles.stageLabel}>{currentStage?.label ?? "Your Tree"}</Text>
          <View style={styles.stagePill}>
            <Text style={styles.stagePillText}>Stage {treeStageIndex + 1} / {totalStages}</Text>
          </View>

          <View style={styles.controlRow}>
            {isRunning ? (
              <TouchableOpacity style={[styles.ctrlBtn, styles.pauseBtn]} onPress={handlePause} activeOpacity={0.8}>
                <Text style={styles.ctrlBtnText}>⏸  Pause</Text>
              </TouchableOpacity>
            ) : remainingSeconds > 0 ? (
              <TouchableOpacity style={[styles.ctrlBtn, styles.resumeBtn]} onPress={handleResume} activeOpacity={0.8}>
                <Text style={styles.ctrlBtnText}>▶  Resume</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.ctrlBtn, styles.resetBtn]} onPress={handleReset} activeOpacity={0.8}>
              <Text style={[styles.ctrlBtnText, styles.resetBtnText]}>↺  Reset</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}
