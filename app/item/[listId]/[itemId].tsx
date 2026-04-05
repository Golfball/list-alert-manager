import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";

export default function KeywordDetailScreen() {
  const { listId, itemId } = useLocalSearchParams<{ listId: string; itemId: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { lists, updateAddressItem, removeItemFromList } = useLists();

  const list = lists.find((l) => l.id === listId);
  const item = list?.items.find((i) => i.id === itemId);

  const [notes, setNotes] = useState(item?.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  if (!list || !item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, padding: 20 }}>Keyword not found.</Text>
      </View>
    );
  }

  const handleSaveNotes = () => {
    updateAddressItem(list.id, item.id, { notes });
    setNotesDirty(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCopyKeyword = async () => {
    try {
      await Clipboard.setStringAsync(item.text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleDelete = () => {
    Alert.alert("Remove Keyword", `Remove "${item.text}" from this list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          removeItemFromList(list.id, item.id);
          router.back();
        },
      },
    ]);
  };

  const topPad = (Platform.OS === "web" ? 67 : insets.top) + 12;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: list.color, paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={2}>{item.text}</Text>
          <Text style={styles.headerSub}>{list.name} · Keyword</Text>
        </View>
        <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={10}>
          <Feather name="trash-2" size={18} color="rgba(255,255,255,0.85)" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Keyword display card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.keywordRow}>
            <View style={[styles.keywordIcon, { backgroundColor: list.color + "20" }]}>
              <Feather name="tag" size={22} color={list.color} />
            </View>
            <View style={styles.keywordBody}>
              <Text style={[styles.keywordText, { color: colors.text }]}>{item.text}</Text>
              <Text style={[styles.keywordHint, { color: colors.textSecondary }]}>
                This keyword is monitored in your clipboard
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleCopyKeyword}
            style={[styles.copyBtn, { backgroundColor: list.color }]}
          >
            <Feather name="copy" size={15} color="#fff" />
            <Text style={styles.copyBtnText}>Copy Keyword</Text>
          </Pressable>
        </View>

        {/* Notes */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={(t) => { setNotes(t); setNotesDirty(true); }}
            placeholder="Add notes about this keyword..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            style={[
              styles.notesInput,
              {
                color: colors.text,
                backgroundColor: isDark ? "#1a1f2e" : "#f9fafb",
                borderColor: notesDirty ? list.color : colors.border,
              },
            ]}
          />
          {notesDirty && (
            <Pressable
              onPress={handleSaveNotes}
              style={[styles.saveBtn, { backgroundColor: list.color }]}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Save Notes</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    lineHeight: 24,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  keywordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  keywordIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  keywordBody: { flex: 1, gap: 3 },
  keywordText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 24,
  },
  keywordHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 110,
    textAlignVertical: "top",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
