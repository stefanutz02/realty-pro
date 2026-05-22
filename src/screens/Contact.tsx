// src/screens/Contact.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";

export default function Contact({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [userType, setUserType] = useState("Buyer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propType, setPropType] = useState("");
  const [city, setCity] = useState("");
  const [rooms, setRooms] = useState("");
  const [baths, setBaths] = useState("");
  const [budget, setBudget] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const EMAIL_API = "https:

  const handleSubmit = async () => {
    if (!userType || !firstName || !lastName || !email || !phone || !propType || !city || !budget) {
      return Alert.alert("Error", "Please fill in all required fields.");
    }
    if (!agree) {
      return Alert.alert("Agreement required", "You must agree to the terms of service.");
    }

    try {
      setSubmitting(true);

      const payload = {
        source: "contact_page",
        subject: `New Contact Message: ${firstName} ${lastName}`,
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        prop_type: propType,
        city,
        budget,
        rooms,
        baths,
        message: "Sent from the Contact page of the mobile app.",
      };

      const res = await fetch(EMAIL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        Alert.alert("Sent", "Your message was sent successfully. We'll contact you soon.");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Could not send the form. Please try again later.");
      }
    } catch (e) {
      console.log("Error sending contact form:", e);
      Alert.alert("Error", "A network issue occurred. Check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = (left: React.ReactNode, right: React.ReactNode) => (
    <View style={styles.row}>
      <View style={styles.col}>{left}</View>
      <View style={styles.col}>{right}</View>
    </View>
  );

  const userTypeOptions = ["Buyer", "Seller", "Agent"];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroLogo}>RealtyPro</Text>
            <Text style={styles.heroTitle}>Contact Us</Text>
            <Text style={styles.heroSubtitle}>
              NATIONWIDE · REAL ESTATE SERVICES · PROPERTY CONSULTATION
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            <View style={styles.contactRow}>
              <View style={styles.contactCard}>
                <Ionicons name="call-outline" size={26} color="#0A84FF" />
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+1 (XXX) XXX-XXXX</Text>
              </View>

              <View style={styles.contactCard}>
                <Ionicons name="mail-outline" size={26} color="#0A84FF" />
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue} numberOfLines={2}>
                  support@real-estate{"\n"}stefanvasilescu.com
                </Text>
              </View>

              <View style={styles.contactCard}>
                <Ionicons name="location-outline" size={26} color="#0A84FF" />
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue} numberOfLines={3}>
                  {"Customizable\nAddress\nLocation"}
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Send us a message</Text>

              <Text style={styles.sectionLabel}>Personal Information</Text>

              <View style={styles.typeRow}>
                {userTypeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.typeBtn,
                      userType === opt && styles.typeBtnActive,
                    ]}
                    onPress={() => setUserType(opt)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        userType === opt && styles.typeBtnTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {renderRow(
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#aaa"
                  value={firstName}
                  onChangeText={setFirstName}
                />,
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#aaa"
                  value={lastName}
                  onChangeText={setLastName}
                />
              )}

              {renderRow(
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#aaa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />,
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              )}

              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                Property Details
              </Text>

              {renderRow(
                <TextInput
                  style={styles.input}
                  placeholder="Property type"
                  placeholderTextColor="#aaa"
                  value={propType}
                  onChangeText={setPropType}
                />,
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#aaa"
                  value={city}
                  onChangeText={setCity}
                />
              )}

              {renderRow(
                <TextInput
                  style={styles.input}
                  placeholder="No. bedrooms"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  value={rooms}
                  onChangeText={setRooms}
                />,
                <TextInput
                  style={styles.input}
                  placeholder="No. bathrooms"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  value={baths}
                  onChangeText={setBaths}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Your budget"
                placeholderTextColor="#aaa"
                value={budget}
                onChangeText={setBudget}
              />

              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={() => setAgree(!agree)}
                  style={[styles.checkbox, agree && styles.checkboxActive]}
                >
                  {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the Privacy Policy and Security Terms *
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitText}>
                  {submitting ? "Sending..." : "SEND MESSAGE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppFooter variant="compact" />
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
  },
  heroLogo: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 8, letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff", marginTop: 12 },
  heroSubtitle: {
    fontSize: 12,
    color: "#C8E0FF",
    marginTop: 5,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  contactRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  contactValue: {
    fontSize: 11,
    color: "#333",
    marginTop: 3,
    textAlign: "center",
    lineHeight: 16,
  },

  formCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  formTitle: { fontSize: 19, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 },

  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  typeBtnActive: {
    backgroundColor: "#0A84FF",
    borderColor: "#0A84FF",
  },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: "#666" },
  typeBtnTextActive: { color: "#fff" },

  row: { flexDirection: "row", marginBottom: 10, gap: 10 },
  col: { flex: 1 },

  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    color: "#222",
    marginBottom: 10,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#0A84FF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkboxActive: {
    backgroundColor: "#0A84FF",
  },
  termsText: { flex: 1, fontSize: 12, color: "#666", lineHeight: 18 },

  submitBtn: {
    backgroundColor: "#D68B1A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
