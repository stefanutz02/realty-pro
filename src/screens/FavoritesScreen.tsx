// src/screens/FavoritesScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../context/AuthModal";

const BLUE = "#0A84FF";
const GOLD = "#D68B1A";

function stripHtml(html: any): string {
  if (!html) return "";
  if (typeof html === "object") html = html.ro || html.en || Object.values(html)[0];
  if (typeof html !== "string") html = String(html);
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

function fmtPrice(p: any, currency = "€"): string {
  if (!p) return "Price upon request";
  const n = Number(p);
  if (isNaN(n) || n === 0) return "Price upon request";
  return `${n.toLocaleString("en-US")} ${currency}`;
}

interface Props {
  navigation: any;
  isActive?: boolean;
  onNavigateToTab?: (tabName: string) => void;
}

export default function FavoritesScreen({ navigation, isActive, onNavigateToTab }: Props) {
  const { user, favoriteItems, toggleFavorite, isFavorite, refreshFavorites } = useAuth();
  const [authModal, setAuthModal] = useState(false);

  useEffect(() => {
    if (isActive && user) {
      refreshFavorites();
    }
  }, [isActive, user]);

  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshFavorites();
      }
    });
    return () => sub.remove();
  }, [user, refreshFavorites]);

  const goToSearch = useCallback(() => {
    if (onNavigateToTab) {
      onNavigateToTab("Search");
    } else {
      try {
        navigation.navigate("Tabs", { screen: "Search" });
      } catch {
        navigation.goBack();
      }
    }
  }, [onNavigateToTab, navigation]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Saved</Text>
          <Text style={styles.heroSubtitle}>Your saved properties</Text>
        </View>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={52} color={BLUE} />
          </View>
          <Text style={styles.emptyTitle}>Account required</Text>
          <Text style={styles.emptyText}>
            Sign in to save your favorite properties and access them from any device.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => setAuthModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => setAuthModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>Don't have an account? Sign up free →</Text>
          </TouchableOpacity>
        </View>
        <AuthModal visible={authModal} onClose={() => setAuthModal(false)} />
      </SafeAreaView>
    );
  }

  if (favoriteItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Saved</Text>
          <Text style={styles.heroSubtitle}>No saved properties yet</Text>
        </View>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-dislike-outline" size={52} color="#ccc" />
          </View>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptyText}>
            Tap the ❤️ icon on any property to save it here.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={goToSearch}
            activeOpacity={0.85}
          >
            <Ionicons name="search-outline" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>Search properties</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderCard = ({ item }: { item: any }) => {
    const title = stripHtml(item.title ?? item.name ?? "Property");
    const images: string[] = item.images ?? [];
    const thumb = images[0] ?? null;
    const price = item.price;
    const currency = item.currency ?? "€";
    const city = item.city?.name ?? item.location ?? "";
    const rooms = item.rooms;
    const surface = item.surface_size ?? item.surface_useful;
    const transaction = item.transaction?.name ?? "";
    const isRent = transaction.toLowerCase().includes("rental");
    const fav = isFavorite(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => navigation.navigate("PropertyDetail", { propertyData: item })}
      >
        <View style={styles.imageWrap}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Ionicons name="image-outline" size={36} color="#ccc" />
            </View>
          )}
          {transaction ? (
            <View style={[styles.badge, isRent ? styles.badgeRent : styles.badgeSale]}>
              <Text style={styles.badgeText}>{transaction}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => toggleFavorite(item.id, item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={fav ? "heart" : "heart-outline"}
              size={22}
              color={fav ? "#FF3B5C" : "#fff"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          <View style={styles.cardMeta}>
            {city ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color="#999" />
                <Text style={styles.metaText}>{city}</Text>
              </View>
            ) : null}
            {rooms ? (
              <View style={styles.metaItem}>
                <Ionicons name="bed-outline" size={12} color="#999" />
                <Text style={styles.metaText}>{rooms} bed.</Text>
              </View>
            ) : null}
            {surface ? (
              <View style={styles.metaItem}>
                <Ionicons name="expand-outline" size={12} color="#999" />
                <Text style={styles.metaText}>{surface} m²</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardPrice, { color: isRent ? GOLD : BLUE }]}>
            {fmtPrice(price, currency)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={favoriteItems}
        renderItem={renderCard}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Saved</Text>
            <Text style={styles.heroSubtitle}>
              {favoriteItems.length}{" "}
              {favoriteItems.length === 1 ? "property saved" : "properties saved"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  hero: {
    backgroundColor: BLUE,
    paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20,
  },
  heroTitle: { fontSize: 26, fontWeight: "900", color: "#fff" },
  heroSubtitle: { fontSize: 13, color: "#C8E0FF", marginTop: 4 },
  emptyWrap: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: "#EAF2FF",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginBottom: 10 },
  emptyText: {
    fontSize: 14, color: "#888", textAlign: "center", lineHeight: 21, marginBottom: 28,
  },
  loginBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: BLUE, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32, marginBottom: 14,
  },
  loginBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  registerBtn: { padding: 4 },
  registerBtnText: { fontSize: 13, color: BLUE, fontWeight: "600" },
  card: {
    marginHorizontal: 14, marginVertical: 7,
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 195 },
  noImage: { backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute", top: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeSale: { backgroundColor: BLUE },
  badgeRent: { backgroundColor: GOLD },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heartBtn: {
    position: "absolute", top: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { padding: 13 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 6 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: "#888" },
  cardPrice: { fontSize: 16, fontWeight: "800" },
});
