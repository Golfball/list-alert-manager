import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type * as NotificationsType from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

let _notifs: typeof NotificationsType | null | undefined = undefined;
function getNotifications(): typeof NotificationsType | null {
  if (_notifs !== undefined) return _notifs;
  try {
    _notifs = require("expo-notifications") as typeof NotificationsType;
  } catch {
    _notifs = null;
  }
  return _notifs ?? null;
}

type PermissionStatus = "granted" | "denied" | "undetermined" | "unavailable";

function SectionHeader({ title }: { title: string }) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  return (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );
}

function SettingsRow({
  icon,
  iconColor,
  label,
  sublabel,
  onPress,
  right,
  isLast,
}: {
  icon: string;
  iconColor: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
}) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
          opacity: pressed && onPress ? 0.7 : 1,
        },
      ]}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "20" }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.rowSublabel, { color: colors.textSecondary }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? (
        <Feather name="chevron-right" size={18} color={colors.textSecondary} />
      ) : null)}
    </Pressable>
  );
}

function PermissionBadge({ status }: { status: PermissionStatus }) {
  const label =
    status === "granted"
      ? "Allowed"
      : status === "denied"
      ? "Denied"
      : status === "undetermined"
      ? "Not Set"
      : "Unavailable";
  const color =
    status === "granted"
      ? "#22c55e"
      : status === "denied"
      ? "#ef4444"
      : "#f59e0b";
  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [notifStatus, setNotifStatus] = useState<PermissionStatus>("unavailable");

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const N = getNotifications();
      if (N) {
        const { status } = await N.getPermissionsAsync();
        setNotifStatus(status as PermissionStatus);
      }
    } catch {
      setNotifStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleRequestNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "web") return;

    if (notifStatus === "denied") {
      Alert.alert(
        "Notifications Blocked",
        "Notifications are currently blocked. Open Settings to allow them.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    try {
      const N = getNotifications();
      if (!N) return;
      const { status } = await N.requestPermissionsAsync();
      setNotifStatus(status as PermissionStatus);
      if (status === "granted") {
        Alert.alert("Notifications Enabled", "You'll now receive alerts when a monitored address is detected.");
      }
    } catch {}
  };

  const handleClipboardSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      Alert.alert(
        "Allow Clipboard Access",
        "To stop iOS from asking every time:\n\n1. Tap \"Open Settings\" below\n2. Find \"Paste from Other Apps\"\n3. Select \"Allow\"\n\nThis lets the app silently monitor your clipboard in the background.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    } else if (Platform.OS === "android") {
      Alert.alert(
        "Clipboard Access",
        "On Android, clipboard access is granted automatically when the app is in the foreground. No additional steps are needed.",
        [{ text: "Got it" }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 16, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Platform.OS !== "web" && (
          <>
            <SectionHeader title="PERMISSIONS" />
            <View style={[styles.card, { borderColor: colors.border }]}>
              <SettingsRow
                icon="clipboard"
                iconColor="#3b82f6"
                label="Clipboard Access"
                sublabel={
                  Platform.OS === "ios"
                    ? "Allow clipboard monitoring without repeated prompts"
                    : "Clipboard access is automatic on Android"
                }
                onPress={handleClipboardSettings}
                right={
                  Platform.OS === "ios" ? (
                    <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                  ) : (
                    <PermissionBadge status="granted" />
                  )
                }
              />
              <SettingsRow
                icon="bell"
                iconColor="#8b5cf6"
                label="Notifications"
                sublabel="Get alerted when a monitored address is detected"
                onPress={notifStatus !== "granted" ? handleRequestNotifications : undefined}
                right={
                  notifStatus !== "unavailable" ? (
                    <View style={styles.permissionRight}>
                      <PermissionBadge status={notifStatus} />
                      {notifStatus !== "granted" && (
                        <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                      )}
                    </View>
                  ) : null
                }
                isLast
              />
            </View>
          </>
        )}

        <SectionHeader title="APPEARANCE" />
        <View style={[styles.card, { borderColor: colors.border }]}>
          <SettingsRow
            icon={isDark ? "moon" : "sun"}
            iconColor={isDark ? "#818cf8" : "#f59e0b"}
            label="Dark Mode"
            right={
              <Switch
                value={isDark}
                onValueChange={() => {
                  Haptics.selectionAsync();
                  toggleTheme();
                }}
                trackColor={{ false: "#d1d5db", true: "#6366f1" }}
                thumbColor="#fff"
              />
            }
            isLast
          />
        </View>

        <SectionHeader title="HOW IT WORKS" />
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {[
            {
              icon: "list",
              color: "#3b82f6",
              text: "Create lists and add addresses or keywords to watch for.",
            },
            {
              icon: "clipboard",
              color: "#22c55e",
              text: "The app scans your clipboard every 2 seconds while active.",
            },
            {
              icon: "bell",
              color: "#8b5cf6",
              text: "When a match is found, you get an alert and (optionally) a push notification.",
            },
            {
              icon: "trash-2",
              color: "#ef4444",
              text: "Dismissing an alert resets monitoring so the same address can trigger again.",
            },
          ].map((item, i, arr) => (
            <View
              key={i}
              style={[
                styles.infoRow,
                i < arr.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View
                style={[styles.infoIcon, { backgroundColor: item.color + "20" }]}
              >
                <Feather name={item.icon as any} size={15} color={item.color} />
              </View>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
  },
  scroll: {
    padding: 16,
    gap: 0,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowSublabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  permissionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
