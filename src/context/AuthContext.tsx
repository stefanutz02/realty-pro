// src/context/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from "../config/api";

const STORAGE_TOKEN = "realty_auth_token";
const STORAGE_USER = "realty_auth_user";
const STORAGE_FAVS = "realty_favorites";
const STORAGE_FAV_ITEMS = "realty_fav_items";
const STORAGE_ID_MAP = "realty_id_map";

let _favoritesSnapshot: string[] = [];

export function getFavoritesSnapshot(): string[] {
  return _favoritesSnapshot;
}

function normalizeId(id: string | number | undefined | null): string {
  if (id === undefined || id === null) return "";
  const str = String(id).trim().toUpperCase();
  return str.startsWith("P") ? str.slice(1) : str;
}

async function registerTokenWithFavorites(favorites: string[]) {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "realty-pro-project-id",
    });
    const expoToken = tokenData.data;

    const url = buildApiUrl(API_ENDPOINTS.auth.registerToken);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: expoToken,
        platform: Platform.OS,
        favorites: favorites
      }),
    });
    console.log("📡 Token registered with favorites:", favorites);
  } catch (e) {
    console.log("⚠️ Token registration error:", e);
  }
}

function rebuildSnapshot(
  favoriteItems: any[],
  idMap: Record<string, number>
): string[] {
  const itemIds = favoriteItems
    .map((item: any) => normalizeId(item.immoflux_id ?? item.id))
    .filter((id) => id && id !== "0");

  const currentIds = new Set(itemIds);
  const mapIds = Object.keys(idMap).filter((key) => {
    const normalizedKey = normalizeId(key);
    return currentIds.has(normalizedKey);
  });

  const merged = [...new Set([...itemIds, ...mapIds.map(normalizeId)])];

  _favoritesSnapshot = merged;
  console.log("📋 Snapshot:", merged);
  return merged;
}

export interface ObiUser {
  id: number;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  agreedTerms?: boolean;
}

interface AuthContextValue {
  user: ObiUser | null;
  token: string | null;
  favorites: number[];
  favoriteItems: any[];
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    payload: RegisterPayload
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  toggleFavorite: (immofluxId: number, propertyData?: any) => Promise<void>;
  isFavorite: (immofluxId: number) => boolean;
  refreshFavorites: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ObiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [idMap, setIdMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;
  
  const idMapRef = useRef<Record<string, number>>({});
  idMapRef.current = idMap;

  useEffect(() => {
    rebuildSnapshot(favoriteItems, idMap);
  }, [favoriteItems, idMap]);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        console.log("🔧 Boot: loading...");
        const results = await AsyncStorage.multiGet([
          STORAGE_TOKEN,
          STORAGE_USER,
          STORAGE_FAVS,
          STORAGE_FAV_ITEMS,
          STORAGE_ID_MAP,
        ]);

        const tok = results[0][1];
        const usr = results[1][1] ? JSON.parse(results[1][1]) : null;
        const favs = results[2][1] ? JSON.parse(results[2][1]) : [];
        const items = results[3][1] ? JSON.parse(results[3][1]) : [];
        const map = results[4][1] ? JSON.parse(results[4][1]) : {};

        if (!isMounted) return;

        console.log("📦 Loaded:", {
          hasToken: !!tok,
          hasUser: !!usr,
          favs: favs.length,
          items: items.length,
          mapKeys: Object.keys(map),
        });

        setIdMap(map);
        idMapRef.current = map;
        setFavoriteItems(items);
        setFavorites(favs);

        if (tok && usr) {
          setToken(tok);
          setUser(usr);
          await refreshFromServer(tok);
        } else {
          await registerTokenWithFavorites([]);
        }
      } catch (err) {
        console.error("❌ Boot error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshFromServer = useCallback(async (explicitToken?: string) => {
    const tok = explicitToken || tokenRef.current;
    if (!tok) return;

    try {
      const url = buildApiUrl(API_ENDPOINTS.auth.me);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) {
        console.log("❌ Failed to fetch user:", res.status);
        return;
      }
      const json = await res.json();
      if (!json.ok) {
        console.log("❌ Server error");
        return;
      }

      const serverFavs: number[] = (json.favorites ?? [])
        .map(Number)
        .filter(Boolean);
      const serverItems: any[] = json.favoriteItems ?? [];

      console.log("📥 Server:", { favs: serverFavs.length, items: serverItems.length });

      const newIdMap: Record<string, number> = {};
      serverItems.forEach((item: any) => {
        const immoId = normalizeId(item.immoflux_id);
        const wpId = Number(item.id);
        if (immoId && wpId) {
          newIdMap[immoId] = wpId;
          newIdMap[`P${immoId}`] = wpId;
        }
      });

      setFavorites(serverFavs);
      setFavoriteItems(serverItems);
      setIdMap(newIdMap);
      idMapRef.current = newIdMap;

      await AsyncStorage.multiSet([
        [STORAGE_FAVS, JSON.stringify(serverFavs)],
        [STORAGE_FAV_ITEMS, JSON.stringify(serverItems)],
        [STORAGE_ID_MAP, JSON.stringify(newIdMap)],
      ]);

      const snapshot = rebuildSnapshot(serverItems, newIdMap);
      await registerTokenWithFavorites(snapshot);

      console.log("💾 Saved, idMap:", Object.keys(newIdMap));
    } catch (err) {
      console.error("❌ Server sync error:", err);
    }
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const url = buildApiUrl(API_ENDPOINTS.auth.login);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          return {
            ok: false,
            error: stripHtml(json.message ?? "Invalid email or password."),
          };
        }

        const tok: string = json.token;
        const usr: ObiUser = json.user;
        const favs: number[] = (json.favorites ?? [])
          .map(Number)
          .filter(Boolean);
        const items: any[] = json.favoriteItems ?? [];

        const newIdMap: Record<string, number> = {};
        items.forEach((item: any) => {
          const immoId = normalizeId(item.immoflux_id);
          const wpId = Number(item.id);
          if (immoId && wpId) {
            newIdMap[immoId] = wpId;
            newIdMap[`P${immoId}`] = wpId;
          }
        });

        setToken(tok);
        setUser(usr);
        setFavorites(favs);
        setFavoriteItems(items);
        setIdMap(newIdMap);
        idMapRef.current = newIdMap;

        await AsyncStorage.multiSet([
          [STORAGE_TOKEN, tok],
          [STORAGE_USER, JSON.stringify(usr)],
          [STORAGE_FAVS, JSON.stringify(favs)],
          [STORAGE_FAV_ITEMS, JSON.stringify(items)],
          [STORAGE_ID_MAP, JSON.stringify(newIdMap)],
        ]);
        
        const snapshot = rebuildSnapshot(items, newIdMap);
        await registerTokenWithFavorites(snapshot);
        
        return { ok: true };
      } catch (err) {
        console.error("❌ Login error:", err);
        return { ok: false, error: "Eroare de rețea. Verifică conexiunea." };
      }
    },
    []
  );

  const register = useCallback(
    async (
      payload: RegisterPayload
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const url = buildApiUrl(API_ENDPOINTS.auth.register);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: payload.password,
            phone: payload.phone ?? "",
            agreedTerms: payload.agreedTerms ?? true,
          }),
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          return {
            ok: false,
            error: stripHtml(json.message ?? "Registration failed."),
          };
        }

        const tok: string = json.token;
        const usr: ObiUser = json.user;
        const favs: number[] = (json.favorites ?? [])
          .map(Number)
          .filter(Boolean);
        const items: any[] = json.favoriteItems ?? [];

        const newIdMap: Record<string, number> = {};
        items.forEach((item: any) => {
          const immoId = normalizeId(item.immoflux_id);
          const wpId = Number(item.id);
          if (immoId && wpId) {
            newIdMap[immoId] = wpId;
            newIdMap[`P${immoId}`] = wpId;
          }
        });

        setToken(tok);
        setUser(usr);
        setFavorites(favs);
        setFavoriteItems(items);
        setIdMap(newIdMap);
        idMapRef.current = newIdMap;

        await AsyncStorage.multiSet([
          [STORAGE_TOKEN, tok],
          [STORAGE_USER, JSON.stringify(usr)],
          [STORAGE_FAVS, JSON.stringify(favs)],
          [STORAGE_FAV_ITEMS, JSON.stringify(items)],
          [STORAGE_ID_MAP, JSON.stringify(newIdMap)],
        ]);
        
        const snapshot = rebuildSnapshot(items, newIdMap);
        await registerTokenWithFavorites(snapshot);
        
        return { ok: true };
      } catch (err) {
        console.error("❌ Register error:", err);
        return { ok: false, error: "Eroare de rețea. Verifică conexiunea." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const tok = tokenRef.current;
    if (tok) {
      try {
        const url = buildApiUrl(API_ENDPOINTS.auth.logout);
        await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${tok}` },
        });
      } catch (_) {}
    }

    setToken(null);
    setUser(null);
    setFavorites([]);
    setFavoriteItems([]);
    setIdMap({});
    idMapRef.current = {};
    _favoritesSnapshot = [];

    await AsyncStorage.multiRemove([
      STORAGE_TOKEN,
      STORAGE_USER,
      STORAGE_FAVS,
      STORAGE_FAV_ITEMS,
      STORAGE_ID_MAP,
    ]);
    
    await registerTokenWithFavorites([]);
  }, []);

  const isFavorite = useCallback(
    (immofluxId: number): boolean => {
      const normalized = normalizeId(immofluxId);

      if (favorites.some((id) => normalizeId(id) === normalized)) return true;

      const wpId = idMap[normalized] || idMap[`P${normalized}`];
      if (wpId && favorites.includes(wpId)) return true;

      if (_favoritesSnapshot.includes(normalized)) return true;

      return false;
    },
    [favorites, idMap]
  );

  const toggleFavorite = useCallback(
    async (incomingId: number, propertyData?: any) => {
      const tok = tokenRef.current;
      if (!tok) {
        console.log("⚠️ No token");
        return;
      }

      const normalized = normalizeId(incomingId);
      const wpId = idMapRef.current[normalized] || idMapRef.current[`P${normalized}`];

      const currentlyFav =
        favorites.some((id) => normalizeId(id) === normalized) ||
        (wpId && favorites.includes(wpId)) ||
        _favoritesSnapshot.includes(normalized);

      const isAdding = !currentlyFav;

      console.log("🔄 Toggle:", {
        incomingId,
        normalized,
        wpId,
        currentlyFav,
        isAdding,
      });

      if (isAdding) {
        setFavorites((prev) => [...prev, wpId || incomingId]);
        if (propertyData) {
          setFavoriteItems((prev) => {
            const exists = prev.some(
              (i) =>
                normalizeId(i.immoflux_id) === normalized ||
                normalizeId(i.id) === normalized
            );
            if (exists) return prev;
            return [
              ...prev,
              {
                ...propertyData,
                id: wpId || incomingId,
                immoflux_id: `P${normalized}`,
              },
            ];
          });
        }
      } else {
        setFavorites((prev) =>
          prev.filter(
            (id) => normalizeId(id) !== normalized && id !== wpId
          )
        );
        setFavoriteItems((prev) =>
          prev.filter(
            (i) =>
              normalizeId(i.immoflux_id) !== normalized &&
              normalizeId(i.id) !== normalized &&
              i.id !== wpId
          )
        );
      }

      try {
        const endpoint = isAdding
          ? API_ENDPOINTS.favorites.add
          : API_ENDPOINTS.favorites.remove;
        const url = buildApiUrl(endpoint);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok}`,
          },
          body: JSON.stringify({ listingId: incomingId }),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          console.log("❌ Toggle failed, reverting");
          await refreshFromServer(tok);
          return;
        }

        const serverFavs: number[] = (json.favorites ?? [])
          .map(Number)
          .filter(Boolean);
        const serverItems: any[] = json.favoriteItems ?? [];
        const returnedWpId: number = Number(json.listingId) || 0;

        if (isAdding && returnedWpId > 0) {
          setIdMap((prev) => {
            const next = {
              ...prev,
              [normalized]: returnedWpId,
              [`P${normalized}`]: returnedWpId,
            };
            idMapRef.current = next;
            AsyncStorage.setItem(STORAGE_ID_MAP, JSON.stringify(next));
            return next;
          });
        }

        if (!isAdding) {
          setIdMap((prev) => {
            const next = { ...prev };
            delete next[normalized];
            delete next[`P${normalized}`];
            Object.keys(next).forEach((key) => {
              if (next[key] === returnedWpId || next[key] === wpId) {
                delete next[key];
              }
            });
            idMapRef.current = next;
            AsyncStorage.setItem(STORAGE_ID_MAP, JSON.stringify(next));
            return next;
          });
        }

        setFavorites(serverFavs);
        setFavoriteItems(serverItems);
        await AsyncStorage.multiSet([
          [STORAGE_FAVS, JSON.stringify(serverFavs)],
          [STORAGE_FAV_ITEMS, JSON.stringify(serverItems)],
        ]);

        console.log("✅ Toggle complete");
        
        const updatedSnapshot = rebuildSnapshot(serverItems, idMapRef.current);
        await registerTokenWithFavorites(updatedSnapshot);
      } catch (err) {
        console.error("❌ Toggle error:", err);
      }
    },
    [favorites, refreshFromServer]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        favorites,
        favoriteItems,
        isLoading,
        login,
        register,
        logout,
        toggleFavorite,
        isFavorite,
        refreshFavorites: () => refreshFromServer(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function stripHtml(str: string): string {
  return (str ?? "").replace(/<[^>]+>/g, "").replace(/\[.*?\]/g, "").trim();
}
