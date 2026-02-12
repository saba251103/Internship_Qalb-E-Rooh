import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ---------------- COLORS ---------------- */
const COLORS = {
  mid: "#4FA3A3",
  dark: "#9FF0D0",
  white: "#FFFFFF",
  soft: "rgba(79,163,163,0.15)",
  darker: "#063333",
  black: "#0A4A4A",
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
    meaning: "Allah is free from imperfections and all praise is due to Him, Allah is The Greatest",
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
  const router=useRouter();
  const [selected, setSelected] = useState<Dhikr | null>(null);
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
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

  const handleTargetChange = (value: string) => {
    const num = Number(value);
    if (!isNaN(num) && num > 0) {
      setTarget(num);
      setCount(0); // Reset count when target changes
      Keyboard.dismiss();
    } else if (value === '') {
      // Allow empty field while typing
      return;
    }
  };

  const handleCustomTextSubmit = () => {
    if (customText.trim() !== "") {
      Keyboard.dismiss();
    }
  };

  const handleQuickTargetPress = (targetNumber: number) => {
    setTarget(targetNumber);
    setCount(0); // Reset count when selecting quick target
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const progress = Math.min((count / target) * 100, 100);

  // Show dhikr list screen
  if (showDhikrList) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

        {/* HEADER */}
        <View style={styles.listHeader}>
          <TouchableOpacity 
            onPress={() => router.push("./features")} 
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.listHeaderText}>Dhikr</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          <View style={styles.tabActive}>
            <Text style={styles.tabTextActive}>All Dhikrs</Text>
          </View>

        </View>

        {/* DHIKR LIST */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {DHIKR_LIST.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.dhikrListItem}
              onPress={() => selectDhikr(item)}
              activeOpacity={0.7}
            >
              <View style={styles.dhikrListLeft}>
                <View style={styles.playIconCircle}>
                  <Ionicons name="play" size={20} color={COLORS.mid} />
                </View>
              </View>
              
              <View style={styles.dhikrListContent}>
                <Text style={styles.dhikrListArabic}>{item.arabic || "✍️"}</Text>
                <Text style={styles.dhikrListTitle}>{item.title}</Text>
                <Text style={styles.dhikrListMeaning}>{item.meaning}</Text>
              </View>

              <View style={styles.dhikrListRight}>
                <Ionicons name="information-circle-outline" size={24} color={COLORS.mid} />
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Animated Background Circles */}
      <Animated.View style={[styles.bgCircle, styles.bgCircle1, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.bgCircle, styles.bgCircle2, { transform: [{ rotate }] }]} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowDhikrList(true)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.mid} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Tasbih</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reset} style={styles.iconBtn}>
            <Ionicons name="refresh" size={24} color={COLORS.mid} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="volume-high" size={24} color={COLORS.mid} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.counterContent}
        showsVerticalScrollIndicator={false}
      >
        {/* COUNT DISPLAY */}
        <View style={styles.countDisplay}>
          <Animated.Text style={[styles.count, { transform: [{ scale: pulseAnim }] }]}>
            {String(count).padStart(2, '0')}
          </Animated.Text>
          <View style={styles.targetBadge}>
            <Text style={styles.targetBadgeText}>Goal: {target}</Text>
          </View>
        </View>

        {/* ANIMATED BEADS */}
        <View style={styles.beadsContainer}>
          <View style={styles.beadRow}>
            {[...Array(9)].map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.bead, 
                  i < Math.floor((count / target) * 9) && styles.beadActive
                ]} 
              />
            ))}
          </View>
        </View>

        {/* CURRENT DHIKR SECTION */}
        <View style={styles.currentSection}>
          <View style={styles.currentHeader}>
            <Text style={styles.currentLabel}>Current Dhikr</Text>
            <TouchableOpacity onPress={() => setShowDhikrList(true)}>
              <Text style={styles.viewAllBtn}>View All</Text>
            </TouchableOpacity>
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
              placeholderTextColor="#666"
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
                  size={SCREEN_WIDTH * 0.12}
                  color={count >= target ? COLORS.mid : COLORS.white}
                />
                <Text style={styles.tapText}>TAP</Text>
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
                  backgroundColor: progress === 100 ? COLORS.mid : COLORS.mid,
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
            <Ionicons name="flag-outline" size={20} color={COLORS.mid} />
            <Text style={styles.goalTitle}>Set Your Goal</Text>
          </View>

          {/* Quick Target Buttons */}
          <View style={styles.quickTargetsContainer}>
            <Text style={styles.quickTargetsLabel}>Quick Select</Text>
            <View style={styles.targetButtonsRow}>
              {[33, 99, 100, 500].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.targetBtn, target === n && styles.targetBtnActive]}
                  onPress={() => handleQuickTargetPress(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.targetBtnText, target === n && styles.targetBtnTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Custom Target Input */}
          <View style={styles.customTargetContainer}>
            <Text style={styles.customTargetLabel}>Or Enter Custom Goal</Text>
            <View style={styles.customTargetInputWrapper}>
              <TextInput
                style={styles.targetInput}
                keyboardType="numeric"
                placeholder="Type number and press done..."
                placeholderTextColor="#666"
                onChangeText={handleTargetChange}
                onSubmitEditing={() => Keyboard.dismiss()}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <View style={styles.targetInputIcon}>
                <Ionicons name="create-outline" size={20} color={COLORS.mid} />
              </View>
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
              <Ionicons name="checkmark-circle" size={80} color={COLORS.mid} />
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
    backgroundColor: COLORS.black,
  },

  // Background Circles
  bgCircle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: COLORS.soft,
  },
  bgCircle1: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
    opacity: 0.08,
  },
  bgCircle2: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    bottom: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.2,
    opacity: 0.06,
  },

  // List Screen Styles
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: SCREEN_HEIGHT * 0.06,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  listHeaderText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "600",
  },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.mid,
  },
  tabText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  tabTextActive: {
    color: COLORS.mid,
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: COLORS.black,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  dhikrListLeft: {
    width: 50,
    alignItems: "center",
  },
  playIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  dhikrListContent: {
    flex: 1,
    marginHorizontal: 15,
  },
  dhikrListArabic: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "right",
  },
  dhikrListTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
    textAlign: "right",
  },
  dhikrListMeaning: {
    color: "#999",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "right",
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
    paddingTop: SCREEN_HEIGHT * 0.06,
    paddingBottom: 10,
  },
  headerText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "600",
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
  },

  counterContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  countDisplay: {
    alignItems: "center",
    marginVertical: SCREEN_HEIGHT * 0.03,
  },
  count: {
    fontSize: SCREEN_WIDTH * 0.22,
    color: COLORS.mid,
    fontWeight: "300",
    letterSpacing: SCREEN_WIDTH * 0.02,
    textShadowColor: COLORS.mid,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  targetBadge: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.mid,
  },
  targetBadgeText: {
    color: COLORS.mid,
    fontSize: 14,
    fontWeight: "600",
  },

  beadsContainer: {
    alignItems: "center",
    marginBottom: SCREEN_HEIGHT * 0.025,
  },
  beadRow: {
    flexDirection: "row",
    gap: 8,
  },
  bead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.mid,
  },
  beadActive: {
    backgroundColor: COLORS.mid,
    shadowColor: COLORS.mid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },

  currentSection: {
    marginBottom: 20,
  },
  currentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  currentLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  viewAllBtn: {
    color: COLORS.mid,
    fontSize: 14,
    fontWeight: "500",
  },

  currentDhikrCard: {
    backgroundColor: COLORS.soft,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.dark,
  },
  currentArabic: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  currentTitle: {
    color: COLORS.mid,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  currentMeaning: {
    color: "#ccc",
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },

  inputWrapper: {
    marginBottom: 20,
  },
  customInput: {
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    textAlign: "center",
    borderWidth: 1,
    borderColor: COLORS.mid,
  },

  buttonContainer: {
    alignItems: "center",
    marginVertical: SCREEN_HEIGHT * 0.025,
  },
  glowWrapper: {
    shadowColor: COLORS.mid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 20,
  },
  tasbeehBtn: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    borderRadius: SCREEN_WIDTH * 0.2,
    backgroundColor: COLORS.mid,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.mid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 15,
  },
  tasbeehBtnDisabled: {
    backgroundColor: COLORS.darker,
    opacity: 0.6,
  },
  tapText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 5,
    letterSpacing: 3,
  },

  progressSection: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.dark,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.mid,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
    shadowColor: COLORS.mid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  progressText: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },

  // Goal Section
  goalSection: {
    marginBottom: 20,
    backgroundColor: COLORS.soft,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.dark,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  goalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  quickTargetsContainer: {
    marginBottom: 20,
  },
  quickTargetsLabel: {
    color: COLORS.mid,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  targetButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  targetBtn: {
    flex: 1,
    backgroundColor: COLORS.dark,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.mid,
    alignItems: "center",
    justifyContent: "center",
  },
  targetBtnActive: {
    backgroundColor: COLORS.mid,
    borderColor: COLORS.mid,
    shadowColor: COLORS.mid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  targetBtnText: {
    color: COLORS.mid,
    fontWeight: "800",
    fontSize: 18,
  },
  targetBtnTextActive: {
    color: COLORS.white,
  },
  customTargetContainer: {
    marginTop: 5,
  },
  customTargetLabel: {
    color: COLORS.mid,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  customTargetInputWrapper: {
    position: "relative",
  },
  targetInput: {
    width: "100%",
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    padding: 16,
    paddingRight: 50,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 2,
    borderColor: COLORS.mid,
  },
  targetInputIcon: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },

  // Success Overlay
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  successIconCircle: {
    marginBottom: 20,
  },
  successTitle: {
    color: COLORS.mid,
    fontSize: 36,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    color: COLORS.mid,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  successMessage: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  successStats: {
    backgroundColor: COLORS.soft,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.dark,
  },
  successStatsText: {
    color: COLORS.mid,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  
});