import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { ListModal } from "@/components/ListModal";
import { MoveItemModal } from "@/components/MoveItemModal";
import { ShareModal } from "@/components/ShareModal";
import { AddressItem, useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";
import { looksLikeAddress } from "@/utils/addressDetector";

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const { lists, addList, addItemToList, editItemInList, removeItemFromList, moveItemToList, monitoringActive } = useLists();
  const list = lists.find((l) => l.id === id);

  const [inputValue, setInputValue] = useState("");
  const [itemType, setItemType] = useState<"address" | "keyword">("address");
  const [editingItem, setEditingItem] = useState<AddressItem | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [moveItem, setMoveItem] = useState<AddressItem | null>(null);
  const [createListForMove, setCreateListForMove] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pendingMoveRef = useRef<{ itemId: string; existingIds: Set<string> } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const searchRef = useRef<TextInput>(null);

  React.useEffect(() => {
    const pending = pendingMoveRef.current;
    if (!pending) return;
    const newList = lists.find((l) => !pending.existingIds.has(l.id));
    if (newList && list) {
      pendingMoveRef.current = null;
      const ok = moveItemToList(list.id, newList.id, pending.itemId);
      if (!ok) {
        Alert.alert(
          "Already Exists",
          `This item already exists in "${newList.name}" and was not moved.`
        );
      }
    }
  }, [lists, moveItemToList, list]);

  if (!list) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>List not found</Text>
      </View>
    );
  }

  const isEditing = editingItem !== null;
  const addressCount = list.items.filter((i) => i.isAddress).length;
  const keywordCount = list.items.filter((i) => !i.isAddress).length;
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const filteredItems = trimmedSearch
    ? list.items.filter((i) => i.text.toLowerCase().includes(trimmedSearch))
    : list.items;

  const headerSubtitle = (() => {
    const parts: string[] = [];
    if (addressCount > 0) parts.push(`${addressCount} ${addressCount === 1 ? "address" : "addresses"}`);
    if (keywordCount > 0) parts.push(`${keywordCount} ${keywordCount === 1 ? "keyword" : "keywords"}`);
    if (parts.length === 0) return "No items yet";
    return parts.join(" · ") + " monitored";
  })();

  const handleStartEdit = (item: AddressItem) => {
    Haptics.selectionAsync();
    setEditingItem(item);
    setInputValue(item.text);
    setItemType(item.isAddress ? "address" : "keyword");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setInputValue("");
    setItemType("address");
    inputRef.current?.blur();
  };

  const doSave = (trimmed: string, resolvedType: "address" | "keyword") => {
    if (isEditing && editingItem) {
      if (trimmed === editingItem.text && resolvedType === (editingItem.isAddress ? "address" : "keyword")) {
        handleCancelEdit();
        return;
      }
      if (list.items.some((i) => i.text === trimmed && i.id !== editingItem.id)) {
        Alert.alert("Duplicate", "This item is already in the list.");
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      editItemInList(list.id, editingItem.id, trimmed, resolvedType === "address");
      setEditingItem(null);
    } else {
      if (list.items.some((i) => i.text === trimmed)) {
        Alert.alert("Duplicate", "This item is already in the list.");
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addItemToList(list.id, trimmed, resolvedType === "address");
    }
    setInputValue("");
    setItemType("address");
    inputRef.current?.focus();
  };

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (itemType === "keyword" && looksLikeAddress(trimmed)) {
      Alert.alert(
        "Looks like an address",
        `"${trimmed}" looks like an address. Would you like to save it as an address instead?`,
        [
          {
            text: "Keep as Keyword",
            style: "cancel",
            onPress: () => doSave(trimmed, "keyword"),
          },
          {
            text: "Save as Address",
            onPress: () => {
              setItemType("address");
              doSave(trimmed, "address");
            },
          },
        ]
      );
      return;
    }

    doSave(trimmed, itemType);
  };

  const handlePasteFromClipboard = async () => {
    if (Platform.OS === "web") return;
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setInputValue(text);
    } catch {}
  };

  const handleDelete = (item: AddressItem) => {
    if (editingItem?.id === item.id) handleCancelEdit();
    const label = item.isAddress ? "Address" : "Keyword";
    Alert.alert(`Remove ${label}`, `Remove "${item.text}" from this list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          removeItemFromList(list.id, item.id);
        },
      },
    ]);
  };

  const handleOpenDetail = (item: AddressItem) => {
    if (item.isAddress) {
      router.push(`/address/${list.id}/${item.id}`);
    } else {
      router.push(`/item/${list.id}/${item.id}`);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.listHeader,
          { backgroundColor: list.color, paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 12 },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{list.name}</Text>
          <Text style={styles.headerSub}>{headerSubtitle}</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShareVisible(true);
          }}
          style={styles.shareBtn}
          hitSlop={10}
        >
          <Feather name="share" size={18} color="#fff" />
        </Pressable>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: monitoringActive ? "#4ade80" : "#fbbf24" }]} />
          <Text style={styles.statusText}>{monitoringActive ? "Live" : "Paused"}</Text>
        </View>
      </View>

      <View
        style={[
          styles.infoBar,
          {
            backgroundColor: isDark ? "#1c2333" : "#eff6ff",
            borderColor: isDark ? "#2d3f5c" : "#bfdbfe",
          },
        ]}
      >
        <Feather name="info" size={14} color={isDark ? "#60a5fa" : "#3b82f6"} />
        <Text style={[styles.infoText, { color: isDark ? "#93c5fd" : "#1d4ed8" }]}>
          Tap an item to view details. Clipboard is scanned every 2 seconds.
        </Text>
      </View>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Feather name="search" size={15} color={colors.textSecondary} />
        <TextInput
          ref={searchRef}
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items..."
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => { setSearchQuery(""); searchRef.current?.focus(); }}
            hitSlop={8}
          >
            <Feather name="x-circle" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isBeingEdited = editingItem?.id === item.id;
          const hasExtras = !!item.notes || !!item.photoUri;
          const iconName = item.isAddress ? "map-pin" : "tag";
          return (
            <Pressable
              onPress={() => !isBeingEdited && handleOpenDetail(item)}
              style={[
                styles.addressRow,
                {
                  backgroundColor: isBeingEdited
                    ? list.color + "12"
                    : colors.surface,
                  borderColor: isBeingEdited ? list.color : colors.border,
                  borderWidth: isBeingEdited ? 1.5 : 1,
                },
              ]}
            >
              <View style={[styles.addressIcon, { backgroundColor: list.color + "18" }]}>
                <Feather name={iconName} size={15} color={list.color} />
              </View>
              <View style={styles.addressBody}>
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                  {item.text}
                </Text>
                {hasExtras && (
                  <View style={styles.extrasRow}>
                    {item.photoUri && (
                      <Feather name="image" size={11} color={colors.textSecondary} />
                    )}
                    {item.notes && (
                      <Feather name="file-text" size={11} color={colors.textSecondary} />
                    )}
                    <Text style={[styles.extrasText, { color: colors.textSecondary }]}>
                      {[item.photoUri && "photo", item.notes && "notes"].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() =>
                    isBeingEdited ? handleCancelEdit() : handleStartEdit(item)
                  }
                  hitSlop={8}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isBeingEdited
                        ? list.color + "22"
                        : isDark ? "#2d3139" : "#f3f4f6",
                    },
                  ]}
                >
                  <Feather
                    name={isBeingEdited ? "x" : "edit-2"}
                    size={14}
                    color={isBeingEdited ? list.color : colors.textSecondary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMoveItem(item);
                  }}
                  hitSlop={8}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" },
                  ]}
                >
                  <Feather name="move" size={14} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={8}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: isDark ? "#2d3139" : "#fee2e2" },
                  ]}
                >
                  <Feather name="trash-2" size={14} color={colors.danger} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? "#2d3139" : "#f3f4f6" }]}>
              <Feather
                name={trimmedSearch ? "search" : "map-pin"}
                size={28}
                color={colors.textSecondary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {trimmedSearch ? "No matches" : "No items yet"}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {trimmedSearch
                ? `Nothing in this list matches "${searchQuery.trim()}"`
                : "Add addresses or keywords to monitor below"}
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: isEditing ? list.color : colors.border,
            borderTopWidth: isEditing ? 2 : 1,
            paddingBottom: bottomPad + 8,
            paddingTop: 10,
          },
        ]}
      >
        {isEditing && (
          <View style={[styles.editingBadge, { backgroundColor: list.color + "18" }]}>
            <Feather name="edit-2" size={11} color={list.color} />
            <Text style={[styles.editingBadgeText, { color: list.color }]}>Editing</Text>
            <Pressable onPress={handleCancelEdit} hitSlop={8}>
              <Feather name="x" size={13} color={list.color} />
            </Pressable>
          </View>
        )}

        {/* Type toggle */}
        <View style={[styles.typeToggleRow, { backgroundColor: isDark ? "#1a1f2e" : "#f3f4f6", borderColor: colors.border }]}>
          <Pressable
            onPress={() => { setItemType("address"); Haptics.selectionAsync(); }}
            style={[
              styles.typeToggleBtn,
              itemType === "address" && { backgroundColor: list.color },
            ]}
          >
            <Feather name="map-pin" size={13} color={itemType === "address" ? "#fff" : colors.textSecondary} />
            <Text style={[styles.typeToggleText, { color: itemType === "address" ? "#fff" : colors.textSecondary }]}>
              Address
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { setItemType("keyword"); Haptics.selectionAsync(); }}
            style={[
              styles.typeToggleBtn,
              itemType === "keyword" && { backgroundColor: list.color },
            ]}
          >
            <Feather name="tag" size={13} color={itemType === "keyword" ? "#fff" : colors.textSecondary} />
            <Text style={[styles.typeToggleText, { color: itemType === "keyword" ? "#fff" : colors.textSecondary }]}>
              Keyword
            </Text>
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: isDark ? "#2d3139" : "#f3f4f6", borderColor: list.color },
            ]}
          >
            <Feather
              name={isEditing ? "edit-2" : itemType === "address" ? "map-pin" : "tag"}
              size={16}
              color={list.color}
            />
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: colors.text }]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={
                isEditing
                  ? "Edit item..."
                  : itemType === "address"
                  ? "Enter address..."
                  : "Enter keyword..."
              }
              placeholderTextColor={colors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              blurOnSubmit={false}
            />
            {Platform.OS !== "web" && !isEditing && (
              <Pressable onPress={handlePasteFromClipboard} hitSlop={8}>
                <Feather name="clipboard" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={handleSave}
            style={[
              styles.addBtn,
              { backgroundColor: inputValue.trim() ? list.color : colors.border },
            ]}
            disabled={!inputValue.trim()}
          >
            <Feather name={isEditing ? "check" : "plus"} size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ShareModal
        visible={shareVisible}
        listName={list.name}
        listColor={list.color}
        listItems={list.items.map((i) => i.text)}
        onClose={() => setShareVisible(false)}
      />

      <MoveItemModal
        visible={moveItem !== null}
        item={moveItem}
        currentListId={list.id}
        lists={lists}
        onMove={(toListId) => {
          const pendingItem = moveItem;
          setMoveItem(null);
          if (pendingItem) {
            const ok = moveItemToList(list.id, toListId, pendingItem.id);
            if (!ok) {
              const destList = lists.find((l) => l.id === toListId);
              Alert.alert(
                "Already Exists",
                `"${pendingItem.text}" already exists in "${destList?.name ?? "that list"}" and was not moved.`
              );
            }
          }
        }}
        onNewList={() => {
          setCreateListForMove(true);
        }}
        onClose={() => setMoveItem(null)}
      />

      <ListModal
        visible={createListForMove}
        onClose={() => setCreateListForMove(false)}
        onSave={(data: { name: string; color: string; flashEnabled: boolean; notificationsEnabled: boolean }) => {
          if (moveItem) {
            pendingMoveRef.current = {
              itemId: moveItem.id,
              existingIds: new Set(lists.map((l) => l.id)),
            };
          }
          addList({ ...data, items: [] });
          setCreateListForMove(false);
          setMoveItem(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 17,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  addressIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  addressBody: { flex: 1, gap: 3 },
  addressText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  extrasRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  extrasText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  rowActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  inputBar: {
    paddingHorizontal: 16,
    gap: 8,
  },
  editingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  editingBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  typeToggleRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeToggleText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
});
