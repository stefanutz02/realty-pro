// src/screens/PropertyDetailScreen.tsx

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import YoutubeIframe from "react-native-youtube-iframe";
import { useAuth } from "../context/AuthContext";

const API_BASE = "https:

const { width: SCREEN_W } = Dimensions.get("window");
const BLUE = "#0A84FF";
const GOLD = "#D68B1A";

function stripHtml(html: any): string {
  if (html === null || html === undefined) return ""
  if (typeof html === "object") {
    if (typeof html.ro === "string") html = html.ro
    else if (typeof html.en === "string") html = html.en
    else {
      const firstValue = Object.values(html).find((value) => typeof value === "string")
      html = firstValue ?? ""
    }
  }
  if (typeof html !== "string") html = String(html)
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .trim()
}

const CURRENCY_MAP: Record<number | string, string> = {
  1: "€",
  2: "RON",
  3: "$",
  "EUR": "€",
  "RON": "RON",
  "USD": "$",
  "eur": "€",
  "ron": "RON",
  "usd": "$",
};

const FURNITURE_MAP: Record<number, string> = {
  30301: "Unfurnished",
  30302: "Partially furnished",
  30303: "Fully furnished",
  30304: "Luxury furnished",
};

const FLOOR_MAP: Record<number, string> = {
  2: "Basement",
  3: "Ground floor",
  1000: "Attic",
  10: "Floor 1",
  20: "Floor 2",
  30: "Floor 3",
  40: "Floor 4",
  50: "Floor 5",
  60: "Floor 6",
  70: "Floor 7",
  80: "Floor 8",
  90: "Floor 9",
  100: "Floor 10",
  110: "Floor 11",
  120: "Floor 12",
  130: "Floor 13",
};

const partitioningLabels: { [key: number]: string } = {
  1: "Separated",
  2: "Semi-separated",
  3: "Non-separated",
  4: "Circular",
  5: "Wagon-style"
};

function getCurrencySymbol(currency: any): string {
  if (!currency) return "€";
  if (currency === "€" || currency === "RON") return currency;
  return CURRENCY_MAP[currency] || "€";
}

function fmtPrice(p: any, currency: any): string {
  if (!p) return "Price upon request";
  const n = Number(p);
  if (isNaN(n) || n === 0) return "Price upon request";
  const symbol = getCurrencySymbol(currency);
  return `${n.toLocaleString("en-US")} ${symbol}`;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

function ImageGallery({ images, propertyId, propertyData }: { images: string[]; propertyId: string | number; propertyData: any }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const { user, toggleFavorite, isFavorite } = useAuth();
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  
  const fav = isFavorite(Number(propertyId));

  if (!images || images.length === 0) {
    return (
      <View style={[gStyles.placeholder]}>
        <Ionicons name="image-outline" size={48} color="#ccc" />
        <Text style={{ color: "#ccc", marginTop: 8 }}>No images</Text>
      </View>
    );
  }

  return (
    <>
      <View style={gStyles.container}>
        <FlatList
          ref={flatRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setActiveIdx(idx);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.95} onPress={() => setLightbox(true)}>
              <Image source={{ uri: item }} style={gStyles.image} resizeMode="contain" />
            </TouchableOpacity>
          )}
        />
        {images.length > 1 && (
          <View style={gStyles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[gStyles.dot, i === activeIdx && gStyles.dotActive]} />
            ))}
          </View>
        )}
        <View style={gStyles.counter}>
          <Ionicons name="images-outline" size={12} color="#fff" />
          <Text style={gStyles.counterText}>{activeIdx + 1}/{images.length}</Text>
        </View>
        <TouchableOpacity
          style={gStyles.heartBtn}
          onPress={() => {
            if (!user) { setAuthModal("login"); return; }
            toggleFavorite(Number(propertyId), propertyData);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={fav ? "heart" : "heart-outline"}
            size={20}
            color={fav ? "#FF3B5C" : "#fff"}
          />
        </TouchableOpacity>
      </View>
      <Modal visible={lightbox} animationType="fade" statusBarTranslucent>
        <View style={gStyles.lightbox}>
          <TouchableOpacity style={gStyles.lightboxClose} onPress={() => setLightbox(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={activeIdx}
            getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: SCREEN_W, height: "100%" }} resizeMode="contain" />
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const gStyles = StyleSheet.create({
  container: { 
  position: "relative",
  backgroundColor: "#F5F7FA",
  height: 320,
},
  image: { 
  width: SCREEN_W, 
  height: 320,
},
  placeholder: {
    width: SCREEN_W, height: 240,
    backgroundColor: "#F0F0F0",
    justifyContent: "center", alignItems: "center",
  },
  dots: {
    position: "absolute", bottom: 12, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  dotActive: { backgroundColor: "#000000", width: 16 },
  counter: {
    position: "absolute", bottom: 12, right: 14,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  counterText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  heartBtn: {
    position: "absolute", bottom: 10, left: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  lightbox: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  lightboxClose: {
    position: "absolute", top: 52, right: 16, zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6,
  },
});

function VideoSection({ youtubeUrl }: { youtubeUrl: string | null }) {
  const [playing, setPlaying] = useState(false);

  if (!youtubeUrl) return null;

  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) return null;

  return (
    <View style={vStyles.container}>
      <Text style={vStyles.title}>Video presentation</Text>
      <View style={vStyles.videoWrapper}>
        <YoutubeIframe
          videoId={videoId}
          height={200}
          width={SCREEN_W - 56}
          play={playing}
          onChangeState={(state: string) => {
            if (state === "ended") setPlaying(false);
          }}
        />
      </View>
    </View>
  );
}

const vStyles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 10,
  },
  videoWrapper: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
    paddingVertical: 12,
  },
});

function StatPill({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={dStyles.statPill}>
      <View style={dStyles.statIconWrap}>
        <Ionicons name={icon} size={18} color={BLUE} />
      </View>
      <Text style={dStyles.statValue}>{value}</Text>
      <Text style={dStyles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={dStyles.detailRow}>
      <Text style={dStyles.detailLabel}>{label}</Text>
      <Text style={[dStyles.detailValue, accent && { color: BLUE, fontWeight: "700" }]}>
        {value}
      </Text>
    </View>
  );
}

export default function PropertyDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();

  const { propertyData: initialData, propertyId: routePropertyId, url, title: routeTitle } = route.params ?? {};

  const [property, setProperty] = useState<any>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData && !!routePropertyId);
  const [agents, setAgents] = useState<any[]>([]);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");

  useEffect(() => {
    fetch(`${API_BASE}/agents`)
      .then((r) => r.json())
      .then((data) => setAgents(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => {})
  }, []);

  useEffect(() => {
    if (!initialData && routePropertyId) {
      setLoading(true);
      fetch(`${API_BASE}/properties/${routePropertyId}`)
        .then((r) => r.json())
        .then((d) => {
          setProperty(d);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [routePropertyId]);

  useEffect(() => {
    if (!property) return;
    setResolvedUrl(property.url || property.link || "");
  }, [property]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" }}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={{ marginTop: 12, color: "#666" }}>Loading property...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text style={{ marginTop: 12, color: "#666" }}>Property not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: BLUE, fontWeight: "700" }}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const p = property;
const title = stripHtml(p.title ?? p.name ?? routeTitle ?? "Property");
const images: string[] = Array.isArray(p.images) ? p.images : [];
const rawCurrency = p.price_currency ?? p.currency ?? 1;
const price = fmtPrice(p.price, rawCurrency);
const description = stripHtml(p.description ?? "");
const city = p.city?.name ?? p.location ?? "";
const zone = p.zone?.name ?? "";
const address = p.address ?? "";
const transaction = p.transaction?.name ?? "";
const category = p.category?.name ?? "";

  const rooms = p.rooms ? String(p.rooms) : null;
  const baths = (p.bathrooms ?? p.baths) ? String(p.bathrooms ?? p.baths) : null;
  const surface = (p.surface_size ?? p.surface_useful) ? `${p.surface_size ?? p.surface_useful} m²` : null;
  
  const rawFloor = p.floor;
  const floorValue = rawFloor != null ? Number(rawFloor) : null;
  const pID = p.id ?? routePropertyId ?? "unknown";

  let floor: string | null = null;
  if (floorValue != null && !isNaN(floorValue) && FLOOR_MAP[floorValue]) {
    floor = FLOOR_MAP[floorValue];
  }

  const rawFurniture = p.furniture != null ? Number(p.furniture) : null;
  const furniture = rawFurniture && FURNITURE_MAP[rawFurniture] ? FURNITURE_MAP[rawFurniture] : null;

  const builtYear = p.built_year ? String(p.built_year) : null;
  const partitioningId = p.spaces_partitioning ?? p.partitioning ?? null;
const partitioning = partitioningId && partitioningLabels[partitioningId]
  ? partitioningLabels[partitioningId]
  : (typeof partitioningId === 'string' ? partitioningId : null);
  const land = p.land_size ? `${p.land_size} m²` : null;

  const youtubeUrl = p.video_code || null;

  const propertyAgentId = p.agent_id ?? p.agent?.id ?? p.user_id ?? null;
  const resolvedAgent = p.agent ?? agents.find((a) => String(a.id) === String(propertyAgentId)) ?? null;
  const agentName = resolvedAgent
    ? `${resolvedAgent.first_name ?? ""} ${resolvedAgent.last_name ?? ""}`.trim() || resolvedAgent.name || "RealtyPro"
    : "RealtyPro";
  const agentPhone = resolvedAgent?.phone ?? resolvedAgent?.mobile ?? resolvedAgent?.telephone ?? "+15550000000";
  const agentAvatar = resolvedAgent?.picture ?? resolvedAgent?.avatar ?? resolvedAgent?.image ?? resolvedAgent?.photo ?? null;

  const features: string[] = Array.isArray(p.features)
    ? p.features.map((f: any) => (typeof f === "string" ? f : f.name ?? f.label ?? ""))
    : [];

  const isRent = transaction.toLowerCase().includes("rental");
  const accentColor = isRent ? GOLD : BLUE;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <View style={[dStyles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={dStyles.backBtn}>
          <Ionicons name="close" size={22} color={BLUE} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={dStyles.headerTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ImageGallery 
          images={images} 
          propertyId={pID} 
          propertyData={p} 
        />

        <View style={dStyles.titleCard}>
          <View style={dStyles.titleRow}>
            {transaction ? (
              <View style={[dStyles.transactionBadge, { backgroundColor: accentColor + "18" }]}>
                <Text style={[dStyles.transactionText, { color: accentColor }]}>{transaction}</Text>
              </View>
            ) : null}
            {category ? (
              <View style={dStyles.categoryBadge}>
                <Text style={dStyles.categoryText}>{category}</Text>
              </View>
            ) : null}
          </View>
          <Text style={dStyles.propertyTitle}>{title}</Text>
          {(city || zone) && (
            <View style={dStyles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#999" />
              <Text style={dStyles.locationText}>
                {[city, zone, address].filter(Boolean).join(" · ")}
              </Text>
            </View>
          )}
          <Text style={[dStyles.priceText, { color: accentColor }]}>{price}</Text>
        </View>

        {(rooms || baths || surface || floor) ? (
          <View style={dStyles.statsRow}>
            {!!rooms && <StatPill icon="bed-outline" label="Bedrooms" value={rooms} />}
            {!!baths && <StatPill icon="water-outline" label="Bathrooms" value={baths} />}
            {!!surface && <StatPill icon="expand-outline" label="Area" value={surface} />}
            {!!floor && <StatPill icon="layers-outline" label="Floor" value={floor} />}
          </View>
        ) : null}

        <View style={dStyles.section}>
          <Text style={dStyles.sectionTitle}>Property details</Text>
          <View style={dStyles.detailsCard}>
            {price !== "Price upon request" && <DetailRow label="Price" value={price} accent />}
            {surface && <DetailRow label="Usable area" value={surface} />}
            {land && <DetailRow label="Land area" value={land} />}
            {rooms && <DetailRow label="Bedrooms" value={rooms} />}
            {baths && <DetailRow label="Bathrooms" value={baths} />}
            {builtYear && <DetailRow label="Year built" value={builtYear} />}
            {category && <DetailRow label="Category" value={category} />}
            {transaction && <DetailRow label="Transaction type" value={transaction} />}
            {partitioning && <DetailRow label="Partitioning" value={partitioning} />}
            {floor && <DetailRow label="Floor" value={floor} />}
            {furniture && <DetailRow label="Furnishing" value={furniture} />}
            {city && <DetailRow label="City" value={city} />}
            {zone && <DetailRow label="Zone" value={zone} />}
          </View>
        </View>

        {description.length > 0 && (
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>Descriere</Text>
            <View style={dStyles.descCard}>
              <Text style={dStyles.descText}>{description}</Text>
            </View>
          </View>
        )}

        <VideoSection youtubeUrl={youtubeUrl} />

        {features.length > 0 && (
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>Amenities</Text>
            <View style={dStyles.featuresCard}>
              {features.map((f, i) => (
                <View key={i} style={dStyles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={BLUE} />
                  <Text style={dStyles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={dStyles.section}>
          <Text style={dStyles.sectionTitle}>Agent</Text>
          <View style={dStyles.agentCard}>
            <View style={dStyles.agentLeft}>
              {agentAvatar ? (
              <Image
                source={{ uri: agentAvatar }}
                style={dStyles.agentAvatar}
                onError={() => {}}
              />
            ) : (
              <View style={dStyles.agentAvatarPlaceholder}>
                <Ionicons name="person" size={24} color={BLUE} />
              </View>
            )}
              <View>
                <Text style={dStyles.agentName}>{agentName}</Text>
                <Text style={dStyles.agentRole}>Real Estate Agent</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={[dStyles.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[dStyles.ctaBtn, { backgroundColor: GOLD }]}
          onPress={() => Linking.openURL(`tel:${agentPhone}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={dStyles.ctaBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dStyles.ctaBtn, { backgroundColor: BLUE }]}
          onPress={() => Linking.openURL(`sms:${agentPhone}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
          <Text style={dStyles.ctaBtnText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dStyles.ctaBtn, { backgroundColor: "#25D366" }]}
          onPress={() => Linking.openURL(`https:
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={dStyles.ctaBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dStyles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: "#EFEFEF",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#F0F5FF",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  titleCard: {
    backgroundColor: "#fff", margin: 14, marginBottom: 0,
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  titleRow: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  transactionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  transactionText: { fontSize: 12, fontWeight: "700" },
  categoryBadge: { backgroundColor: "#F5F7FA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryText: { fontSize: 12, color: "#666", fontWeight: "600" },
  propertyTitle: { fontSize: 19, fontWeight: "800", color: "#1A1A2E", lineHeight: 26, marginBottom: 6 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  locationText: { fontSize: 13, color: "#888", flex: 1 },
  priceText: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  statsRow: { flexDirection: "row", marginHorizontal: 14, marginTop: 12, gap: 10 },
  statPill: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#EAF2FF",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  statValue: { fontSize: 14, fontWeight: "800", color: "#1A1A2E" },
  statLabel: { fontSize: 10, color: "#aaa", marginTop: 2, textAlign: "center" },
  section: { marginHorizontal: 14, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A2E", marginBottom: 10 },
  detailsCard: {
    backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValue: { fontSize: 14, color: "#1A1A2E", fontWeight: "600", textAlign: "right", flex: 1, marginLeft: 8 },
  descCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  descText: { fontSize: 14, color: "#444", lineHeight: 22 },
  featuresCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  featureText: { fontSize: 14, color: "#333" },
  agentCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  agentLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatar: { width: 52, height: 52, borderRadius: 26 },
  agentAvatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#EAF2FF",
    alignItems: "center", justifyContent: "center",
  },
  agentName: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  agentRole: { fontSize: 12, color: "#888", marginTop: 2 },
  ctaBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 10,
    paddingHorizontal: 14, paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#EFEFEF",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  ctaBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 12, paddingVertical: 13,
  },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
