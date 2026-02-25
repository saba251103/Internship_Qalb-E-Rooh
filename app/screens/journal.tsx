import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  PixelRatio,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// 1. IMPORT SAFE AREA CONTEXT
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// ==========================================
// RESPONSIVE UTILITIES
// ==========================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 350;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 680) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const normalize = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_WIDTH / guidelineBaseWidth)));
const wp = (percentage: number) => Math.round((percentage * SCREEN_WIDTH) / 100);
const hp = (percentage: number) => Math.round((percentage * SCREEN_HEIGHT) / 100);

// ==========================================
// DATA
// ==========================================
type EmotionKey = 'sad' | 'guilty' | 'anxious' | 'alone' | 'angry' | 'lost' | 'grateful' | 'hopeful';

const ALLAH_NAMES: Record<EmotionKey, { name: string; arabic: string; meaning: string; dua: string; color: string; }> = {
  sad: { name: 'Ar-Rahman', arabic: 'الرَّحْمَٰن', meaning: "Allah's mercy is bigger than your pain.", dua: 'Ya Rahman, hold my heart gently.', color: '#1a5f5f' },
  guilty: { name: 'Al-Ghafoor', arabic: 'الْغَفُور', meaning: 'Your sin is small next to His forgiveness.', dua: 'Ya Ghafoor, I return to You again.', color: '#2d5a5a' },
  anxious: { name: 'Al-Wakeel', arabic: 'الْوَكِيل', meaning: 'Allah is handling what you cannot.', dua: 'Ya Wakeel, I give this matter to You.', color: '#0e6b6b' },
  alone: { name: 'Al-Wali', arabic: 'الْوَلِيّ', meaning: 'You are never walking life alone.', dua: 'Ya Wali, stay close to me.', color: '#156565' },
  angry: { name: 'Al-Hakeem', arabic: 'الْحَكِيم', meaning: 'There is wisdom you cannot see yet.', dua: 'Ya Hakeem, help me understand.', color: '#0a5555' },
  lost: { name: 'An-Noor', arabic: 'النُّور', meaning: 'Allah guides hearts through darkness.', dua: 'Ya Noor, guide my heart.', color: '#1d7070' },
  grateful: { name: 'Ash-Shakoor', arabic: 'الشَّكُور', meaning: 'He appreciates even your smallest effort.', dua: 'Ya Shakoor, accept my gratitude.', color: '#0f5050' },
  hopeful: { name: 'Al-Fattah', arabic: 'الْفَتَّاح', meaning: 'He opens doors when you see only walls.', dua: 'Ya Fattah, open paths for me.', color: '#196969' },
};

const EMOTIONS = [
  { key: 'sad', label: 'Sad', icon: 'cloud-rain' },
  { key: 'guilty', label: 'Guilty', icon: 'heart-broken' },
  { key: 'anxious', label: 'Anxious', icon: 'wind' },
  { key: 'alone', label: 'Alone', icon: 'alert-circle' },
  { key: 'angry', label: 'Angry', icon: 'zap' },
  { key: 'lost', label: 'Lost', icon: 'help-circle' },
  { key: 'grateful', label: 'Grateful', icon: 'sun' },
  { key: 'hopeful', label: 'Hopeful', icon: 'star' },
];

// ==========================================
// ROOT WRAPPER (Required for Safe Area)
// ==========================================
export default function AppWrapper() {
  return (
    <SafeAreaProvider>
      <IslamicJournal />
    </SafeAreaProvider>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
function IslamicJournal() {
  const router = useRouter();
  // 2. USE INSETS HOOK
  const insets = useSafeAreaInsets();
  
  const [currentView, setCurrentView] = useState<'home' | 'new' | 'entries'>('home');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [journalText, setJournalText] = useState('');
  const [futureComment, setFutureComment] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [currentView]);

  const saveEntry = () => {
    if (selectedEmotion && journalText) {
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        emotion: selectedEmotion,
        text: journalText,
        futureComment,
        allahName: ALLAH_NAMES[selectedEmotion],
      };
      setEntries([newEntry, ...entries]);
      setJournalText('');
      setFutureComment('');
      setSelectedEmotion(null);
      setCurrentView('entries');
      Keyboard.dismiss();
    }
  };

  // --- RENDER FUNCTIONS ---

  const renderHome = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* 3. DYNAMIC PADDING TOP */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerPattern} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons name="chevron-back" size={moderateScale(24)} color={'#FFFFFF'} />
          </TouchableOpacity>
          <View style={styles.crescentContainer}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={moderateScale(32)} color="#f5f5dc" />
          </View>
        </View>
        <Text style={styles.headerTitle}>Qalb Journal</Text>
        <Text style={styles.headerSubtitle}>Where emotions meet His Names</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.quoteSection}>
          <View style={styles.ornamentLeft} />
          <Text style={styles.quote}>"Verily, in the remembrance of Allah do hearts find rest"</Text>
          <Text style={styles.quoteRef}>— Ar-Ra'd 13:28</Text>
          <View style={styles.ornamentRight} />
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={[styles.actionCard, styles.primaryCard]} onPress={() => setCurrentView('new')} activeOpacity={0.9}>
            <View style={styles.cardIcon}><Feather name="edit-3" size={moderateScale(26)} color="#f5f5dc" /></View>
            <Text style={styles.cardTitle}>New Entry</Text>
            <Text style={styles.cardSubtitle}>Express your heart today</Text>
            <View style={styles.cardAccent} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, styles.secondaryCard]} onPress={() => setCurrentView('entries')} activeOpacity={0.9}>
            <View style={styles.cardIcon}><Feather name="book-open" size={moderateScale(26)} color="#0A4A4A" /></View>
            <Text style={[styles.cardTitle, { color: '#0A4A4A' }]}>My Entries</Text>
            <Text style={[styles.cardSubtitle, { color: '#0A4A4A' }]}>{entries.length} reflections</Text>
            <View style={[styles.cardAccent, { backgroundColor: '#0A4A4A' }]} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderNewEntry = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={[styles.entryHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => setCurrentView('home')} style={styles.backButton}>
            <Feather name="arrow-left" size={moderateScale(24)} color="#f5f5dc" />
          </TouchableOpacity>
          <Text style={styles.entryHeaderTitle}>My Heart Right Now...</Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.emotionGrid}>
              {EMOTIONS.map((emotion) => (
                <TouchableOpacity
                  key={emotion.key}
                  style={[styles.emotionChip, selectedEmotion === emotion.key && styles.emotionChipSelected]}
                  onPress={() => setSelectedEmotion(emotion.key as EmotionKey)}
                >
                  <Feather name={emotion.icon as any} size={normalize(18)} color={selectedEmotion === emotion.key ? '#f5f5dc' : '#0A4A4A'} />
                  <Text style={[styles.emotionLabel, selectedEmotion === emotion.key && styles.emotionLabelSelected]}>{emotion.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedEmotion && (
            <Animated.View style={[styles.allahNameCard, { opacity: fadeAnim, backgroundColor: ALLAH_NAMES[selectedEmotion].color }]}>
              <View style={styles.nameOrnament} />
              <Text style={styles.arabicName}>{ALLAH_NAMES[selectedEmotion].arabic}</Text>
              <Text style={styles.englishName}>{ALLAH_NAMES[selectedEmotion].name}</Text>
              <View style={styles.divider} />
              <Text style={styles.nameMeaning}>{ALLAH_NAMES[selectedEmotion].meaning}</Text>
              <View style={styles.duaContainer}>
                <MaterialCommunityIcons name="hands-pray" size={normalize(14)} color="#f5f5dc" />
                <Text style={styles.duaText}>{ALLAH_NAMES[selectedEmotion].dua}</Text>
              </View>
            </Animated.View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pour your heart out</Text>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Write freely... Allah is listening"
                placeholderTextColor="#5a8080"
                multiline
                value={journalText}
                onChangeText={setJournalText}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message to Future Me</Text>
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, { minHeight: verticalScale(80) }]}
                placeholder="What would you tell yourself?"
                placeholderTextColor="#5a8080"
                multiline
                value={futureComment}
                onChangeText={setFutureComment}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={[styles.saveButton, (!selectedEmotion || !journalText) && styles.saveButtonDisabled]}
            onPress={saveEntry}
            disabled={!selectedEmotion || !journalText}
          >
            <Feather name="heart" size={normalize(18)} color="#f5f5dc" />
            <Text style={styles.saveButtonText}>Save to Journal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const renderEntries = () => (
    <View style={styles.container}>
      <View style={[styles.entryHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => setCurrentView('home')} style={styles.backButton}>
          <Feather name="arrow-left" size={moderateScale(24)} color="#f5f5dc" />
        </TouchableOpacity>
        <Text style={styles.entryHeaderTitle}>My Journey</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="book-open-page-variant" size={moderateScale(70)} color="#1a5f5f" />
          <Text style={styles.emptyStateText}>No entries yet</Text>
          <Text style={styles.emptyStateSubtext}>Start your spiritual journey by creating your first entry</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => setCurrentView('new')}>
            <Text style={styles.emptyStateButtonText}>Begin Writing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.entriesList} 
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryCardHeader}>
                <View style={styles.entryDateContainer}>
                  <Feather name="calendar" size={normalize(13)} color="#5a8080" />
                  <Text style={styles.entryDate}>{entry.date}</Text>
                </View>
                <View style={[styles.emotionBadge, { backgroundColor: entry.allahName.color }]}>
                  <Text style={styles.emotionBadgeText}>{EMOTIONS.find((e) => e.key === entry.emotion)?.label}</Text>
                </View>
              </View>
              <View style={styles.entryNameSection}>
                <Text style={styles.entryArabic}>{entry.allahName.arabic}</Text>
                <Text style={styles.entryEnglish}>{entry.allahName.name}</Text>
              </View>
              <Text style={styles.entryText}>{entry.text}</Text>
              {entry.futureComment && (
                <View style={styles.futureCommentSection}>
                  <MaterialCommunityIcons name="message-text" size={normalize(13)} color="#5a8080" />
                  <Text style={styles.futureCommentText}>{entry.futureComment}</Text>
                </View>
              )}
              <View style={styles.entryFooter}>
                <Text style={styles.entryDua}>{entry.allahName.dua}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {currentView === 'home' && renderHome()}
      {currentView === 'new' && renderNewEntry()}
      {currentView === 'entries' && renderEntries()}
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#0A4A4A' },
  container: { flex: 1, backgroundColor: '#0A4A4A' },
  scrollContent: { paddingBottom: 40 },

  // HOME HEADER
  header: {
    paddingBottom: verticalScale(20),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
    backgroundColor: '#0A4A4A', // Ensure background covers status bar area
    zIndex: 10,
  },
  headerPattern: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
    backgroundColor: 'rgba(26, 95, 95, 0.3)',
    borderBottomLeftRadius: scale(60), borderBottomRightRadius: scale(60),
  },
  headerTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', marginBottom: verticalScale(10), paddingHorizontal: wp(5),
  },
  headerBackButton: { position: 'absolute', left: wp(5), padding: 8 },
  crescentContainer: { opacity: 0.9 },
  headerTitle: { fontSize: normalize(32), fontWeight: '700', color: '#f5f5dc', letterSpacing: 1 },
  headerSubtitle: { fontSize: normalize(13), color: '#a8c5c5', marginTop: 4, fontStyle: 'italic' },

  // QUOTE & CARDS
  quoteSection: {
    marginTop: verticalScale(30), marginHorizontal: wp(6), paddingVertical: verticalScale(20),
    paddingHorizontal: wp(5), backgroundColor: 'rgba(26, 95, 95, 0.2)', borderRadius: scale(16),
    borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.1)',
  },
  ornamentLeft: { position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#f5f5dc', opacity: 0.3 },
  ornamentRight: { position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#f5f5dc', opacity: 0.3 },
  quote: { fontSize: normalize(15), color: '#f5f5dc', textAlign: 'center', lineHeight: normalize(24), fontStyle: 'italic' },
  quoteRef: { fontSize: normalize(11), color: '#a8c5c5', textAlign: 'center', marginTop: 8 },
  
  cardContainer: { marginTop: verticalScale(30), paddingHorizontal: wp(5) },
  actionCard: { padding: scale(24), borderRadius: scale(20), marginBottom: verticalScale(16), position: 'relative', overflow: 'hidden' },
  primaryCard: { backgroundColor: '#156565', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  secondaryCard: { backgroundColor: '#f5f5dc', borderWidth: 1, borderColor: 'rgba(10, 74, 74, 0.1)' },
  cardIcon: { marginBottom: 12 },
  cardTitle: { fontSize: normalize(22), fontWeight: '700', color: '#f5f5dc', marginBottom: 4 },
  cardSubtitle: { fontSize: normalize(13), color: '#a8c5c5' },
  cardAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#f5f5dc' },

  // ENTRY SCREENS
  entryHeader: {
    paddingBottom: verticalScale(15), paddingHorizontal: wp(5),
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245, 245, 220, 0.1)',
    backgroundColor: '#0A4A4A',
  },
  backButton: { marginRight: wp(4), padding: 5 },
  entryHeaderTitle: { fontSize: normalize(20), fontWeight: '600', color: '#f5f5dc', flex: 1 },
  
  section: { marginTop: verticalScale(25), paddingHorizontal: wp(5) },
  sectionTitle: { fontSize: normalize(15), fontWeight: '600', color: '#a8c5c5', marginBottom: 12 },
  
  emotionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emotionChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f5f5dc', borderRadius: 25, gap: 8 },
  emotionChipSelected: { backgroundColor: '#156565', borderWidth: 2, borderColor: '#f5f5dc' },
  emotionLabel: { fontSize: normalize(13), fontWeight: '600', color: '#0A4A4A' },
  emotionLabelSelected: { color: '#f5f5dc' },

  allahNameCard: {
    marginTop: verticalScale(20), marginHorizontal: wp(5), padding: scale(24),
    borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,245,220,0.2)'
  },
  nameOrnament: { position: 'absolute', top: 16, width: 60, height: 2, backgroundColor: '#f5f5dc', opacity: 0.3 },
  arabicName: { fontSize: normalize(32), fontWeight: '700', color: '#f5f5dc', marginVertical: 10 },
  englishName: { fontSize: normalize(16), fontWeight: '600', color: '#a8c5c5', marginBottom: 16 },
  divider: { width: 40, height: 1, backgroundColor: '#f5f5dc', opacity: 0.3, marginBottom: 16 },
  nameMeaning: { fontSize: normalize(14), color: '#f5f5dc', textAlign: 'center', fontStyle: 'italic', marginBottom: 16 },
  duaContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 },
  duaText: { fontSize: normalize(13), color: '#f5f5dc', fontStyle: 'italic' },

  textInputContainer: { backgroundColor: 'rgba(26, 95, 95, 0.2)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.1)', padding: 4 },
  textInput: { fontSize: normalize(15), color: '#f5f5dc', padding: 16, minHeight: 120, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },

  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0A4A4A', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#156565', marginHorizontal: wp(5), marginVertical: 15, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f5f5dc' },
  saveButtonDisabled: { backgroundColor: '#0d4040', opacity: 0.5 },
  saveButtonText: { fontSize: normalize(15), fontWeight: '700', color: '#f5f5dc' },

  // ENTRY LIST
  entriesList: { flex: 1, paddingTop: 10 },
  entryCard: { marginHorizontal: wp(5), marginBottom: 16, padding: 20, backgroundColor: 'rgba(26, 95, 95, 0.2)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.1)' },
  entryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  entryDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryDate: { fontSize: normalize(12), color: '#a8c5c5' },
  emotionBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  emotionBadgeText: { fontSize: normalize(10), fontWeight: '700', color: '#f5f5dc', textTransform: 'uppercase' },
  entryNameSection: { alignItems: 'center', marginBottom: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(245, 245, 220, 0.1)' },
  entryArabic: { fontSize: normalize(24), fontWeight: '700', color: '#f5f5dc' },
  entryEnglish: { fontSize: normalize(12), color: '#a8c5c5' },
  entryText: { fontSize: normalize(14), color: '#f5f5dc', lineHeight: 22, marginBottom: 12 },
  futureCommentSection: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#f5f5dc' },
  futureCommentText: { flex: 1, fontSize: normalize(12), color: '#a8c5c5', fontStyle: 'italic' },
  entryFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(245, 245, 220, 0.1)' },
  entryDua: { fontSize: normalize(12), color: '#a8c5c5', textAlign: 'center', fontStyle: 'italic' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateText: { fontSize: normalize(20), fontWeight: '600', color: '#f5f5dc', marginTop: 20 },
  emptyStateSubtext: { fontSize: normalize(13), color: '#a8c5c5', textAlign: 'center', marginTop: 8 },
  emptyStateButton: { marginTop: 30, paddingVertical: 14, paddingHorizontal: 30, backgroundColor: '#156565', borderRadius: 12, borderWidth: 1, borderColor: '#f5f5dc' },
  emptyStateButtonText: { fontSize: normalize(14), fontWeight: '600', color: '#f5f5dc' },
});