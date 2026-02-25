import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  PixelRatio,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// 1. IMPORT SAFE AREA CONTEXT
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// --- RESPONSIVE UTILITIES ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;

const scale = (size: number): number => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number): number => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size: number, factor = 0.5): number => size + (scale(size) - size) * factor;

const fontScale = (size: number): number => {
  const normalized = size / PixelRatio.getFontScale();
  return Math.round(PixelRatio.roundToNearestPixel(normalized));
};

const responsiveFontSize = (size: number): number => {
  if (isSmallDevice) return fontScale(size * 0.9);
  if (isTablet) return fontScale(size * 1.15);
  return fontScale(size);
};

const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(40),
};

// --- ROOT WRAPPER ---
export default function SurahKhatamWrapper() {
  return (
    <SafeAreaProvider>
      <SurahKhatamPlanner />
    </SafeAreaProvider>
  );
}

function SurahKhatamPlanner() {
  const router = useRouter();
  // 2. GET INSETS
  const insets = useSafeAreaInsets();
  
  // --- States ---
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [targetDate, setTargetDate] = useState(new Date(2026, 3, 12));
  const [surahs, setSurahs] = useState<any[]>([]);
  const [completedSurahs, setCompletedSurahs] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');

  // --- Persistence Logic ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem("khatamData");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCompletedSurahs(parsed.completed || []);
          setTargetDate(new Date(parsed.date));
          setHasPlan(parsed.hasPlan);
          setStreak(parsed.streak || 0);
        }
      } catch (e) { console.error("Load error", e); }
    };
    loadData();
    
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(json => {
        setSurahs(json.data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem("khatamData", JSON.stringify({
        completed: completedSurahs,
        date: targetDate,
        hasPlan,
        streak
      }));
    }
  }, [completedSurahs, targetDate, hasPlan, streak, loading]);

  // --- Dynamic Math ---
  const planData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const surahsRemaining = 114 - completedSurahs.length;
    const dynamicDailyGoal = Math.ceil(surahsRemaining / daysLeft);
    const progressPercent = Math.round((completedSurahs.length / 114) * 100);

    return { daysLeft, surahsRemaining, dynamicDailyGoal, progressPercent };
  }, [targetDate, completedSurahs]);

  const todaysTargetList = useMemo(() => {
    const doneSet = new Set(completedSurahs);
    return surahs.filter(s => !doneSet.has(s.number)).slice(0, planData.dynamicDailyGoal);
  }, [completedSurahs, surahs, planData.dynamicDailyGoal]);

  // --- Plan Management ---
  const deleteCurrentPlan = () => {
    Alert.alert(
      "Delete Current Plan?",
      "This will permanently erase your progress. Start fresh?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.removeItem("khatamData");
            setHasPlan(false);
            setCompletedSurahs([]);
            setStreak(0);
            setTargetDate(new Date(2026, 3, 12));
            setActiveTab('today');
          } 
        }
      ]
    );
  };

  const toggleComplete = (id: number) => {
    setCompletedSurahs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  if (loading) return (
    <LinearGradient colors={['#0A4A4A', '#064343']} style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#f5f5dc" />
      <Text style={styles.loadingText}>Loading...</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0A4A4A', '#064343', '#032626']} style={styles.container}>
      {/* 3. TRANSLUCENT STATUS BAR */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 4. DYNAMIC HEADER PADDING */}
      <View style={[styles.headerRow, { marginTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="chevron-back" size={24} color="#f5f5dc" />
        </TouchableOpacity>
      </View>

      {!hasPlan ? (
        <View style={styles.centeredContent}>
          <View style={styles.welcomeContainer}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            
            <View style={styles.iconContainer}>
              <LinearGradient colors={['rgba(245,245,220,0.18)','rgba(245,245,220,0.08)']} style={styles.iconGradient}>
                <FontAwesome5 name="book-open" size={moderateScale(50)} color="#f5f5dc" />
              </LinearGradient>
            </View>

            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>Begin Your Journey</Text>
              <Text style={styles.welcomeSubtitle}>Complete the Quran</Text>
              <Text style={styles.welcomeDescription}>
                Set your goal date and we'll create a personalized daily reading plan for you
              </Text>
            </View>

            <TouchableOpacity style={styles.setupButton} onPress={() => setShowModal(true)} activeOpacity={0.85}>
              <LinearGradient colors={['#f5f5dc', '#E8DCC4']} style={styles.setupGradient}>
                <Ionicons name="calendar" size={moderateScale(20)} color="#0A4A4A" />
                <Text style={styles.setupText}>Set Your Goal Date</Text>
                <Ionicons name="arrow-forward" size={moderateScale(20)} color="#0A4A4A" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.featureRow}>
              {['Daily Goals', 'Track Progress', 'Stay Motivated'].map((text, i) => (
                <View key={i} style={styles.featureCard}>
                  <Text style={styles.featureText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.headerSection}>
            <View style={styles.headerCard}>
              <LinearGradient colors={['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.06)']} style={styles.headerGradient}>
                <View style={styles.headerTop}>
                  <View style={styles.headerLeft}>
                    <View style={styles.planIcon}>
                      <Ionicons name="flag" size={moderateScale(18)} color="#f5f5dc" />
                    </View>
                    <View>
                      <Text style={styles.userTitle}>Your Khatam Plan</Text>
                      <Text style={styles.targetSub}>Target: {targetDate.toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={deleteCurrentPlan} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={moderateScale(18)} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressPercentLarge}>{planData.progressPercent}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={['#f5f5dc', '#D2B48C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${planData.progressPercent}%` }]}
                    />
                  </View>
                  <Text style={styles.completedText}>{completedSurahs.length} / 114 Surahs</Text>
                </View>

                <View style={styles.statsContainer}>
                  {[
                    { label: "Today", value: planData.dynamicDailyGoal, icon: "today-outline" },
                    { label: "Days Left", value: planData.daysLeft, icon: "time-outline" },
                    { label: "Remaining", value: planData.surahsRemaining, icon: "list-outline" }
                  ].map((stat, i) => (
                    <View key={i} style={styles.statCard}>
                      <LinearGradient colors={['rgba(210, 180, 140, 0.2)', 'rgba(210, 180, 140, 0.1)']} style={styles.statGradient}>
                        <View style={styles.statIconBg}>
                          <Ionicons name={stat.icon as any} size={moderateScale(18)} color="#f5f5dc" />
                        </View>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.tabSection}>
            <View style={styles.tabBar}>
              {['today', 'all'].map((tab) => (
                <TouchableOpacity 
                  key={tab}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabContent, activeTab === tab && styles.activeTabContent]}>
                    <Ionicons 
                      name={tab === 'today' ? "flash" : "list"} 
                      size={moderateScale(16)} 
                      color={activeTab === tab ? '#0A4A4A' : '#B8A488'} 
                    />
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                      {tab === 'today' ? `Daily Goal (${planData.dynamicDailyGoal})` : 'All Surahs'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 5. BOTTOM SAFE AREA PADDING */}
          <ScrollView 
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          >
            {(activeTab === 'today' ? todaysTargetList : surahs).map((item) => {
              const isDone = completedSurahs.includes(item.number);
              return (
                <View key={item.number} style={styles.surahCardWrapper}>
                  <LinearGradient
                    colors={
                      isDone
                        ? ['rgba(210, 180, 140, 0.15)', 'rgba(210, 180, 140, 0.08)']
                        : ['rgba(245, 245, 220, 0.1)', 'rgba(245, 245, 220, 0.05)']
                    }
                    style={[styles.surahCard, isDone && styles.surahCardDone]}
                  >
                    <TouchableOpacity 
                      style={styles.surahPressable} 
                      onPress={() => router.push({
                        pathname: "/screens/quran_details",
                        params: { surahNumber: item.number.toString(), surahName: item.englishName }
                      })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.surahLeft}>
                        <View style={styles.surahNumberBadge}>
                          <Text style={styles.surahNumber}>{item.number}</Text>
                        </View>
                        <View style={styles.surahInfo}>
                          <Text style={[styles.surahName, isDone && styles.surahNameDone]}>
                            {item.englishName}
                          </Text>
                          <Text style={styles.surahMeta}>
                            {item.numberOfAyahs} verses • {item.revelationType}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity 
                        onPress={() => toggleComplete(item.number)}
                        style={styles.checkButton}
                        activeOpacity={0.7}
                        hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                      >
                        <View style={[styles.checkCircle, isDone && styles.checkCircleDone]}>
                          <Ionicons 
                            name={isDone ? "checkmark" : "ellipse-outline"} 
                            size={moderateScale(20)} 
                            color={isDone ? "#0A4A4A" : "#B8A488"} 
                          />
                        </View>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#0D5F5F', '#0A4A4A']} style={styles.modalGradient}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
                <Text style={styles.modalTitle}>Set Your Goal</Text>
                <Text style={styles.modalSubtitle}>When do you want to complete it?</Text>

                <View style={styles.datePickerSection}>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={targetDate} mode="date" display="spinner"
                        onChange={onDateChange} minimumDate={new Date()}
                        textColor="#f5f5dc" themeVariant="dark"
                      />
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.datePickerWrapperAndroid} onPress={() => setShowAndroidPicker(true)}>
                        <Ionicons name="calendar" size={moderateScale(20)} color="#D2B48C" />
                        <Text style={styles.androidPickerBtnText}>Select Date</Text>
                      </TouchableOpacity>
                      {showAndroidPicker && (
                        <DateTimePicker
                          value={targetDate} mode="date" display="default"
                          onChange={onDateChange} minimumDate={new Date()}
                        />
                      )}
                    </>
                  )}
                  
                  <View style={styles.selectedDateCard}>
                    <View style={styles.selectedDateIcon}>
                      <Ionicons name="calendar-outline" size={moderateScale(18)} color="#D2B48C" />
                    </View>
                    <View style={styles.selectedDateInfo}>
                      <Text style={styles.selectedDateLabel}>Target Date</Text>
                      <Text style={styles.selectedDateText}>
                        {targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.modalActionButton} 
                  onPress={() => { setHasPlan(true); setShowModal(false); }}
                >
                  <LinearGradient colors={['#f5f5dc', '#E8DCC4']} style={styles.modalActionGradient}>
                    <Text style={styles.modalActionText}>Create Plan</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCancelButton}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#D2B48C', marginTop: spacing.md, fontSize: responsiveFontSize(14) },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Welcome
  centeredContent: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  welcomeContainer: { alignItems: 'center', position: 'relative' },
  decorativeCircle1: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(245, 245, 220, 0.03)' },
  decorativeCircle2: { position: 'absolute', bottom: -80, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(210, 180, 140, 0.03)' },
  iconContainer: { marginBottom: spacing.lg, borderRadius: 30, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  iconGradient: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  welcomeTextContainer: { alignItems: 'center', marginBottom: spacing.xl },
  welcomeTitle: { color: '#f5f5dc', fontSize: responsiveFontSize(26), fontWeight: 'bold', marginBottom: spacing.xs },
  welcomeSubtitle: { color: '#D2B48C', fontSize: responsiveFontSize(16), fontWeight: '600', marginBottom: spacing.sm },
  welcomeDescription: { color: '#B8A488', textAlign: 'center', fontSize: responsiveFontSize(14), lineHeight: 22, paddingHorizontal: spacing.md },
  setupButton: { width: '100%', borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, marginBottom: spacing.lg },
  setupGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  setupText: { color: '#0A4A4A', fontSize: responsiveFontSize(16), fontWeight: 'bold' },
  featureRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  featureCard: { flex: 1, backgroundColor: 'rgba(245, 245, 220, 0.08)', padding: spacing.sm, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.15)' },
  featureText: { color: '#D2B48C', fontSize: responsiveFontSize(11), fontWeight: '600', textAlign: 'center' },
  
  // Dashboard
  headerSection: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  headerCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)', overflow: 'hidden' },
  headerGradient: { padding: spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  planIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245, 245, 220, 0.15)', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { padding: 6, backgroundColor: 'rgba(255, 107, 107, 0.15)', borderRadius: 8 },
  userTitle: { color: '#f5f5dc', fontSize: responsiveFontSize(16), fontWeight: 'bold' },
  targetSub: { color: '#D2B48C', fontSize: responsiveFontSize(12), fontWeight: '600' },
  progressSection: { marginBottom: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  progressLabel: { color: '#B8A488', fontSize: 12, fontWeight: '600' },
  progressPercentLarge: { color: '#f5f5dc', fontSize: 20, fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.1)' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  completedText: { color: '#D2B48C', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  statsContainer: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  statGradient: { padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(210, 180, 140, 0.25)' },
  statIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(245, 245, 220, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { color: '#f5f5dc', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#B8A488', fontSize: 10, fontWeight: '600' },
  
  // Tabs
  tabSection: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  tabBar: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1 },
  tabContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: 'rgba(245, 245, 220, 0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.15)' },
  activeTabContent: { backgroundColor: '#f5f5dc', borderColor: '#D2B48C' },
  tabText: { color: '#B8A488', fontWeight: '600', fontSize: 12 },
  activeTabText: { color: '#0A4A4A', fontWeight: 'bold' },
  
  // List
  scrollArea: { paddingHorizontal: spacing.md },
  scrollContent: { paddingBottom: spacing.md },
  surahCardWrapper: { marginBottom: spacing.sm, borderRadius: 14, overflow: 'hidden' },
  surahCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.15)' },
  surahCardDone: { opacity: 0.6 },
  surahPressable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  surahLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  surahNumberBadge: { width: 36, height: 36, backgroundColor: 'rgba(245, 245, 220, 0.15)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.25)' },
  surahNumber: { color: '#f5f5dc', fontWeight: 'bold', fontSize: 13 },
  surahInfo: { flex: 1 },
  surahName: { color: '#f5f5dc', fontSize: 15, fontWeight: 'bold' },
  surahNameDone: { textDecorationLine: 'line-through' },
  surahMeta: { color: '#B8A488', fontSize: 11 },
  checkButton: { padding: 4 },
  checkCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(245, 245, 220, 0.1)', justifyContent: 'center', alignItems: 'center' },
  checkCircleDone: { backgroundColor: '#f5f5dc' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  modalContainer: { width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden' },
  modalGradient: { width: '100%', borderRadius: 24 },
  modalScrollContent: { padding: spacing.lg },
  modalTitle: { color: '#f5f5dc', fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  modalSubtitle: { color: '#B8A488', fontSize: 13, textAlign: 'center', marginBottom: spacing.lg },
  datePickerSection: { marginBottom: spacing.lg },
  datePickerWrapper: { backgroundColor: 'rgba(245, 245, 220, 0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)', overflow: 'hidden', marginBottom: spacing.md },
  datePickerWrapperAndroid: { backgroundColor: 'rgba(245, 245, 220, 0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  androidPickerBtnText: { color: '#f5f5dc', fontSize: 15, fontWeight: '600' },
  selectedDateCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(210, 180, 140, 0.15)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(210, 180, 140, 0.3)' },
  selectedDateIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245, 245, 220, 0.15)', justifyContent: 'center', alignItems: 'center' },
  selectedDateInfo: { flex: 1 },
  selectedDateLabel: { color: '#B8A488', fontSize: 11, fontWeight: '600' },
  selectedDateText: { color: '#f5f5dc', fontSize: 14, fontWeight: 'bold' },
  modalActionButton: { borderRadius: 16, overflow: 'hidden', marginBottom: spacing.sm },
  modalActionGradient: { paddingVertical: 14, alignItems: 'center' },
  modalActionText: { color: '#0A4A4A', fontWeight: 'bold', fontSize: 16 },
  modalCancelButton: { paddingVertical: 10, alignItems: 'center' },
  modalCancelText: { color: '#B8A488', fontSize: 14, fontWeight: '600' },
});