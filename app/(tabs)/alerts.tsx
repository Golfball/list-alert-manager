import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { AlertItem, useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";

function AlertCard({
  alert,
  onPress,
  onDismiss,
}: {
  alert: AlertItem;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const formatTime = (ts: number) => {
    const now = Date.now();
    const diff = now - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.alertCard,
        {
          backgroundColor: colors.surface,
          borderColor: alert.read ? colors.border : alert.listColor + "44",
          borderLeftColor: alert.listColor,
        },
      ]}
    >
      {!alert.read && <View style={[styles.unreadDot, { backgroundColor: alert.listColor }]} />}
      <View style={[styles.alertIcon, { backgroundColor: alert.listColor + "20" }]}>
        <Feather name="map-pin" size={18} color={alert.listColor} />
      </View>
      <View style={styles.alertBody}>
        <View style={styles.alertTopRow}>
          <Text style={[styles.alertList, { color: alert.listColor }]} numberOfLines={1}>
            {alert.listName}
          </Text>
          <Text style={[styles.alertTime, { color: colors.textSecondary }]}>
            {formatTime(alert.timestamp)}
          </Text>
        </View>
        <Text
          style={[styles.alertMsg, { color: alert.read ? colors.textSecondary : colors.text }]}
          numberOfLines={2}
        >
          {alert.message}
        </Text>
        {alert.matchedText && (
          <View style={[styles.matchChip, { backgroundColor: alert.listColor + "18" }]}>
            <Feather name="check-circle" size={11} color={alert.listColor} />
            <Text style={[styles.matchText, { color: alert.listColor }]} numberOfLines={1}>
              {alert.matchedText}
            </Text>
          </View>
        )}
        <Text style={[styles.tapHint, { color: colors.textSecondary }]}>
          {alert.message.startsWith("Keyword") ? "Tap to view keyword details" : "Tap to view address details"}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          style={[styles.dismissBtn, { backgroundColor: isDark ? "#2d3139" : "#fee2e2" }]}
        >
          <Feather name="x" size={14} color={colors.danger} />
        </Pressable>
        <Feather name="chevron-right" size={15} color={colors.textSecondary} style={{ marginTop: 6 }} />
      </View>
    </Pressable>
  );
}

export default function AlertsScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lists, alerts, markAlertRead, removeAlert, clearAlerts, unreadCount, manuallyPaused, toggleMonitoring } = useLists();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleClear = () => {
    Alert.alert(
      "Clear All Alerts",
      "This will remove all alerts. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAlerts();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 16, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Alerts</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : `${alerts.length} total`}
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
          {alerts.length > 0 && (
            <Pressable
              onPress={handleClear}
              style={[styles.iconBtn, { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" }]}
            >
              <Feather name="trash-2" size={16} color={colors.danger} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={() => {
              Haptics.selectionAsync();
              if (!item.read) markAlertRead(item.id);
              const list = lists.find((l) => l.id === item.listId);
              const matched = list?.items.find((a) => a.text === item.matchedText);
              if (list && matched) {
                if (matched.isAddress) {
                  router.push(`/address/${list.id}/${matched.id}`);
                } else {
                  router.push(`/item/${list.id}/${matched.id}`);
                }
              }
            }}
            onDismiss={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              removeAlert(item.id);
            }}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 120 : 100 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={alerts.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" }]}>
              <Feather name="bell-off" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No alerts yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Alerts appear here when a monitored address is detected in your clipboard
            </Text>
          </View>
        }
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
    fontSize: 12,
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
  list: { padding: 16 },
  alertCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBody: {
    flex: 1,
    gap: 4,
  },
  alertTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  alertList: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  alertTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  alertMsg: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  matchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 2,
  },
  matchText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    maxWidth: 200,
  },
  rightCol: {
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tapHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
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
    paddingHorizontal: 32,
  },
});
