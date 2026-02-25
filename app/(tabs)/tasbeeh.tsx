import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import responsive from "../../utils/responsive";

const { vs, hs, moderateScale, screenWidth, screenHeight } = responsive;

/* ---------------- COLORS (Your Palette!) ---------------- */
const COLORS = {
  // Primary Colors
  darkTeal: "#0A4A4A",      // Main background
  beige: "#f5f5dc",         // Text and highlights
  lightTeal: "#a8c5c5",     // Accents
  
  // Supporting Colors
  tealMedium: "#156B6B",    // Cards/surfaces
  tealLight: "#0D5555",     // Input backgrounds
  beigeDark: "#d4c9b0",     // Secondary text
  beigeLight: "#fafaf0",    // Very light accents
  
  // Accent
  gold: "#D4AF37",
  
  // White for icons
  white: "#FFFFFF",
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
  const [customTargetInput, setCustomTargetInput] = useState<string>(""); // NEW: Separate state for input
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
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    // Rotate animation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 30],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const increment = async () => {
    if (count < target) {
      const newCount = count + 1;
      setCount(newCount);
      
      // Button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      // Pulse animation on count
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (newCount === target) {
        setShowSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Success animation
        Animated.parallel([
          Animated.timing(successAnim, { 
            toValue: 1, 
            duration: 400, 
            useNativeDriver: true 
          }),
          Animated.timing(slideAnim, { 
            toValue: 1, 
            duration: 500, 
            useNativeDriver: true 
          }),
        ]).start();

        // Auto hide after 3 seconds
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(successAnim, { 
              toValue: 0, 
              duration: 300, 
              useNativeDriver: true 
            }),
            Animated.timing(slideAnim, { 
              toValue: 0, 
              duration: 300, 
              useNativeDriver: true 
            }),
          ]).start(() => {
            setShowSuccess(false);
          });
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

  // FIXED: Better custom target handling
  const handleCustomTargetChange = (value: string) => {
    setCustomTargetInput(value); // Just update the input text
  };

  const applyCustomTarget = () => {
    const num = Number(customTargetInput);
    if (!isNaN(num) && num > 0 && num <= 10000) {
      setTarget(num);
      setCount(0);
      // setCustomTargetInput("");  <-- REMOVE THIS LINE
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCustomTextSubmit = () => {
    if (customText.trim() !== "") {
      Keyboard.dismiss();
    }
  };

  const handleQuickTargetPress = (targetNumber: number) => {
    setTarget(targetNumber);
    setCount(0);
    setCustomTargetInput(""); // Keep this! This ensures the custom box clears when you pick a preset
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const progress = Math.min((count / target) * 100, 100);

  // Show dhikr list screen
  if (showDhikrList) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal} />

        {/* HEADER */}
        <View style={styles.listHeader}>
          <TouchableOpacity 
            onPress={() => router.push("/(tabs)")} 
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.beige} />
          </TouchableOpacity>
          <Text style={styles.listHeaderText}>Dhikr</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>

        </View>

        {/* DHIKR LIST */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {DHIKR_LIST.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.dhikrListItem, index === DHIKR_LIST.length - 1 && styles.dhikrListItemLast]}
              onPress={() => selectDhikr(item)}
              activeOpacity={0.7}
            >
              <View style={styles.dhikrListLeft}>
                <View style={styles.playIconCircle}>
                  <Ionicons name="play" size={20} color={COLORS.lightTeal} />
                </View>
              </View>
              
              <View style={styles.dhikrListContent}>
                <Text style={styles.dhikrListArabic}>{item.arabic || "✍️"}</Text>
                <Text style={styles.dhikrListTitle}>{item.title}</Text>
                <Text style={styles.dhikrListMeaning}>{item.meaning}</Text>
              </View>

              <View style={styles.dhikrListRight}>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.lightTeal} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Show counter screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal} />

      {/* Animated Background Circles */}
      <Animated.View style={[styles.bgCircle, styles.bgCircle1, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.bgCircle, styles.bgCircle2, { transform: [{ rotate }] }]} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowDhikrList(true)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.beige} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Tasbih</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reset} style={styles.iconBtn}>
            <Ionicons name="refresh" size={24} color={COLORS.lightTeal} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.counterContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* COUNT DISPLAY */}
        <View style={styles.countDisplay}>
          <Animated.Text style={[styles.count, { transform: [{ scale: pulseAnim }] }]}>
            {String(count).padStart(3, '0')}
          </Animated.Text>
          <View style={styles.targetBadge}>
            <MaterialCommunityIcons name="flag-checkered" size={16} color={COLORS.darkTeal} />
            <Text style={styles.targetBadgeText}>Goal: {target}</Text>
          </View>
        </View>

        {/* ANIMATED BEADS */}
        <View style={styles.beadsContainer}>
          <View style={styles.beadRow}>
            {[...Array(11)].map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.bead, 
                  i < Math.floor((count / target) * 11) && styles.beadActive
                ]} 
              />
            ))}
          </View>
        </View>

        {/* CURRENT DHIKR SECTION */}
        <View style={styles.currentSection}>
          <View style={styles.currentHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={20} color={COLORS.beige} />
            <Text style={styles.currentLabel}>Current Dhikr</Text>
          </View>

          <View style={styles.currentDhikrCard}>
            {selected?.isCustom ? (
              <>
                <Text style={styles.currentArabic}>
                  {customText.trim() !== "" ? customText : "✍️"}
                </Text>
                <Text style={styles.currentTitle}>
                  {customText.trim() !== "" ? "Custom Dhikr" : "Add your dhikr"}
                </Text>
                <Text style={styles.currentMeaning}>Your personal remembrance</Text>
              </>
            ) : (
              <>
                <Text style={styles.currentArabic}>{selected?.arabic}</Text>
                <Text style={styles.currentTitle}>{selected?.title}</Text>
                <Text style={styles.currentMeaning}>{selected?.meaning}</Text>
              </>
            )}
          </View>
        </View>

        {/* CUSTOM INPUT */}
        {selected?.isCustom && (
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.customInput}
              placeholder="Enter your dhikr..."
              placeholderTextColor={COLORS.beigeDark + '60'}
              value={customText}
              onChangeText={setCustomText}
              onSubmitEditing={handleCustomTextSubmit}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>
        )}

        {/* TASBEEH BUTTON */}
        <View style={styles.buttonContainer}>
          <Animated.View
            style={[
              styles.glowWrapper,
              {
                shadowRadius: glow,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.tasbeehBtn,
                  count >= target && styles.tasbeehBtnDisabled
                ]}
                activeOpacity={0.9}
                onPress={increment}
                disabled={count >= target}
              >
                <MaterialCommunityIcons
                  name="hand-pointing-up"
                  size={screenWidth * 0.12}
                  color={count >= target ? COLORS.beigeDark : COLORS.darkTeal}
                />
                <Text style={[styles.tapText, count >= target && styles.tapTextDisabled]}>TAP</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>

        {/* PROGRESS */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {count} / {target} • {Math.round(progress)}%
          </Text>
        </View>

        {/* SET GOAL SECTION */}
        <View style={styles.goalSection}>
          <View style={styles.goalHeader}>
            <Ionicons name="flag-outline" size={22} color={COLORS.beige} />
            <Text style={styles.goalTitle}>Set Your Goal</Text>
          </View>

          {/* Quick Target Buttons */}
          <View style={styles.quickTargetsContainer}>
            <Text style={styles.quickTargetsLabel}>Quick Select</Text>
            <View style={styles.targetButtonsRow}>
              {[33, 99, 100, 500].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.targetBtn, target === n && !customTargetInput && styles.targetBtnActive]}
                  onPress={() => handleQuickTargetPress(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.targetBtnText, target === n && !customTargetInput && styles.targetBtnTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          

<View style={styles.customTargetContainer}>
            <Text style={styles.customTargetLabel}>Custom Goal</Text>
            <View style={styles.customTargetInputWrapper}>
              <TextInput
                style={[
                  styles.targetInput, 
                  // If current target matches input, show active border
                  (target === Number(customTargetInput)) && styles.targetInputActive
                ]}
                keyboardType="numeric"
                placeholder="Enter number (max 10,000)"
                placeholderTextColor={COLORS.beigeDark + '60'}
                value={customTargetInput}
                onChangeText={handleCustomTargetChange}
                returnKeyType="done"
                maxLength={5}
                onSubmitEditing={applyCustomTarget} // <--- Allows keyboard "Done" to work
              />
              <TouchableOpacity 
                style={styles.targetInputButton}
                onPress={applyCustomTarget}
                disabled={!customTargetInput || Number(customTargetInput) <= 0}
              >
                <MaterialCommunityIcons 
                  name={target === Number(customTargetInput) ? "check-circle" : "check-circle-outline"}
                  size={28} 
                  color={
                    target === Number(customTargetInput) 
                    ? COLORS.lightTeal // Active Color
                    : COLORS.beigeDark + '40' // Inactive Color
                  } 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.successContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                  {
                    scale: successAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.beige} />
            </View>
            <Text style={styles.successTitle}>مَا شَاءَ ٱللَّٰهُ</Text>
            <Text style={styles.successSubtitle}>Masha Allah</Text>
            <Text style={styles.successMessage}>Target Completed!</Text>
            <View style={styles.successStats}>
              <Text style={styles.successStatsText}>
                You completed {target} dhikr ✨
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkTeal,
  },

  // Background Circles
  bgCircle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: COLORS.lightTeal + '10',
  },
  bgCircle1: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    top: -screenWidth * 0.3,
    right: -screenWidth * 0.3,
    opacity: 0.15,
  },
  bgCircle2: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    bottom: -screenWidth * 0.2,
    left: -screenWidth * 0.2,
    opacity: 0.1,
  },

  // List Screen Styles
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: screenHeight * 0.06,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tealMedium,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  listHeaderText: {
    color: COLORS.beige,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  tabActive: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: COLORS.lightTeal,
  },
  tabTextActive: {
    color: COLORS.beige,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  dhikrListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.tealMedium,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightTeal + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dhikrListItemLast: {
    marginBottom: 0,
  },
  dhikrListLeft: {
    width: 50,
    alignItems: "center",
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightTeal + '20',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '40',
  },
  dhikrListContent: {
    flex: 1,
    marginHorizontal: 15,
  },
  dhikrListArabic: {
    color: COLORS.beige,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "right",
    letterSpacing: 0.5,
  },
  dhikrListTitle: {
    color: COLORS.beige,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "right",
    letterSpacing: 0.3,
  },
  dhikrListMeaning: {
    color: COLORS.beigeDark,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "right",
    letterSpacing: 0.3,
  },
  dhikrListRight: {
    width: 40,
    alignItems: "center",
  },

  // Counter Screen Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: screenHeight * 0.06,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tealMedium,
  },
  headerText: {
    color: COLORS.beige,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: COLORS.tealMedium,
  },

  counterContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  countDisplay: {
    alignItems: "center",
    marginVertical: screenHeight * 0.04,
  },
  count: {
    fontSize: screenWidth * 0.26,
    color: COLORS.beige,
    fontWeight: "200",
    letterSpacing: screenWidth * 0.03,
    textShadowColor: COLORS.lightTeal,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.beige,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 20,
    shadowColor: COLORS.beige,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  targetBadgeText: {
    color: COLORS.darkTeal,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  beadsContainer: {
    alignItems: "center",
    marginBottom: screenHeight * 0.03,
  },
  beadRow: {
    flexDirection: "row",
    gap: 10,
  },
  bead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.tealMedium,
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '40',
  },
  beadActive: {
    backgroundColor: COLORS.lightTeal,
    borderColor: COLORS.lightTeal,
    shadowColor: COLORS.lightTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },

  currentSection: {
    marginBottom: 25,
  },
  currentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  currentLabel: {
    color: COLORS.beige,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  currentDhikrCard: {
    backgroundColor: COLORS.tealMedium,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  currentArabic: {
    color: COLORS.beige,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 1,
  },
  currentTitle: {
    color: COLORS.lightTeal,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  currentMeaning: {
    color: COLORS.beigeDark,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 0.3,
  },

  inputWrapper: {
    marginBottom: 25,
  },
  customInput: {
    backgroundColor: COLORS.tealLight,
    color: COLORS.beige,
    padding: 18,
    borderRadius: 16,
    fontSize: 17,
    textAlign: "center",
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '40',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  buttonContainer: {
    alignItems: "center",
    marginVertical: screenHeight * 0.03,
  },
  glowWrapper: {
    shadowColor: COLORS.beige,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    elevation: 20,
  },
  tasbeehBtn: {
    width: screenWidth * 0.45,
    height: screenWidth * 0.45,
    borderRadius: screenWidth * 0.225,
    backgroundColor: COLORS.beige,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.beige,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: COLORS.beigeLight,
  },
  tasbeehBtnDisabled: {
    backgroundColor: COLORS.tealMedium,
    borderColor: COLORS.lightTeal + '40',
    opacity: 0.7,
  },
  tapText: {
    color: COLORS.darkTeal,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: 4,
  },
  tapTextDisabled: {
    color: COLORS.beigeDark,
  },

  progressSection: {
    marginBottom: 25,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.tealMedium,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '30',
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.lightTeal,
    borderRadius: 10,
    shadowColor: COLORS.lightTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  progressText: {
    color: COLORS.beigeDark,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Goal Section
  goalSection: {
    marginBottom: 20,
    backgroundColor: COLORS.tealMedium,
    borderRadius: 20,
    padding: 22,
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '30',
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  goalTitle: {
    color: COLORS.beige,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  quickTargetsContainer: {
    marginBottom: 20,
  },
  quickTargetsLabel: {
    color: COLORS.lightTeal,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  targetButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  targetBtn: {
    flex: 1,
    backgroundColor: COLORS.tealLight,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '40',
    alignItems: "center",
    justifyContent: "center",
  },
  targetBtnActive: {
    backgroundColor: COLORS.beige,
    borderColor: COLORS.beige,
    shadowColor: COLORS.beige,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  targetBtnText: {
    color: COLORS.beigeDark,
    fontWeight: "800",
    fontSize: 19,
    letterSpacing: 0.5,
  },
  targetBtnTextActive: {
    color: COLORS.darkTeal,
  },
  customTargetContainer: {
    marginTop: 5,
  },
  customTargetLabel: {
    color: COLORS.lightTeal,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  customTargetInputWrapper: {
    position: "relative",
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    backgroundColor: COLORS.tealLight,
    color: COLORS.beige,
    padding: 18,
    paddingRight: 60,
    borderRadius: 16,
    fontSize: 17,
    fontWeight: "700",
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '40',
    letterSpacing: 0.5,
  },
  targetInputButton: {
    position: "absolute",
    right: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Success Overlay
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 74, 74, 0.97)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  successIconCircle: {
    marginBottom: 25,
  },
  successTitle: {
    color: COLORS.beige,
    fontSize: 38,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 1,
  },
  successSubtitle: {
    color: COLORS.lightTeal,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  successMessage: {
    color: COLORS.beige,
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  successStats: {
    backgroundColor: COLORS.tealMedium,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.lightTeal + '40',
  },
  successStatsText: {
    color: COLORS.beige,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'flex-start' 
  },
  targetInputActive: {
    borderColor: COLORS.lightTeal,
    backgroundColor: COLORS.darkTeal, // Optional: slightly darker background to show focus
    color: COLORS.white,
  },
});