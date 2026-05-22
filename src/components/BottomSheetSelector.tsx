// src/components/BottomSheetSelector.tsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BottomSheetSelectorProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  showSearch?: boolean;
}

export default function BottomSheetSelector({
  label,
  value,
  options,
  onChange,
  showSearch = false,
}: BottomSheetSelectorProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isSelected = value && value !== "Oricare";
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (visible && showSearch) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, showSearch]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleSelect = (item: string) => {
    onChange(item);
    Keyboard.dismiss();
    setTimeout(() => {
      setVisible(false);
      setSearchQuery("");
    }, 100);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setVisible(false);
    setSearchQuery("");
    setKeyboardHeight(0);
  };

  const screenHeight = Dimensions.get("window").height;
  const maxSheetHeight = screenHeight * 0.7;
  const sheetHeight = keyboardHeight > 0 
    ? screenHeight - keyboardHeight - 50
    : maxSheetHeight;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.selector, isSelected && styles.selectorActive]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
      >
        <Text
          style={[styles.selectorText, isSelected && styles.selectorTextActive]}
          numberOfLines={1}
        >
          {value || "Any"}
        </Text>
        <Ionicons
          name="chevron-down"
          size={15}
          color={isSelected ? "#0A84FF" : "#999"}
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          
          <View style={[styles.sheet, { maxHeight: sheetHeight }]}>
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>{label}</Text>

            {showSearch && (
              <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={18} color="#888" />
                  <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    placeholder="Search location..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color="#888" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark-circle" size={18} color="#0A84FF" />
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
            />

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
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

  keyboardView: {
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
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
    textAlign: "center",
  },

  searchContainer: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
    padding: 0,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  optionActive: {
    backgroundColor: "#EAF2FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderBottomColor: "transparent",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  optionTextActive: {
    color: "#0A84FF",
    fontWeight: "600",
  },

  emptyState: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
  },

  closeBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  closeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0A84FF",
  },
});
