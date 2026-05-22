// src/components/AppFooter.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const YEAR = new Date().getFullYear();

interface AppFooterProps {
  variant?: "inline" | "compact";
}

function CompactFooter() {
  return (
    <View style={c.wrap}>
      <View style={c.inner}>
        <Text style={c.text}>
          © {YEAR} Stefan Vasilescu · All rights reserved
        </Text>
      </View>
    </View>
  );
}

const c = StyleSheet.create({
  wrap: {
    backgroundColor: "#F0F4FF",
    borderTopWidth: 1,
    borderTopColor: "#DDEAFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  inner: { flexDirection: "row", alignItems: "center", gap: 6 },
  text: { fontSize: 11, color: "#6B7FA3", textAlign: "center", lineHeight: 16 },
});

export default function AppFooter({
  variant = "inline",
}: AppFooterProps) {
  if (variant === "compact") return <CompactFooter />;

  return (
    <View style={styles.footer}>
      <View style={styles.topCurve} />

      <Text style={styles.tagline}>Real Estate, Made Simple</Text>

      <View style={styles.divider} />

      <Text style={styles.companyName}>RealtyPro</Text>
      <Text style={styles.legal}>
        A modern real estate platform{"\n"}Built with React Native & Expo
      </Text>

      <Text style={styles.copyright}>
        © {YEAR} Stefan Vasilescu{"\n"}All rights reserved
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#0A84FF",
    paddingTop: 0,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 20,
  },

  topCurve: {
    width: "130%",
    height: 32,
    backgroundColor: "#F5F7FA",
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    marginBottom: 20,
    alignSelf: "center",
  },

  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.5,
    marginBottom: 18,
  },

  divider: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 18,
  },

  companyName: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  legal: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 10,
  },
  copyright: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 2,
  },
});