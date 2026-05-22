// src/components/CreditCalculatorModal.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BLUE = "#0A84FF";
const GOLD = "#D68B1A";

export type CreditType = "ipotecar" | "nevoi_personale";

interface CreditCalculatorModalProps {
  visible: boolean;
  type: CreditType;
  onClose: () => void;
}

function calcRate(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function fmt(n: number, currency = "EUR"): string {
  return `${Math.round(n).toLocaleString("en-US")} ${currency}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(text: string): number {
  const cleaned = text.replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : 0;
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  accentColor,
  editable,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  accentColor: string;
  editable?: boolean;
}) {
  const [inputValue, setInputValue] = useState(String(value));

  const dec = () => {
    const next = clamp(value - step, min, max);
    setInputValue(String(next));
    onChange(next);
  };

  const inc = () => {
    const next = clamp(value + step, min, max);
    setInputValue(String(next));
    onChange(next);
  };

  const submitInput = () => {
    const parsed = parseNumber(inputValue);
    const next = clamp(parsed || min, min, max);
    setInputValue(String(next));
    onChange(next);
  };

  return (
    <View style={st.stepperWrap}>
      <Text style={st.stepperLabel}>{label}</Text>
      <View style={st.stepperRow}>
        <TouchableOpacity style={st.stepBtn} onPress={dec} activeOpacity={0.7}>
          <Ionicons name="remove" size={18} color={accentColor} />
        </TouchableOpacity>

        {editable ? (
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            onBlur={submitInput}
            onSubmitEditing={submitInput}
            keyboardType="numeric"
            returnKeyType="done"
            style={st.stepperInput}
          />
        ) : (
          <Text style={st.stepperValue}>{display}</Text>
        )}

        <TouchableOpacity style={st.stepBtn} onPress={inc} activeOpacity={0.7}>
          <Ionicons name="add" size={18} color={accentColor} />
        </TouchableOpacity>
      </View>

      {editable && <Text style={st.stepperHelper}>{display}</Text>}

      <View style={st.track}>
        <View
          style={[
            st.trackFill,
            {
              backgroundColor: accentColor,
              width: `${(((value - min) / (max - min)) * 100).toFixed(1)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function Row({ label, value, accent, bold, boldColor }: { label: string; value: string; accent?: boolean; bold?: boolean; boldColor?: string }) {
  return (
    <View style={st.row}>
      <Text style={[st.rowLabel, accent && { color: "#888" }]}>{label}</Text>
      <Text style={[st.rowValue, bold && { color: boldColor ?? BLUE, fontWeight: "700" }, accent && { color: "#555" }]}>
        {value}
      </Text>
    </View>
  );
}

function IpotecarCalc() {
  const [amount, setAmount] = useState(150000);
  const [years, setYears] = useState(20);
  const rate = 5;

  const months = years * 12;
  const monthly = calcRate(amount, rate, months);
  const totalPaid = monthly * months;
  const totalInterest = totalPaid - amount;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={[st.resultCard, { borderTopColor: BLUE }]}>
        <Text style={st.resultLabel}>Estimated Monthly Payment</Text>
        <Text style={[st.resultMain, { color: BLUE }]}>{fmt(monthly, "EUR")}</Text>
        <Text style={st.resultSub}>
          {fmt(amount, "EUR")} loan · {months} months · {fmtPct(rate)} interest
        </Text>
      </View>

      <Stepper
        label="Loan Amount"
        value={amount}
        onChange={setAmount}
        min={20000}
        max={1000000}
        step={5000}
        display={fmt(amount, "EUR")}
        accentColor={BLUE}
        editable
      />

      <Stepper
        label="Repayment Period"
        value={years}
        onChange={setYears}
        min={5}
        max={30}
        step={1}
        display={`${years} years`}
        accentColor={BLUE}
      />

      <View style={st.summaryBox}>
        <Row label="Loan Amount" value={fmt(amount, "EUR")} />
        <Row label="Annual Interest Rate" value={fmtPct(rate)} accent />
        <Row label="Total Amount to Repay" value={fmt(totalPaid, "EUR")} />
        <Row label="Total Interest" value={fmt(totalInterest, "EUR")} accent />
        <Row label="Monthly Payment" value={fmt(monthly, "EUR")} bold boldColor={BLUE} />
      </View>

      <Text style={st.disclaimer}>
        * This calculation is approximate. Final rates depend on application review and applicable bank fees.
      </Text>

      <TouchableOpacity style={[st.ctaBtn, { backgroundColor: BLUE }]} onPress={() => Linking.openURL("tel:+15550000000")}>
        <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={st.ctaText}>Free Consultation – +1 (555) 000-0000</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function NevoiCalc() {
  const [amount, setAmount] = useState(30000);
  const [months, setMonths] = useState(60);
  const rate = 9;

  const monthly = calcRate(amount, rate, months);
  const totalPaid = monthly * months;
  const totalInterest = totalPaid - amount;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={[st.resultCard, { borderTopColor: GOLD }]}>
        <Text style={st.resultLabel}>Estimated Monthly Payment</Text>
        <Text style={[st.resultMain, { color: GOLD }]}>{fmt(monthly, "EUR")}</Text>
        <Text style={st.resultSub}>
          {fmt(amount, "EUR")} · {months} months · {fmtPct(rate)} interest
        </Text>
      </View>

      <Stepper
        label="Loan Amount"
        value={amount}
        onChange={setAmount}
        min={1000}
        max={1000000}
        step={1000}
        display={fmt(amount, "EUR")}
        accentColor={GOLD}
        editable
      />

      <Stepper
        label="Repayment Period"
        value={months}
        onChange={setMonths}
        min={6}
        max={120}
        step={6}
        display={`${months} months`}
        accentColor={GOLD}
      />

      <View style={st.summaryBox}>
        <Row label="Requested Amount" value={fmt(amount, "EUR")} />
        <Row label="Annual Interest Rate" value={fmtPct(rate)} accent />
        <Row label="Total Amount to Repay" value={fmt(totalPaid, "EUR")} />
        <Row label="Total Interest" value={fmt(totalInterest, "EUR")} accent />
        <Row label="Monthly Payment" value={fmt(monthly, "EUR")} bold boldColor={GOLD} />
      </View>

      <Text style={st.disclaimer}>
        * This calculation is approximate. Final rates and bank fees are determined after application review.
      </Text>

      <TouchableOpacity style={[st.ctaBtn, { backgroundColor: GOLD }]} onPress={() => Linking.openURL("tel:+15550000000")}>
        <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={st.ctaText}>Free Consultation – +1 (555) 000-0000</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function CreditCalculatorModal({ visible, type, onClose }: CreditCalculatorModalProps) {
  const insets = useSafeAreaInsets();

  const isIpotecar = type === "ipotecar";
  const title = isIpotecar ? "Mortgage" : "Personal Loan";
  const accent = isIpotecar ? BLUE : GOLD;
  const icon: keyof typeof Ionicons.glyphMap = isIpotecar ? "home-outline" : "wallet-outline";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#F5F7FA" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            st.header,
            {
              paddingTop: insets.top + 6,
              borderBottomColor: "#E8E8E8",
              backgroundColor: "#fff",
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={st.closeBtn}>
            <Ionicons name="close" size={24} color={BLUE} />
          </TouchableOpacity>

          <View style={st.headerCenter}>
            <View style={[st.headerIcon, { backgroundColor: accent + "18" }]}>
              <Ionicons name={icon} size={20} color={accent} />
            </View>
            <Text style={st.headerTitle}>{title}</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <View style={st.tabRow}>
          <TouchableOpacity
            style={[st.tab, st.tabActive, { borderBottomColor: accent }]}
            onPress={() => {}}
          >
            <Text style={[st.tabText, { color: accent }]}>Simulator</Text>
          </TouchableOpacity>
        </View>

        {isIpotecar ? <IpotecarCalc /> : <NevoiCalc />}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, alignItems: "flex-start" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: "600", color: "#999" },

  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  resultLabel: { fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  resultMain: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5 },
  resultSub: { fontSize: 12, color: "#999", marginTop: 6, textAlign: "center" },

  stepperWrap: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepperLabel: { fontSize: 12, color: "#888", marginBottom: 10, fontWeight: "500" },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", flex: 1, textAlign: "center" },
  stepperInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    paddingHorizontal: 10,
  },
  stepperHelper: {
    marginTop: 8,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    fontWeight: "600",
  },
  track: {
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  trackFill: { height: "100%", borderRadius: 2 },

  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  rowLabel: { fontSize: 13, color: "#555" },
  rowValue: { fontSize: 13, color: "#1A1A2E", fontWeight: "600" },

  disclaimer: {
    fontSize: 11,
    color: "#aaa",
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  ctaText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});