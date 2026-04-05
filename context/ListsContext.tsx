import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as Clipboard from "expo-clipboard";
import type * as NotificationsType from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { triggerFlash } from "@/utils/flashEmitter";

// Lazy-load expo-notifications so a module-level throw in Expo Go on Android
// doesn't crash the entire context before any try/catch can run.
let _notifs: typeof NotificationsType | null | undefined = undefined;
function getNotifications(): typeof NotificationsType | null {
  if (_notifs !== undefined) return _notifs;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _notifs = require("expo-notifications") as typeof NotificationsType;
  } catch {
    _notifs = null;
  }
  return _notifs ?? null;
}
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export interface AddressItem {
  id: string;
  text: string;
  isAddress: boolean;
  mapAddress?: string;
  notes?: string;
  photoUri?: string;
}

export interface ListItem {
  id: string;
  name: string;
  color: string;
  flashEnabled: boolean;
  notificationsEnabled: boolean;
  createdAt: number;
  items: AddressItem[];
}

export interface AlertItem {
  id: string;
  listId: string;
  listName: string;
  listColor: string;
  message: string;
  matchedText: string;
  timestamp: number;
  read: boolean;
}

interface ListsContextType {
  lists: ListItem[];
  alerts: AlertItem[];
  monitoringActive: boolean;
  manuallyPaused: boolean;
  toggleMonitoring: () => void;
  addList: (list: Omit<ListItem, "id" | "createdAt" | "items"> & { items?: ListItem["items"] }) => void;
  updateList: (id: string, updates: Partial<ListItem>) => void;
  deleteList: (id: string) => void;
  toggleFlash: (id: string) => void;
  toggleNotifications: (id: string) => void;
  addItemToList: (listId: string, text: string, isAddress?: boolean) => void;
  editItemInList: (listId: string, itemId: string, newText: string, isAddress?: boolean) => void;
  removeItemFromList: (listId: string, itemId: string) => void;
  moveItemToList: (fromListId: string, toListId: string, itemId: string) => boolean;
  updateAddressItem: (listId: string, itemId: string, updates: Partial<Omit<AddressItem, "id">>) => void;
  addAlert: (alert: Omit<AlertItem, "id" | "timestamp" | "read">) => void;
  markAlertRead: (id: string) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  unreadCount: number;
}

const ListsContext = createContext<ListsContextType | null>(null);

const LISTS_KEY = "@lists_data_v2";
const ALERTS_KEY = "@alerts_data_v2";
const LAST_CLIPBOARD_KEY = "@last_clipboard";
const BG_TASK = "CLIPBOARD_MONITOR_TASK";

const NOW = Date.now();
const DAY = 86400000;
const HOUR = 3600000;

const DEFAULT_LISTS: ListItem[] = [
  {
    id: "demo-list-1",
    name: "Delivery Addresses",
    color: "#3b82f6",
    flashEnabled: true,
    notificationsEnabled: true,
    createdAt: NOW - 7 * DAY,
    items: [
      { id: "d1-1", text: "123 Oak Street, Austin, TX 78701", isAddress: true, notes: "Gate code: 4892" },
      { id: "d1-2", text: "456 Maple Ave, Austin, TX 78702", isAddress: true },
      { id: "d1-3", text: "789 Pine Blvd, Austin, TX 78703", isAddress: true },
      { id: "d1-4", text: "1011 Cedar Ln, Austin, TX 78704", isAddress: true, notes: "Leave at side door" },
      { id: "d1-5", text: "2240 Riverside Dr, Austin, TX 78741", isAddress: true },
    ],
  },
  {
    id: "demo-list-2",
    name: "Client Properties",
    color: "#22c55e",
    flashEnabled: false,
    notificationsEnabled: true,
    createdAt: NOW - 3 * DAY,
    items: [
      { id: "d2-1", text: "2200 Congress Ave, Austin, TX 78704", isAddress: true },
      { id: "d2-2", text: "350 W 6th Street, Austin, TX 78701", isAddress: true },
      { id: "d2-3", text: "wholesale", isAddress: false },
      { id: "d2-4", text: "commercial lease", isAddress: false },
      { id: "d2-5", text: "900 E 6th Street, Austin, TX 78702", isAddress: true },
    ],
  },
  {
    id: "demo-list-3",
    name: "Watchlist",
    color: "#ef4444",
    flashEnabled: true,
    notificationsEnabled: true,
    createdAt: NOW - DAY,
    items: [
      { id: "d3-1", text: "500 W 2nd Street, Austin, TX 78701", isAddress: true },
      { id: "d3-2", text: "foreclosure", isAddress: false },
      { id: "d3-3", text: "bank owned", isAddress: false },
      { id: "d3-4", text: "1405 S Congress Ave, Austin, TX 78704", isAddress: true },
    ],
  },
];

const DEFAULT_ALERTS: AlertItem[] = [
  {
    id: "demo-alert-1",
    listId: "demo-list-1",
    listName: "Delivery Addresses",
    listColor: "#3b82f6",
    message: 'Address "123 Oak Street, Austin, TX 78701" detected in clipboard',
    matchedText: "123 Oak Street, Austin, TX 78701",
    timestamp: NOW - 2 * HOUR,
    read: false,
  },
  {
    id: "demo-alert-2",
    listId: "demo-list-3",
    listName: "Watchlist",
    listColor: "#ef4444",
    message: 'Keyword "foreclosure" detected in clipboard',
    matchedText: "foreclosure",
    timestamp: NOW - 5 * HOUR,
    read: false,
  },
  {
    id: "demo-alert-3",
    listId: "demo-list-2",
    listName: "Client Properties",
    listColor: "#22c55e",
    message: 'Address "2200 Congress Ave, Austin, TX 78704" detected in clipboard',
    matchedText: "2200 Congress Ave, Austin, TX 78704",
    timestamp: NOW - DAY,
    read: true,
  },
  {
    id: "demo-alert-4",
    listId: "demo-list-1",
    listName: "Delivery Addresses",
    listColor: "#3b82f6",
    message: 'Address "456 Maple Ave, Austin, TX 78702" detected in clipboard',
    matchedText: "456 Maple Ave, Austin, TX 78702",
    timestamp: NOW - 2 * DAY,
    read: true,
  },
];

// Migrate old string[] items to AddressItem[]
function migrateItems(raw: unknown[]): AddressItem[] {
  return raw.map((item, idx) => {
    if (typeof item === "string") {
      return { id: `m-${idx}-${Date.now()}`, text: item, isAddress: true };
    }
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const result: AddressItem = {
        id: typeof obj.id === "string" ? obj.id : `m-${idx}-${Date.now()}`,
        text: typeof obj.text === "string" ? obj.text : "",
        isAddress: typeof obj.isAddress === "boolean" ? obj.isAddress : true,
      };
      if (typeof obj.mapAddress === "string") result.mapAddress = obj.mapAddress;
      if (typeof obj.notes === "string") result.notes = obj.notes;
      if (typeof obj.photoUri === "string") result.photoUri = obj.photoUri;
      return result;
    }
    return { id: `m-${idx}-${Date.now()}`, text: String(item), isAddress: true };
  });
}

try {
  getNotifications()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // expo-notifications not available in Expo Go on Android (SDK 53+)
}

let _getLists: (() => ListItem[]) | null = null;
let _addAlertExternal: ((alert: Omit<AlertItem, "id" | "timestamp" | "read">) => void) | null = null;

if (Platform.OS !== "web") {
  TaskManager.defineTask(BG_TASK, async () => {
    try {
      const [listsData, lastClip] = await Promise.all([
        AsyncStorage.getItem(LISTS_KEY),
        AsyncStorage.getItem(LAST_CLIPBOARD_KEY),
      ]);
      if (!listsData) return BackgroundFetch.BackgroundFetchResult.NoData;

      const rawLists = JSON.parse(listsData) as Array<ListItem & { items: unknown[] }>;
      const lists: ListItem[] = rawLists.map((l) => ({
        ...l,
        items: migrateItems(l.items ?? []),
      }));

      const clipboardText = await Clipboard.getStringAsync();
      if (!clipboardText || clipboardText === lastClip) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      await AsyncStorage.setItem(LAST_CLIPBOARD_KEY, clipboardText);
      const lowerClip = clipboardText.toLowerCase();

      for (const list of lists) {
        for (const item of list.items) {
          const trimmed = item.text.toLowerCase().trim();
          if (trimmed && lowerClip.includes(trimmed)) {
            if (list.notificationsEnabled) {
              await getNotifications()?.scheduleNotificationAsync({
                content: {
                  title: `Match in "${list.name}"`,
                  body: `${item.isAddress ? "Address" : "Keyword"} "${item.text}" detected in clipboard`,
                  data: { listId: list.id, match: item.text },
                },
                trigger: null,
              });
            }
            const alertsData = await AsyncStorage.getItem(ALERTS_KEY);
            const alerts: AlertItem[] = alertsData ? JSON.parse(alertsData) : [];
            const newAlert: AlertItem = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              listId: list.id,
              listName: list.name,
              listColor: list.color,
              message: `${item.isAddress ? "Address" : "Keyword"} "${item.text}" detected in clipboard`,
              matchedText: item.text,
              timestamp: Date.now(),
              read: false,
            };
            await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify([newAlert, ...alerts].slice(0, 100)));
            break;
          }
        }
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

async function requestNotificationPermission() {
  if (Platform.OS === "web") return;
  try {
    const N = getNotifications();
    if (!N) return false;
    const { status } = await N.requestPermissionsAsync();
    if (status === "granted") {
      await N.setNotificationCategoryAsync("alert-match", [
        {
          identifier: "dismiss",
          buttonTitle: "Dismiss",
          options: { isDestructive: true, isAuthenticationRequired: false },
        },
      ]);
    }
    return status === "granted";
  } catch {
    return false;
  }
}

async function registerBackgroundTask() {
  if (Platform.OS === "web") return;
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BG_TASK, {
        minimumInterval: 30,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // background tasks not available in Expo Go always
  }
}

export function ListsProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<ListItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const lastClipRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listsRef = useRef<ListItem[]>([]);
  const manuallyPausedRef = useRef(false);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    const load = async () => {
      try {
        const [listsData, alertsData] = await Promise.all([
          AsyncStorage.getItem(LISTS_KEY),
          AsyncStorage.getItem(ALERTS_KEY),
        ]);
        if (listsData) {
          const rawLists = JSON.parse(listsData) as Array<ListItem & { items: unknown[] }>;
          const migrated = rawLists.map((l) => ({
            ...l,
            items: migrateItems(l.items ?? []),
          }));
          setLists(migrated);
          await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(migrated));
        } else {
          setLists(DEFAULT_LISTS);
          await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(DEFAULT_LISTS));
        }
        if (alertsData) {
          setAlerts(JSON.parse(alertsData));
        } else {
          setAlerts(DEFAULT_ALERTS);
          await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(DEFAULT_ALERTS));
        }
      } catch {}
    };
    load();

    requestNotificationPermission();
    registerBackgroundTask();
  }, []);

  const saveLists = useCallback(async (updated: ListItem[]) => {
    setLists(updated);
    listsRef.current = updated;
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
  }, []);

  const saveAlerts = useCallback(async (updated: AlertItem[]) => {
    setAlerts(updated);
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
  }, []);

  const addAlertInternal = useCallback(
    async (data: Omit<AlertItem, "id" | "timestamp" | "read">) => {
      const newAlert: AlertItem = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        read: false,
      };
      setAlerts((prev) => {
        const updated = [newAlert, ...prev].slice(0, 100);
        AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
        return updated;
      });

      const list = listsRef.current.find((l) => l.id === data.listId);

      // Screen flash with the list color (foreground only)
      if (list?.flashEnabled) {
        triggerFlash(list.color);
      }

      if (list?.notificationsEnabled && Platform.OS !== "web") {
        try {
          await getNotifications()?.scheduleNotificationAsync({
            content: {
              title: `Match in "${data.listName}"`,
              body: data.message,
              data: { listId: data.listId, alertId: newAlert.id },
              categoryIdentifier: "alert-match",
              // Android: sets notification LED color on devices that support it
              color: list?.color,
            },
            trigger: null,
          });
        } catch {}
      }
    },
    []
  );

  const checkClipboard = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const text = await Clipboard.getStringAsync();
      if (!text || text === lastClipRef.current) return;
      lastClipRef.current = text;
      await AsyncStorage.setItem(LAST_CLIPBOARD_KEY, text);

      const lowerText = text.toLowerCase();
      for (const list of listsRef.current) {
        for (const item of list.items) {
          const trimmed = item.text.toLowerCase().trim();
          if (trimmed && lowerText.includes(trimmed)) {
            await addAlertInternal({
              listId: list.id,
              listName: list.name,
              listColor: list.color,
              message: `${item.isAddress ? "Address" : "Keyword"} "${item.text}" detected in clipboard`,
              matchedText: item.text,
            });
            break;
          }
        }
      }
    } catch {}
  }, [addAlertInternal]);

  const startMonitoring = useCallback(() => {
    if (Platform.OS === "web") return;
    if (intervalRef.current) return;
    setMonitoringActive(true);
    intervalRef.current = setInterval(checkClipboard, 2000);
  }, [checkClipboard]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setMonitoringActive(false);
  }, []);

  const toggleMonitoring = useCallback(() => {
    const nowPaused = !manuallyPausedRef.current;
    manuallyPausedRef.current = nowPaused;
    setManuallyPaused(nowPaused);
    if (nowPaused) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  }, [startMonitoring, stopMonitoring]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        if (!manuallyPausedRef.current) startMonitoring();
      } else {
        stopMonitoring();
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    if (AppState.currentState === "active" && !manuallyPausedRef.current) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
      try { sub?.remove(); } catch {}
    };
  }, [startMonitoring, stopMonitoring]);

  // Expose getLists for background task
  _getLists = () => listsRef.current;
  _addAlertExternal = addAlertInternal;

  const addList = useCallback(
    (data: Omit<ListItem, "id" | "createdAt" | "items"> & { items?: ListItem["items"] }) => {
      const newList: ListItem = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        items: data.items ?? [],
      };
      saveLists([newList, ...lists]);
    },
    [lists, saveLists]
  );

  const updateList = useCallback(
    (id: string, updates: Partial<ListItem>) => {
      const updated = lists.map((l) => (l.id === id ? { ...l, ...updates } : l));
      saveLists(updated);
    },
    [lists, saveLists]
  );

  const deleteList = useCallback(
    (id: string) => {
      saveLists(lists.filter((l) => l.id !== id));
    },
    [lists, saveLists]
  );

  const toggleFlash = useCallback(
    (id: string) => {
      const updated = lists.map((l) =>
        l.id === id ? { ...l, flashEnabled: !l.flashEnabled } : l
      );
      saveLists(updated);
    },
    [lists, saveLists]
  );

  const toggleNotifications = useCallback(
    (id: string) => {
      const updated = lists.map((l) =>
        l.id === id ? { ...l, notificationsEnabled: !l.notificationsEnabled } : l
      );
      saveLists(updated);
    },
    [lists, saveLists]
  );

  const addItemToList = useCallback(
    (listId: string, text: string, isAddress = true) => {
      const newItem: AddressItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text,
        isAddress,
      };
      const updated = lists.map((l) =>
        l.id === listId
          ? { ...l, items: [...l.items.filter((i) => i.text !== text), newItem] }
          : l
      );
      saveLists(updated);
    },
    [lists, saveLists]
  );

  const removeItemFromList = useCallback(
    (listId: string, itemId: string) => {
      const updated = lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
          : l
      );
      saveLists(updated);
    },
    [lists, saveLists]
  );

  const editItemInList = useCallback(
    (listId: string, itemId: string, newText: string, isAddress?: boolean) => {
      const updated = lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === itemId
                  ? { ...i, text: newText, ...(isAddress !== undefined && { isAddress }) }
                  : i
              ),
            }
          : l
      );
      saveLists(updated);
    },
    [lists, saveLists]
  );

  const updateAddressItem = useCallback(
    (listId: string, itemId: string, updates: Partial<Omit<AddressItem, "id">>) => {
      const updated = lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)) }
          : l
      );
      saveLists(updated);
    },
    [lists, saveLists]
  );

  const moveItemToList = useCallback(
    (fromListId: string, toListId: string, itemId: string): boolean => {
      const fromList = lists.find((l) => l.id === fromListId);
      const toList = lists.find((l) => l.id === toListId);
      if (!fromList || !toList) return false;
      const item = fromList.items.find((i) => i.id === itemId);
      if (!item) return false;
      const alreadyThere = toList.items.some(
        (i) => i.text.toLowerCase() === item.text.toLowerCase()
      );
      if (alreadyThere) return false;
      const updated = lists.map((l) => {
        if (l.id === fromListId) {
          return { ...l, items: l.items.filter((i) => i.id !== itemId) };
        }
        if (l.id === toListId) {
          return { ...l, items: [...l.items, { ...item }] };
        }
        return l;
      });
      saveLists(updated);
      return true;
    },
    [lists, saveLists]
  );

  const addAlert = useCallback(
    (data: Omit<AlertItem, "id" | "timestamp" | "read">) => {
      addAlertInternal(data);
    },
    [addAlertInternal]
  );

  const markAlertRead = useCallback(
    (id: string) => {
      const updated = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
      saveAlerts(updated);
    },
    [alerts, saveAlerts]
  );

  const removeAlert = useCallback(
    (id: string) => {
      setAlerts((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const removeAlertRef = useRef(removeAlert);
  useEffect(() => { removeAlertRef.current = removeAlert; }, [removeAlert]);

  // Subscribe to notification response (user taps notification) to auto-dismiss
  useEffect(() => {
    if (Platform.OS === "web") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sub: any;
    try {
      sub = getNotifications()?.addNotificationResponseReceivedListener((response) => {
        const alertId = response.notification.request.content.data?.alertId as string | undefined;
        if (alertId) removeAlertRef.current(alertId);
      });
    } catch {}
    return () => { try { sub?.remove(); } catch {} };
  }, []);

  const clearAlerts = useCallback(() => {
    saveAlerts([]);
  }, [saveAlerts]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <ListsContext.Provider
      value={{
        lists,
        alerts,
        monitoringActive,
        manuallyPaused,
        toggleMonitoring,
        addList,
        updateList,
        deleteList,
        toggleFlash,
        toggleNotifications,
        addItemToList,
        editItemInList,
        removeItemFromList,
        moveItemToList,
        updateAddressItem,
        addAlert,
        markAlertRead,
        removeAlert,
        clearAlerts,
        unreadCount,
      }}
    >
      {children}
    </ListsContext.Provider>
  );
}

export function useLists(): ListsContextType {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error("useLists must be used within ListsProvider");
  return ctx;
}
