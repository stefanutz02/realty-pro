// src/components/AppLoader.tsx

import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Easing, Text } from "react-native";

interface AppLoaderProps {
  visible: boolean;
  onFinish?: () => void;
}

export default function AppLoader({ visible, onFinish }: AppLoaderProps) {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 100,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShow(false);
        if (onFinish) onFinish();
      });
    }
  }, [visible]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.loaderWrap,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Text style={styles.brandText}>RealtyPro</Text>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progress.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    zIndex: 9999,
  },
  brandText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0A84FF",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  progressBarBg: {
    width: 160,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0A84FF",
  },
});
