import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// If you have a custom responsive utility, you can still use it, 
// but I've relied on Dimensions and flexbox here for bulletproof responsiveness.
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

/* ---------------- COLORS (Premium Palette) ---------------- */
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
  transparentTeal: "rgba(21, 107, 107, 0.6)", // For glass effect
};

/* ---------------- TYPES ---------------- */
type Dhikr = {
  id: string;
  title: string;
  arabic: string;
  meaning: string;
  defaultTarget: number;
  isCustom?: boolean;
};

/* ---------------- DHIKR DATA ---------------- */
const DHIKR_LIST: Dhikr[] = [
  { id: "1", title: "Subhan Allah", arabic: "سُبْحَانَ ٱللَّٰهِ", meaning: "Glory be to Allah", defaultTarget: 33 },
  { id: "2", title: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰهِ", meaning: "Praise be to Allah", defaultTarget: 33 },
  { id: "3", title: "Allahu Akbar", arabic: "ٱللَّٰهُ أَكْبَر", meaning: "Allah is The Greatest", defaultTarget: 34 },
  { id: "4", title: "Astaghfirullah", arabic: "أَسْتَغْفِرُ ٱللَّٰهَ", meaning: "I seek Allah's forgiveness", defaultTarget: 100 },
  { id: "5", title: "La ilaha illa Allah", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", meaning: "There is no god except Allah", defaultTarget: 100 },
  {
    id: "6",
    title: "Subhan Allahi wa bi Hamdihi",
    arabic: "سُبْحَانَ اللَّهِ وَ بِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ",
    meaning: "Allah is free from imperfections and all praise is due to Him",
    defaultTarget: 100,
  },
  {
    id: "custom",
    title: "Custom Dhikr",
    arabic: "",
    meaning: "Add your own dhikr",
    defaultTarget: 33,
    isCustom: true,
  },
];

/* ---------------- SCREEN ---------------- */
export default function TasbeehDhikrScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Dhikr | null>(null);
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [customTargetInput, setCustomTargetInput] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [showDhikrList, setShowDhikrList] = useState<boolean>(true);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  /* 🌟 Animations */
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 25],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const increment = async () => {
    if (count < target) {
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
    }
  };

  const reset = () => {
    setCount(0);
    setShowSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectDhikr = (item: Dhikr) => {
    setSelected(item);
    setTarget(item.defaultTarget);
    setCount(0);
    setShowDhikrList(false);
    setShowSuccess(false);
    if (!item.isCustom) setCustomText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const applyCustomTarget = () => {
    const num = Number(customTargetInput);
    if (!isNaN(num) && num > 0 && num <= 10000) {
      setTarget(num);
      setCount(0);
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleQuickTargetPress = (targetNumber: number) => {
    setTarget(targetNumber);
    setCount(0);
    setCustomTargetInput(""); 
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const progress = Math.min((count / target) * 100, 100);

  // ---------------- DHIKR SELECTION SCREEN ----------------
  if (showDhikrList) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal} />
        
        <View style={styles.listHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.beige} />
          </TouchableOpacity>
          <Text style={styles.listHeaderText}>Select Dhikr</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentList}
          showsVerticalScrollIndicator={false}
        >
          {DHIKR_LIST.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.dhikrListItem, index === DHIKR_LIST.length - 1 && { marginBottom: 0 }]}
              onPress={() => selectDhikr(item)}
              activeOpacity={0.8}
            >
              <View style={styles.playIconCircle}>
                <Ionicons name="play" size={18} color={COLORS.lightTeal} style={{ marginLeft: 2 }} />
              </View>
              
              <View style={styles.dhikrListContent}>
                <Text style={styles.dhikrListArabic}>{item.arabic || "✍️"}</Text>
                <Text style={styles.dhikrListTitle}>{item.title}</Text>
                <Text style={styles.dhikrListMeaning} numberOfLines={2}>{item.meaning}</Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.lightTeal} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------- COUNTER SCREEN ----------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal} />

      {/* Background Decor */}
      <Animated.View style={[styles.bgCircle, styles.bgCircle1, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.bgCircle, styles.bgCircle2, { transform: [{ rotate }] }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDhikrList(true)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color={COLORS.beige} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Tasbih</Text>
          <TouchableOpacity onPress={reset} style={styles.iconBtnFilled}>
            <Ionicons name="refresh" size={22} color={COLORS.lightTeal} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.counterContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* COUNT DISPLAY */}
          <View style={styles.countDisplay}>
            <Animated.Text 
              style={[styles.count, { transform: [{ scale: pulseAnim }] }]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {String(count).padStart(3, '0')}
            </Animated.Text>
            <View style={styles.targetBadge}>
              <MaterialCommunityIcons name="bullseye-arrow" size={18} color={COLORS.darkTeal} />
              <Text style={styles.targetBadgeText}>Goal: {target}</Text>
            </View>
          </View>

          {/* BEADS STRING */}
          <View style={styles.beadsContainer}>
            <View style={styles.beadLine} />
            <View style={styles.beadRow}>
              {[...Array(11)].map((_, i) => {
                const isActive = i < Math.floor((count / target) * 11);
                return (
                  <View 
                    key={i} 
                    style={[styles.bead, isActive && styles.beadActive]} 
                  />
                );
              })}
            </View>
          </View>

          {/* CURRENT DHIKR CARD */}
          <View style={styles.currentDhikrCard}>
            <View style={styles.currentHeader}>
              <MaterialCommunityIcons name="book-open-variant" size={18} color={COLORS.lightTeal} />
              <Text style={styles.currentLabel}>Current Dhikr</Text>
            </View>
            
            {selected?.isCustom ? (
              <View style={styles.customDhikrWrapper}>
                <TextInput
                  style={styles.customInputText}
                  placeholder="Type your personal dhikr..."
                  placeholderTextColor={COLORS.beigeDark + '80'}
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

          {/* TASBEEH BUTTON */}
          <View style={styles.buttonContainer}>
            <Animated.View style={[styles.glowWrapper, { shadowRadius: glow }]}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={[styles.tasbeehBtn, count >= target && styles.tasbeehBtnDisabled]}
                  activeOpacity={0.9}
                  onPress={increment}
                  disabled={count >= target}
                >
                  <View style={styles.tasbeehBtnInner}>
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={screenWidth * 0.15}
                      color={count >= target ? COLORS.beigeDark : COLORS.darkTeal}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>

          {/* PROGRESS BAR */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {count} / {target} • {Math.round(progress)}%
            </Text>
          </View>

          {/* SET GOAL SECTION */}
          <View style={styles.goalSection}>
            <Text style={styles.goalTitle}>Set Target</Text>
            
            <View style={styles.targetButtonsRow}>
              {[33, 99, 100].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.targetBtn, target === n && !customTargetInput && styles.targetBtnActive]}
                  onPress={() => handleQuickTargetPress(n)}
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
                placeholder="Custom Goal..."
                placeholderTextColor={COLORS.beigeDark + '60'}
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
                  size={28} 
                  color={target === Number(customTargetInput) ? COLORS.lightTeal : COLORS.beigeDark + '40'} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SUCCESS OVERLAY */}
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
            <MaterialCommunityIcons name="check-decagram" size={90} color={COLORS.gold} style={{ marginBottom: 20 }} />
            <Text style={styles.successTitle}>مَا شَاءَ ٱللَّٰهُ</Text>
            <Text style={styles.successMessage}>Target Completed!</Text>
            <View style={styles.successStats}>
              <Text style={styles.successStatsText}>Alhamdulillah, {target} completed ✨</Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkTeal,
  },
  scrollView: {
    flex: 1,
  },
  
  // Background Circles (Ambient Glow)
  bgCircle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: COLORS.lightTeal,
    opacity: 0.08,
  },
  bgCircle1: {
    width: screenWidth * 1.2,
    height: screenWidth * 1.2,
    top: -screenWidth * 0.4,
    right: -screenWidth * 0.4,
  },
  bgCircle2: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    bottom: -screenWidth * 0.2,
    left: -screenWidth * 0.3,
  },

  // ---------------- HEADER ----------------
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  iconBtnFilled: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: COLORS.transparentTeal,
  },
  listHeaderText: {
    color: COLORS.beige,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerText: {
    color: COLORS.beige,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // ---------------- LIST SCREEN ----------------
  scrollContentList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  dhikrListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.transparentTeal,
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '20',
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.darkTeal,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '50',
  },
  dhikrListContent: {
    flex: 1,
    marginHorizontal: 15,
  },
  dhikrListArabic: {
    color: COLORS.beige,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "right",
  },
  dhikrListTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  dhikrListMeaning: {
    color: COLORS.beigeDark,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },

  // ---------------- COUNTER SCREEN ----------------
  counterContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  countDisplay: {
    alignItems: "center",
    marginVertical: 15,
  },
  count: {
    fontSize: screenWidth * 0.3,
    color: COLORS.beige,
    fontWeight: "300",
    letterSpacing: 2,
    height: screenWidth * 0.35, 
    textAlign: 'center',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.beige,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: -10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  targetBadgeText: {
    color: COLORS.darkTeal,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Beads
  beadsContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    height: 30,
  },
  beadLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: COLORS.lightTeal + '30',
    top: '50%',
    zIndex: 0,
  },
  beadRow: {
    flexDirection: "row",
    justifyContent: 'space-between',
    width: '80%',
    zIndex: 1,
  },
  bead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.tealMedium,
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '50',
  },
  beadActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
    transform: [{ scale: 1.3 }],
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },

  // Current Dhikr Card
  currentDhikrCard: {
    backgroundColor: COLORS.transparentTeal,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '20',
    marginBottom: 30,
  },
  currentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    backgroundColor: COLORS.darkTeal + '50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentLabel: {
    color: COLORS.lightTeal,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  currentArabic: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 40,
  },
  currentTitle: {
    color: COLORS.beige,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  currentMeaning: {
    color: COLORS.beigeDark,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  customDhikrWrapper: {
    width: '100%',
    minHeight: 80,
  },
  customInputText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightTeal + '40',
    paddingBottom: 10,
  },

  // Main Button
  buttonContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  glowWrapper: {
    shadowColor: COLORS.beige,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    elevation: 10,
  },
  tasbeehBtn: {
    width: screenWidth * 0.45,
    height: screenWidth * 0.45,
    borderRadius: screenWidth * 0.225,
    backgroundColor: COLORS.tealMedium,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: COLORS.darkTeal,
  },
  tasbeehBtnInner: {
    width: '90%',
    height: '90%',
    borderRadius: 100,
    backgroundColor: COLORS.beige,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tasbeehBtnDisabled: {
    opacity: 0.6,
  },

  // Progress
  progressSection: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.tealMedium,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  progressText: {
    color: COLORS.beigeDark,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 1,
  },

  // Goal Section
  goalSection: {
    backgroundColor: COLORS.transparentTeal,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '20',
  },
  goalTitle: {
    color: COLORS.beige,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  targetButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  targetBtn: {
    flex: 1,
    backgroundColor: COLORS.darkTeal + '80',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '30',
    alignItems: "center",
  },
  targetBtnActive: {
    backgroundColor: COLORS.beige,
    borderColor: COLORS.beige,
  },
  targetBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  targetBtnTextActive: {
    color: COLORS.darkTeal,
  },
  customTargetInputWrapper: {
    position: "relative",
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    backgroundColor: COLORS.darkTeal + '80',
    color: COLORS.white,
    padding: 16,
    paddingRight: 60,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '30',
  },
  targetInputActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.darkTeal,
  },
  targetInputButton: {
    position: "absolute",
    right: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 74, 74, 0.95)", // Deep teal blur
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  successTitle: {
    color: COLORS.beige,
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    color: COLORS.lightTeal,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  successStats: {
    backgroundColor: COLORS.transparentTeal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold + '50',
  },
  successStatsText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "600",
  },
});