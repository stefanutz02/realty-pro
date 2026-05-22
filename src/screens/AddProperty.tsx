// src/screens/AddProperty.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AppFooter from "../components/AppFooter";

const BLUE = "#0A84FF";
const GOLD = "#D68B1A";

type ModalType = "client_buy" | "client_rent" | "owner_sell" | "owner_rent";

function PropertyForm({
  contextTitle,
  onSuccess,
}: {
  contextTitle: string;
  onSuccess: () => void;
}) {
  const isOwner =
    contextTitle.includes("sell") || contextTitle.includes("I'm a seller");
  const isRent =
    contextTitle.toLowerCase().includes("rent");

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propType, setPropType] = useState("");
  const [city, setCity] = useState("");
  const [rooms, setRooms] = useState("");
  const [baths, setBaths] = useState("");
  const [budget, setBudget] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [district, setDistrict] = useState("");
  const [adresa, setAdresa] = useState("");
  const [landmarks, setLandmarks] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [priceType, setPriceType] = useState("Total");
  const [layoutType, setLayoutType] = useState("Separated");
  const [surface, setSurface] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [heating, setHeating] = useState("Central heating");
  const [furnished, setFurnished] = useState("Unfurnished");
  const [yearBuilt, setYearBuilt] = useState("");
  const [structure, setStructure] = useState("Concrete");
  const [firstHome, setFirstHome] = useState(false);
  const [images, setImages] = useState<any[]>([]);

  const EMAIL_API = "https:

  let propTypePlaceholder = "What would you like to buy?";
  if (isOwner) {
    propTypePlaceholder = isRent ? "What would you like to rent?" : "What would you like to sell?";
  } else {
    propTypePlaceholder = isRent ? "What would you like to rent?" : "What would you like to buy?";
  }

  const toggleAmenity = (val: string) => {
    setAmenities((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.4,
    });

    if (!result.canceled) {
      const selected = result.assets.map((a) => ({ uri: a.uri }));
      setImages((prev) => [...prev, ...selected].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!firstName || !email || !phone) {
      return Alert.alert(
        "Error",
        "Please fill in required fields (Name, Email, Phone)."
      );
    }
    if (!agree) {
      return Alert.alert("Agreement required", "You must agree to the terms of service.");
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("subject", contextTitle);
      formData.append("first_name", firstName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("propType", propType);
      formData.append("city", city);
      formData.append("source", isOwner ? "seller" : "buyer");
      formData.append("district", district);
      formData.append("address", adresa);
      formData.append("landmarks", landmarks);
      formData.append("budget", budget);
      formData.append("prop_type", propType);
      formData.append("rooms", rooms);
      formData.append("baths", baths);

      if (isOwner) {
        formData.append("currency", currency);
        formData.append("price_type", priceType);
        formData.append("layout_type", layoutType);
        formData.append("surface", surface);
        formData.append("floor", floor);
        formData.append("total_floors", totalFloors);
        formData.append("amenities", amenities.join(", "));
        formData.append("heating", heating);
        formData.append("furnished", furnished);
        formData.append("year_built", yearBuilt);
        formData.append("structure", structure);
        formData.append("first_home", firstHome ? "1" : "0");

        images.forEach((img, index) => {
          const ext = img.uri.split(".").pop()?.toLowerCase() ?? "jpg";
          const fileName = `photo_${index}_${Date.now()}.${ext}`;
          formData.append("images[]", {
            uri: Platform.OS === "ios" ? img.uri.replace("file:
            name: fileName,
            type: `image/${ext === "jpg" ? "jpeg" : ext}`,
          });
        });
      }

      const res = await fetch(EMAIL_API, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        Alert.alert("Success", "Your request has been sent successfully!");
        onSuccess();
      } else {
        Alert.alert("Error", "Server encountered an issue. Please try again.");
      }
    } catch (e) {
      console.log("Error:", e);
      Alert.alert("Error", "Network issue. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTwo = (left: React.ReactNode, right: React.ReactNode) => (
    <View style={styles.row}>
      <View style={styles.col}>{left}</View>
      <View style={styles.col}>{right}</View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>CONTACT INFORMATION</Text>
        {renderTwo(
          <TextInput
            style={styles.input}
            placeholder="Name (required)"
            placeholderTextColor="#aaa"
            value={firstName}
            onChangeText={setFirstName}
          />,
          <TextInput
            style={styles.input}
            placeholder="Phone (required)"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        )}
        {renderTwo(
          <TextInput
            style={styles.input}
            placeholder="Email (required)"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />,
          <TextInput
            style={styles.input}
            placeholder={propTypePlaceholder}
            placeholderTextColor="#aaa"
            value={propType}
            onChangeText={setPropType}
          />
        )}

        {isOwner ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PROPERTY LOCATION</Text>
            {renderTwo(
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#aaa"
                value={city}
                onChangeText={setCity}
              />,
              <TextInput
                style={styles.input}
                placeholder="District / Neighborhood"
                placeholderTextColor="#aaa"
                value={district}
                onChangeText={setDistrict}
              />
            )}
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Exact address"
              placeholderTextColor="#aaa"
              value={adresa}
              onChangeText={setAdresa}
            />
            <TextInput
              style={styles.input}
              placeholder="Landmarks"
              placeholderTextColor="#aaa"
              value={landmarks}
              onChangeText={setLandmarks}
            />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PRICE DETAILS</Text>
            <View style={styles.row}>
              <View style={{ flex: 2 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => {
                    const opts = ["EUR", "RON", "USD"];
                    setCurrency(opts[(opts.indexOf(currency) + 1) % opts.length]);
                  }}
                >
                  <Text style={styles.selectLabel}>Currency</Text>
                  <Text style={styles.selectValue}>{currency}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1.5 }}>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setPriceType(priceType === "Total" ? "/sqm" : "Total")}
                >
                  <Text style={styles.selectLabel}>Price type</Text>
                  <Text style={styles.selectValue}>{priceType}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CHARACTERISTICS</Text>
            <TouchableOpacity
              style={[styles.selectBox, { marginBottom: 10 }]}
              onPress={() => {
                const opts = [
                  "Separated",
                  "Semi-separated",
                  "Open-plan",
                  "Studio",
                  "Room",
                ];
                setLayoutType(opts[(opts.indexOf(layoutType) + 1) % opts.length]);
              }}
            >
              <Text style={styles.selectLabel}>Layout</Text>
              <Text style={styles.selectValue}>{layoutType}</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Surface area (m²)"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={surface}
                onChangeText={setSurface}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Bedrooms"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={rooms}
                onChangeText={setRooms}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Bathrooms"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={baths}
                onChangeText={setBaths}
              />
            </View>

            {renderTwo(
              <TextInput
                style={styles.input}
                placeholder="Floor"
                placeholderTextColor="#aaa"
                value={floor}
                onChangeText={setFloor}
              />,
              <TextInput
                style={styles.input}
                placeholder="Total floors"
                placeholderTextColor="#aaa"
                value={totalFloors}
                onChangeText={setTotalFloors}
              />
            )}

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>AMENITIES</Text>
            <Text style={styles.hintText}>Select one or more options</Text>
            <View style={styles.chipsRow}>
              {[
                "Gas",
                "Tiles & Ceramics",
                "Interior renovated",
                "Double-glazed windows",
                "Parquet",
                "Metal door",
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleAmenity(item)}
                  style={[styles.chip, amenities.includes(item) && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      amenities.includes(item) && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {renderTwo(
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                  const opts = [
                    "Central heating",
                    "District heating",
                    "None (disconnected)",
                    "Stove",
                    "Other",
                  ];
                  setHeating(opts[(opts.indexOf(heating) + 1) % opts.length]);
                }}
              >
                <Text style={styles.selectLabel}>Heating</Text>
                <Text style={styles.selectValue}>{heating}</Text>
              </TouchableOpacity>,
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                  const opts = ["Unfurnished", "Partially furnished", "Fully furnished", "Luxury"];
                  setFurnished(opts[(opts.indexOf(furnished) + 1) % opts.length]);
                }}
              >
                <Text style={styles.selectLabel}>Furnished</Text>
                <Text style={styles.selectValue}>{furnished}</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CONSTRUCTION</Text>
            {renderTwo(
              <TextInput
                style={styles.input}
                placeholder="Year built"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={yearBuilt}
                onChangeText={setYearBuilt}
              />,
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                  const opts = [
                    "Concrete",
                    "Steel frame",
                    "Brick",
                    "Lightweight concrete",
                    "Panels",
                    "Metal shed",
                    "Sandwich panels",
                  ];
                  setStructure(opts[(opts.indexOf(structure) + 1) % opts.length]);
                }}
              >
                <Text style={styles.selectLabel}>Structure</Text>
                <Text style={styles.selectValue}>{structure}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.termsRow}>
              <TouchableOpacity
                onPress={() => setFirstHome(!firstHome)}
                style={[styles.checkbox, firstHome && styles.checkboxActive]}
              >
                {firstHome && <Ionicons name="checkmark" size={14} color="white" />}
              </TouchableOpacity>
              <Text style={styles.termsText}>I accept first-time homebuyer program eligibility</Text>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>IMAGES (MAX. 5)</Text>
            <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImages}>
              <Ionicons name="camera-outline" size={24} color={GOLD} />
              <Text style={{ color: GOLD, fontWeight: "600", marginTop: 4 }}>
                Upload images
              </Text>
              <Text style={{ color: "#aaa", fontSize: 12 }}>
                {images.length}/5 images selected
              </Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <View style={styles.imagePreviewRow}>
                {images.map((img, index) => (
                  <View key={index}>
                    <Image source={{ uri: img.uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeBadge}
                      onPress={() => setImages(images.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close" size={11} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>DESIRED LOCATION</Text>
            {renderTwo(
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#aaa"
                value={city}
                onChangeText={setCity}
              />,
              <TextInput
                style={styles.input}
                placeholder="District / Neighborhood"
                placeholderTextColor="#aaa"
                value={district}
                onChangeText={setDistrict}
              />
            )}
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Exact address"
              placeholderTextColor="#aaa"
              value={adresa}
              onChangeText={setAdresa}
            />
            <TextInput
              style={styles.input}
              placeholder="Landmarks"
              placeholderTextColor="#aaa"
              value={landmarks}
              onChangeText={setLandmarks}
            />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PROPERTY DETAILS</Text>
            {renderTwo(
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
              placeholder="Your budget (EUR)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />
          </>
        )}

        <View style={[styles.termsRow, { marginTop: 28 }]}>
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
            {submitting ? "Sending..." : "SUBMIT REQUEST"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function AddProperty({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [modalType, setModalType] = useState<ModalType | null>(null);

  const getModalTitle = (type: ModalType | null): string => {
    switch (type) {
      case "client_buy":
        return "I want to buy a property";
      case "client_rent":
        return "I want to rent a property";
      case "owner_sell":
        return "I'm a seller and want to sell a property";
      case "owner_rent":
        return "I'm a seller and want to rent a property";
      default:
        return "";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroLogo}>RealtyPro</Text>
          <Text style={styles.heroTitle}>Add Listing</Text>
          <Text style={styles.heroSubtitle}>Tell us what you need, and we'll contact you.</Text>
        </View>

        <View style={styles.cardsGrid}>
          <View style={styles.optionCard}>
            <View style={styles.optionCardHeader}>
              <Ionicons name="person-outline" size={22} color={BLUE} />
              <Text style={styles.optionCardTitle}>I'm a buyer</Text>
            </View>
            <Text style={styles.optionCardSub}>I want to</Text>
            <TouchableOpacity
              style={styles.optionBtn}
              onPress={() => setModalType("client_buy")}
            >
              <Ionicons name="home-outline" size={16} color={BLUE} />
              <Text style={styles.optionBtnText}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionBtn}
              onPress={() => setModalType("client_rent")}
            >
              <Ionicons name="key-outline" size={16} color={BLUE} />
              <Text style={styles.optionBtnText}>Rent</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionCard}>
            <View style={styles.optionCardHeader}>
              <Ionicons name="business-outline" size={22} color={GOLD} />
              <Text style={[styles.optionCardTitle, { color: GOLD }]}>I'm a seller</Text>
            </View>
            <Text style={styles.optionCardSub}>I want to</Text>
            <TouchableOpacity
              style={[styles.optionBtn, { borderColor: GOLD }]}
              onPress={() => setModalType("owner_sell")}
            >
              <Ionicons name="pricetag-outline" size={16} color={GOLD} />
              <Text style={[styles.optionBtnText, { color: GOLD }]}>Sell</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, { borderColor: GOLD }]}
              onPress={() => setModalType("owner_rent")}
            >
              <Ionicons name="document-text-outline" size={16} color={GOLD} />
              <Text style={[styles.optionBtnText, { color: GOLD }]}>Rent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AppFooter variant="compact" />

      <Modal
        visible={modalType !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setModalType(null)}
      >
        <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
          <View
            style={{
              paddingTop: insets.top,
              height: 50 + insets.top,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#E8E8E8",
              backgroundColor: "#fff",
            }}
          >
            <TouchableOpacity onPress={() => setModalType(null)}>
              <Ionicons name="close" size={26} color={BLUE} />
            </TouchableOpacity>
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 15,
                fontWeight: "700",
                marginRight: 30,
                color: "#222",
              }}
            >
              {getModalTitle(modalType)}
            </Text>
          </View>

          {modalType && (
            <PropertyForm
              contextTitle={getModalTitle(modalType)}
              onSuccess={() => setModalType(null)}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },

  hero: {
    backgroundColor: BLUE,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogo: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 12, letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroSubtitle: { fontSize: 13, color: "#C8E0FF", marginTop: 5, textAlign: "center" },

  cardsGrid: {
    flexDirection: "row",
    margin: 16,
    gap: 12,
  },
  optionCard: {
  flex: 1,
  backgroundColor: "#fff",
  borderRadius: 18,
  padding: 14,
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
},
  optionCardHeader: {
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  marginBottom: 8,
},
  optionCardTitle: {
  fontSize: 14,
  fontWeight: "700",
  color: BLUE,
  textAlign: "center",
  flexShrink: 1,
},
  optionCardSub: { fontSize: 11, color: "#999", marginBottom: 10, textAlign: "center" },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BLUE,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  optionBtnText: { fontSize: 14, fontWeight: "600", color: BLUE },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 11,
    color: "#aaa",
    fontStyle: "italic",
    marginBottom: 10,
    marginTop: -4,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  col: { flex: 1 },

  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#222",
    marginBottom: 10,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  selectLabel: { fontSize: 10, color: "#aaa", marginBottom: 2 },
  selectValue: { fontSize: 14, color: "#222", fontWeight: "500" },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: BLUE,
    backgroundColor: BLUE,
  },
  chipText: { color: "#555", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  imageUploadBtn: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FFFBF5",
    marginBottom: 12,
  },
  imagePreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  removeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BLUE,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkboxActive: { backgroundColor: BLUE },
  termsText: { flex: 1, fontSize: 12, color: "#666", lineHeight: 18 },

  submitBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
