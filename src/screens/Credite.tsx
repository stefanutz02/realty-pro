// src/screens/Credite.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Animated,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import CreditCalculatorModal, { CreditType } from "../components/CreditCalculatorModal";
import AppFooter from "../components/AppFooter";

const BLUE = "#0A84FF";
const GOLD = "#D68B1A";

const STEPS = [
  { icon: "ear-outline" as const,         text: "We understand your needs" },
  { icon: "list-outline" as const,        text: "We show you all options" },
  { icon: "ribbon-outline" as const,      text: "We help with the best offer" },
  { icon: "git-compare-outline" as const, text: "We compare multiple lenders" },
  { icon: "time-outline" as const,        text: "You save time" },
  { icon: "chatbubble-outline" as const,  text: "Free consultation" },
];

const CREDIT_TYPES = [
  { icon: "home-outline" as const,    label: "Mortgage",              color: BLUE },
  { icon: "wallet-outline" as const,  label: "Personal Loan",        color: GOLD },
  { icon: "refresh-outline" as const, label: "Refinance",            color: "#0F6E56" },
  { icon: "business-outline" as const,label: "Business / Corporate",  color: "#993356" },
];

const EMAIL_API = "https:

function ContactModal({
  visible,
  onClose,
  prefillType,
}: {
  visible: boolean;
  onClose: () => void;
  prefillType?: string;
}) {
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [county, setCounty]         = useState("");
  const [city, setCity]             = useState("");
  const [creditType, setCreditType] = useState(prefillType ?? "");
  const [agree1, setAgree1]         = useState(false);
  const [agree2, setAgree2]         = useState(false);
  const [agree3, setAgree3]         = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) setCreditType(prefillType ?? "");
  }, [visible, prefillType]);

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone("");
    setCounty(""); setCity(""); setCreditType("");
    setAgree1(false); setAgree2(false); setAgree3(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !phone || !county || !city) {
      return Alert.alert("Incomplete fields", "Please fill in all required fields.");
    }
    if (!agree1 || !agree2 || !agree3) {
      return Alert.alert("Agreement required", "You must agree to all terms to continue.");
    }

    try {
      setSubmitting(true);
      const res = await fetch(EMAIL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "loan_page",
          subject: `Loan Request: ${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          county,
          city,
          credit_type: creditType || "Not specified",
          message: `Loan consultation request. Type: ${creditType || "Not specified"}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        Alert.alert(
          "Request sent ✓",
          "A consultant will contact you soon.",
          [{ text: "OK", onPress: handleClose }]
        );
      } else {
        Alert.alert("Error", "Could not send request. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network issue. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>

        <View style={[m.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleClose} style={m.closeBtn}>
            <Ionicons name="close" size={24} color={BLUE} />
          </TouchableOpacity>
          <View style={m.headerCenter}>
            <View style={m.headerIconWrap}>
              <Ionicons name="person-outline" size={18} color={BLUE} />
            </View>
            <Text style={m.headerTitle}>Contact me</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={m.subtitle}>
              Complete the form and our consultant will contact you with a personalized offer.
            </Text>

            <View style={m.row}>
              <View style={m.col}>
                <Text style={m.label}>First Name *</Text>
                <TextInput
                  style={m.input}
                  placeholder="John"
                  placeholderTextColor="#C0C0C0"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={m.col}>
                <Text style={m.label}>Last Name *</Text>
                <TextInput
                  style={m.input}
                  placeholder="Doe"
                  placeholderTextColor="#C0C0C0"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <Text style={m.label}>Email Address *</Text>
            <TextInput
              style={m.input}
              placeholder="john.doe@example.com"
              placeholderTextColor="#C0C0C0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={m.label}>Phone Number *</Text>
            <TextInput
              style={m.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="#C0C0C0"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={m.row}>
              <View style={m.col}>
                <Text style={m.label}>State/Province *</Text>
                <TextInput
                  style={m.input}
                  placeholder="California"
                  placeholderTextColor="#C0C0C0"
                  value={county}
                  onChangeText={setCounty}
                />
              </View>
              <View style={m.col}>
                <Text style={m.label}>City *</Text>
                <TextInput
                  style={m.input}
                  placeholder="San Francisco"
                  placeholderTextColor="#C0C0C0"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            <Text style={m.label}>Loan Type (optional)</Text>
            <View style={m.typeGrid}>
              {["Mortgage", "Personal Loan", "Refinance", "Business"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[m.typeChip, creditType === t && m.typeChipActive]}
                  onPress={() => setCreditType(creditType === t ? "" : t)}
                  activeOpacity={0.8}
                >
                  <Text style={[m.typeChipText, creditType === t && m.typeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={m.agreementsBox}>
              {[
                {
                  val: agree1, set: setAgree1,
                  text: "I confirm I have read and accept ",
                  link: "Terms and Conditions",
                },
                {
                  val: agree2, set: setAgree2,
                  text: "I agree with ",
                  link: "personal data processing",
                },
                {
                  val: agree3, set: setAgree3,
                  text: "I confirm I am 18 years or older",
                  link: "",
                },
              ].map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={m.agreeRow}
                  onPress={() => a.set(!a.val)}
                  activeOpacity={0.8}
                >
                  <View style={[m.checkbox, a.val && m.checkboxActive]}>
                    {a.val && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                  <Text style={m.agreeText}>
                    {a.text}
                    {a.link
                      ? <Text style={m.agreeLink}>{a.link}</Text>
                      : null}
                    {" *"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[m.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <Text style={m.submitText}>Sending...</Text>
                : <>
                    <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={m.submitText}>Send request</Text>
                  </>
              }
            </TouchableOpacity>

            <Text style={m.legal}>
              Your information will be used only to contact you about our services and will not
              be shared with third parties.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function Credite() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [activeModal, setActiveModal]       = useState<CreditType | null>(null);
  const [contactVisible, setContactVisible] = useState(false);
  const [prefillType, setPrefillType]       = useState("");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const openContact = (type = "") => {
    setPrefillType(type);
    setContactVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.hero}>
          <Animated.View
            style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <Text style={styles.heroLogo}>RealtyPro</Text>
            <Text style={styles.heroTitle}>Loans & Mortgages</Text>
            <Text style={styles.heroSubtitle}>
              We find the best loan solution for you
            </Text>
          </Animated.View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL("tel:+15550000000")}>
            <Ionicons name="call-outline" size={20} color={BLUE} />
            <Text style={styles.actionText}>Call now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL("https:
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL("mailto:support@real-estate.stefanvasilescu.com")}>
            <Ionicons name="mail-outline" size={20} color={GOLD} />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How we help?</Text>
          <View style={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={s.icon} size={22} color={BLUE} />
                </View>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan types</Text>
          <View style={styles.creditTypesGrid}>
            {CREDIT_TYPES.map((ct, i) => (
              <TouchableOpacity
                key={i}
                style={styles.creditTypeCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (ct.label === "Mortgage")        setActiveModal("ipotecar");
                  else if (ct.label === "Personal Loan") setActiveModal("nevoi_personale");
                  else openContact(ct.label);
                }}
              >
                <View style={[styles.creditTypeIcon, { backgroundColor: ct.color + "18" }]}>
                  <Ionicons name={ct.icon} size={24} color={ct.color} />
                </View>
                <Text style={[styles.creditTypeLabel, { color: ct.color }]}>{ct.label}</Text>
                <View style={[styles.calcPill, { backgroundColor: ct.color + "15" }]}>
                  <Ionicons name="calculator-outline" size={11} color={ct.color} />
                  <Text style={[styles.calcPillText, { color: ct.color }]}>Calculate</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaBanner}
          onPress={() => openContact()}
          activeOpacity={0.9}
        >
          <View style={styles.ctaBannerLeft}>
            <Text style={styles.ctaBannerTitle}>Want to be contacted?</Text>
            <Text style={styles.ctaBannerSub}>Fill the form and we'll call you</Text>
          </View>
          <View style={styles.ctaBannerArrow}>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            RealtyPro is not a financial institution. We act as an intermediary and real estate
            consultant. All calculations are estimates. Final offers are set after financial
            institution analysis.
          </Text>
        </View>

        <AppFooter variant="compact" />
      </ScrollView>

      {activeModal && (
        <CreditCalculatorModal
          visible
          type={activeModal}
          onClose={() => setActiveModal(null)}
        />
      )}

      <ContactModal
        visible={contactVisible}
        onClose={() => setContactVisible(false)}
        prefillType={prefillType}
      />
    </SafeAreaView>
  );
}

const m = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#fff",
  },
  closeBtn: { width: 40, alignItems: "flex-start" },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },

  subtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },

  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222",
    backgroundColor: "#fff",
  },

  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  typeChipActive: {
    borderColor: BLUE,
    backgroundColor: "#EAF2FF",
  },
  typeChipText: { fontSize: 12, fontWeight: "600", color: "#777" },
  typeChipTextActive: { color: BLUE },

  agreementsBox: {
    marginTop: 22,
    gap: 14,
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8EFFF",
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#C8D5E8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  agreeText: {
    flex: 1,
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
  },
  agreeLink: {
    color: BLUE,
    fontWeight: "600",
  },

  submitBtn: {
    flexDirection: "row",
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    shadowColor: BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  legal: {
    fontSize: 11,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 16,
    paddingHorizontal: 8,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },

  hero: {
    backgroundColor: BLUE,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
    paddingBottom: 52,
    alignItems: "center",
  },
  heroCard: { alignItems: "center", paddingTop: 24 },
  heroLogo: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 12, letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroSubtitle: {
    fontSize: 14,
    color: "#C8E0FF",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
    fontWeight: "500",
  },

  actionsRow: {
    flexDirection: "row",
    marginTop: -24,
    marginHorizontal: 20,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionText: { fontSize: 11, fontWeight: "600", color: "#444" },

  section: { marginHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A2E", marginBottom: 14 },

  stepsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stepCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#333", lineHeight: 17 },

  creditTypesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  creditTypeCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  creditTypeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  creditTypeLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  calcPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  calcPillText: { fontSize: 11, fontWeight: "600" },

  ctaBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BLUE,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaBannerLeft: { flex: 1 },
  ctaBannerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  ctaBannerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 },
  ctaBannerArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  legalSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#ECECEC",
    borderRadius: 10,
  },
  legalText: { fontSize: 11, color: "#999", lineHeight: 16, textAlign: "center" },
});
