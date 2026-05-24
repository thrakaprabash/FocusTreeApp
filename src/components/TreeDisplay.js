import React from "react";
import { StyleSheet, View } from "react-native";
import TreeStage from "./TreeStage";
import { useTheme } from "../state/ThemeContext";

/**
 * TreeDisplay wraps TreeStage in a premium concentric-ring backdrop.
 * The three rings simulate a glowing forest habitat. Ring colors shift
 * between a deep forest green (light mode) and a bright jade (dark mode).
 */
export default function TreeDisplay({ stage, size = 180 }) {
  const { isDark } = useTheme();

  const ring3Size = size + 20;
  const ring2Size = size + 48;
  const ring1Size = size + 76;

  // Brighter rgba values in dark mode for more visible glow
  const r = isDark ? "74,222,128" : "43,122,61";

  return (
    <View
      style={[
        styles.ring1,
        { width: ring1Size, height: ring1Size, borderRadius: ring1Size / 2, backgroundColor: `rgba(${r},0.06)` }
      ]}
    >
      <View
        style={[
          styles.ring2,
          { width: ring2Size, height: ring2Size, borderRadius: ring2Size / 2, backgroundColor: `rgba(${r},0.10)`, borderColor: `rgba(${r},0.16)` }
        ]}
      >
        <View
          style={[
            styles.ring3,
            { width: ring3Size, height: ring3Size, borderRadius: ring3Size / 2, backgroundColor: `rgba(${r},0.09)`, borderColor: `rgba(${r},0.24)` }
          ]}
        >
          <TreeStage stage={stage} size={ring3Size} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring1: { alignItems: "center", justifyContent: "center" },
  ring2: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
  ring3: { alignItems: "center", justifyContent: "center", borderWidth: 1.5, overflow: "hidden" }
});
