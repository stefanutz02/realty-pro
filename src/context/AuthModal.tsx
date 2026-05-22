// src/context/AuthModal.tsx

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { buildApiUrl, API_ENDPOINTS } from "../config/api";

const BLUE = "#0A84FF";
const GOLD = "#D68B1A";

interface AuthModalProps {
  visible: boolean;
  initialTab?: "login" | "register";
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({
  visible,
  initialTab = "login",
  onClose,
  onSuccess,
}: AuthModalProps) {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [tab, setTab] = useState<"login" | "register" | "forgot">(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const switchTab = (t: "login" | "register" | "forgot") => {
    setTab(t);
    setError("");
    setForgotSuccess(false);
  };

  const resetAllFields = () => {
    setLoginEmail("");
    setLoginPassword("");
    setRegFirstName("");
    setRegLastName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegConfirm("");
    setForgotEmail("");
    setAgreedTerms(false);
    setError("");
    setForgotSuccess(false);
  };

  const handleClose = () => {
    resetAllFields();
    onClose();
  };

  const handleLogin = async () => {
    setError("");
    if (!loginEmail.trim() || !loginPassword) {
      setError("Please enter both email and password.");
      shake();
      return;
    }
    setLoading(true);
    const result = await login(loginEmail.trim(), loginPassword);
    setLoading(false);
    if (result.ok) {
      resetAllFields();
      onSuccess?.();
      onClose();
    } else {
      setError(result.error ?? "An error occurred. Please try again.");
      shake();
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!regFirstName || !regLastName || !regEmail || !regPassword) {
      setError("Please fill in all required fields.");
      shake();
      return;
    }
    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      shake();
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      shake();
      return;
    }
    if (!agreedTerms) {
      setError("You must accept the Terms and Conditions.");
      shake();
      return;
    }

    setLoading(true);
    const result = await register({
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone,
      agreedTerms: agreedTerms,
    });
    setLoading(false);
    if (result.ok) {
      resetAllFields();
      onSuccess?.();
      onClose();
    } else {
      setError(result.error ?? "An error occurred. Please try again.");
      shake();
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setError("Please enter a valid email address.");
      shake();
      return;
    }

    setLoading(true);
    try {
      const url = buildApiUrl(API_ENDPOINTS.auth.forgotPassword);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const json = await res.json();

      setLoading(false);
      if (json.ok) {
        setForgotSuccess(true);
        Alert.alert(
          "Email Sent",
          "Check your inbox and spam folder for password reset instructions.",
          [{ text: "OK", onPress: () => switchTab("login") }]
        );
      } else {
        setError(json.message || "Failed to send reset email.");
        shake();
      }
    } catch (e) {
      setLoading(false);
      setError("Network error. Please try again.");
      shake();
    }
  };

  const renderHeader = () => (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
        <Ionicons name="close" size={22} color="#666" />
      </TouchableOpacity>
      <Text style={s.logoText}>RealtyPro</Text>
      <View style={{ width: 36 }} />
    </View>
  );

  const renderTabSwitcher = () => (
    tab !== "forgot" ? (
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, tab === "login" && s.tabActive]}
          onPress={() => switchTab("login")}
        >
          <Text style={[s.tabText, tab === "login" && s.tabTextActive]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === "register" && s.tabActive]}
          onPress={() => switchTab("register")}
        >
          <Text style={[s.tabText, tab === "register" && s.tabTextActive]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    ) : null
  );

  const renderError = () => (
    error ? (
      <View style={s.errorBanner}>
        <Ionicons name="alert-circle" size={16} color="#D32F2F" />
        <Text style={s.errorText}>{error}</Text>
      </View>
    ) : null
  );

  const renderLoginForm = () => (
    <View style={s.formCard}>
      <Text style={s.formTitle}>Welcome Back!</Text>
      <Text style={s.formSubtitle}>Sign in to access your account</Text>

      {renderError()}

      <Text style={s.fieldLabel}>Email Address</Text>
      <View style={s.inputWrap}>
        <Ionicons name="mail-outline" size={18} color="#aaa" style={s.inputIcon} />
        <TextInput
          style={s.input}
          placeholder="you@example.com"
          placeholderTextColor="#bbb"
          keyboardType="email-address"
          autoCapitalize="none"
          value={loginEmail}
          onChangeText={setLoginEmail}
        />
      </View>

      <Text style={s.fieldLabel}>Password</Text>
      <View style={s.inputWrap}>
        <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={s.inputIcon} />
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="Enter your password"
          placeholderTextColor="#bbb"
          secureTextEntry={!showLoginPwd}
          value={loginPassword}
          onChangeText={setLoginPassword}
        />
        <TouchableOpacity onPress={() => setShowLoginPwd(!showLoginPwd)} style={s.eyeBtn}>
          <Ionicons name={showLoginPwd ? "eye-off-outline" : "eye-outline"} size={18} color="#aaa" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.forgotBtn} onPress={() => switchTab("forgot")}>
        <Text style={s.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.submitBtn, loading && s.submitBtnDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={s.submitText}>Sign In</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => switchTab("register")} style={s.switchLink}>
        <Text style={s.switchText}>
          Don't have an account? <Text style={s.switchTextBold}>Create one free →</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderForgotPasswordForm = () => (
    <View style={s.formCard}>
      <TouchableOpacity onPress={() => switchTab("login")} style={s.backBtn}>
        <Ionicons name="arrow-back" size={20} color={BLUE} />
        <Text style={s.backText}>Back to Sign In</Text>
      </TouchableOpacity>

      <Text style={s.formTitle}>Reset Password</Text>
      <Text style={s.formSubtitle}>
        Enter your email and we'll send you instructions to reset your password.
      </Text>

      {forgotSuccess && (
        <View style={s.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Text style={s.successText}>Email sent! Check your inbox.</Text>
        </View>
      )}

      {renderError()}

      <Text style={s.fieldLabel}>Email Address</Text>
      <View style={s.inputWrap}>
        <Ionicons name="mail-outline" size={18} color="#aaa" style={s.inputIcon} />
        <TextInput
          style={s.input}
          placeholder="you@example.com"
          placeholderTextColor="#bbb"
          keyboardType="email-address"
          autoCapitalize="none"
          value={forgotEmail}
          onChangeText={setForgotEmail}
        />
      </View>

      <TouchableOpacity
        style={[s.submitBtn, { backgroundColor: GOLD }, loading && s.submitBtnDisabled]}
        onPress={handleForgotPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color="#fff" />
            <Text style={s.submitText}>Send Instructions</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={s.formCard}>
      <Text style={s.formTitle}>Create Account</Text>
      <Text style={s.formSubtitle}>Save properties, contact agents, and more</Text>

      {renderError()}

      <View style={s.row}>
        <View style={s.half}>
          <Text style={s.fieldLabel}>First Name *</Text>
          <View style={s.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#aaa" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="John"
              placeholderTextColor="#bbb"
              value={regFirstName}
              onChangeText={setRegFirstName}
            />
          </View>
        </View>
        <View style={s.half}>
          <Text style={s.fieldLabel}>Last Name *</Text>
          <View style={s.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#aaa" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Doe"
              placeholderTextColor="#bbb"
              value={regLastName}
              onChangeText={setRegLastName}
            />
          </View>
        </View>
      </View>

      <Text style={s.fieldLabel}>Email *</Text>
      <View style={s.inputWrap}>
        <Ionicons name="mail-outline" size={18} color="#aaa" style={s.inputIcon} />
        <TextInput
          style={s.input}
          placeholder="you@example.com"
          placeholderTextColor="#bbb"
          keyboardType="email-address"
          autoCapitalize="none"
          value={regEmail}
          onChangeText={setRegEmail}
        />
      </View>

      <Text style={s.fieldLabel}>Phone</Text>
      <View style={s.inputWrap}>
        <Ionicons name="call-outline" size={18} color="#aaa" style={s.inputIcon} />
        <TextInput
          style={s.input}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor="#bbb"
          keyboardType="phone-pad"
          value={regPhone}
          onChangeText={setRegPhone}
        />
      </View>

      <Text style={s.fieldLabel}>Password *</Text>
      <View style={s.inputWrap}>
        <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={s.inputIcon} />
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="At least 6 characters"
          placeholderTextColor="#bbb"
          secureTextEntry={!showRegPwd}
          value={regPassword}
          onChangeText={setRegPassword}
        />
        <TouchableOpacity onPress={() => setShowRegPwd(!showRegPwd)} style={s.eyeBtn}>
          <Ionicons name={showRegPwd ? "eye-off-outline" : "eye-outline"} size={18} color="#aaa" />
        </TouchableOpacity>
      </View>

      <Text style={s.fieldLabel}>Confirm Password *</Text>
      <View style={s.inputWrap}>
        <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={s.inputIcon} />
        <TextInput
          style={s.input}
          placeholder="Re-enter your password"
          placeholderTextColor="#bbb"
          secureTextEntry={!showRegPwd}
          value={regConfirm}
          onChangeText={setRegConfirm}
        />
      </View>

      {regPassword.length > 0 && (
        <View style={s.strengthRow}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                s.strengthBar,
                {
                  backgroundColor:
                    regPassword.length >= i * 3
                      ? i <= 1
                        ? "#FF3B30"
                        : i <= 2
                        ? "#FF9500"
                        : i <= 3
                        ? "#34C759"
                        : BLUE
                      : "#E0E0E0",
                },
              ]}
            />
          ))}
          <Text style={s.strengthLabel}>
            {regPassword.length < 4 ? "Weak" : regPassword.length < 7 ? "Fair" : regPassword.length < 10 ? "Good" : "Strong"}
          </Text>
        </View>
      )}

      <TouchableOpacity style={s.termsRow} onPress={() => setAgreedTerms(!agreedTerms)} activeOpacity={0.8}>
        <View style={[s.checkbox, agreedTerms && s.checkboxActive]}>
          {agreedTerms && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
        <Text style={s.termsText}>
          I agree to the <Text style={{ color: BLUE, fontWeight: "600" }}>Terms & Conditions</Text> and{" "}
          <Text style={{ color: BLUE, fontWeight: "600" }}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.submitBtn, { backgroundColor: GOLD }, loading && s.submitBtnDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={s.submitText}>Create Account</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => switchTab("login")} style={s.switchLink}>
        <Text style={s.switchText}>
          Ai deja cont? <Text style={s.switchTextBold}>Autentifică-te →</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#F5F7FA" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {renderHeader()}
        {renderTabSwitcher()}

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            {tab === "login" && renderLoginForm()}
            {tab === "forgot" && renderForgotPasswordForm()}
            {tab === "register" && renderRegisterForm()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A84FF",
    letterSpacing: 0.5,
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: BLUE },
  tabText: { fontSize: 15, fontWeight: "600", color: "#999" },
  tabTextActive: { color: BLUE },

  scroll: { padding: 16, paddingBottom: 60 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#D32F2F",
  },
  errorText: { flex: 1, fontSize: 13, color: "#C62828", lineHeight: 18 },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#34C759",
  },
  successText: { flex: 1, fontSize: 13, color: "#2E7D32", lineHeight: 18 },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  backText: { fontSize: 14, color: BLUE, fontWeight: "600" },
  formTitle: { fontSize: 22, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
  formSubtitle: { fontSize: 13, color: "#888", marginBottom: 22, lineHeight: 18 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
    paddingVertical: 13,
  },
  eyeBtn: { padding: 4 },

  forgotBtn: { alignSelf: "flex-end", marginTop: 10, marginBottom: 4 },
  forgotText: { fontSize: 13, color: BLUE, fontWeight: "600" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 22,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  switchLink: { alignItems: "center", marginTop: 18 },
  switchText: { fontSize: 14, color: "#888" },
  switchTextBold: { color: BLUE, fontWeight: "700" },

  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, color: "#888", marginLeft: 6, width: 56 },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: { backgroundColor: BLUE, borderColor: BLUE },
  termsText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 19 },
});
