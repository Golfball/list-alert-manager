import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
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

export default function AddressDetailScreen() {
  const { listId, addressId } = useLocalSearchParams<{ listId: string; addressId: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { lists, updateAddressItem, removeItemFromList } = useLists();

  const list = lists.find((l) => l.id === listId);
  const address = list?.items.find((i) => i.id === addressId);

  const [mapAddress, setMapAddress] = useState(address?.mapAddress ?? "");
  const [mapAddressDirty, setMapAddressDirty] = useState(false);
  const [notes, setNotes] = useState(address?.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  if (!list || !address) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, padding: 20 }}>Address not found.</Text>
      </View>
    );
  }

  const handleOpenMaps = () => {
    const query = encodeURIComponent(
      address.mapAddress?.trim() ? address.mapAddress.trim() : address.text
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = Platform.OS === "ios"
      ? `maps://maps.apple.com/?q=${query}`
      : `geo:0,0?q=${query}`;
    const fallback = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.canOpenURL(url)
      .then((supported) => Linking.openURL(supported ? url : fallback))
      .catch(() => Linking.openURL(fallback));
  };

  const handleSaveMapAddress = () => {
    updateAddressItem(list.id, address.id, { mapAddress: mapAddress.trim() || undefined });
    setMapAddressDirty(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveNotes = () => {
    updateAddressItem(list.id, address.id, { notes });
    setNotesDirty(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photo library to add a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      updateAddressItem(list.id, address.id, { photoUri: result.assets[0].uri });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert("Remove Photo", "Remove the photo from this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          updateAddressItem(list.id, address.id, { photoUri: undefined });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Remove Address", `Remove "${address.text}" from this list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          removeItemFromList(list.id, address.id);
          router.back();
        },
      },
    ]);
  };

  const topPad = (Platform.OS === "web" ? 67 : insets.top) + 12;
  const hasMapsAddress = !!(address.mapAddress?.trim());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: list.color, paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={2}>{address.text}</Text>
          <Text style={styles.headerSub}>{list.name}</Text>
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
        {/* Open in Maps */}
        <Pressable
          onPress={handleOpenMaps}
          style={[styles.mapsBtn, { backgroundColor: list.color }]}
        >
          <Feather name="map-pin" size={18} color="#fff" />
          <Text style={styles.mapsBtnText}>Open in Maps</Text>
          <Feather name="external-link" size={15} color="rgba(255,255,255,0.8)" />
        </Pressable>

        {/* Actual Address for Maps */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MAPS ADDRESS</Text>
            {hasMapsAddress && (
              <View style={[styles.setTag, { backgroundColor: list.color + "20" }]}>
                <Feather name="check-circle" size={11} color={list.color} />
                <Text style={[styles.setTagText, { color: list.color }]}>Set</Text>
              </View>
            )}
          </View>
          <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
            Override the address used when opening Maps. If empty, the monitored text is used.
          </Text>
          <TextInput
            value={mapAddress}
            onChangeText={(t) => { setMapAddress(t); setMapAddressDirty(true); }}
            placeholder="e.g. 123 Main St, New York, NY"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
            style={[
              styles.singleLineInput,
              {
                color: colors.text,
                backgroundColor: isDark ? "#1a1f2e" : "#f9fafb",
                borderColor: mapAddressDirty ? list.color : colors.border,
              },
            ]}
          />
          {mapAddressDirty && (
            <Pressable
              onPress={handleSaveMapAddress}
              style={[styles.saveBtn, { backgroundColor: list.color }]}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Save Address</Text>
            </Pressable>
          )}
        </View>

        {/* Photo */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PHOTO</Text>
          {address.photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: address.photoUri }} style={styles.photo} resizeMode="cover" />
              <Pressable onPress={handleRemovePhoto} style={styles.removePhotoBtn}>
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickPhoto}
              style={[styles.photoPlaceholder, { backgroundColor: isDark ? "#1a1f2e" : "#f3f4f6", borderColor: colors.border }]}
            >
              <View style={[styles.photoIcon, { backgroundColor: list.color + "22" }]}>
                <Feather name="camera" size={24} color={list.color} />
              </View>
              <Text style={[styles.photoPlaceholderText, { color: colors.textSecondary }]}>
                Tap to add a photo
              </Text>
            </Pressable>
          )}
          {address.photoUri && (
            <Pressable onPress={handlePickPhoto} style={[styles.changePhotoBtn, { borderColor: colors.border }]}>
              <Feather name="refresh-cw" size={14} color={colors.textSecondary} />
              <Text style={[styles.changePhotoText, { color: colors.textSecondary }]}>Change photo</Text>
            </Pressable>
          )}
        </View>

        {/* Notes */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={(t) => { setNotes(t); setNotesDirty(true); }}
            placeholder="Add notes about this address..."
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
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  mapsBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginLeft: -25,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  setTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  setTagText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  singleLineInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  photoContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  photoPlaceholder: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  photoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: "top",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
