import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const DEFAULT_SIZE = 280;

/**
 * Renders a single tree stage image.
 * The parent (TreeDisplay) provides the container / rings.
 * This component is purely responsible for the image itself.
 *
 * Props:
 *  - stage : tree stage object (from TREE_STAGES / getTreeStage)
 *  - size  : square side in dp (default 280)
 */
export default function TreeStage({ stage, size }) {
  if (!stage) return null;

  const resolvedSize = Number.isFinite(size) && size > 0 ? size : DEFAULT_SIZE;

  // ── Image from extracted_tree_snaps (or any future image asset) ─────────────
  if (stage.image) {
    return (
      <Image
        source={stage.image}
        style={{ width: resolvedSize, height: resolvedSize, resizeMode: "cover" }}
      />
    );
  }

  // ── Emoji fallback (legacy / debug use) ─────────────────────────────────────
  if (stage.emoji) {
    return (
      <View style={[styles.emojiWrap, { width: resolvedSize, height: resolvedSize }]}>
        <Text style={styles.emoji}>{stage.emoji}</Text>
        {stage.imageHint ? (
          <Text style={styles.hint}>{stage.imageHint}</Text>
        ) : null}
      </View>
    );
  }

  // ── Placeholder (no image, no emoji) ────────────────────────────────────────
  return (
    <View style={[styles.placeholder, { width: resolvedSize, height: resolvedSize }]}>
      <Text style={styles.placeholderText}>🌱</Text>
      <Text style={styles.placeholderText}>Stage {stage.stageNumber}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emojiWrap: {
    borderRadius: 16,
    backgroundColor: "#f2f6f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 12
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8
  },
  hint: {
    color: "#5c5c5c",
    fontSize: 11,
    textAlign: "center"
  },
  placeholder: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#c3c3c3",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  placeholderText: {
    color: "#5c5c5c",
    fontSize: 13,
    textAlign: "center"
  }
});
