// src/components/PropertyAssistant.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addPendingSession,
  updateSessionActivity,
  markSessionTranscriptSent,
  removePendingSession,
} from '../tasks/transcriptTask';

const API_URL = "https:

const ASSISTANT_AVATAR_URL = "https:

const BLUE     = "#0A84FF";
const BLUE_DARK = "#0066CC";
const BLUE_LIGHT = "#E8F2FF";
const BLUE_MID = "#4DA6FF";
const GOLD = "#D68B1A";
const BG = "#F0F4F8";
const CARD = "#FFFFFF";
const TEXT_PRIMARY = "#0D1B2A";
const TEXT_SECONDARY = "#6B7A8D";
const TEXT_LIGHT = "#A8B4C0";
const BORDER = "#E2E8F0";
const GREEN = "#34C759";
const RED_SOFT = "#FF453A";

const INACTIVITY_MS = 2 * 60 * 1000;
const CONSENT_STORAGE_KEY = '@assistant_user_consent';

interface PropertyCard {
  id: number;
  immoflux_id?: number;
  title: string;
  price: string;
  location: string;
  image?: string | null;
  rooms?: number;
  surface?: number | string;
  link?: string;
  transaction_type?: string;
}

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  properties?: PropertyCard[];
  suggestions?: string[];
  time: string;
  isError?: boolean;
}

type ConsentAnswer = "yes" | "no" | null;

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
}

function timeNow(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function isRentType(type?: string): boolean {
  return !!type && type.toLowerCase().includes("rental");
}

function PropCard({ prop, onPress }: { prop: PropertyCard; onPress: (p: PropertyCard) => void }) {
  const rent = isRentType(prop.transaction_type);
  const accent = rent ? GOLD : BLUE;
  return (
    <TouchableOpacity style={styles.propCard} onPress={() => onPress(prop)} activeOpacity={0.85}>
      <View style={styles.propImageWrap}>
        {prop.image ? (
          <Image source={{ uri: prop.image }} style={styles.propImage} resizeMode="cover" />
        ) : (
          <View style={[styles.propImage, styles.propImagePlaceholder]}>
            <Ionicons name="home-outline" size={26} color={TEXT_LIGHT} />
          </View>
        )}
        {prop.transaction_type ? (
          <View style={[styles.propBadge, { backgroundColor: accent }]}>
            <Text style={styles.propBadgeText}>{prop.transaction_type}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.propBody}>
        <Text style={styles.propTitle} numberOfLines={2}>{prop.title || "Property"}</Text>
        <View style={styles.propMetaRow}>
          {!!prop.location && (
            <View style={styles.propMetaItem}>
              <Ionicons name="location-outline" size={11} color={TEXT_LIGHT} />
              <Text style={styles.propMetaText} numberOfLines={1}>{prop.location}</Text>
            </View>
          )}
          {!!prop.rooms && (
            <View style={styles.propMetaItem}>
              <Ionicons name="bed-outline" size={11} color={TEXT_LIGHT} />
              <Text style={styles.propMetaText}>{prop.rooms} bed.</Text>
            </View>
          )}
          {!!prop.surface && (
            <View style={styles.propMetaItem}>
              <Ionicons name="expand-outline" size={11} color={TEXT_LIGHT} />
              <Text style={styles.propMetaText}>{parseFloat(String(prop.surface)).toFixed(0)} m²</Text>
            </View>
          )}
        </View>
        <View style={styles.propFooter}>
          <Text style={[styles.propPrice, { color: accent }]}>{prop.price || "Price upon request"}</Text>
          <View style={[styles.propViewBtn, { backgroundColor: accent + "18" }]}>
            <Text style={[styles.propViewBtnText, { color: accent }]}>View</Text>
            <Ionicons name="chevron-forward" size={11} color={accent} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TypingIndicator() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dot = (d: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(d, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(500),
      ]));
    const a1 = dot(d1, 0); const a2 = dot(d2, 150); const a3 = dot(d3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);
  return (
    <View style={styles.typingRow}>
      <View style={styles.avatarSmall}>
        <Image source={{ uri: ASSISTANT_AVATAR_URL }} style={styles.avatarImg} />
      </View>
      <View style={styles.typingBubble}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
}

export default function PropertyAssistant() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => uuid());
  const [consentAnswer, setConsentAnswer] = useState<ConsentAnswer>(null);
  const [consentPending, setConsentPending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const listRef = useRef<FlatList>(null);
  const fabAnim = useRef(new Animated.Value(1)).current;
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(sessionId);
  const consentRef = useRef<ConsentAnswer>(null);
  const msgCountRef = useRef(0);
  const transcriptSentRef = useRef(false);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { consentRef.current = consentAnswer; }, [consentAnswer]);
  useEffect(() => { msgCountRef.current = messages.length; }, [messages]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const loadPersistedConsent = async () => {
      try {
        const persisted = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
        if (persisted) {
          const { consent, timestamp } = JSON.parse(persisted);
          const isValid = timestamp && (Date.now() - timestamp) < 30 * 24 * 60 * 60 * 1000;
          if (consent === "yes" && isValid) {
            setConsentAnswer("yes");
            consentRef.current = "yes";
          }
        }
      } catch (_) {}
    };
    loadPersistedConsent();
  }, []);

  useEffect(() => {
    if (!visible) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(fabAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(fabAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        Animated.delay(2500),
      ]));
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  const sendTranscript = useCallback(async (trigger: 'inactivity' | 'background' = 'inactivity') => {
  if (transcriptSentRef.current) return;
  if (consentRef.current !== "yes") return;
  if (msgCountRef.current < 2) return;

  transcriptSentRef.current = true;

  await markSessionTranscriptSent(sessionIdRef.current);

  try {
    await fetch(`${API_URL}/chat/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        trigger: trigger === 'background' ? 'background_inactivity' : 'inactivity'
      }),
    });
    console.log(`[Assistant] Transcript sent (${trigger})`);
  } catch (err) {
    console.log('[Assistant] Transcript send failed:', err);
  }
}, []);

  const resetInactivityTimer = useCallback(() => {
  if (sessionExpired) return;
  if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

  updateSessionActivity(sessionIdRef.current);

  inactivityTimer.current = setTimeout(() => {
    setSessionExpired(true);
    setMessages((prev) => [
      ...prev,
      {
        id: uuid(),
        role: "bot",
        text: "Session expired due to inactivity (2 minutes). Tap \"New conversation\" to restart. 🔄",
        time: timeNow(),
        suggestions: [],
      },
    ]);
    sendTranscript('inactivity');
  }, INACTIVITY_MS);
}, [sessionExpired, sendTranscript]);

  const addBotMessage = useCallback((
    text: string,
    properties: PropertyCard[] = [],
    suggestions: string[] = [],
    isError = false
  ) => {
    setMessages((prev) => [...prev, { id: uuid(), role: "bot", text, properties, suggestions, time: timeNow(), isError }]);
    if (!visible) setUnread((n) => n + 1);
  }, [visible]);

  const showWelcome = useCallback(() => {
    setConsentPending(true);
    addBotMessage(
      "Hello! I'm your Property Assistant 👋\n\nBefore we start, please note that this conversation may be recorded and shared with our team for personalized support. Please respond below.",
      [], []
    );
  }, [addBotMessage]);

  useEffect(() => {
    if (visible && messages.length === 0) {
      setTimeout(() => showWelcome(), 350);
    }
  }, [visible]);

  const handleConsentYes = useCallback(async () => {
  setConsentPending(false);
  setConsentAnswer("yes");
  consentRef.current = "yes";

  try {
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
      consent: "yes",
      timestamp: Date.now()
    }));
  } catch (_) {}

  try {
    await fetch(`${API_URL}/chat/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        consent: { transcript: true, training: true },
      }),
    });
  } catch (_) {}

  await addPendingSession({
    sessionId: sessionIdRef.current,
    startTime: Date.now(),
    lastActivity: Date.now(),
    consentGiven: true,
    messageCount: 0,
    transcriptSent: false,
  });

  addBotMessage(
    "Thank you for agreeing! 🙏\n\nHow can I help you today? Are you looking for an apartment, house, land, or another type of property?",
    [],
    ["🏠 Apartments", "🏡 Houses for sale", "📋 Land", "🔑 Rentals available"]
  );
  resetInactivityTimer();
}, [addBotMessage, resetInactivityTimer]);

  const handleConsentNo = useCallback(async () => {
  setConsentPending(false);
  setConsentAnswer("no");
  consentRef.current = "no";

  try {
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
      consent: "no",
      timestamp: Date.now()
    }));
  } catch (_) {}

  try {
    await fetch(`${API_URL}/chat/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        consent: { transcript: false, training: false },
      }),
    });
  } catch (_) {}

  await addPendingSession({
    sessionId: sessionIdRef.current,
    startTime: Date.now(),
    lastActivity: Date.now(),
    consentGiven: false,
    messageCount: 0,
    transcriptSent: false,
  });

  addBotMessage(
    "Understood! This conversation won't be recorded.\n\nHow can I help you today?",
    [],
    ["🏠 Apartments", "🏡 Houses for sale", "📋 Land", "🔑 Rentals available"]
  );
  resetInactivityTimer();
}, [addBotMessage, resetInactivityTimer]);

  const handlePropPress = useCallback((prop: PropertyCard) => {
    const id = prop.immoflux_id || prop.id;
    setVisible(false);
    setTimeout(() => navigation.navigate("PropertyDetail", { propertyId: String(id) }), 350);
  }, [navigation]);

  const sendText = useCallback(async (text: string) => {
  if (!text.trim() || isLoading || sessionExpired || consentPending) return;
  setInput("");
  resetInactivityTimer();

  setMessages((prev) => [...prev, { id: uuid(), role: "user", text: text.trim(), time: timeNow() }]);
  setIsLoading(true);

  const raw = await AsyncStorage.getItem('@assistant_pending_sessions');
  if (raw) {
    const sessions = JSON.parse(raw);
    const session = sessions.find((s: any) => s.sessionId === sessionIdRef.current);
    if (session) {
      session.messageCount = msgCountRef.current + 1;
      await AsyncStorage.setItem('@assistant_pending_sessions', JSON.stringify(sessions));
    }
  }

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text.trim(),
        sessionId,
        platform: "app",
        consentGiven: consentAnswer === "yes",
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.session_id) setSessionId(data.session_id);
    addBotMessage(data.text || "I couldn't generate a response.", data.properties || [], data.suggestions || []);
  } catch {
    addBotMessage(
      "I'm having a connection issue right now.\n\nYou can contact us directly:\n📞 +1 (XXX) XXX-XXXX\n✉️ support@real-estate.stefanvasilescu.com",
      [], ["🔄 Try again", "📞 Call now"], true
    );
  } finally {
    setIsLoading(false);
  }
}, [isLoading, sessionExpired, consentPending, sessionId, consentAnswer, addBotMessage, resetInactivityTimer]);

  const handleReload = useCallback(async () => {
  if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  transcriptSentRef.current = false;

  await removePendingSession(sessionIdRef.current);

  const newSid = uuid();
  setSessionId(newSid);
  sessionIdRef.current = newSid;

  let hasPersistedConsent = false;
  let persistedConsent: "yes" | "no" | null = null;
  try {
    const persisted = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    if (persisted) {
      const { consent, timestamp } = JSON.parse(persisted);
      const isValid = timestamp && (Date.now() - timestamp) < 30 * 24 * 60 * 60 * 1000;
      if (isValid) {
        hasPersistedConsent = true;
        persistedConsent = consent;
      }
    }
  } catch (_) {}

  if (hasPersistedConsent && persistedConsent === "yes") {
    setConsentAnswer("yes");
    consentRef.current = "yes";
    setConsentPending(false);
    setSessionExpired(false);
    setMessages([]);
    setInput("");
    msgCountRef.current = 0;

    try {
      await fetch(`${API_URL}/chat/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: newSid,
          consent: { transcript: true, training: true },
        }),
      });
    } catch (_) {}

    await addPendingSession({
      sessionId: newSid,
      startTime: Date.now(),
      lastActivity: Date.now(),
      consentGiven: true,
      messageCount: 0,
      transcriptSent: false,
    });

    setTimeout(() => {
      addBotMessage(
        "Hello again! 👋 I'm your Property Assistant. How can I help you today?",
        [],
        ["🏠 Apartments", "🏡 Houses for sale", "📋 Land", "🔑 Rentals available"]
      );
    }, 150);
  } else {
    setConsentAnswer(null);
    consentRef.current = null;
    setConsentPending(false);
    setSessionExpired(false);
    setMessages([]);
    setInput("");
    msgCountRef.current = 0;
    setTimeout(() => showWelcome(), 150);
  }
}, [addBotMessage, showWelcome]);

  const closeChat = useCallback(() => setVisible(false), []);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === "user";
    const isLast = index === messages.length - 1;

    if (isUser) {
      return (
        <View style={styles.rowUser}>
          <View style={styles.bubbleUser}>
            <Text style={styles.bubbleUserText}>{item.text}</Text>
          </View>
          <Text style={styles.timeStamp}>{item.time}</Text>
        </View>
      );
    }

    return (
      <View style={styles.rowBot}>
        <View style={styles.avatarSmall}>
          <Image source={{ uri: ASSISTANT_AVATAR_URL }} style={styles.avatarImg} />
        </View>
        <View style={styles.botGroup}>
          <View style={[styles.bubbleBot, item.isError && styles.bubbleBotError]}>
            <Text style={styles.bubbleBotText}>{item.text}</Text>
            {item.properties && item.properties.length > 0 && (
              <View style={styles.propList}>
                {item.properties.slice(0, 4).map((p) => (
                  <PropCard key={String(p.immoflux_id || p.id)} prop={p} onPress={handlePropPress} />
                ))}
                {item.properties.length > 4 && (
                  <Text style={styles.moreProps}>+{item.properties.length - 4} properties available</Text>
                )}
              </View>
            )}
          </View>
          <Text style={styles.timeStamp}>{item.time}</Text>
          {isLast && !sessionExpired && !consentPending && item.suggestions && item.suggestions.length > 0 && (
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}
            >
              {item.suggestions.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => sendText(s)} activeOpacity={0.75}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Animated.View style={[styles.fab, { transform: [{ scale: fabAnim }], bottom: 88 + insets.bottom }]}>
        <TouchableOpacity style={styles.fabInner} onPress={() => { setVisible(true); setUnread(0); }} activeOpacity={0.88}>
          <Image source={{ uri: ASSISTANT_AVATAR_URL }} style={styles.fabAvatar} />
          {unread > 0 && (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          )}
          <View style={styles.fabOnline} />
        </TouchableOpacity>
        <View style={styles.fabLabel}>
          <Text style={styles.fabLabelText}>Property</Text>
          <Text style={styles.fabLabelText}>Assistant</Text>
        </View>
      </Animated.View>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeChat}>
        <SafeAreaView style={styles.modal} edges={["top"]}>
          <StatusBar barStyle="light-content" />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatarWrap}>
                <Image source={{ uri: ASSISTANT_AVATAR_URL }} style={styles.headerAvatar} />
                <View style={[styles.onlineDot, sessionExpired && { backgroundColor: TEXT_LIGHT }]} />
              </View>
              <View>
                <Text style={styles.headerName}>Assistant</Text>
                <View style={styles.headerSubRow}>
                  <View style={[styles.onlineDotInline, sessionExpired && { backgroundColor: TEXT_LIGHT }]} />
                  <Text style={styles.headerSub}>
                    {sessionExpired ? "Session closed" : "AI Assistant · Available"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerBtn} onPress={handleReload} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="refresh-outline" size={17} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={closeChat} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.subHeader}>
            <Ionicons name="shield-checkmark-outline" size={11} color={TEXT_LIGHT} />
            <Text style={styles.subHeaderText}>
              {consentAnswer === "yes"
                ? "Conversation recorded · RealtyPro"
                : "RealtyPro · Property Search"}
            </Text>
          </View>

          <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMessage}
              contentContainerStyle={[styles.list, { paddingBottom: keyboardHeight > 0 ? 8 : insets.bottom }]}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListFooterComponent={isLoading ? <TypingIndicator /> : null}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
            />

            {consentPending && (
                <View style={[
                  styles.inputArea,
                  inputFocused && styles.inputAreaFocused,
                  { paddingBottom: keyboardHeight > 0 ? 10 : insets.bottom + 10 }
                ]}>
                <View style={styles.consentBarTitleRow}>
                  <View style={styles.consentIconWrap}>
                    <Ionicons name="shield-checkmark" size={18} color={BLUE} />
                  </View>
                  <Text style={styles.consentBarTitle}>GDPR Consent</Text>
                </View>
                <Text style={styles.consentBarSub}>
                  This conversation will be recorded and shared with our team.
                </Text>
                <View style={styles.consentBtns}>
                  <TouchableOpacity style={styles.consentYes} onPress={handleConsentYes} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.consentYesText}>Yes, I agree</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.consentNo} onPress={handleConsentNo} activeOpacity={0.85}>
                    <Text style={styles.consentNoText}>No, thanks</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {sessionExpired && (
              <View style={[styles.expiredBar, { paddingBottom: insets.bottom + 10 }]}>
                <Ionicons name="time-outline" size={18} color={TEXT_SECONDARY} />
                <Text style={styles.expiredText}>Session expired</Text>
                <TouchableOpacity style={styles.reloadBtn} onPress={handleReload} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={14} color="#fff" />
                  <Text style={styles.reloadBtnText}>New conversation</Text>
                </TouchableOpacity>
              </View>
            )}

            {!consentPending && !sessionExpired && (
                  <View style={[
                    styles.inputArea,
                    inputFocused && styles.inputAreaFocused,
                    { paddingBottom: keyboardHeight > 0 ? 4 : insets.bottom }
                  ]}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type a message..."
                    placeholderTextColor={TEXT_LIGHT}
                    multiline
                    maxLength={500}
                    onSubmitEditing={() => sendText(input)}
                    returnKeyType="send"
                    blurOnSubmit={false}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnOff]}
                    onPress={() => sendText(input)}
                    disabled={!input.trim() || isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="send" size={15} color="#fff" />}
                  </TouchableOpacity>
                </View>
                <Text style={styles.footer}>Powered by Property Assistant · RealtyPro</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: "absolute", right: 16, zIndex: 99, alignItems: "center" },
  fabInner: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: BLUE,
    alignItems: "center", justifyContent: "center",
    shadowColor: BLUE, shadowOpacity: 0.5, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
    borderWidth: 3, borderColor: "#fff",
  },
  fabAvatar: { width: 60, height: 60, borderRadius: 30 },
  fabBadge: {
    position: "absolute", top: -2, right: -2, minWidth: 20, height: 20,
    backgroundColor: RED_SOFT, borderRadius: 10, borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  fabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  fabOnline: {
    position: "absolute", bottom: 2, right: 2, width: 14, height: 14,
    borderRadius: 7, backgroundColor: GREEN, borderWidth: 2.5, borderColor: "#fff",
  },
  fabLabel: { marginTop: 5, backgroundColor: TEXT_PRIMARY, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,alignItems: "center", justifyContent: "center" },
  fabLabelText: { color: "#fff", fontSize: 10, fontWeight: "700", },

  modal: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: BLUE, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatarWrap: { position: "relative" },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0, width: 11, height: 11,
    borderRadius: 6, backgroundColor: GREEN, borderWidth: 2, borderColor: BLUE,
  },
  onlineDotInline: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  headerName: { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.2 },
  headerSubRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.75)" },
  headerRight: { flexDirection: "row", gap: 6 },
  headerBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  subHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 5, backgroundColor: CARD,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  subHeaderText: { fontSize: 10, color: TEXT_LIGHT, fontWeight: "500" },

  list: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, gap: 6 },

  rowBot: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 2 },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 18, overflow: "hidden",
    borderWidth: 2, borderColor: "#fff",
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  botGroup: { flex: 1 },
  bubbleBot: {
    backgroundColor: CARD, borderRadius: 16, borderBottomLeftRadius: 6, padding: 11,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  bubbleBotError: { backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FFD5D5" },
  bubbleBotText: { fontSize: 14, color: TEXT_PRIMARY, lineHeight: 21 },

  rowUser: { alignItems: "flex-end", paddingLeft: 50, marginVertical: 2 },
  bubbleUser: {
    backgroundColor: BLUE, borderRadius: 20, borderBottomRightRadius: 6,
    paddingHorizontal: 12, paddingVertical: 10, maxWidth: "100%",
    shadowColor: BLUE, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  bubbleUserText: { fontSize: 14, color: "#fff", lineHeight: 21 },
  timeStamp: { fontSize: 11, color: TEXT_LIGHT, marginTop: 5, paddingHorizontal: 3 },

  typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 4, paddingHorizontal: 14 },
  typingBubble: {
    flexDirection: "row", gap: 5, backgroundColor: CARD,
    borderRadius: 20, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, alignItems: "center",
  },
  typingDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: BLUE_MID },

  propList: { marginTop: 12, gap: 10 },
  propCard: {
    flexDirection: "row", backgroundColor: BG, borderRadius: 16,
    overflow: "hidden", borderWidth: 1, borderColor: BORDER,
  },
  propImageWrap: { width: 110, flexShrink: 0, backgroundColor: BORDER, position: "relative" },
  propImage: { width: "100%", height: 110 },
  propImagePlaceholder: { justifyContent: "center", alignItems: "center", height: 110 },
  propBadge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  propBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  propBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  propTitle: { fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, lineHeight: 19 },
  propMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  propMetaItem: { flexDirection: "row", alignItems: "center", gap: 2 },
  propMetaText: { fontSize: 11, color: TEXT_SECONDARY },
  propFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  propPrice: { fontSize: 15, fontWeight: "800" },
  propViewBtn: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  propViewBtnText: { fontSize: 12, fontWeight: "700" },
  moreProps: { fontSize: 13, color: BLUE, fontWeight: "600", textAlign: "center", paddingVertical: 8 },

  chipsScroll: { marginTop: 10 },
  chipsContent: { gap: 8, paddingRight: 4, paddingVertical: 4 },
  chip: {
    backgroundColor: CARD, borderWidth: 1.5, borderColor: BLUE + "40",
    borderRadius: 24, paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: BLUE, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: BLUE },

  consentBar: {
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
  },
  consentBarTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  consentIconWrap: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: BLUE_LIGHT,
    alignItems: "center", justifyContent: "center",
  },
  consentBarTitle: { fontSize: 14, fontWeight: "800", color: TEXT_PRIMARY },
  consentBarSub: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 18, marginBottom: 10 },
  consentBtns: { flexDirection: "row", gap: 10 },
  consentYes: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 11,
    shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  consentYesText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  consentNo: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: BG, borderRadius: 12, paddingVertical: 11,
    borderWidth: 1.5, borderColor: BORDER,
  },
  consentNoText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: "600" },

  expiredBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD,
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  expiredText: { flex: 1, fontSize: 14, color: TEXT_SECONDARY, fontWeight: "500" },
  reloadBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: BLUE, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11,
  },
  reloadBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "700" },

  inputArea: {
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 12, paddingTop: 8,
  },
  inputAreaFocused: { borderTopColor: BLUE + "60" },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 10, backgroundColor: BG,
    borderRadius: 28, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 16, paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 15.5, color: TEXT_PRIMARY, maxHeight: 110, lineHeight: 22, paddingVertical: 0 },
  sendBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: BLUE,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 1,
    shadowColor: BLUE, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  sendBtnOff: { backgroundColor: TEXT_LIGHT, shadowOpacity: 0 },
  footer: { textAlign: "center", fontSize: 10, color: TEXT_LIGHT, marginTop: 6, fontWeight: "500" },
});
