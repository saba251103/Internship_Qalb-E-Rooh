import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import moment from "moment-hijri";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { fetchAllSurahsFromBackend } from "../services/quranService";
import { fetchAllPrayerLogs, syncDailyPrayerLog } from "../services/trackerService";

// ─── Utils ────────────────────────────────────────────────────────────────────
const fontScale = (size: number) =>
  Platform.OS === "android" ? moderateScale(size, 0.3) : moderateScale(size);

// ─── Types ────────────────────────────────────────────────────────────────────
type Prayer = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
type ModalType = "prayers" | "fasting" | null;

interface PrayerState extends Record<Prayer, boolean> {}
interface DailyData {
  date: string;
  prayers: PrayerState;
  fasting: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRAYERS: Prayer[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_META: Record<Prayer, { arabic: string; time: string; icon: string }> = {
  Fajr:    { arabic: "الفجر",  time: "Dawn",    icon: "weather-sunset-up" },
  Dhuhr:   { arabic: "الظهر",  time: "Midday",  icon: "weather-sunny" },
  Asr:     { arabic: "العصر",  time: "Afternoon", icon: "weather-partly-cloudy" },
  Maghrib: { arabic: "المغرب", time: "Sunset",  icon: "weather-sunset-down" },
  Isha:    { arabic: "العشاء", time: "Night",   icon: "weather-night" },
};

const STORAGE_KEY = "namazData_today";
const SURAH_PREFIX = "daily_surah_";

const DEFAULT_PRAYER_STATE: PrayerState = {
  Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false,
};

// ─── Animated Prayer Row ──────────────────────────────────────────────────────
const PrayerRow = React.memo(({
  prayer,
  checked,
  onToggle,
}: {
  prayer: Prayer;
  checked: boolean;
  onToggle: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  }, [checked]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();

    if (Platform.OS !== "web") {
      Haptics.impactAsync(checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle();
  };

  const meta = PRAYER_META[prayer];
  const checkScale = checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.6, 1] });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: verticalScale(10) }}>
      <Pressable onPress={handlePress} style={({ pressed }) => [styles.prayerRow, checked && styles.prayerRowActive, pressed && { opacity: 0.92 }]}>
        {/* Left: Checkbox + name */}
        <View style={styles.prayerLeft}>
          <Animated.View style={[styles.checkbox, checked && styles.checkboxChecked, { transform: [{ scale: checkScale }] }]}>
            {checked && <MaterialCommunityIcons name="check" size={moderateScale(14)} color="#FFF" />}
          </Animated.View>
          <View style={{ marginLeft: scale(14) }}>
            <Text style={[styles.prayerName, checked && styles.textWhite]}>{prayer}</Text>
            <Text style={[styles.prayerTime, checked && styles.prayerTimeActive]}>{meta.time}</Text>
          </View>
        </View>

        {/* Right: Arabic + icon */}
        <View style={styles.prayerRight}>
          <Text style={[styles.prayerArabic, checked && styles.prayerArabicActive]}>{meta.arabic}</Text>
          <MaterialCommunityIcons
            name={meta.icon as any}
            size={moderateScale(18)}
            color={checked ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}
            style={{ marginLeft: scale(8) }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── MashaAllah Modal ─────────────────────────────────────────────────────────
const MashaAllahModal = ({
  visible,
  type,
  onClose,
}: {
  visible: boolean;
  type: ModalType;
  onClose: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const config = type === "fasting"
    ? { title: "MashaAllah! ✨", message: "May Allah accept your fast.\nYour sawm has been recorded.", icon: "moon-waning-crescent" as const }
    : { title: "MashaAllah! 🤲", message: "All five prayers complete!\nMay Allah accept your ibadah.", icon: "check-decagram" as const };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={["#0A4A4A", "#073333"]} style={styles.modalIconBg}>
            <MaterialCommunityIcons name={config.icon} size={moderateScale(52)} color="#6EE7B7" />
          </LinearGradient>
          <Text style={styles.modalTitle}>{config.title}</Text>
          <Text style={styles.modalSub}>{config.message}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.closeBtnText}>Alhamdulillah</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DailyWorshipWrapper() {
  return (
    <SafeAreaProvider>
      <DailyWorshipScreen />
    </SafeAreaProvider>
  );
}

function DailyWorshipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const todayString = moment().format("YYYY-MM-DD");

  // ── State ──
  const [prayerState, setPrayerState] = useState<PrayerState>({ ...DEFAULT_PRAYER_STATE });
  const [isFasting, setIsFasting] = useState(false);
  const [dailySurah, setDailySurah] = useState<any>(null);
  const [surahLoading, setSurahLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // ── Modal: track which type triggered it (null = closed) ──
  const [modalType, setModalType] = useState<ModalType>(null);

  // ── Refs to track PREVIOUS state (avoid false triggers) ──
  const prevPrayersRef = useRef<PrayerState>({ ...DEFAULT_PRAYER_STATE });
  const prevFastingRef = useRef(false);
  const hasShownAllPrayersModal = useRef(false);
  const hasShownFastingModal = useRef(false);
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init ──
  useEffect(() => {
    loadTodayData();
    loadDailySurah();
    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [todayString]);

  // ─── Load daily Surah ─────────────────────────────────────────────────────
  const loadDailySurah = async () => {
    setSurahLoading(true);
    try {
      const stored = await AsyncStorage.getItem(`${SURAH_PREFIX}${todayString}`);
      if (stored) {
        setDailySurah(JSON.parse(stored));
        return;
      }
      const allSurahs = await fetchAllSurahsFromBackend();
      if (!allSurahs?.length) return;

      const dayOfYear = moment().dayOfYear();
      const index = dayOfYear % allSurahs.length;
      const surah = allSurahs[index];

      setDailySurah(surah);
      await AsyncStorage.multiRemove([
        `${SURAH_PREFIX}${moment().subtract(1, "days").format("YYYY-MM-DD")}`,
        `${SURAH_PREFIX}${moment().subtract(2, "days").format("YYYY-MM-DD")}`,
      ]);
      await AsyncStorage.setItem(`${SURAH_PREFIX}${todayString}`, JSON.stringify(surah));
    } catch (e) {
      console.warn("[DailyWorship] Could not load surah:", e);
    } finally {
      setSurahLoading(false);
    }
  };

  // ─── Load today's worship data ────────────────────────────────────────────
  const loadTodayData = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: DailyData = JSON.parse(cached);
        if (parsed.date === todayString) {
          setPrayerState(parsed.prayers);
          setIsFasting(parsed.fasting);
          prevPrayersRef.current = parsed.prayers;
          prevFastingRef.current = parsed.fasting;
          hasShownAllPrayersModal.current = Object.values(parsed.prayers).every(Boolean);
          hasShownFastingModal.current = parsed.fasting;
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}

    try {
      const serverData = await fetchAllPrayerLogs();
      const todayLog = serverData?.[todayString];
      if (todayLog) {
        setPrayerState(todayLog.prayers);
        setIsFasting(todayLog.fasting);
        prevPrayersRef.current = todayLog.prayers;
        prevFastingRef.current = todayLog.fasting;
        hasShownAllPrayersModal.current = Object.values(todayLog.prayers).every(Boolean);
        hasShownFastingModal.current = todayLog.fasting;

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: todayString,
          prayers: todayLog.prayers,
          fasting: todayLog.fasting,
        }));
      }
    } catch {}
  };

  // ─── Toggle a prayer ─────────────────────────────────────────────────────
  const togglePrayer = useCallback((prayer: Prayer) => {
    setPrayerState((prev) => {
      const updated = { ...prev, [prayer]: !prev[prayer] };
      const allDone = Object.values(updated).every(Boolean);
      const wasAllDone = Object.values(prev).every(Boolean);

      if (allDone && !wasAllDone && !hasShownAllPrayersModal.current) {
        hasShownAllPrayersModal.current = true;
        setTimeout(() => setModalType("prayers"), 300);
      }

      if (!allDone) {
        hasShownAllPrayersModal.current = false;
      }

      persistData(updated, isFasting);
      return updated;
    });
  }, [isFasting]);

  // ─── Toggle fasting ───────────────────────────────────────────────────────
  const toggleFasting = useCallback(() => {
    setIsFasting((prev) => {
      const updated = !prev;

      if (updated && !hasShownFastingModal.current) {
        hasShownFastingModal.current = true;
        setTimeout(() => setModalType("fasting"), 300);
      }

      if (!updated) {
        hasShownFastingModal.current = false;
      }

      persistData(prayerState, updated);
      return updated;
    });
  }, [prayerState]);

  // ─── Persist with debounced sync ──────────────────────────────────────────
  const persistData = useCallback(
    async (prayers: PrayerState, fasting: boolean) => {
      const payload: DailyData = { date: todayString, prayers, fasting };

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(async () => {
        setIsSyncing(true);
        try {
          await syncDailyPrayerLog(todayString, { prayers, fasting });
        } catch {
        } finally {
          setIsSyncing(false);
        }
      }, 300);
    },
    [todayString]
  );

  const completedCount = Object.values(prayerState).filter(Boolean).length;

  return (
    <LinearGradient colors={["#0A4A4A", "#073333", "#041F1F"]} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Header ── */}
      <View style={[styles.header, { marginTop: insets.top + verticalScale(8) }]}>
        <Pressable 
          onPress={() => router.back()} 
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={moderateScale(32)} color="#FFF" />
        </Pressable>

        <View style={{ flex: 1, marginLeft: scale(8) }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Daily Worship</Text>
            {isSyncing && <ActivityIndicator size="small" color="#6EE7B7" style={{ marginLeft: scale(8) }} />}
          </View>
          <Text style={styles.hijriText}>
            {moment(todayString).format("iD iMMMM iYYYY")} AH
          </Text>
        </View>

        {/* Prayer count badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{completedCount}</Text>
          <Text style={styles.countBadgeSlash}>/5</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(40) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Surah of the Day ── */}
        <Text style={styles.sectionLabel}>Surah of the Day</Text>

        {surahLoading ? (
          <View style={styles.surahSkeleton}>
            <ActivityIndicator color="#6EE7B7" />
          </View>
        ) : dailySurah ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/screens/quran_details",
                params: {
                  surahNumber: dailySurah.number.toString(),
                  surahName: dailySurah.englishName,
                },
              })
            }
            style={({ pressed }) => [styles.surahCard, pressed && { opacity: 0.88 }]}
          >
            <LinearGradient
              colors={["rgba(110,231,183,0.18)", "rgba(110,231,183,0.06)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.surahGradient}
            >
              <View style={styles.surahLeft}>
                <LinearGradient colors={["#0A4A4A", "#073333"]} style={styles.surahIconBg}>
                  <FontAwesome5 name="book-open" size={moderateScale(15)} color="#6EE7B7" />
                </LinearGradient>
                <View>
                  <Text style={styles.surahNumber}>Surah {dailySurah.number}</Text>
                  <Text style={styles.surahName}>{dailySurah.englishName}</Text>
                  <Text style={styles.surahTranslation}>{dailySurah.englishNameTranslation}</Text>
                </View>
              </View>
              <View style={styles.surahRight}>
                <Text style={styles.surahArabicName}>{dailySurah.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={moderateScale(22)} color="#6EE7B7" />
              </View>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.surahError}>
            <MaterialCommunityIcons name="wifi-off" size={moderateScale(20)} color="#6B7280" />
            <Text style={styles.surahErrorText}>Surah unavailable offline</Text>
          </View>
        )}

        {/* ── Fasting ── */}
        <Text style={[styles.sectionLabel, { marginTop: verticalScale(24) }]}>Today's Checklist</Text>

        <Pressable
          onPress={toggleFasting}
          style={({ pressed }) => [styles.fastingCard, isFasting && styles.fastingActive, pressed && { opacity: 0.9 }]}
        >
          <View style={[styles.fastingIconBg, isFasting && styles.fastingIconBgActive]}>
            <MaterialCommunityIcons
              name={isFasting ? "moon-waning-crescent" : "white-balance-sunny"}
              size={moderateScale(22)}
              color={isFasting ? "#0A4A4A" : "#6EE7B7"}
            />
          </View>
          <View style={{ flex: 1, marginLeft: scale(14) }}>
            <Text style={[styles.fastingLabel, isFasting && styles.fastingLabelActive]}>
              Sawm (Fasting)
            </Text>
            <Text style={[styles.fastingSubText, isFasting && styles.fastingSubTextActive]}>
              {isFasting ? "Alhamdulillah, recorded!" : "Tap to record today's fast"}
            </Text>
          </View>
          {isFasting && (
            <MaterialCommunityIcons name="check-circle" size={moderateScale(22)} color="#0A4A4A" />
          )}
        </Pressable>

        {/* ── Prayers ── */}
        <View style={{ marginTop: verticalScale(6) }}>
          {PRAYERS.map((prayer) => (
            <PrayerRow
              key={prayer}
              prayer={prayer}
              checked={prayerState[prayer]}
              onToggle={() => togglePrayer(prayer)}
            />
          ))}
        </View>

        {/* ── Completion banner ── */}
        {completedCount === 5 && isFasting && (
          <View style={styles.completionBanner}>
            <MaterialCommunityIcons name="star-four-points" size={moderateScale(16)} color="#FCD34D" />
            <Text style={styles.completionText}>
              All prayers & fast recorded. May Allah accept! 🤲
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── MashaAllah Modal ── */}
      <MashaAllahModal
        visible={modalType !== null}
        type={modalType}
        onClose={() => setModalType(null)}
      />
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: wp("5%"), marginBottom: verticalScale(24), flexDirection: "row", alignItems: "center" },
  backButton: { width: moderateScale(40), height: moderateScale(40), justifyContent: "center", alignItems: "flex-start" },
  headerTitleRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: fontScale(24), fontWeight: "900", color: "#FFF", letterSpacing: -0.5 },
  hijriText: { color: "#6EE7B7", fontSize: fontScale(12), fontWeight: "600", marginTop: verticalScale(2) },
  countBadge: { flexDirection: "row", alignItems: "baseline", backgroundColor: "rgba(110,231,183,0.15)", paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: moderateScale(20), borderWidth: 1, borderColor: "rgba(110,231,183,0.3)" },
  countBadgeText: { color: "#6EE7B7", fontSize: fontScale(20), fontWeight: "900" },
  countBadgeSlash: { color: "rgba(110,231,183,0.5)", fontSize: fontScale(14), fontWeight: "600" },

  // Content
  content: { paddingHorizontal: wp("5%") },
  sectionLabel: { color: "#6EE7B7", fontSize: fontScale(11), fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: verticalScale(12) },

  // Surah card
  surahCard: { borderRadius: moderateScale(18), overflow: "hidden", marginBottom: verticalScale(4), borderWidth: 1, borderColor: "rgba(110,231,183,0.25)" },
  surahGradient: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: moderateScale(18) },
  surahLeft: { flexDirection: "row", alignItems: "center", gap: scale(14), flex: 1 },
  surahIconBg: { width: moderateScale(42), height: moderateScale(42), borderRadius: moderateScale(21), justifyContent: "center", alignItems: "center" },
  surahNumber: { color: "rgba(110,231,183,0.7)", fontSize: fontScale(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  surahName: { color: "#FFF", fontSize: fontScale(16), fontWeight: "800", marginTop: verticalScale(1) },
  surahTranslation: { color: "#9CA3AF", fontSize: fontScale(12), marginTop: verticalScale(2) },
  surahRight: { flexDirection: "row", alignItems: "center", gap: scale(4) },
  surahArabicName: { color: "#6EE7B7", fontSize: fontScale(18), fontWeight: "700" },
  surahSkeleton: { height: verticalScale(80), borderRadius: moderateScale(18), backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "center", alignItems: "center", marginBottom: verticalScale(4) },
  surahError: { height: verticalScale(64), borderRadius: moderateScale(18), backgroundColor: "rgba(255,255,255,0.05)", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: scale(8), marginBottom: verticalScale(4), borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  surahErrorText: { color: "#6B7280", fontSize: fontScale(13) },

  // Fasting
  fastingCard: { backgroundColor: "rgba(255,255,255,0.06)", flexDirection: "row", padding: moderateScale(18), borderRadius: moderateScale(20), alignItems: "center", marginBottom: verticalScale(12), borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  fastingActive: { backgroundColor: "#6EE7B7", borderColor: "#6EE7B7" },
  fastingIconBg: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(22), backgroundColor: "rgba(110,231,183,0.15)", justifyContent: "center", alignItems: "center" },
  fastingIconBgActive: { backgroundColor: "rgba(10,74,74,0.25)" },
  fastingLabel: { fontSize: fontScale(15), fontWeight: "700", color: "#FFF" },
  fastingLabelActive: { color: "#0A4A4A" },
  fastingSubText: { fontSize: fontScale(12), color: "#9CA3AF", marginTop: verticalScale(2) },
  fastingSubTextActive: { color: "rgba(10,74,74,0.7)" },

  // Prayer rows
  prayerRow: { backgroundColor: "rgba(255,255,255,0.07)", flexDirection: "row", justifyContent: "space-between", paddingVertical: verticalScale(16), paddingHorizontal: scale(18), borderRadius: moderateScale(16), alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  prayerRowActive: { backgroundColor: "#059669", borderColor: "#059669" },
  prayerLeft: { flexDirection: "row", alignItems: "center" },
  prayerRight: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: moderateScale(24), height: moderateScale(24), borderRadius: moderateScale(7), borderWidth: 2, borderColor: "rgba(110,231,183,0.6)", justifyContent: "center", alignItems: "center" },
  checkboxChecked: { backgroundColor: "rgba(255,255,255,0.25)", borderColor: "transparent" },
  prayerName: { color: "#D1FAE5", fontSize: fontScale(15), fontWeight: "700" },
  prayerTime: { color: "rgba(255,255,255,0.35)", fontSize: fontScale(11), marginTop: verticalScale(2) },
  prayerTimeActive: { color: "rgba(255,255,255,0.6)" },
  prayerArabic: { color: "rgba(255,255,255,0.3)", fontSize: fontScale(17), fontWeight: "700" },
  prayerArabicActive: { color: "rgba(255,255,255,0.75)" },
  textWhite: { color: "#FFF" },

  // Completion banner
  completionBanner: { flexDirection: "row", alignItems: "center", gap: scale(10), backgroundColor: "rgba(252,211,77,0.1)", borderRadius: moderateScale(14), padding: moderateScale(14), marginTop: verticalScale(16), borderWidth: 1, borderColor: "rgba(252,211,77,0.25)" },
  completionText: { color: "#FCD34D", fontSize: fontScale(13), fontWeight: "600", flex: 1 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFF", padding: moderateScale(32), borderRadius: moderateScale(28), alignItems: "center", width: wp("82%"), shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 40, elevation: 20 },
  modalIconBg: { width: moderateScale(96), height: moderateScale(96), borderRadius: moderateScale(48), justifyContent: "center", alignItems: "center", marginBottom: verticalScale(20) },
  modalTitle: { fontSize: fontScale(24), fontWeight: "900", color: "#0A4A4A", letterSpacing: -0.5 },
  modalSub: { fontSize: fontScale(14), color: "#6B7280", textAlign: "center", marginTop: verticalScale(10), marginBottom: verticalScale(28), lineHeight: verticalScale(22) },
  closeBtn: { backgroundColor: "#0A4A4A", paddingVertical: verticalScale(15), paddingHorizontal: scale(48), borderRadius: moderateScale(16) },
  closeBtnText: { color: "#FFF", fontWeight: "800", fontSize: fontScale(15), letterSpacing: 0.2 },
});