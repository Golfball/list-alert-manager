import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { Colors, PRESET_COLORS } from "@/constants/theme";
import { ColorPicker } from "@/components/ColorPicker";
import { ListItem } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";

interface ListModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string; flashEnabled: boolean; notificationsEnabled: boolean }) => void;
  editingList?: ListItem | null;
}

export function ListModal({ visible, onClose, onSave, editingList }: ListModalProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingList) {
        setName(editingList.name);
        setColor(editingList.color);
        setFlashEnabled(editingList.flashEnabled);
        setNotificationsEnabled(editingList.notificationsEnabled);
      } else {
        setName("");
        setColor(PRESET_COLORS[0]);
        setFlashEnabled(false);
        setNotificationsEnabled(true);
      }
      setNameError(false);
    }
  }, [visible, editingList]);

  const handleSave = () => {
    if (!name.trim()) {
      setNameError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({ name: name.trim(), color, flashEnabled, notificationsEnabled });
    onClose();
  };

  const ToggleRow = ({
    label,
    icon,
    value,
    onToggle,
  }: {
    label: string;
    icon: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onToggle(); }}
      style={[styles.toggleRow, { borderColor: colors.border }]}
    >
      <View style={styles.toggleLeft}>
        <View style={[styles.iconCircle, { backgroundColor: color + "22" }]}>
          <Feather name={icon as any} size={16} color={color} />
        </View>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={[styles.toggle, { backgroundColor: value ? color : colors.border }]}>
        <View style={[styles.toggleDot, { transform: [{ translateX: value ? 18 : 2 }] }]} />
      </View>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
          >
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {editingList ? "Edit List" : "New List"}
                </Text>
                <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                  <Feather name="x" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
              >
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>LIST NAME</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        borderColor: nameError ? colors.danger : color,
                        backgroundColor: isDark ? "#2d3139" : "#f3f4f6",
                      },
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={name}
                      onChangeText={(t) => { setName(t); if (t) setNameError(false); }}
                      placeholder="Enter list name..."
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                      maxLength={50}
                      returnKeyType="done"
                      onSubmitEditing={handleSave}
                    />
                  </View>
                  {nameError && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      Please enter a name
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>COLOR</Text>
                  <ColorPicker selected={color} onSelect={setColor} />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>SETTINGS</Text>
                  <ToggleRow label="Flash Alert" icon="zap" value={flashEnabled} onToggle={() => setFlashEnabled((v) => !v)} />
                  <ToggleRow label="Notifications" icon="bell" value={notificationsEnabled} onToggle={() => setNotificationsEnabled((v) => !v)} />
                </View>
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Pressable onPress={onClose} style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={[styles.btn, styles.saveBtn, { backgroundColor: color }]}>
                  <Text style={styles.saveBtnText}>
                    {editingList ? "Save Changes" : "Create List"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoid: { justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "web" ? 34 : 0,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: { padding: 4 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 24,
  },
  field: { gap: 10 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { borderWidth: 1 },
  saveBtn: {},
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
