import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { ListItem, useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";

interface ListCardProps {
  list: ListItem;
  onEdit: (list: ListItem) => void;
}

export function ListCard({ list, onEdit }: ListCardProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const { toggleFlash, toggleNotifications, deleteList } = useLists();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Haptics.selectionAsync();
    router.push(`/list/${list.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${list.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteList(list.id);
          },
        },
      ]
    );
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.colorBar, { backgroundColor: list.color }]} />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              <View style={[styles.dot, { backgroundColor: list.color }]} />
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {list.name}
              </Text>
            </View>
            <View style={styles.topActions}>
              <Pressable onPress={() => onEdit(list)} hitSlop={10} style={styles.editBtn}>
                <Feather name="edit-2" size={15} color={colors.textSecondary} />
              </Pressable>
              <Feather name="chevron-right" size={16} color={colors.textSecondary} />
            </View>
          </View>

          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {(() => {
              const addrCount = list.items.filter((i) => i.isAddress).length;
              const kwCount = list.items.filter((i) => !i.isAddress).length;
              const parts: string[] = [];
              if (addrCount > 0) parts.push(`${addrCount} ${addrCount === 1 ? "address" : "addresses"}`);
              if (kwCount > 0) parts.push(`${kwCount} ${kwCount === 1 ? "keyword" : "keywords"}`);
              if (parts.length === 0) return "No items";
              return parts.join(" · ");
            })()}{" · "}Created {formatDate(list.createdAt)}
          </Text>

          <View style={styles.controls}>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); toggleFlash(list.id); }}
              style={[
                styles.badge,
                { backgroundColor: list.flashEnabled ? list.color + "22" : isDark ? "#2d3139" : "#f3f4f6" },
              ]}
            >
              <Feather name="zap" size={13} color={list.flashEnabled ? list.color : colors.textSecondary} />
              <Text style={[styles.badgeText, { color: list.flashEnabled ? list.color : colors.textSecondary }]}>
                Flash
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { Haptics.selectionAsync(); toggleNotifications(list.id); }}
              style={[
                styles.badge,
                { backgroundColor: list.notificationsEnabled ? list.color + "22" : isDark ? "#2d3139" : "#f3f4f6" },
              ]}
            >
              <Feather name="bell" size={13} color={list.notificationsEnabled ? list.color : colors.textSecondary} />
              <Text style={[styles.badgeText, { color: list.notificationsEnabled ? list.color : colors.textSecondary }]}>
                Notify
              </Text>
            </Pressable>

            <View style={styles.spacer} />

            <Pressable
              onPress={handleDelete}
              hitSlop={10}
              style={[styles.deleteBtn, { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" }]}
            >
              <Feather name="trash-2" size={14} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  colorBar: { width: 4 },
  body: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  editBtn: { padding: 4 },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  spacer: { flex: 1 },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
