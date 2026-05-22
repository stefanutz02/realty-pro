// src/screens/Search.tsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  AppState,
  AppStateStatus,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Modal,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import BottomSheetSelector from "../components/BottomSheetSelector";
import CreditCalculatorModal, { CreditType } from "../components/CreditCalculatorModal";
import AppFooter from "../components/AppFooter";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../context/AuthModal";
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from "../config/api";

const PER_PAGE = 20;
const DEFAULT_COUNTY_ID = 1;

const TRANSACTION_OPTIONS: Record<string, number> = {
  "Sale": 1,
  "Rental": 2,
};

const CATEGORY_OPTIONS: Record<string, number> = {
  "Apartments": 1,
  "Houses / Villas": 2,
  "Land": 3,
  "Commercial Spaces": 4,
  "Offices": 5,
  "Industrial": 6,
};

const DEFAULT_FILTERS = {
  transaction: "",
  category: "",
  city_id: "",
  zone_id: "",
  rooms_min: "",
  price_max: "",
};

function stripHtml(html: any): string {
  if (!html) return "";
  if (typeof html === "object") html = html.ro || html.en || Object.values(html)[0];
  if (typeof html !== "string") html = String(html);
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

const CURRENCY_MAP: Record<number | string, string> = {
  1: "€",
  2: "RON",
  "EUR": "€",
  "RON": "RON",
  "eur": "€",
  "ron": "RON",
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

function PriceInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<TextInput>(null);
  const isSelected = !!value;

  const open = () => {
    setDraft(value);
    setVisible(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const confirm = () => {
    const cleaned = draft.replace(/[^0-9]/g, "");
    onChange(cleaned);
    Keyboard.dismiss();
    setTimeout(() => setVisible(false), 100);
  };

  const clear = () => {
    setDraft("");
    onChange("");
    Keyboard.dismiss();
    setTimeout(() => setVisible(false), 100);
  };

  const displayValue = value
    ? Number(value).toLocaleString("en-US") + " €"
    : "Any";

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={priceStyles.label}>Max Price (€)</Text>
      <TouchableOpacity
        style={[priceStyles.selector, isSelected && priceStyles.selectorActive]}
        onPress={open}
        activeOpacity={0.75}
      >
        <Text
          style={[priceStyles.selectorText, isSelected && priceStyles.selectorTextActive]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        {isSelected ? (
          <TouchableOpacity
            onPress={clear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color="#0A84FF" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={15} color="#999" />
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={() => { Keyboard.dismiss(); setVisible(false); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={priceStyles.modalWrap}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableOpacity
            style={priceStyles.backdrop}
            activeOpacity={1}
            onPress={() => { Keyboard.dismiss(); setVisible(false); }}
          />
          <View style={priceStyles.sheet}>
            <View style={priceStyles.handle} />
            <Text style={priceStyles.sheetTitle}>Maximum Price (€)</Text>

            <View style={priceStyles.inputRow}>
              <TextInput
                ref={inputRef}
                style={priceStyles.input}
                value={draft}
                onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                placeholder="e.g. 500000"
                placeholderTextColor="#aaa"
                returnKeyType="done"
                onSubmitEditing={confirm}
              />
              <Text style={priceStyles.currency}>€</Text>
            </View>

            <View style={priceStyles.btnRow}>
              <TouchableOpacity style={priceStyles.clearBtn} onPress={clear}>
                <Text style={priceStyles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={priceStyles.confirmBtn} onPress={confirm}>
                <Text style={priceStyles.confirmBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const priceStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F7FA",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  selectorActive: {
    backgroundColor: "#EAF2FF",
    borderColor: "#0A84FF",
  },
  selectorText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginRight: 4,
  },
  selectorTextActive: {
    color: "#0A84FF",
    fontWeight: "600",
  },
  modalWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 16,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#0A84FF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A2E",
    padding: 0,
  },
  currency: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A84FF",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#0A84FF",
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

export default function Search({ navigation, resetSignal = 0 }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout, toggleFavorite, isFavorite } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [cities, setCities]           = useState<{ id: number; name: string }[]>([]);
  const [zones, setZones]             = useState<{ id: number; name: string }[]>([]);
  const [results, setResults]         = useState<any[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [creditModal, setCreditModal] = useState<CreditType | null>(null);
  const [authModal, setAuthModal]     = useState<"login" | "register" | null>(null);
  
  const appState    = useRef(AppState.currentState);
  const lastBgTime  = useRef<number | null>(null);
  const isLoading   = useRef(false);

  useEffect(() => {
    loadAllCitiesForCounty(DEFAULT_COUNTY_ID);
  }, []);

  const loadAllCitiesForCounty = async (countyId: number) => {
    setLoading(true);
    const allCities: { id: number; name: string }[] = [];
    let currentPage = 1;
    let lastPage = 1;

    try {
      do {
        const url = buildApiUrl(API_ENDPOINTS.locations.cities, {
          countyId: String(countyId),
        }) + `?per_page=100&page=${currentPage}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.data && Array.isArray(data.data)) {
          allCities.push(...data.data.map((c: any) => ({ 
            id: c.id, 
            name: c.name 
          })));
        }
        
        lastPage = data.last_page || 1;
        currentPage++;
      } while (currentPage <= lastPage && currentPage <= 150);

      allCities.sort((a, b) => a.name.localeCompare(b.name));
      setCities(allCities);
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!filters.city_id) {
      setZones([]);
      return;
    }

    const loadZonesForCity = async () => {
      try {
        const cityId = parseInt(filters.city_id);
        const url = buildApiUrl(API_ENDPOINTS.locations.zones, {
          cityId: String(cityId),
        }) + "?per_page=1000";
        const res = await fetch(url);
        const data = await res.json();
        
        const zoneList = (data.data || []).map((z: any) => ({ 
          id: z.id, 
          city_id: z.city_id,
          name: z.name 
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setZones(zoneList);
        
        if (filters.zone_id) {
          const zoneStillValid = zoneList.some((z: any) => String(z.id) === filters.zone_id);
          if (!zoneStillValid) {
            setFilters(prev => ({ ...prev, zone_id: "" }));
          }
        }
      } catch (err) {
        console.error('Failed to load zones for city:', err);
        setZones([]);
      }
    };

    loadZonesForCity();
  }, [filters.city_id]);

  const buildUrl = useCallback((pageNum: number, f: typeof DEFAULT_FILTERS) => {
    let url = buildApiUrl(API_ENDPOINTS.properties.search) + `?per_page=${PER_PAGE}&page=${pageNum}`;

    if (f.transaction && TRANSACTION_OPTIONS[f.transaction])
      url += `&transaction_id=${TRANSACTION_OPTIONS[f.transaction]}`;
    if (f.category && CATEGORY_OPTIONS[f.category])
      url += `&category_id=${CATEGORY_OPTIONS[f.category]}`;
    if (f.city_id) url += `&city_id=${f.city_id}`;
    if (f.zone_id) url += `&zone_id=${f.zone_id}`;
    if (f.rooms_min) url += `&rooms_min=${f.rooms_min}`;
    if (f.price_max) url += `&price_max=${f.price_max}`;

    return url;
  }, []);

  const loadPage = useCallback(async (opts?: { page?: number; filters?: typeof DEFAULT_FILTERS }) => {
    if (isLoading.current) return;
    isLoading.current = true;
    setLoading(true);
    const p = opts?.page ?? page;
    const f = opts?.filters ?? filters;
    try {
      const res  = await fetch(buildUrl(p, f));
      const json = await res.json();
      if (Array.isArray(json)) {
        setResults(json.slice(0, PER_PAGE));
        setTotalPages(1);
        setTotalCount(json.length);
      } else {
        const slicedData = (json.data ?? []).slice(0, PER_PAGE);
        setResults(slicedData);
        const actualTotal = json.total ?? (json.data?.length ?? 0);
        setTotalPages(Math.ceil(actualTotal / PER_PAGE));
        setTotalCount(actualTotal);
      }
    } catch (e) {
      console.error("IMMOFLUX fetch error:", e);
    } finally {
      isLoading.current = false;
      setLoading(false);
    }
  }, [page, filters, buildUrl]);

  useEffect(() => { loadPage(); }, [page]);

  useEffect(() => {
    if (resetSignal > 0) {
      const def = DEFAULT_FILTERS;
      setFilters(def);
      setPage(1);
      loadPage({ page: 1, filters: def });
    }
  }, [resetSignal]);

  const loadPageRef = useRef(loadPage);
  useEffect(() => { loadPageRef.current = loadPage; }, [loadPage]);

  useEffect(() => {
    const FIVE_MIN = 5 * 60 * 1000;

    const id = setInterval(() => {
      console.log("⏱ Auto-refresh: 5 minutes elapsed");
      loadPageRef.current();
    }, FIVE_MIN);

    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        (next === "background" || next === "inactive")
      ) {
        lastBgTime.current = Date.now();
      }

      if (
        appState.current.match(/inactive|background/) &&
        next === "active"
      ) {
        console.log("📱 App resumed from background — refreshing anunțuri");
        loadPageRef.current();
      }

      appState.current = next;
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  const applyFilters = () => { 
    setPage(1); 
    loadPage({ page: 1, filters }); 
  };

  const getVisiblePages = () => {
    const max = 5;
    let start = Math.max(1, page - 2);
    let end   = Math.min(totalPages, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const renderCard = (item: any) => {
    const title       = stripHtml(item.title ?? item.name ?? "Proprietate");
    const images: string[] = item.images ?? [];
    const thumb       = images[0] ?? null;
    const price       = item.price;
    const rawCurrency = item.price_currency ?? item.currency ?? 1;
    const currency    = getCurrencySymbol(rawCurrency);
    const city        = item.city?.name ?? item.location ?? "";
    const rooms       = item.rooms;
    const surface     = item.surface_size ?? item.surface_useful;
    const transaction = item.transaction?.name ?? "";
    const isRent      = transaction.toLowerCase().includes("nchiri");
    const fav         = isFavorite(item.id);

    return (
      <TouchableOpacity
        key={String(item.id)}
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => navigation.navigate("PropertyDetail", { propertyData: item })}
      >
        <View style={styles.imageWrap}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.image} resizeMode="contain" />
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
          {images.length > 1 && (
            <View style={styles.photoCount}>
              <Ionicons name="images-outline" size={12} color="#fff" />
              <Text style={styles.photoCountText}>{images.length}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => {
              if (!user) { setAuthModal("login"); return; }
              toggleFavorite(item.id, item);
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
                <Text style={styles.metaText}>{rooms} cam.</Text>
              </View>
            ) : null}
            {surface ? (
              <View style={styles.metaItem}>
                <Ionicons name="expand-outline" size={12} color="#999" />
                <Text style={styles.metaText}>{surface} m²</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardPrice, { color: isRent ? "#D68B1A" : "#0A84FF" }]}>
            {fmtPrice(price, rawCurrency)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const cityOptions = ["Any", ...cities.map((c) => c.name)];
  const zoneOptions = ["Any", ...zones.map((z) => z.name)];

  return (
    <GestureHandlerRootView style={{ flex: 1 }} collapsable={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.scrollContent}
            removeClippedSubviews={true}
            scrollEventThrottle={16}
            overScrollMode="never"
          >
            <View style={styles.hero}>
              <Text style={styles.heroLogo}>RealtyPro</Text>
              <Text style={styles.heroSubtitle}>Find your dream property today</Text>

              {user ? (
                <View style={styles.userRow}>
                  <View style={styles.userAvatarWrap}>
                    <Ionicons name="person" size={18} color="#0A84FF" />
                  </View>
                  <Text style={styles.userNameText} numberOfLines={1}>
                    {user.displayName || user.email}
                  </Text>
                  <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Ionicons name="log-out-outline" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.logoutBtnText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.authRow}>
                  <TouchableOpacity
                    style={styles.authBtnLogin}
                    onPress={() => setAuthModal("login")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="log-in-outline" size={16} color="#0A84FF" />
                    <Text style={styles.authBtnLoginText}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.authBtnRegister}
                    onPress={() => setAuthModal("register")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="person-add-outline" size={16} color="#fff" />
                    <Text style={styles.authBtnRegisterText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.filtersBox}>
              <Text style={styles.filtersTitle}>Filter Properties</Text>

              <View style={styles.filtersGrid}>
                <View style={styles.filterHalf}>
                  <BottomSheetSelector
                    label="Transaction Type"
                    value={filters.transaction || "Any"}
                    options={["Any", ...Object.keys(TRANSACTION_OPTIONS)]}
                    onChange={(v: string) => setFilters({ ...filters, transaction: v === "Any" ? "" : v })}
                  />
                </View>
                <View style={styles.filterHalf}>
                  <BottomSheetSelector
                    label="Category"
                    value={filters.category || "Any"}
                    options={["Any", ...Object.keys(CATEGORY_OPTIONS)]}
                    onChange={(v: string) => setFilters({ ...filters, category: v === "Any" ? "" : v })}
                  />
                </View>
              </View>

              <View style={styles.filtersGrid}>
                <View style={styles.filterHalf}>
                  <BottomSheetSelector
                    label="City"
                    value={filters.city_id ? (cities.find((c) => String(c.id) === filters.city_id)?.name ?? "Any") : "Any"}
                    options={cityOptions}
                    showSearch={true}
                    onChange={(v: string) => {
                      const found = cities.find((c) => c.name === v);
                      setFilters({ ...filters, city_id: found ? String(found.id) : "", zone_id: "" });
                    }}
                  />
                </View>
                <View style={styles.filterHalf}>
                  <BottomSheetSelector
                    label="Zone"
                    value={filters.zone_id ? (zones.find((z) => String(z.id) === filters.zone_id)?.name ?? "Any") : "Any"}
                    options={zoneOptions}
                    onChange={(v: string) => {
                      const found = zones.find((z) => z.name === v);
                      setFilters({ ...filters, zone_id: found ? String(found.id) : "" });
                    }}
                  />
                </View>
              </View>

              <View style={styles.filtersGrid}>
                <View style={styles.filterHalf}>
                  <BottomSheetSelector
                    label="Min. Bedrooms"
                    value={filters.rooms_min || "Any"}
                    options={["Any", "1", "2", "3", "4", "5+"]}
                    onChange={(v: string) => setFilters({ ...filters, rooms_min: v === "Any" ? "" : v.replace("+", "") })}
                  />
                </View>
                <View style={styles.filterHalf}>
                  <PriceInput
                    value={filters.price_max}
                    onChange={(v) => setFilters({ ...filters, price_max: v })}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.searchBtn} onPress={applyFilters}>
                <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.searchBtnText}>Search Properties</Text>
              </TouchableOpacity>

              <View style={styles.creditRow}>
                <TouchableOpacity
                  style={[styles.creditBtn, { borderColor: "#0A84FF" }]}
                  onPress={() => setCreditModal("ipotecar")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home-outline" size={16} color="#0A84FF" />
                  <Text style={[styles.creditBtnText, { color: "#0A84FF" }]}>
                    Mortgage{"\n"}Calculator
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.creditBtn, { borderColor: "#D68B1A" }]}
                  onPress={() => setCreditModal("nevoi_personale")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="wallet-outline" size={16} color="#D68B1A" />
                  <Text style={[styles.creditBtnText, { color: "#D68B1A" }]}>
                    Personal{"\n"}Loan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.resultsBar}>
              {loading ? (
                <ActivityIndicator size="small" color="#0A84FF" />
              ) : (
                <Text style={styles.resultsText}>
                  {totalCount > 0 ? `${totalCount} properties found` : "No properties found"}
                </Text>
              )}
            </View>

            {results.map((item) => renderCard(item))}

            {totalPages > 1 && (
              <View style={styles.paginationWrapper}>
                <TouchableOpacity
                  disabled={page === 1}
                  style={[styles.pageArrow, page === 1 && styles.pageArrowDisabled]}
                  onPress={() => setPage(page - 1)}
                >
                  <Ionicons name="chevron-back" size={16} color={page === 1 ? "#C0C0C0" : "#0A84FF"} />
                </TouchableOpacity>
                <View style={styles.pageNumbers}>
                  {getVisiblePages().map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setPage(n)}
                      style={[styles.pageChip, n === page && styles.pageChipActive]}
                    >
                      <Text style={[styles.pageChipText, n === page && styles.pageChipTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  disabled={page === totalPages}
                  style={[styles.pageArrow, page === totalPages && styles.pageArrowDisabled]}
                  onPress={() => setPage(page + 1)}
                >
                  <Ionicons name="chevron-forward" size={16} color={page === totalPages ? "#C0C0C0" : "#0A84FF"} />
                </TouchableOpacity>
              </View>
            )}

            <AppFooter showEraCredit />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {creditModal && (
        <CreditCalculatorModal
          visible={creditModal !== null}
          type={creditModal}
          onClose={() => setCreditModal(null)}
        />
      )}

      {authModal && (
        <AuthModal
          visible={authModal !== null}
          initialTab={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F5F7FA" 
  },
  scrollContent: {
    paddingBottom: 120,
  },

  hero: {
    backgroundColor: "#0A84FF",
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogo:     { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 8, letterSpacing: 0.5 },
  heroTitle:    { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 12 },
  heroSubtitle: { fontSize: 13, color: "#C8E0FF", marginTop: 4, marginBottom: 18 },

  authRow: { flexDirection: "row", gap: 10, marginTop: 2, paddingHorizontal: 20 },
  authBtnLogin: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 11,
  },
  authBtnLoginText:  { fontSize: 14, fontWeight: "700", color: "#0A84FF" },
  authBtnRegister: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12,
    paddingVertical: 11, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
  },
  authBtnRegisterText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  userRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    marginTop: 2, marginHorizontal: 20,
  },
  userAvatarWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  userNameText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#fff" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, backgroundColor: "rgba(0,0,0,0.15)",
  },
  logoutBtnText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },

  filtersBox: {
    backgroundColor: "#fff", margin: 14, marginTop: 12,
    padding: 14, borderRadius: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  filtersTitle: {
    fontSize: 13, fontWeight: "700", color: "#888",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
  },
  filtersGrid:  { flexDirection: "row", gap: 10 },
  filterHalf:   { flex: 1 },

  searchBtn: {
    flexDirection: "row", backgroundColor: "#0A84FF",
    paddingVertical: 13, borderRadius: 12, marginTop: 14,
    alignItems: "center", justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  creditRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  creditBtn: {
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center",
    justifyContent: "center", 
    gap: 6,
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingVertical: 11,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    minHeight: 50,
  },
  creditBtnText: { 
    fontSize: 13, 
    fontWeight: "700", 
    textAlign: "center",
    flexShrink: 1,
  },

  resultsBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 8, minHeight: 28,
  },
  resultsText: { fontSize: 13, color: "#666", fontWeight: "600" },

  card: {
    marginHorizontal: 14, marginVertical: 7,
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  imageWrap: { 
  position: "relative",
  backgroundColor: "#F5F7FA",
  height: 220,
  },
  image: { 
    width: "100%", 
    height: "100%",
  },
  noImage: { backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center" },

  badge: { position: "absolute", top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeSale: { backgroundColor: "#0A84FF" },
  badgeRent: { backgroundColor: "#D68B1A" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  photoCount: {
    position: "absolute", bottom: 10, right: 56,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  photoCountText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  heartBtn: {
    position: "absolute", bottom: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
  },

  cardBody:  { padding: 13 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 6 },
  cardMeta:  { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  metaItem:  { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText:  { fontSize: 12, color: "#888" },
  cardPrice: { fontSize: 16, fontWeight: "800" },

  paginationWrapper: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 24, marginBottom: 32, paddingHorizontal: 16, gap: 10,
  },
  pageArrow: {
    width: 38, height: 38, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#0A84FF",
    alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },
  pageArrowDisabled: { borderColor: "#E0E0E0", backgroundColor: "#F9F9F9" },
  pageNumbers:       { flexDirection: "row", gap: 6, alignItems: "center" },
  pageChip: {
    minWidth: 38, height: 38, borderRadius: 10,
    backgroundColor: "#F0F4FF",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 10,
  },
  pageChipActive: {
    backgroundColor: "#0A84FF",
    shadowColor: "#0A84FF", shadowOpacity: 0.35, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  pageChipText:       { fontSize: 14, fontWeight: "600", color: "#0A84FF" },
  pageChipTextActive: { color: "#fff" },
});
