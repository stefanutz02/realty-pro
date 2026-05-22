// src/navigation/FloatingTabBar.tsx

import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const BLUE     = "#0A84FF";
const INACTIVE = "#000000";
const WHITE    = "#FFFFFF";
const BAR_H    = 72;

const TABS = [
  { name: "Search",      label: "Search",     active: "search",        inactive: "search-outline" },
  { name: "AddProperty", label: "Add",        active: "add-circle",    inactive: "add-circle-outline" },
  { name: "Blog",        label: "Blog",       active: "document-text", inactive: "document-text-outline" },
  { name: "Credite",     label: "Mortgage",   active: "card",          inactive: "card-outline" },
  { name: "Contact",     label: "Contact",    active: "call",          inactive: "call-outline" },
  { name: "Favorite",    label: "Saved",      active: "heart",         inactive: "heart-outline" },
] as const;

type Props = BottomTabBarProps & {
  onReselectTab?: (name: string) => void;
};

export default function FloatingTabBar({ state, navigation, onReselectTab }: Props) {
  const insets   = useSafeAreaInsets();
  const screenW  = Dimensions.get("window").width;
  const SIDE     = Math.max(12, Math.min(20, screenW * 0.03));
  const barWidth = screenW - SIDE * 2;

  const activeName = state.routes[state.index]?.name as string;
  const activeIdx  = TABS.findIndex((t) => t.name === activeName);

  const scaleVals = useRef(
    TABS.map((_, i) => new Animated.Value(i === activeIdx ? 1 : 0.9))
  ).current;

  const colorVals = useRef(
    TABS.map((_, i) => new Animated.Value(i === activeIdx ? 1 : 0))
  ).current;

  useEffect(() => {
    TABS.forEach((_, i) => {
      Animated.spring(scaleVals[i], {
        toValue: i === activeIdx ? 1 : 0.9,
        stiffness: 300, damping: 25, mass: 0.6,
        useNativeDriver: true,
      }).start();

      Animated.spring(colorVals[i], {
        toValue: i === activeIdx ? 1 : 0,
        stiffness: 300, damping: 25, mass: 0.6,
        useNativeDriver: false,
      }).start();
    });
  }, [activeIdx]);

  const go = (name: string) => {
    if (name === activeName) { onReselectTab?.(name); return; }
    navigation.navigate(name);
  };

  return (
    <View
      style={[
        styles.outerWrap, 
        { paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: SIDE }
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { width: barWidth, height: BAR_H }]}>
        {TABS.map((t, i) => {
          const focused = activeIdx === i;

          const labelColor = colorVals[i].interpolate({
            inputRange:  [0, 1],
            outputRange: [INACTIVE, BLUE],
          });

          return (
            <TouchableOpacity
              key={t.name}
              onPress={() => go(t.name)}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <Animated.View 
                style={[
                  styles.iconContainer,
                  focused && styles.iconContainerActive,
                  { transform: [{ scale: scaleVals[i] }] }
                ]}
              >
                <Ionicons
                  name={(focused ? t.active : t.inactive) as any}
                  size={20}
                  color={focused ? WHITE : INACTIVE}
                />
              </Animated.View>

              <Animated.Text
                numberOfLines={1}
                style={[styles.tabLabel, { color: labelColor }]}
              >
                {t.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    backgroundColor: "transparent",
    zIndex: 100,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: WHITE,
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
    textAlign: "center",
    letterSpacing: -0.2,
  },
});
