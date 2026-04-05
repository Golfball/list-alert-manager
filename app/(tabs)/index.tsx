import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { ImportModal } from "@/components/ImportModal";
import { ListCard } from "@/components/ListCard";
import { ListModal } from "@/components/ListModal";
import { ListItem, useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";

export default function ListsScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { lists, addList, updateList, manuallyPaused, toggleMonitoring } = useLists();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<ListItem | null>(null);
  const [importVisible, setImportVisible] = useState(false);

  const handleSave = (data: {
    name: string;
    color: string;
    flashEnabled: boolean;
    notificationsEnabled: boolean;
  }) => {
    if (editingList) {
      updateList(editingList.id, data);
    } else {
      addList(data);
    }
    setEditingList(null);
  };

  const handleEdit = (list: ListItem) => {
    setEditingList(list);
    setModalVisible(true);
  };

  const handleImport = (name: string, color: string, items: string[]) => {
    addList({
      name,
      color,
      flashEnabled: true,
      notificationsEnabled: true,
      items: items.map((text) => ({ id: `${Date.now()}-${Math.random()}`, text, isAddress: true })),
    });
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Lists</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {lists.length} {lists.length === 1 ? "list" : "lists"}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleMonitoring();
            }}
            style={[
              styles.monitorBtn,
              { backgroundColor: manuallyPaused ? "#fef3c7" : "#dcfce7" },
            ]}
            hitSlop={6}
          >
            <View
              style={[
                styles.monitorDot,
                { backgroundColor: manuallyPaused ? "#f59e0b" : "#22c55e" },
              ]}
            />
            <Text
              style={[
                styles.monitorLabel,
                { color: manuallyPaused ? "#92400e" : "#15803d" },
              ]}
            >
              {manuallyPaused ? "Paused" : "Live"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setImportVisible(true);
            }}
            style={[styles.iconBtn, { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" }]}
            hitSlop={6}
          >
            <Feather name="download" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditingList(null);
              setModalVisible(true);
            }}
            style={[styles.addBtn, { backgroundColor: colors.tint }]}
          >
            <Feather name="plus" size={22} color={isDark ? "#000" : "#fff"} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListCard list={item} onEdit={handleEdit} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 120 : 100 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={lists.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" }]}>
              <Feather name="list" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No lists yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Tap + to create your first list
            </Text>
          </View>
        }
      />

      <ListModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingList(null);
        }}
        onSave={handleSave}
        editingList={editingList}
      />

      <ImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onImport={handleImport}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  monitorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  monitorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  monitorLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  list: { padding: 16 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
