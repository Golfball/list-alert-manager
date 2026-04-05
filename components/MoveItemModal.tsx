import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { AddressItem, ListItem } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";

interface MoveItemModalProps {
  visible: boolean;
  item: AddressItem | null;
  currentListId: string;
  lists: ListItem[];
  onMove: (toListId: string) => void;
  onNewList: () => void;
  onClose: () => void;
}

export function MoveItemModal({
  visible,
  item,
  currentListId,
  lists,
  onMove,
  onNewList,
  onClose,
}: MoveItemModalProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const targets = lists.filter((l) => l.id !== currentListId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.header}>
            <Feather name="move" size={18} color={colors.tint} />
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item ? `Move "${item.text}" to…` : "Move Item to…"}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {targets.length > 0
              ? "Choose a destination list:"
              : "No other lists yet. Create one to move this item."}
          </Text>

          <FlatList
            data={targets}
            keyExtractor={(l) => l.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: list }) => (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onMove(list.id);
                }}
                style={[
                  styles.listRow,
                  {
                    backgroundColor: isDark ? "#1a1f2e" : "#f8f9fa",
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.colorDot, { backgroundColor: list.color }]}
                />
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: colors.text }]}>
                    {list.name}
                  </Text>
                  <Text
                    style={[
                      styles.listCount,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {list.items.length}{" "}
                    {list.items.length === 1 ? "item" : "items"}
                  </Text>
                </View>
                <Feather
                  name="arrow-right"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          />

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNewList();
            }}
            style={[
              styles.newListRow,
              {
                backgroundColor: colors.tint + "12",
                borderColor: colors.tint + "40",
              },
            ]}
          >
            <View
              style={[
                styles.newListIcon,
                { backgroundColor: colors.tint + "22" },
              ]}
            >
              <Feather name="plus" size={14} color={colors.tint} />
            </View>
            <Text style={[styles.newListText, { color: colors.tint }]}>
              Create new list & move here
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  list: {
    maxHeight: 260,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  listInfo: { flex: 1 },
  listName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  listCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  newListRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  newListIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  newListText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
