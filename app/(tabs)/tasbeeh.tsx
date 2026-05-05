import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// NOTE: Ensure your dhikrService path is correct for your project structure
import {
  clearAllDhikrSessions,
  deleteDhikrSession,
  fetchDhikrHistory,
  saveDhikrSession,
} from "../services/dhikrService";

/* ─────────────────────────────────────────────
   RESPONSIVE SCALING UTILITIES
───────────────────────────────────────────── */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const guidelineBaseWidth = 393;
const guidelineBaseHeight = 852;

const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.4) => size + (scale(size) - size) * factor;

/* ─────────────────────────────────────────────
   COLORS
───────────────────────────────────────────── */
const COLORS = {
  darkTeal: "#0A4A4A",
  beige: "#f5f5dc",
  lightTeal: "#a8c5c5",
  tealMedium: "#156B6B",
  tealLight: "#0D5555",
  beigeDark: "#d4c9b0",
  beigeLight: "#fafaf0",
  gold: "#D4AF37",
  white: "#FFFFFF",
  transparentTeal: "rgba(21, 107, 107, 0.6)",
  danger: "#C0392B",
  dangerLight: "rgba(192, 57, 43, 0.15)",
  overlay: "rgba(5, 30, 30, 0.88)",
};

/* ─────────────────────────────────────────────
   TYPES & DATA
───────────────────────────────────────────── */
type Dhikr = {
  id: string;
  title: string;
  arabic: string;
  meaning: string;
  defaultTarget: number;
  isCustom?: boolean;
};

type DhikrSession = {
  sessionId: string;
  dhikrId: string;
  dhikrTitle: string;
  dhikrArabic: string;
  customText?: string;
  target: number;
  count: number;
  completedAt: string;
  isCompleted: boolean;
};

const DHIKR_LIST: Dhikr[] = [
  { id: "1", title: "Subhan Allah", arabic: "سُبْحَانَ ٱللَّٰهِ", meaning: "Glory be to Allah", defaultTarget: 33 },
  { id: "2", title: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰهِ", meaning: "Praise be to Allah", defaultTarget: 33 },
  { id: "3", title: "Allahu Akbar", arabic: "ٱللَّٰهُ أَكْبَر", meaning: "Allah is The Greatest", defaultTarget: 34 },
  { id: "4", title: "Astaghfirullah", arabic: "أَسْتَغْفِرُ ٱللَّٰهَ", meaning: "I seek Allah's forgiveness", defaultTarget: 100 },
  { id: "5", title: "La ilaha illa Allah", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", meaning: "There is no god except Allah", defaultTarget: 100 },
  { id: "6", title: "Subhan Allahi wa bi Hamdihi", arabic: "سُبْحَانَ اللَّهِ وَ بِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ", meaning: "Allah is free from imperfections and all praise is due to Him", defaultTarget: 100 },
  { id: "custom", title: "Custom Dhikr", arabic: "", meaning: "Add your own dhikr", defaultTarget: 33, isCustom: true },
];

/* ─────────────────────────────────────────────
   FULL-SCREEN BLOCKING LOADER
───────────────────────────────────────────── */
function FullScreenLoader({ visible, label = "Syncing…" }: { visible: boolean; label?: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      spin.setValue(0);
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        spin.stopAnimation();
        pulse.stopAnimation();
      });
    }
  }, [visible]);

  if (!visible) return null;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={[loaderStyles.backdrop, { opacity: fade }]} pointerEvents="box-only">
      <View style={loaderStyles.card}>
        <View style={loaderStyles.ringWrap}>
          <View style={loaderStyles.ringTrack} />
          <Animated.View style={[loaderStyles.ringArc, { transform: [{ rotate }] }]} />
          <Animated.View style={[loaderStyles.dot, { transform: [{ scale: pulse }] }]} />
        </View>
        <Text style={loaderStyles.label}>{label}</Text>
        <Text style={loaderStyles.sub}>Please wait…</Text>
      </View>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────
   HISTORY SCREEN
───────────────────────────────────────────── */
function HistoryScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets(); 

  const [sessions, setSessions] = useState<DhikrSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Syncing…");
  const [editingSession, setEditingSession] = useState<DhikrSession | null>(null);
  const [editCount, setEditCount] = useState("");
  const [editTarget, setEditTarget] = useState("");

  const withLoader = async (label: string, fn: () => Promise<void>) => {
    setLoadingLabel(label);
    setGlobalLoading(true);
    try { await fn(); } finally { setGlobalLoading(false); }
  };

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data: DhikrSession[] = await fetchDhikrHistory();
      data.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      setSessions(data);
    } catch {
      Alert.alert("Network Error", "Could not load history from the server.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const deleteSession = (sessionId: string) => {
    Alert.alert("Delete Session", "Remove this session from your history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => withLoader("Deleting…", async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          try {
            await deleteDhikrSession(sessionId);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
          } catch {
            Alert.alert("Error", "Failed to delete session on the server.");
          }
        }),
      },
    ]);
  };

  const openEdit = (session: DhikrSession) => {
    setEditingSession(session);
    setEditCount(String(session.count));
    setEditTarget(String(session.target));
  };

  const saveEdit = () => {
    if (!editingSession) return;
    const newCount = Number(editCount);
    const newTarget = Number(editTarget);
    if (isNaN(newCount) || isNaN(newTarget) || newCount < 0 || newTarget <= 0) {
      Alert.alert("Invalid values", "Please enter valid numbers.");
      return;
    }
    const updated: DhikrSession = { ...editingSession, count: newCount, target: newTarget, isCompleted: newCount >= newTarget };
    withLoader("Saving changes…", async () => {
      try {
        await saveDhikrSession(updated);
        setSessions(prev => prev.map(s => s.sessionId === editingSession.sessionId ? updated : s));
        setEditingSession(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert("Error", "Failed to save changes to the server.");
      }
    });
  };

  const clearAll = () => {
    Alert.alert("Clear All History", "This will permanently delete your entire dhikr history.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All", style: "destructive",
        onPress: () => withLoader("Clearing history…", async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          try { await clearAllDhikrSessions(); setSessions([]); } 
          catch { Alert.alert("Error", "Failed to clear history on the server."); }
        }),
      },
    ]);
  };

  const totalSessions = sessions.length;
  const totalCount = sessions.reduce((s, x) => s + x.count, 0);
  const completedSessions = sessions.filter(s => s.isCompleted).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) + " • " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FullScreenLoader visible={globalLoading} label={loadingLabel} />

      <View style={styles.listHeader}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={moderateScale(32)} color={COLORS.beige} />
        </TouchableOpacity>
        <Text style={styles.listHeaderText}>Dhikr History</Text>
        <TouchableOpacity onPress={clearAll} style={styles.iconBtn}>
          <MaterialCommunityIcons name="trash-can-outline" size={moderateScale(24)} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={histStyles.statsBanner}>

        {[
          { value: totalSessions, label: "Sessions" },
          { value: totalCount.toLocaleString(), label: "Total Count" },
          { value: completedSessions, label: "Completed" },
        ].map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <View style={histStyles.statDivider} />}
            <View style={histStyles.statItem}>
              <Text style={histStyles.statValue}>{item.value}</Text>
              <Text style={histStyles.statLabel}>{item.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
      <Text style={histStyles.warningText}>
  ⚠️ Only last 10 tasbeeh sessions will be stored. Older ones will be automatically replaced.
</Text>
      {loading ? (
        <View style={histStyles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.lightTeal} />
          <Text style={[histStyles.emptyText, { marginTop: moderateScale(16) }]}>Syncing from cloud…</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={histStyles.emptyState}>
          <MaterialCommunityIcons name="history" size={moderateScale(52)} color={COLORS.lightTeal + "60"} />
          <Text style={histStyles.emptyText}>No history yet</Text>
          <Text style={histStyles.emptySubText}>Your completed dhikr sessions will appear here</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={histStyles.list} showsVerticalScrollIndicator={false}>
          {sessions.map(session => (
            <View key={session.sessionId} style={histStyles.card}>
              <View style={histStyles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={histStyles.cardArabic} numberOfLines={1}>{session.dhikrArabic || session.customText || "✍️"}</Text>
                  <Text style={histStyles.cardTitle}>{session.dhikrTitle}</Text>
                  {session.customText ? <Text style={histStyles.cardCustomText} numberOfLines={1}>{session.customText}</Text> : null}
                </View>
                <View style={histStyles.badgeContainer}>
                  <View style={[histStyles.completedBadge, !session.isCompleted && histStyles.incompleteBadge]}>
                    <Text style={[histStyles.completedBadgeText, !session.isCompleted && histStyles.incompleteBadgeText]}>
                      {session.isCompleted ? "Completed ✓" : "Partial"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={histStyles.progressRow}>
                <View style={histStyles.countBox}>
                  <Text style={histStyles.countValue}>{session.count}</Text>
                  <Text style={histStyles.countLabel}>Count</Text>
                </View>
                <View style={histStyles.progressBarWrap}>
                  <View style={histStyles.progressBg}>
                    <View
                      style={[
                        histStyles.progressFill,
                        { width: `${Math.min((session.count / session.target) * 100, 100)}%` },
                        session.isCompleted && histStyles.progressFillComplete,
                      ]}
                    />
                  </View>
                  <Text style={histStyles.progressLabel}>
                    {session.count} / {session.target} • {Math.round(Math.min((session.count / session.target) * 100, 100))}%
                  </Text>
                </View>
                <View style={histStyles.countBox}>
                  <Text style={histStyles.countValue}>{session.target}</Text>
                  <Text style={histStyles.countLabel}>Target</Text>
                </View>
              </View>

              <Text style={histStyles.date}>{formatDate(session.completedAt)}</Text>

              <View style={histStyles.actions}>
                <TouchableOpacity style={histStyles.editBtn} onPress={() => openEdit(session)}>
                  <MaterialCommunityIcons name="pencil-outline" size={moderateScale(16)} color={COLORS.lightTeal} />
                  <Text style={histStyles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={histStyles.deleteBtn} onPress={() => deleteSession(session.sessionId)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={moderateScale(16)} color={COLORS.danger} />
                  <Text style={histStyles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: verticalScale(40) }} />
        </ScrollView>
      )}

      <Modal visible={!!editingSession} transparent animationType="slide" onRequestClose={() => setEditingSession(null)}>
        <View style={histStyles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: '100%' }}>
            <View style={histStyles.modalBox}>
              <Text style={histStyles.modalTitle}>Edit Session</Text>
              {editingSession && <Text style={histStyles.modalSubtitle}>{editingSession.dhikrTitle}</Text>}

              <Text style={histStyles.modalLabel}>Count achieved</Text>
              <TextInput style={histStyles.modalInput} value={editCount} onChangeText={setEditCount} keyboardType="numeric" returnKeyType="next" maxLength={6} />

              <Text style={histStyles.modalLabel}>Target</Text>
              <TextInput style={histStyles.modalInput} value={editTarget} onChangeText={setEditTarget} keyboardType="numeric" returnKeyType="done" maxLength={6} onSubmitEditing={saveEdit} />

              <View style={histStyles.modalActions}>
                <TouchableOpacity style={histStyles.modalCancelBtn} onPress={() => setEditingSession(null)}>
                  <Text style={histStyles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={histStyles.modalSaveBtn} onPress={saveEdit}>
                  <Text style={histStyles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
export default function TasbeehDhikrScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets(); 

  const minDim = Math.min(screenWidth, screenHeight);

  const [selected, setSelected] = useState<Dhikr | null>(null);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [customTargetInput, setCustomTargetInput] = useState("");
  const [customText, setCustomText] = useState("");
  const [showDhikrList, setShowDhikrList] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Syncing…");

  const currentSessionId = useRef<string | null>(null);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const saveFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 25000, useNativeDriver: true })).start();
  }, []);

  const glow = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 25] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const withLoader = async (label: string, fn: () => Promise<void>) => {
    setLoadingLabel(label);
    setGlobalLoading(true);
    try { await fn(); } finally { setGlobalLoading(false); }
  };

  const persistSession = useCallback(
    async (finalCount: number, isCompleted: boolean) => {
      let sessionId = currentSessionId.current;
      if (!sessionId) {
        sessionId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        currentSessionId.current = sessionId;
      }
      const payload: DhikrSession = {
        sessionId,
        dhikrId: selected?.id ?? "custom",
        dhikrTitle: selected?.isCustom ? customText || "Custom Dhikr" : selected?.title ?? "",
        dhikrArabic: selected?.arabic ?? "",
        customText: selected?.isCustom ? customText : undefined,
        target,
        count: finalCount,
        completedAt: new Date().toISOString(),
        isCompleted,
      };
      await saveDhikrSession(payload);
    },
    [selected, target, customText]
  );

  const flashSaved = () => {
    saveFlash.stopAnimation();
    saveFlash.setValue(0);
    Animated.sequence([
      Animated.timing(saveFlash, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(saveFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const saveProgress = async () => {
    await withLoader("Saving progress…", async () => {
      try {
        await persistSession(count, count >= target);
        flashSaved();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert("Error", "Failed to sync with server.");
      }
    });
  };

  const increment = async () => {
    if (count >= target) return;
    const newCount = count + 1;
    setCount(newCount);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (newCount === target) {
      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
        Animated.timing(slideAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setShowSuccess(false));
      }, 3000);
    }
  };

  const reset = () => {
    setCount(0);
    setShowSuccess(false);
    currentSessionId.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectDhikr = (item: Dhikr) => {
    setSelected(item);
    setTarget(item.defaultTarget);
    setCount(0);
    setShowDhikrList(false);
    setShowSuccess(false);
    currentSessionId.current = null;
    if (!item.isCustom) setCustomText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const applyCustomTarget = () => {
    const num = Number(customTargetInput);
    if (!isNaN(num) && num > 0 && num <= 10000) {
      setTarget(num);
      setCount(0);
      currentSessionId.current = null;
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleQuickTarget = (n: number) => {
    setTarget(n);
    setCount(0);
    currentSessionId.current = null;
    setCustomTargetInput("");
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const progress = Math.min((count / target) * 100, 100);

  if (showHistory) {
    return <HistoryScreen onBack={() => setShowHistory(false)} />;
  }

  if (showDhikrList) {
    return (
      <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.listHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={moderateScale(32)} color={COLORS.beige} />
          </TouchableOpacity>
          <Text style={styles.listHeaderText}>Select Dhikr</Text>
          <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.historyBtn}>
            <MaterialCommunityIcons name="history" size={moderateScale(22)} color={COLORS.lightTeal} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentList} showsVerticalScrollIndicator={false}>
          {DHIKR_LIST.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.dhikrListItem, index === DHIKR_LIST.length - 1 && { marginBottom: 0 }]}
              onPress={() => selectDhikr(item)}
              activeOpacity={0.8}
            >
              <View style={styles.playIconCircle}>
                <Ionicons name="play" size={moderateScale(18)} color={COLORS.lightTeal} style={{ marginLeft: 2 }} />
              </View>
              <View style={styles.dhikrListContent}>
                <Text style={styles.dhikrListArabic}>{item.arabic || "✍️"}</Text>
                <Text style={styles.dhikrListTitle}>{item.title}</Text>
                <Text style={styles.dhikrListMeaning} numberOfLines={2}>{item.meaning}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={moderateScale(24)} color={COLORS.lightTeal} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FullScreenLoader visible={globalLoading} label={loadingLabel} />

      <Animated.View
        style={[styles.bgCircle, {
          width: screenWidth * 1.5, height: screenWidth * 1.5,
          top: -screenWidth * 0.5, right: -screenWidth * 0.5,
          transform: [{ rotate }],
        }]}
      />
      <Animated.View
        style={[styles.bgCircle, {
          width: screenWidth * 0.9, height: screenWidth * 0.9,
          bottom: -screenWidth * 0.2, left: -screenWidth * 0.3,
          transform: [{ rotate }],
        }]}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDhikrList(true)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={moderateScale(28)} color={COLORS.beige} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Tasbih</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={saveProgress} style={[styles.iconBtnFilled, { marginRight: moderateScale(8) }]}>
              <Ionicons name="bookmark-outline" size={moderateScale(20)} color={COLORS.lightTeal} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowHistory(true)} style={[styles.iconBtnFilled, { marginRight: moderateScale(8) }]}>
              <MaterialCommunityIcons name="history" size={moderateScale(20)} color={COLORS.lightTeal} />
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={styles.iconBtnFilled}>
              <Ionicons name="refresh" size={moderateScale(20)} color={COLORS.lightTeal} />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={[counterStyles.savedToast, { opacity: saveFlash }]} pointerEvents="none">
          <MaterialCommunityIcons name="check-circle" size={moderateScale(16)} color={COLORS.gold} />
          <Text style={counterStyles.savedToastText}>Synced to cloud</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.counterContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.countDisplay}>
            <Animated.Text
              style={[
                styles.count,
                {
                  fontSize: Math.min(minDim * 0.28, 140),
                  height: Math.min(minDim * 0.32, 160),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {String(count).padStart(3, "0")}
            </Animated.Text>
            <View style={styles.targetBadge}>
              <MaterialCommunityIcons name="bullseye-arrow" size={moderateScale(18)} color={COLORS.darkTeal} />
              <Text style={styles.targetBadgeText}>Goal: {target}</Text>
            </View>
          </View>

          <View style={styles.beadsContainer}>
            <View style={styles.beadLine} />
            <View style={styles.beadRow}>
              {[...Array(11)].map((_, i) => {
                const isActive = i < Math.floor((count / target) * 11);
                return <View key={i} style={[styles.bead, isActive && styles.beadActive]} />;
              })}
            </View>
          </View>

          <View style={styles.currentDhikrCard}>
            <View style={styles.currentHeader}>
              <MaterialCommunityIcons name="book-open-variant" size={moderateScale(18)} color={COLORS.lightTeal} />
              <Text style={styles.currentLabel}>Current Dhikr</Text>
            </View>
            {selected?.isCustom ? (
              <View style={styles.customDhikrWrapper}>
                <TextInput
                  style={styles.customInputText}
                  placeholder="Type your personal dhikr…"
                  placeholderTextColor={COLORS.beigeDark + "80"}
                  value={customText}
                  onChangeText={setCustomText}
                  returnKeyType="done"
                  multiline
                />
              </View>
            ) : (
              <>
                <Text style={styles.currentArabic}>{selected?.arabic}</Text>
                <Text style={styles.currentTitle}>{selected?.title}</Text>
                <Text style={styles.currentMeaning}>{selected?.meaning}</Text>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Animated.View style={[styles.glowWrapper, { shadowRadius: glow }]}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.tasbeehBtn,
                    count >= target && styles.tasbeehBtnDisabled,
                    {
                      width: Math.min(minDim * 0.42, 220),
                      height: Math.min(minDim * 0.42, 220),
                      borderRadius: Math.min(minDim * 0.21, 110),
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={increment}
                  disabled={count >= target}
                >
                  <View style={styles.tasbeehBtnInner}>
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={Math.min(minDim * 0.16, 80)}
                      color={count >= target ? COLORS.beigeDark : COLORS.darkTeal}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {count} / {target} • {Math.round(progress)}%
            </Text>
          </View>

          <View style={styles.goalSection}>
            <Text style={styles.goalTitle}>Set Target</Text>
            <View style={styles.targetButtonsRow}>
              {[33, 99, 100].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.targetBtn, target === n && !customTargetInput && styles.targetBtnActive]}
                  onPress={() => handleQuickTarget(n)}
                >
                  <Text style={[styles.targetBtnText, target === n && !customTargetInput && styles.targetBtnTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customTargetInputWrapper}>
              <TextInput
                style={[styles.targetInput, target === Number(customTargetInput) && styles.targetInputActive]}
                keyboardType="numeric"
                placeholder="Custom Goal…"
                placeholderTextColor={COLORS.beigeDark + "60"}
                value={customTargetInput}
                onChangeText={setCustomTargetInput}
                returnKeyType="done"
                maxLength={5}
                onSubmitEditing={applyCustomTarget}
              />
              <TouchableOpacity
                style={styles.targetInputButton}
                onPress={applyCustomTarget}
                disabled={!customTargetInput || Number(customTargetInput) <= 0}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={moderateScale(28)}
                  color={target === Number(customTargetInput) ? COLORS.lightTeal : COLORS.beigeDark + "40"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={counterStyles.saveProgressBtn} onPress={saveProgress} activeOpacity={0.8}>
            <MaterialCommunityIcons name="content-save-outline" size={moderateScale(20)} color={COLORS.darkTeal} />
            <Text style={counterStyles.saveProgressBtnText}>Save Progress</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: successAnim }]}>
          <Animated.View
            style={[
              styles.successContent,
              {
                transform: [
                  { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                  { scale: successAnim },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name="check-decagram" size={moderateScale(90)} color={COLORS.gold} style={{ marginBottom: moderateScale(20) }} />
            <Text style={styles.successTitle}>مَا شَاءَ ٱللَّٰهُ</Text>
            <Text style={styles.successMessage}>Target Completed!</Text>
            <View style={styles.successStats}>
              <Text style={styles.successStatsText}>Alhamdulillah, {target} completed ✨</Text>
            </View>
            <Text style={counterStyles.autoSavedNote}>Tap 'Save Progress' to sync</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
   STYLES 
───────────────────────────────────────────── */

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.darkTeal },
  scrollView: { flex: 1 },
  bgCircle: { position: "absolute", borderRadius: 1000, backgroundColor: COLORS.lightTeal, opacity: 0.08 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: "5%", paddingVertical: moderateScale(15) },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: "5%", paddingVertical: moderateScale(15) },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: moderateScale(44), height: moderateScale(44), justifyContent: "center", alignItems: "flex-start" },
  iconBtnFilled: { width: moderateScale(38), height: moderateScale(38), justifyContent: "center", alignItems: "center", borderRadius: moderateScale(19), backgroundColor: COLORS.transparentTeal },
  historyBtn: { width: moderateScale(40), height: moderateScale(40), justifyContent: "center", alignItems: "center", borderRadius: moderateScale(20), backgroundColor: COLORS.transparentTeal },
  listHeaderText: { color: COLORS.beige, fontSize: moderateScale(22), fontWeight: "700", letterSpacing: 0.5 },
  headerText: { color: COLORS.beige, fontSize: moderateScale(22), fontWeight: "700", letterSpacing: 1 },
  scrollContentList: { paddingHorizontal: "5%", paddingTop: moderateScale(10), paddingBottom: moderateScale(40) },
  dhikrListItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.transparentTeal, padding: moderateScale(18), borderRadius: moderateScale(20), marginBottom: moderateScale(14), borderWidth: 1, borderColor: COLORS.lightTeal + "20" },
  playIconCircle: { width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20), backgroundColor: COLORS.darkTeal, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.lightTeal + "50" },
  dhikrListContent: { flex: 1, marginHorizontal: moderateScale(15) },
  dhikrListArabic: { color: COLORS.beige, fontSize: moderateScale(22), fontWeight: "700", marginBottom: moderateScale(4), textAlign: "right" },
  dhikrListTitle: { color: COLORS.white, fontSize: moderateScale(16), fontWeight: "600", marginBottom: moderateScale(4) },
  dhikrListMeaning: { color: COLORS.beigeDark, fontSize: moderateScale(13), fontStyle: "italic", lineHeight: moderateScale(18) },
  
  /* * CRITICAL SPACING FIXES BELOW:
   * Removed `justifyContent: "space-evenly"` from counterContent.
   * Added heavy, consistent bottom margins to all major block elements to ensure a clean layout. 
   */
  counterContent: { flexGrow: 1, paddingHorizontal: "5%", paddingTop: verticalScale(10), paddingBottom: verticalScale(60) },
  countDisplay: { alignItems: "center", marginBottom: verticalScale(24) }, 
  count: { color: COLORS.beige, fontWeight: "300", letterSpacing: 2, textAlign: "center" },
  targetBadge: { flexDirection: "row", alignItems: "center", gap: moderateScale(6), backgroundColor: COLORS.beige, paddingHorizontal: moderateScale(20), paddingVertical: moderateScale(8), borderRadius: moderateScale(20), marginTop: moderateScale(8), elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: moderateScale(4) }, shadowOpacity: 0.2, shadowRadius: moderateScale(5) },
  targetBadgeText: { color: COLORS.darkTeal, fontSize: moderateScale(15), fontWeight: "800", letterSpacing: 0.5 },
  
  beadsContainer: { alignItems: "center", justifyContent: "center", height: moderateScale(30), marginBottom: verticalScale(32) },
  beadLine: { position: "absolute", width: "80%", height: moderateScale(2), backgroundColor: COLORS.lightTeal + "30", top: "50%", zIndex: 0 },
  beadRow: { flexDirection: "row", justifyContent: "space-between", width: "80%", zIndex: 1 },
  bead: { width: moderateScale(12), height: moderateScale(12), borderRadius: moderateScale(6), backgroundColor: COLORS.tealMedium, borderWidth: 1, borderColor: COLORS.lightTeal + "50" },
  beadActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold, transform: [{ scale: 1.3 }], shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: moderateScale(6), elevation: 4 },
  
  currentDhikrCard: { backgroundColor: COLORS.transparentTeal, borderRadius: moderateScale(24), padding: moderateScale(24), alignItems: "center", borderWidth: 1, borderColor: COLORS.lightTeal + "20", marginBottom: verticalScale(36) },
  currentHeader: { flexDirection: "row", alignItems: "center", gap: moderateScale(8), marginBottom: moderateScale(15), backgroundColor: COLORS.darkTeal + "50", paddingHorizontal: moderateScale(12), paddingVertical: moderateScale(6), borderRadius: moderateScale(12) },
  currentLabel: { color: COLORS.lightTeal, fontSize: moderateScale(13), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  currentArabic: { color: COLORS.white, fontSize: moderateScale(28), fontWeight: "bold", marginBottom: moderateScale(16), textAlign: "center", lineHeight: moderateScale(40) },
  currentTitle: { color: COLORS.beige, fontSize: moderateScale(18), fontWeight: "600", marginBottom: moderateScale(8), textAlign: "center" },
  currentMeaning: { color: COLORS.beigeDark, fontSize: moderateScale(14), textAlign: "center", fontStyle: "italic", lineHeight: moderateScale(20) },
  customDhikrWrapper: { width: "100%", minHeight: moderateScale(80) },
  customInputText: { color: COLORS.white, fontSize: moderateScale(20), fontWeight: "600", textAlign: "center", borderBottomWidth: 1, borderBottomColor: COLORS.lightTeal + "40", paddingBottom: moderateScale(10) },
  
  buttonContainer: { alignItems: "center", marginBottom: verticalScale(36) },
  glowWrapper: { shadowColor: COLORS.beige, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, elevation: 10 },
  tasbeehBtn: { backgroundColor: COLORS.tealMedium, justifyContent: "center", alignItems: "center", borderWidth: moderateScale(6), borderColor: COLORS.darkTeal },
  tasbeehBtnInner: { width: "90%", height: "90%", borderRadius: moderateScale(100), backgroundColor: COLORS.beige, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: moderateScale(4) }, shadowOpacity: 0.2, shadowRadius: moderateScale(5) },
  tasbeehBtnDisabled: { opacity: 0.6 },
  
  progressSection: { paddingHorizontal: "3%", marginBottom: verticalScale(36) },
  progressBar: { height: moderateScale(8), backgroundColor: COLORS.tealMedium, borderRadius: moderateScale(4), overflow: "hidden", marginBottom: moderateScale(10) },
  progressFill: { height: "100%", backgroundColor: COLORS.gold, borderRadius: moderateScale(4) },
  progressText: { color: COLORS.beigeDark, fontSize: moderateScale(14), textAlign: "center", fontWeight: "600", letterSpacing: 1 },
  
  goalSection: { backgroundColor: COLORS.transparentTeal, borderRadius: moderateScale(24), padding: moderateScale(24), borderWidth: 1, borderColor: COLORS.lightTeal + "20", marginBottom: verticalScale(24) },
  goalTitle: { color: COLORS.beige, fontSize: moderateScale(16), fontWeight: "700", marginBottom: moderateScale(16), letterSpacing: 0.5 },
  targetButtonsRow: { flexDirection: "row", gap: moderateScale(12), marginBottom: moderateScale(16) },
  targetBtn: { flex: 1, backgroundColor: COLORS.darkTeal + "80", paddingVertical: moderateScale(14), borderRadius: moderateScale(14), borderWidth: 1, borderColor: COLORS.lightTeal + "30", alignItems: "center" },
  targetBtnActive: { backgroundColor: COLORS.beige, borderColor: COLORS.beige },
  targetBtnText: { color: COLORS.white, fontWeight: "700", fontSize: moderateScale(16) },
  targetBtnTextActive: { color: COLORS.darkTeal },
  customTargetInputWrapper: { position: "relative", flexDirection: "row", alignItems: "center" },
  targetInput: { flex: 1, backgroundColor: COLORS.darkTeal + "80", color: COLORS.white, padding: moderateScale(16), paddingRight: moderateScale(60), borderRadius: moderateScale(14), fontSize: moderateScale(16), fontWeight: "600", borderWidth: 1, borderColor: COLORS.lightTeal + "30" },
  targetInputActive: { borderColor: COLORS.gold, backgroundColor: COLORS.darkTeal },
  targetInputButton: { position: "absolute", right: moderateScale(8), width: moderateScale(44), height: moderateScale(44), justifyContent: "center", alignItems: "center" },
  
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10, 74, 74, 0.95)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  successContent: { alignItems: "center", paddingHorizontal: "10%" },
  successTitle: { color: COLORS.beige, fontSize: moderateScale(34), fontWeight: "bold", marginBottom: moderateScale(8), textAlign: "center" },
  successMessage: { color: COLORS.lightTeal, fontSize: moderateScale(20), fontWeight: "600", marginBottom: moderateScale(25), letterSpacing: 0.5 },
  successStats: { backgroundColor: COLORS.transparentTeal, paddingHorizontal: moderateScale(24), paddingVertical: moderateScale(12), borderRadius: moderateScale(20), borderWidth: 1, borderColor: COLORS.gold + "50" },
  successStatsText: { color: COLORS.gold, fontSize: moderateScale(16), fontWeight: "600" },
});

const loaderStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay, justifyContent: "center", alignItems: "center", zIndex: 9999 },
  card: { width: "60%", minWidth: scale(200), paddingVertical: moderateScale(36), alignItems: "center", backgroundColor: "rgba(13, 85, 85, 0.92)", borderRadius: moderateScale(28), borderWidth: 1, borderColor: COLORS.lightTeal + "40", shadowColor: "#000", shadowOffset: { width: 0, height: moderateScale(12) }, shadowOpacity: 0.5, shadowRadius: moderateScale(24), elevation: 20 },
  ringWrap: { width: moderateScale(80), height: moderateScale(80), justifyContent: "center", alignItems: "center", marginBottom: moderateScale(20) },
  ringTrack: { position: "absolute", width: moderateScale(72), height: moderateScale(72), borderRadius: moderateScale(36), borderWidth: moderateScale(4), borderColor: COLORS.tealMedium + "50" },
  ringArc: { position: "absolute", width: moderateScale(72), height: moderateScale(72), borderRadius: moderateScale(36), borderWidth: moderateScale(4), borderColor: "transparent", borderTopColor: COLORS.gold, borderRightColor: COLORS.gold + "60" },
  dot: { width: moderateScale(22), height: moderateScale(22), borderRadius: moderateScale(11), backgroundColor: COLORS.gold, shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: moderateScale(10), elevation: 6 },
  label: { color: COLORS.beige, fontSize: moderateScale(17), fontWeight: "700", letterSpacing: 0.4, marginBottom: moderateScale(4) },
  sub: { color: COLORS.lightTeal, fontSize: moderateScale(13) },
});

const histStyles = StyleSheet.create({
  statsBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: COLORS.transparentTeal, marginHorizontal: "5%", marginBottom: moderateScale(12), borderRadius: moderateScale(20), paddingVertical: moderateScale(16), borderWidth: 1, borderColor: COLORS.lightTeal + "20" },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { color: COLORS.gold, fontSize: moderateScale(22), fontWeight: "800", letterSpacing: 0.5 },
  statLabel: { color: COLORS.beigeDark, fontSize: moderateScale(12), marginTop: moderateScale(2), textAlign: "center" },
  statDivider: { width: 1, height: "80%", backgroundColor: COLORS.lightTeal + "30" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: moderateScale(12), paddingHorizontal: "10%" },
  emptyText: { color: COLORS.beige, fontSize: moderateScale(18), fontWeight: "600" },
  emptySubText: { color: COLORS.beigeDark, fontSize: moderateScale(14), textAlign: "center" },
  list: { paddingHorizontal: "5%", paddingTop: moderateScale(4) },
  card: { backgroundColor: COLORS.transparentTeal, borderRadius: moderateScale(20), padding: moderateScale(18), marginBottom: moderateScale(14), borderWidth: 1, borderColor: COLORS.lightTeal + "20" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: moderateScale(12) },
  cardArabic: { color: COLORS.white, fontSize: moderateScale(18), fontWeight: "700", textAlign: "right", marginBottom: moderateScale(2) },
  cardTitle: { color: COLORS.beige, fontSize: moderateScale(15), fontWeight: "600" },
  cardCustomText: { color: COLORS.beigeDark, fontSize: moderateScale(13), fontStyle: "italic", marginTop: moderateScale(2) },
  badgeContainer: { marginLeft: moderateScale(10), marginTop: moderateScale(2) },
  completedBadge: { backgroundColor: "rgba(212,175,55,0.2)", paddingHorizontal: moderateScale(10), paddingVertical: moderateScale(4), borderRadius: moderateScale(10), borderWidth: 1, borderColor: COLORS.gold + "40" },
  completedBadgeText: { color: COLORS.gold, fontSize: moderateScale(12), fontWeight: "700" },
  incompleteBadge: { backgroundColor: "rgba(168,197,197,0.1)", borderColor: COLORS.lightTeal + "40" },
  incompleteBadgeText: { color: COLORS.lightTeal },
  progressRow: { flexDirection: "row", alignItems: "center", gap: moderateScale(10), marginBottom: moderateScale(10) },
  countBox: { alignItems: "center", minWidth: moderateScale(44) },
  countValue: { color: COLORS.white, fontSize: moderateScale(18), fontWeight: "700" },
  countLabel: { color: COLORS.beigeDark, fontSize: moderateScale(11) },
  progressBarWrap: { flex: 1 },
  progressBg: { height: moderateScale(6), backgroundColor: COLORS.tealMedium, borderRadius: moderateScale(3), overflow: "hidden", marginBottom: moderateScale(4) },
  progressFill: { height: "100%", backgroundColor: COLORS.lightTeal, borderRadius: moderateScale(3) },
  progressFillComplete: { backgroundColor: COLORS.gold },
  progressLabel: { color: COLORS.beigeDark, fontSize: moderateScale(12), textAlign: "center" },
  date: { color: COLORS.beigeDark + "80", fontSize: moderateScale(12), marginBottom: moderateScale(12) },
  actions: { flexDirection: "row", gap: moderateScale(10) },
  editBtn: { flexDirection: "row", alignItems: "center", gap: moderateScale(6), backgroundColor: COLORS.tealLight + "80", paddingHorizontal: moderateScale(14), paddingVertical: moderateScale(8), borderRadius: moderateScale(10), borderWidth: 1, borderColor: COLORS.lightTeal + "30" },
  editBtnText: { color: COLORS.lightTeal, fontSize: moderateScale(13), fontWeight: "600" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: moderateScale(6), backgroundColor: COLORS.dangerLight, paddingHorizontal: moderateScale(14), paddingVertical: moderateScale(8), borderRadius: moderateScale(10), borderWidth: 1, borderColor: COLORS.danger + "30" },
  deleteBtnText: { color: COLORS.danger, fontSize: moderateScale(13), fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: COLORS.tealLight, borderTopLeftRadius: moderateScale(28), borderTopRightRadius: moderateScale(28), padding: "8%", paddingBottom: Platform.OS === "ios" ? moderateScale(40) : moderateScale(28) },
  modalTitle: { color: COLORS.beige, fontSize: moderateScale(20), fontWeight: "800", marginBottom: moderateScale(4) },
  modalSubtitle: { color: COLORS.lightTeal, fontSize: moderateScale(14), marginBottom: moderateScale(20) },
  modalLabel: { color: COLORS.beigeDark, fontSize: moderateScale(13), fontWeight: "600", marginBottom: moderateScale(6), marginTop: moderateScale(8) },
  modalInput: { backgroundColor: COLORS.darkTeal + "80", color: COLORS.white, padding: moderateScale(14), borderRadius: moderateScale(12), fontSize: moderateScale(16), fontWeight: "700", borderWidth: 1, borderColor: COLORS.lightTeal + "30" },
  modalActions: { flexDirection: "row", gap: moderateScale(12), marginTop: moderateScale(24) },
  modalCancelBtn: { flex: 1, paddingVertical: moderateScale(14), borderRadius: moderateScale(14), borderWidth: 1, borderColor: COLORS.lightTeal + "40", alignItems: "center" },
  modalCancelText: { color: COLORS.beigeDark, fontWeight: "600", fontSize: moderateScale(15) },
  modalSaveBtn: { flex: 1, paddingVertical: moderateScale(14), borderRadius: moderateScale(14), backgroundColor: COLORS.beige, alignItems: "center" },
  warningText: {
    color: COLORS.gold,
    fontSize: moderateScale(12),
    textAlign: "center",
    marginHorizontal: "5%",
    marginBottom: moderateScale(10),
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: COLORS.gold + "30",
    fontWeight: "600",
  },
  modalSaveText: { color: COLORS.darkTeal, fontWeight: "800", fontSize: moderateScale(15) },
});

const counterStyles = StyleSheet.create({
  savedToast: { position: "absolute", top: moderateScale(80), alignSelf: "center", flexDirection: "row", alignItems: "center", gap: moderateScale(6), backgroundColor: "rgba(10, 74, 74, 0.95)", paddingHorizontal: moderateScale(18), paddingVertical: moderateScale(8), borderRadius: moderateScale(20), borderWidth: 1, borderColor: COLORS.gold + "50", zIndex: 100 },
  savedToastText: { color: COLORS.gold, fontSize: moderateScale(14), fontWeight: "700" },
  saveProgressBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: moderateScale(8), backgroundColor: COLORS.beige, paddingVertical: moderateScale(16), borderRadius: moderateScale(16), marginBottom: verticalScale(40) },
  saveProgressBtnText: { color: COLORS.darkTeal, fontSize: moderateScale(16), fontWeight: "800", letterSpacing: 0.5 },
  autoSavedNote: { color: COLORS.lightTeal, fontSize: moderateScale(13), marginTop: moderateScale(20), opacity: 0.8 },
});