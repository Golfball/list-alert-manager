import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { shareList } from "@/utils/api";

interface ShareModalProps {
  visible: boolean;
  listName: string;
  listColor: string;
  listItems: string[];
  onClose: () => void;
}

export function ShareModal({ visible, listName, listColor, listItems, onClose }: ShareModalProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      setCode(null);
      setError(null);
      setCopied(false);
      setLoading(true);
      shareList(listName, listColor, listItems)
        .then((c) => setCode(c))
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [visible, listName, listColor, listItems]);

  const handleCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `Join my "${listName}" list in List & Alert Manager. Use code: ${code}`,
        title: `Share "${listName}"`,
      });
    } catch {
      handleCopy();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.colorDot, { backgroundColor: listColor }]} />
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              Share "{listName}"
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Give someone this code to import your list. It expires in 30 days.
          </Text>

          <View style={[styles.codeBox, { backgroundColor: isDark ? "#1a1f2e" : "#f3f4f6", borderColor: colors.border }]}>
            {loading ? (
              <ActivityIndicator color={listColor} />
            ) : error ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            ) : (
              <Text style={[styles.code, { color: listColor, letterSpacing: 8 }]}>{code}</Text>
            )}
          </View>

          {!loading && !error && code && (
            <View style={styles.actions}>
              <Pressable
                onPress={handleCopy}
                style={[styles.btn, { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" }]}
              >
                <Feather name={copied ? "check" : "copy"} size={16} color={copied ? "#22c55e" : colors.textSecondary} />
                <Text style={[styles.btnText, { color: copied ? "#22c55e" : colors.textSecondary }]}>
                  {copied ? "Copied!" : "Copy Code"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={[styles.btn, styles.btnPrimary, { backgroundColor: listColor }]}
              >
                <Feather name="share" size={16} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>Share</Text>
              </Pressable>
            </View>
          )}
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
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  codeBox: {
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  code: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimary: {},
  btnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
