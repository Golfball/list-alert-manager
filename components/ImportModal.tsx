import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors, PRESET_COLORS } from "@/constants/theme";
import { ColorPicker } from "@/components/ColorPicker";
import { useTheme } from "@/context/ThemeContext";
import { importList } from "@/utils/api";
import { parseFile } from "@/utils/fileParser";

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (name: string, color: string, items: string[]) => void;
}

type Tab = "code" | "file";

interface ParsedFile {
  name: string;
  fileName: string;
  items: string[];
  selected: Set<string>;
  color: string;
}

export function ImportModal({ visible, onClose, onImport }: ImportModalProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [tab, setTab] = useState<Tab>("code");

  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);

  const handleClose = () => {
    setCode("");
    setCodeError(null);
    setFileError(null);
    setParsedFile(null);
    setTab("code");
    onClose();
  };

  const handleCodeImport = async () => {
    if (code.trim().length !== 6) {
      setCodeError("Please enter the full 6-character code.");
      return;
    }
    setCodeLoading(true);
    setCodeError(null);
    try {
      const data = await importList(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onImport(data.name, data.color, data.items);
      handleClose();
    } catch (e: unknown) {
      setCodeError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setCodeLoading(false);
    }
  };

  const handlePickFile = async () => {
    if (Platform.OS === "web") {
      setFileError("File import is not available on web.");
      return;
    }
    setFileError(null);
    setFileLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/plain",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) {
        setFileLoading(false);
        return;
      }
      const asset = result.assets[0];
      const items = await parseFile(
        asset.uri,
        asset.mimeType ?? "",
        asset.name ?? "import"
      );
      if (items.length === 0) {
        setFileError("No items found in the file. Make sure each row/line has text.");
        setFileLoading(false);
        return;
      }
      const baseName = (asset.name ?? "Import").replace(/\.[^.]+$/, "");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setParsedFile({
        name: baseName,
        fileName: asset.name ?? "import",
        items,
        selected: new Set(items),
        color: PRESET_COLORS[5],
      });
    } catch (e: unknown) {
      setFileError(
        e instanceof Error ? e.message : "Could not read the file."
      );
    } finally {
      setFileLoading(false);
    }
  };

  const handleToggleItem = (item: string) => {
    if (!parsedFile) return;
    const next = new Set(parsedFile.selected);
    if (next.has(item)) {
      next.delete(item);
    } else {
      next.add(item);
    }
    setParsedFile({ ...parsedFile, selected: next });
  };

  const handleFileImport = () => {
    if (!parsedFile) return;
    const selectedItems = parsedFile.items.filter((i) =>
      parsedFile.selected.has(i)
    );
    if (selectedItems.length === 0) {
      setFileError("Please select at least one item.");
      return;
    }
    if (!parsedFile.name.trim()) {
      setFileError("Please enter a name for the list.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onImport(parsedFile.name.trim(), parsedFile.color, selectedItems);
    handleClose();
  };

  const selectedCount = parsedFile ? parsedFile.selected.size : 0;
  const totalCount = parsedFile ? parsedFile.items.length : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
            parsedFile && styles.sheetTall,
          ]}
        >
          <View style={styles.header}>
            <Feather name="download" size={18} color={colors.tint} />
            <Text style={[styles.title, { color: colors.text }]}>
              Import a List
            </Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Tab bar */}
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: isDark ? "#1a1f2e" : "#f3f4f6",
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setTab("code");
                setFileError(null);
                setParsedFile(null);
              }}
              style={[
                styles.tabBtn,
                tab === "code" && { backgroundColor: colors.tint },
              ]}
            >
              <Feather
                name="hash"
                size={13}
                color={tab === "code" ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      tab === "code" ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                Share Code
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setTab("file");
                setCodeError(null);
              }}
              style={[
                styles.tabBtn,
                tab === "file" && { backgroundColor: colors.tint },
              ]}
            >
              <Feather
                name="file-text"
                size={13}
                color={tab === "file" ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      tab === "file" ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                From File
              </Text>
            </Pressable>
          </View>

          {/* Share code tab */}
          {tab === "code" && (
            <>
              <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Enter the 6-character code someone shared with you.
              </Text>

              <TextInput
                value={code}
                onChangeText={(t) => {
                  setCode(t.toUpperCase());
                  setCodeError(null);
                }}
                placeholder="A1B2C3"
                placeholderTextColor={colors.textSecondary}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleCodeImport}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#1a1f2e" : "#f3f4f6",
                    borderColor: codeError ? colors.danger : colors.border,
                    color: colors.text,
                  },
                ]}
              />

              {codeError && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {codeError}
                </Text>
              )}

              <Pressable
                onPress={handleCodeImport}
                disabled={codeLoading}
                style={[
                  styles.importBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: codeLoading ? 0.7 : 1,
                  },
                ]}
              >
                {codeLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="download" size={16} color="#fff" />
                    <Text style={styles.importBtnText}>Import List</Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {/* From file tab */}
          {tab === "file" && !parsedFile && (
            <>
              <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Pick a CSV, Excel (.xlsx / .xls), or plain text file. Each row
                becomes one monitored item.
              </Text>

              {fileError && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {fileError}
                </Text>
              )}

              <Pressable
                onPress={handlePickFile}
                disabled={fileLoading}
                style={[
                  styles.pickBtn,
                  {
                    backgroundColor: isDark ? "#1a1f2e" : "#f3f4f6",
                    borderColor: colors.border,
                    opacity: fileLoading ? 0.7 : 1,
                  },
                ]}
              >
                {fileLoading ? (
                  <ActivityIndicator color={colors.tint} />
                ) : (
                  <>
                    <View
                      style={[
                        styles.pickIconCircle,
                        { backgroundColor: colors.tint + "22" },
                      ]}
                    >
                      <Feather name="folder" size={24} color={colors.tint} />
                    </View>
                    <Text
                      style={[styles.pickBtnText, { color: colors.text }]}
                    >
                      Choose File
                    </Text>
                    <Text
                      style={[
                        styles.pickBtnHint,
                        { color: colors.textSecondary },
                      ]}
                    >
                      CSV · Excel · TXT
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {/* Preview step */}
          {tab === "file" && parsedFile && (
            <>
              <View style={styles.previewHeader}>
                <View style={styles.fileChip}>
                  <Feather name="file-text" size={13} color={colors.tint} />
                  <Text
                    style={[styles.fileChipText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {parsedFile.fileName}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setParsedFile(null)}
                  hitSlop={8}
                >
                  <Feather name="refresh-cw" size={14} color={colors.textSecondary} />
                </Pressable>
              </View>

              <TextInput
                value={parsedFile.name}
                onChangeText={(t) =>
                  setParsedFile({ ...parsedFile, name: t })
                }
                placeholder="List name..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: isDark ? "#1a1f2e" : "#f3f4f6",
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                COLOR
              </Text>
              <ColorPicker
                selected={parsedFile.color}
                onSelect={(c) => setParsedFile({ ...parsedFile, color: c })}
              />

              <View style={styles.itemsHeader}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  ITEMS
                </Text>
                <Text
                  style={[
                    styles.itemCount,
                    { color: colors.tint },
                  ]}
                >
                  {selectedCount} of {totalCount} selected
                </Text>
              </View>

              <ScrollView
                style={styles.itemsList}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {parsedFile.items.map((item) => {
                  const isSelected = parsedFile.selected.has(item);
                  return (
                    <Pressable
                      key={item}
                      onPress={() => handleToggleItem(item)}
                      style={[
                        styles.itemRow,
                        {
                          backgroundColor: isSelected
                            ? parsedFile.color + "12"
                            : "transparent",
                          borderColor: isSelected
                            ? parsedFile.color + "40"
                            : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected
                              ? parsedFile.color
                              : "transparent",
                            borderColor: isSelected
                              ? parsedFile.color
                              : colors.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Feather name="check" size={11} color="#fff" />
                        )}
                      </View>
                      <Text
                        style={[styles.itemRowText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {fileError && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {fileError}
                </Text>
              )}

              <Pressable
                onPress={handleFileImport}
                style={[
                  styles.importBtn,
                  { backgroundColor: parsedFile.color },
                ]}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.importBtnText}>
                  Import {selectedCount} Item{selectedCount !== 1 ? "s" : ""}
                </Text>
              </Pressable>
            </>
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
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    maxHeight: "90%",
  },
  sheetTall: {
    maxHeight: "92%",
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
  tabBar: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  input: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  importBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  pickBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
  pickIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pickBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  pickBtnHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  fileChipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  nameInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemCount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  itemsList: {
    maxHeight: 160,
    borderRadius: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  itemRowText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
