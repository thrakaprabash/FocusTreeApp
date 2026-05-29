import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../state/ThemeContext';

const ITEM_HEIGHT = 46;
const VISIBLE_ITEMS = 3;
const REPEAT_COUNT = 3; // Minimal repetitions for highest performance

export default function WheelPicker({ items, selectedValue, onValueChange, width = 70, unit }) {
  const { theme, isDark } = useTheme();
  const scrollViewRef = useRef(null);
  
  // Create expanded items array
  const extendedItems = useMemo(() => {
    return Array.from({ length: items.length * REPEAT_COUNT }).map((_, i) => ({
      ...items[i % items.length],
      _key: i.toString() // unique key
    }));
  }, [items]);

  const middleSegmentIndex = Math.floor(REPEAT_COUNT / 2);
  const middleOffset = middleSegmentIndex * items.length;

  const getRealIndex = (val) => {
    const idx = items.findIndex(i => i.value === val);
    return idx >= 0 ? idx : 0;
  };

  const getScrollIndex = (val) => {
    return middleOffset + getRealIndex(val);
  };

  const activeIndexRef = useRef(getScrollIndex(selectedValue));
  const [activeIndex, setActiveIndex] = useState(activeIndexRef.current);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Delay rendering off-screen items to keep navigation perfectly smooth
    const t = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  const setIndex = (newIdx) => {
    activeIndexRef.current = newIdx;
    setActiveIndex(newIdx);
  };

  // Only react to external changes (like presets)
  useEffect(() => {
    const targetIdx = getRealIndex(selectedValue);
    const currentRealIdx = activeIndexRef.current % items.length;
    
    if (targetIdx !== currentRealIdx && scrollViewRef.current) {
      // jump to the new target index around the current active segment to minimize scroll distance
      const baseSegment = Math.floor(activeIndexRef.current / items.length) * items.length;
      let newIdx = baseSegment + targetIdx;
      
      // Support smooth transition when going backwards from 0 to 59 or 59 to 0
      const diff = targetIdx - currentRealIdx;
      if (Math.abs(diff) > items.length / 2) {
        if (diff > 0) newIdx -= items.length;
        else newIdx += items.length;
      }
      
      scrollViewRef.current.scrollTo({ y: newIdx * ITEM_HEIGHT, animated: true });
      setIndex(newIdx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, items]);

  // Initial scroll
  useEffect(() => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: activeIndex * ITEM_HEIGHT, animated: false });
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < extendedItems.length && index !== activeIndexRef.current) {
      setIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const resetToMiddle = (index) => {
    const realIdx = index % items.length;
    const targetIndex = middleOffset + realIdx;
    
    const currentSegment = Math.floor(index / items.length);
    if (currentSegment !== middleSegmentIndex) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: targetIndex * ITEM_HEIGHT, animated: false });
      }
      setIndex(targetIndex);
    }
  };

  const handleMomentumScrollEnd = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < extendedItems.length) {
      setIndex(index);
      onValueChange(extendedItems[index].value);
      resetToMiddle(index);
    }
  };

  const handleScrollEndDrag = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    
    // snap manually in case momentum didn't trigger
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    
    if (index >= 0 && index < extendedItems.length) {
      setIndex(index);
      onValueChange(extendedItems[index].value);
      
      setTimeout(() => {
        resetToMiddle(index);
      }, 400);
    }
  };

  return (
    <View style={[styles.container, { height: ITEM_HEIGHT * VISIBLE_ITEMS, width, backgroundColor: theme.bgInput, borderColor: theme.border }]}>
      {/* Highlight bar */}
      <View style={[styles.highlight, { top: ITEM_HEIGHT, height: ITEM_HEIGHT, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} pointerEvents="none" />
      
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled={true}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT,
        }}
      >
        {extendedItems.map((item, index) => {
          const isActive = index === activeIndex;
          const isAdjacent = Math.abs(index - activeIndex) === 1;
          
          let color = theme.border; // far items
          let scale = 0.8;
          let opacity = 0.3;
          
          if (isActive) {
            color = theme.text;
            scale = 1;
            opacity = 1;
          } else if (isAdjacent) {
            color = theme.textMuted;
            scale = 0.9;
            opacity = 0.7;
          }

          // Render a lightweight empty view for off-screen items during initial mount
          if (!isMounted && Math.abs(index - activeIndex) > 2) {
            return <View key={item._key} style={{ height: ITEM_HEIGHT }} />;
          }

          return (
            <View key={item._key} style={[styles.item, { height: ITEM_HEIGHT }]}>
              <Text style={[
                styles.itemText, 
                { color, opacity, transform: [{ scale }] }
              ]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Unit Text */}
      {unit && (
        <Text style={[styles.unitText, { color: theme.textMuted, top: ITEM_HEIGHT + (ITEM_HEIGHT / 2) - 8, right: 8 }]} pointerEvents="none">
          {unit}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative'
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 26,
    fontWeight: '800',
  },
  unitText: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '700',
  }
});
