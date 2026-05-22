// src/screens/Blog.tsx

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";

const BLOG_API =
  "https:

export default function Blog({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      const res = await fetch(`${BLOG_API}&page=${pageNum}`);
      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const data = await res.json();
      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setPosts(append ? (prev) => [...prev, ...data] : data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  const renderPost = ({ item }: { item: any }) => {
    const image = item._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const title = item.title?.rendered?.replace(/&.*?;/g, "");
    const date = new Date(item.date).toLocaleDateString("en-US");
    const author = item._embedded?.author?.[0]?.name || "RealtyPro";
    const excerpt =
      (item.excerpt?.rendered?.replace(/<[^>]+>/g, "") ?? "").slice(0, 120) + "...";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("BlogDetail", {
            url: item.link,
            title: item.title.rendered.replace(/&.*?;/g, ""),
          })
        }
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={styles.noImageText}>No image</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardExcerpt}>{excerpt}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardAuthor}>✍️ {author}</Text>
            <Text style={styles.cardDate}>{date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#666" }}>Loading articles...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <View style={styles.hero}>
                <Text style={styles.heroLogo}>RealtyPro</Text>
                <Text style={styles.heroTitle}>Articles & News</Text>
                <Text style={styles.heroSubtitle}>Latest blog posts</Text>
              </View>
            }
            ListFooterComponent={
              <>
                <Text style={styles.loadMoreText}>
                  {hasMore ? "Loading more articles..." : "You've reached the end 🎉"}
                </Text>
                <AppFooter />
              </>
            }
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },

  hero: {
    backgroundColor: "#0A84FF",
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogo: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 8, letterSpacing: 0.5 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 12,
  },
  heroSubtitle: { fontSize: 13, color: "#C8E0FF", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginVertical: 7,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  image: { width: "100%", height: 185 },
  noImage: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: { color: "#ccc" },
  cardBody: { padding: 14 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 6,
  },
  cardExcerpt: { fontSize: 13, color: "#555", marginBottom: 10, lineHeight: 19 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardAuthor: { fontSize: 12, color: "#0A84FF", fontWeight: "600" },
  cardDate: { fontSize: 12, color: "#999" },

  loadMoreText: {
    textAlign: "center",
    padding: 16,
    color: "#999",
    fontSize: 13,
  },
});
