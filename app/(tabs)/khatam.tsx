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
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SurahKhatamPlanner() {
  const router = useRouter();

  // --- States ---
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
      "This will permanently erase your progress and your deadline. You will need to create a new plan.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete & Start New", 
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

  if (loading) return (
    <LinearGradient colors={['#0A4A4A', '#064343']} style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#f5f5dc" />
      <Text style={styles.loadingText}>Loading your journey...</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0A4A4A', '#064343', '#032626']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {!hasPlan ? (
          <View style={styles.centeredContent}>
            {/* Welcome Screen */}
            <View style={styles.welcomeContainer}>
              {/* Decorative Elements */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />
              
              {/* Icon Container */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.08)']}
                  style={styles.iconGradient}
                >
                  <FontAwesome5 name="book-open" size={60} color="#f5f5dc" />
                </LinearGradient>
              </View>

              {/* Welcome Text */}
              <View style={styles.welcomeTextContainer}>
                <View style={styles.textDecoration}>
                  <View style={styles.decorDot} />
                  <View style={styles.decorLine} />
                  <View style={styles.decorDot} />
                </View>
                <Text style={styles.welcomeTitle}>Begin Your Journey</Text>
                <Text style={styles.welcomeSubtitle}>Complete the entire Quran</Text>
                <Text style={styles.welcomeDescription}>
                  Set your goal date and we'll create a personalized daily reading plan for you
                </Text>
                <View style={styles.textDecoration}>
                  <View style={styles.decorDot} />
                  <View style={styles.decorLine} />
                  <View style={styles.decorDot} />
                </View>
              </View>

              {/* CTA Button */}
              <TouchableOpacity 
                style={styles.setupButton} 
                onPress={() => setShowModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#f5f5dc', '#E8DCC4']}
                  style={styles.setupGradient}
                >
                  <Ionicons name="calendar" size={22} color="#0A4A4A" />
                  <Text style={styles.setupText}>Set Your Goal Date</Text>
                  <Ionicons name="arrow-forward" size={22} color="#0A4A4A" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Feature Cards */}
              <View style={styles.featureRow}>
                <View style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#D2B48C" />
                  </View>
                  <Text style={styles.featureText}>Daily Goals</Text>
                </View>
                <View style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="trending-up-outline" size={20} color="#D2B48C" />
                  </View>
                  <Text style={styles.featureText}>Track Progress</Text>
                </View>
                <View style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="checkmark-done-outline" size={20} color="#D2B48C" />
                  </View>
                  <Text style={styles.featureText}>Stay Motivated</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Header Card */}
            <View style={styles.headerSection}>
              <View style={styles.headerCard}>
                <LinearGradient
                  colors={['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.06)']}
                  style={styles.headerGradient}
                >
                  {/* Top Row */}
                  <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                      <View style={styles.planIcon}>
                        <Ionicons name="flag" size={18} color="#f5f5dc" />
                      </View>
                      <View>
                        <Text style={styles.userTitle}>Your Khatam Plan</Text>
                        <Text style={styles.targetSub}>Target: {targetDate.toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={deleteCurrentPlan} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>

                  {/* Progress Section */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Overall Progress</Text>
                      <Text style={styles.progressPercentLarge}>{planData.progressPercent}%</Text>
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={['#f5f5dc', '#D2B48C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressBarFill, { width: `${planData.progressPercent}%` }]}
                        />
                      </View>
                      <Text style={styles.completedText}>
                        {completedSurahs.length} / 114 Surahs
                      </Text>
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['rgba(210, 180, 140, 0.2)', 'rgba(210, 180, 140, 0.1)']}
                        style={styles.statGradient}
                      >
                        <View style={styles.statIconBg}>
                          <Ionicons name="today-outline" size={20} color="#f5f5dc" />
                        </View>
                        <Text style={styles.statValue}>{planData.dynamicDailyGoal}</Text>
                        <Text style={styles.statLabel}>Today's Goal</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['rgba(210, 180, 140, 0.2)', 'rgba(210, 180, 140, 0.1)']}
                        style={styles.statGradient}
                      >
                        <View style={styles.statIconBg}>
                          <Ionicons name="time-outline" size={20} color="#f5f5dc" />
                        </View>
                        <Text style={styles.statValue}>{planData.daysLeft}</Text>
                        <Text style={styles.statLabel}>Days Left</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['rgba(210, 180, 140, 0.2)', 'rgba(210, 180, 140, 0.1)']}
                        style={styles.statGradient}
                      >
                        <View style={styles.statIconBg}>
                          <Ionicons name="list-outline" size={20} color="#f5f5dc" />
                        </View>
                        <Text style={styles.statValue}>{planData.surahsRemaining}</Text>
                        <Text style={styles.statLabel}>Remaining</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabSection}>
              <View style={styles.tabBar}>
                <TouchableOpacity 
                  style={styles.tab}
                  onPress={() => setActiveTab('today')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabContent, activeTab === 'today' && styles.activeTabContent]}>
                    <Ionicons 
                      name="flash" 
                      size={18} 
                      color={activeTab === 'today' ? '#0A4A4A' : '#B8A488'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
                      Daily Goal ({planData.dynamicDailyGoal})
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.tab}
                  onPress={() => setActiveTab('all')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabContent, activeTab === 'all' && styles.activeTabContent]}>
                    <Ionicons 
                      name="list" 
                      size={18} 
                      color={activeTab === 'all' ? '#0A4A4A' : '#B8A488'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                      All Surahs (114)
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Surah List */}
            <ScrollView 
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {(activeTab === 'today' ? todaysTargetList : surahs).map((item, index) => {
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
                        >
                          <View style={[styles.checkCircle, isDone && styles.checkCircleDone]}>
                            <Ionicons 
                              name={isDone ? "checkmark" : "ellipse-outline"} 
                              size={24} 
                              color={isDone ? "#0A4A4A" : "#B8A488"} 
                            />
                          </View>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                );
              })}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}

        {/* Setup Modal */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#0D5F5F', '#0A4A4A']}
                style={styles.modalGradient}
              >
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalDecoration}>
                      <View style={styles.modalDot} />
                      <View style={styles.modalLine} />
                      <View style={styles.modalDot} />
                    </View>
                    <Text style={styles.modalTitle}>Set Your Goal</Text>
                    <Text style={styles.modalSubtitle}>Choose when you'd like to complete the Quran</Text>
                  </View>

                  {/* Date Picker */}
                  <View style={styles.datePickerSection}>
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={targetDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, d) => d && setTargetDate(d)}
                        minimumDate={new Date()}
                        textColor="#f5f5dc"
                        themeVariant="dark"
                      />
                    </View>
                    
                    {/* Selected Date Display */}
                    <View style={styles.selectedDateCard}>
                      <View style={styles.selectedDateIcon}>
                        <Ionicons name="calendar-outline" size={20} color="#D2B48C" />
                      </View>
                      <View style={styles.selectedDateInfo}>
                        <Text style={styles.selectedDateLabel}>Target Date</Text>
                        <Text style={styles.selectedDateText}>
                          {targetDate.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <TouchableOpacity 
                    style={styles.modalActionButton} 
                    onPress={() => { setHasPlan(true); setShowModal(false); }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#f5f5dc', '#E8DCC4']}
                      style={styles.modalActionGradient}
                    >
                      <Ionicons name="checkmark-circle" size={22} color="#0A4A4A" />
                      <Text style={styles.modalActionText}>Create My Plan</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setShowModal(false)} 
                    style={styles.modalCancelButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    color: '#D2B48C',
    marginTop: 16,
    fontSize: 14,
  },

  // Welcome Screen
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(245, 245, 220, 0.03)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(210, 180, 140, 0.03)',
  },
  iconContainer: {
    marginBottom: 30,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  textDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  decorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D2B48C',
  },
  decorLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(245, 245, 220, 0.2)',
  },
  welcomeTitle: { 
    color: '#f5f5dc', 
    fontSize: 28, 
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#D2B48C',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  welcomeDescription: { 
    color: '#B8A488', 
    textAlign: 'center', 
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  setupButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 30,
  },
  setupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  setupText: { 
    color: '#0A4A4A', 
    fontSize: 17, 
    fontWeight: 'bold' 
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(245, 245, 220, 0.08)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(210, 180, 140, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#D2B48C',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    marginBottom: 12,
  },
  headerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  deleteBtn: { 
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  userTitle: { 
    color: '#f5f5dc', 
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  targetSub: { 
    color: '#D2B48C', 
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    color: '#B8A488',
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercentLarge: {
    color: '#f5f5dc',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBg: { 
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.1)',
  },
  progressBarFill: { 
    height: '100%',
    borderRadius: 6,
  },
  completedText: {
    color: '#D2B48C',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(210, 180, 140, 0.25)',
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { 
    color: '#f5f5dc', 
    fontSize: 20, 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: { 
    color: '#B8A488', 
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Tab Bar
  tabSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabBar: { 
    flexDirection: 'row',
    gap: 10,
  },
  tab: { 
    flex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 245, 220, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
  },
  activeTabContent: {
    backgroundColor: '#f5f5dc',
    borderColor: '#D2B48C',
  },
  tabText: { 
    color: '#B8A488',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: { 
    color: '#0A4A4A',
    fontWeight: 'bold',
  },

  // Scroll Area
  scrollArea: { 
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  surahCardWrapper: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  surahCard: {
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
  },
  surahCardDone: {
    opacity: 0.6,
  },
  surahPressable: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  surahNumberBadge: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.25)',
  },
  surahNumber: { 
    color: '#f5f5dc',
    fontWeight: 'bold',
    fontSize: 15,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: { 
    color: '#f5f5dc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  surahNameDone: {
    textDecorationLine: 'line-through',
  },
  surahMeta: { 
    color: '#B8A488',
    fontSize: 12,
  },
  checkButton: {
    padding: 4,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#f5f5dc',
  },

  // Modal
  modalBackdrop: { 
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    width: '100%',
    maxHeight: height * 0.85,
  },
  modalScrollContent: {
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  modalDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D2B48C',
  },
  modalLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(210, 180, 140, 0.4)',
  },
  modalTitle: { 
    color: '#f5f5dc',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#B8A488',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  datePickerSection: {
    marginBottom: 24,
  },
  datePickerWrapper: {
    backgroundColor: 'rgba(245, 245, 220, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
  },
  selectedDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(210, 180, 140, 0.15)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210, 180, 140, 0.3)',
  },
  selectedDateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateInfo: {
    flex: 1,
  },
  selectedDateLabel: {
    color: '#B8A488',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedDateText: {
    color: '#f5f5dc',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginBottom: 12,
  },
  modalActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  modalActionText: { 
    color: '#0A4A4A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#B8A488',
    fontSize: 14,
    fontWeight: '600',
  },
});