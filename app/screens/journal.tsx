import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
const { width, height } = Dimensions.get('window');

// Type for emotion keys
type EmotionKey = 'sad' | 'guilty' | 'anxious' | 'alone' | 'angry' | 'lost' | 'grateful' | 'hopeful';

// Allah's Names database with emotions
const ALLAH_NAMES: Record<EmotionKey, {
  name: string;
  arabic: string;
  meaning: string;
  dua: string;
  color: string;
}> = {
  sad: {
    name: 'Ar-Rahman',
    arabic: 'الرَّحْمَٰن',
    meaning: "Allah's mercy is bigger than your pain.",
    dua: 'Ya Rahman, hold my heart gently.',
    color: '#1a5f5f',
  },
  guilty: {
    name: 'Al-Ghafoor',
    arabic: 'الْغَفُور',
    meaning: 'Your sin is small next to His forgiveness.',
    dua: 'Ya Ghafoor, I return to You again.',
    color: '#2d5a5a',
  },
  anxious: {
    name: 'Al-Wakeel',
    arabic: 'الْوَكِيل',
    meaning: 'Allah is handling what you cannot.',
    dua: 'Ya Wakeel, I give this matter to You.',
    color: '#0e6b6b',
  },
  alone: {
    name: 'Al-Wali',
    arabic: 'الْوَلِيّ',
    meaning: 'You are never walking life alone.',
    dua: 'Ya Wali, stay close to me.',
    color: '#156565',
  },
  angry: {
    name: 'Al-Hakeem',
    arabic: 'الْحَكِيم',
    meaning: 'There is wisdom you cannot see yet.',
    dua: 'Ya Hakeem, help me understand.',
    color: '#0a5555',
  },
  lost: {
    name: 'An-Noor',
    arabic: 'النُّور',
    meaning: 'Allah guides hearts through darkness.',
    dua: 'Ya Noor, guide my heart.',
    color: '#1d7070',
  },
  grateful: {
    name: 'Ash-Shakoor',
    arabic: 'الشَّكُور',
    meaning: 'He appreciates even your smallest effort.',
    dua: 'Ya Shakoor, accept my gratitude.',
    color: '#0f5050',
  },
  hopeful: {
    name: 'Al-Fattah',
    arabic: 'الْفَتَّاح',
    meaning: 'He opens doors when you see only walls.',
    dua: 'Ya Fattah, open paths for me.',
    color: '#196969',
  },
};

const EMOTIONS: { key: EmotionKey; label: string; icon: string }[] = [
  { key: 'sad', label: 'Sad', icon: 'cloud-rain' },
  { key: 'guilty', label: 'Guilty', icon: 'heart-broken' },
  { key: 'anxious', label: 'Anxious', icon: 'wind' },
  { key: 'alone', label: 'Alone', icon: 'alert-circle' },
  { key: 'angry', label: 'Angry', icon: 'zap' },
  { key: 'lost', label: 'Lost', icon: 'help-circle' },
  { key: 'grateful', label: 'Grateful', icon: 'sun' },
  { key: 'hopeful', label: 'Hopeful', icon: 'star' },
];

export default function IslamicJournal() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'home' | 'new' | 'entries'>('home');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [journalText, setJournalText] = useState('');
  const [futureComment, setFutureComment] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentView]);

  const saveEntry = () => {
    if (selectedEmotion && journalText) {
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
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
    }
  };

  const renderHome = () => (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <StatusBar barStyle="light-content" />
      
{/* Header */}
<View style={styles.header}>
  <View style={styles.headerPattern} />

  {/* Top Row (Back + Crescent) */}
  <View style={styles.headerTopRow}>
    <TouchableOpacity
      onPress={() => router.push('./features')}
      style={styles.headerBackButton}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={22} color={'#FFFFFF'} />
    </TouchableOpacity>

    <View style={styles.crescentContainer}>
      <MaterialCommunityIcons name="moon-waning-crescent" size={32} color="#f5f5dc" />
    </View>
  </View>

  <Text style={styles.headerTitle}>Qalb Journal</Text>
  <Text style={styles.headerSubtitle}>Where emotions meet His Names</Text>
</View>

      {/* Quote Section */}
      <View style={styles.quoteSection}>
        <View style={styles.ornamentLeft} />
        <Text style={styles.quote}>
          "Verily, in the remembrance of Allah do hearts find rest"
        </Text>
        <Text style={styles.quoteRef}>— Ar-Ra'd 13:28</Text>
        <View style={styles.ornamentRight} />
      </View>

      {/* Action Cards */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.actionCard, styles.primaryCard]}
          onPress={() => setCurrentView('new')}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Feather name="edit-3" size={28} color="#f5f5dc" />
          </View>
          <Text style={styles.cardTitle}>New Entry</Text>
          <Text style={styles.cardSubtitle}>Express your heart today</Text>
          <View style={styles.cardAccent} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.secondaryCard]}
          onPress={() => setCurrentView('entries')}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Feather name="book-open" size={28} color="#0A4A4A" />
          </View>
          <Text style={[styles.cardTitle, { color: '#0A4A4A' }]}>
            My Entries
          </Text>
          <Text style={[styles.cardSubtitle, { color: '#0A4A4A' }]}>
            {entries.length} reflections
          </Text>
          <View style={[styles.cardAccent, { backgroundColor: '#0A4A4A' }]} />
        </TouchableOpacity>
      </View>

      {/* Footer Pattern */}
      <View style={styles.footerPattern}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.patternDot} />
        ))}
      </View>
    </Animated.View>
  );

  const renderNewEntry = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.entryHeader}>
        <TouchableOpacity onPress={() => setCurrentView('home')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#f5f5dc" />
        </TouchableOpacity>
        <Text style={styles.entryHeaderTitle}>My Heart Right Now...</Text>
      </View>

      {/* Emotion Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <View style={styles.emotionGrid}>
          {EMOTIONS.map((emotion) => (
            <TouchableOpacity
              key={emotion.key}
              style={[
                styles.emotionChip,
                selectedEmotion === emotion.key && styles.emotionChipSelected,
              ]}
              onPress={() => setSelectedEmotion(emotion.key)}
              activeOpacity={0.7}
            >
              <Feather
                name={emotion.icon as any}
                size={20}
                color={selectedEmotion === emotion.key ? '#f5f5dc' : '#0A4A4A'}
              />
              <Text
                style={[
                  styles.emotionLabel,
                  selectedEmotion === emotion.key && styles.emotionLabelSelected,
                ]}
              >
                {emotion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Allah's Name Display */}
      {selectedEmotion && (
        <Animated.View
          style={[
            styles.allahNameCard,
            { opacity: fadeAnim, backgroundColor: ALLAH_NAMES[selectedEmotion].color },
          ]}
        >
          <View style={styles.nameOrnament} />
          <Text style={styles.arabicName}>{ALLAH_NAMES[selectedEmotion].arabic}</Text>
          <Text style={styles.englishName}>{ALLAH_NAMES[selectedEmotion].name}</Text>
          <View style={styles.divider} />
          <Text style={styles.nameMeaning}>{ALLAH_NAMES[selectedEmotion].meaning}</Text>
          <View style={styles.duaContainer}>
            <MaterialCommunityIcons name="hands-pray" size={16} color="#f5f5dc" />
            <Text style={styles.duaText}>{ALLAH_NAMES[selectedEmotion].dua}</Text>
          </View>
        </Animated.View>
      )}

      {/* Journal Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pour your heart out</Text>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Write freely... Allah is listening"
            placeholderTextColor="#5a8080"
            multiline
            numberOfLines={8}
            value={journalText}
            onChangeText={setJournalText}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Future Me Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message to Future Me</Text>
        <View style={styles.textInputContainer}>
          <TextInput
            style={[styles.textInput, { minHeight: 80 }]}
            placeholder="What would you tell yourself when you read this again?"
            placeholderTextColor="#5a8080"
            multiline
            numberOfLines={4}
            value={futureComment}
            onChangeText={setFutureComment}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, (!selectedEmotion || !journalText) && styles.saveButtonDisabled]}
        onPress={saveEntry}
        disabled={!selectedEmotion || !journalText}
        activeOpacity={0.8}
      >
        <Feather name="heart" size={20} color="#f5f5dc" />
        <Text style={styles.saveButtonText}>Save to Journal</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderEntries = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.entryHeader}>
        <TouchableOpacity onPress={() => setCurrentView('home')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#f5f5dc" />
        </TouchableOpacity>
        <Text style={styles.entryHeaderTitle}>My Journey</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="book-open-page-variant" size={80} color="#1a5f5f" />
          <Text style={styles.emptyStateText}>No entries yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Start your spiritual journey by creating your first entry
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setCurrentView('new')}
          >
            <Text style={styles.emptyStateButtonText}>Begin Writing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.entriesList} showsVerticalScrollIndicator={false}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryCardHeader}>
                <View style={styles.entryDateContainer}>
                  <Feather name="calendar" size={14} color="#5a8080" />
                  <Text style={styles.entryDate}>{entry.date}</Text>
                </View>
                <View
                  style={[
                    styles.emotionBadge,
                    { backgroundColor: entry.allahName.color },
                  ]}
                >
                  <Text style={styles.emotionBadgeText}>
                    {EMOTIONS.find((e) => e.key === entry.emotion)?.label}
                  </Text>
                </View>
              </View>

              <View style={styles.entryNameSection}>
                <Text style={styles.entryArabic}>{entry.allahName.arabic}</Text>
                <Text style={styles.entryEnglish}>{entry.allahName.name}</Text>
              </View>

              <Text style={styles.entryText} numberOfLines={4}>
                {entry.text}
              </Text>

              {entry.futureComment && (
                <View style={styles.futureCommentSection}>
                  <MaterialCommunityIcons name="message-text" size={14} color="#5a8080" />
                  <Text style={styles.futureCommentText} numberOfLines={2}>
                    {entry.futureComment}
                  </Text>
                </View>
              )}

              <View style={styles.entryFooter}>
                <Text style={styles.entryDua}>{entry.allahName.dua}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.app}>
      {currentView === 'home' && renderHome()}
      {currentView === 'new' && renderNewEntry()}
      {currentView === 'entries' && renderEntries()}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#0A4A4A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A4A4A',
  },
  
  // HOME SCREEN
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(26, 95, 95, 0.3)',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  crescentContainer: {
    marginBottom: 12,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f5f5dc',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a8c5c5',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  quoteSection: {
    marginTop: 30,
    marginHorizontal: 30,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(26, 95, 95, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.1)',
    position: 'relative',
  },
  ornamentLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#f5f5dc',
    opacity: 0.3,
  },
  ornamentRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#f5f5dc',
    opacity: 0.3,
  },
  quote: {
    fontSize: 16,
    color: '#f5f5dc',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  quoteRef: {
    fontSize: 12,
    color: '#a8c5c5',
    textAlign: 'center',
    marginTop: 8,
  },
  
  cardContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    gap: 16,
  },
  actionCard: {
    padding: 24,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  primaryCard: {
    backgroundColor: '#156565',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  secondaryCard: {
    backgroundColor: '#f5f5dc',
    borderWidth: 1,
    borderColor: 'rgba(10, 74, 74, 0.1)',
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f5f5dc',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#a8c5c5',
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#f5f5dc',
  },
  
  footerPattern: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
    marginBottom: 30,
  },
  patternDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245, 245, 220, 0.3)',
  },
  
  // NEW ENTRY SCREEN
  entryHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  entryHeaderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f5f5dc',
    flex: 1,
  },
  
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a8c5c5',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5dc',
    borderRadius: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emotionChipSelected: {
    backgroundColor: '#156565',
    borderColor: '#f5f5dc',
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4A4A',
  },
  emotionLabelSelected: {
    color: '#f5f5dc',
  },
  
  allahNameCard: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  nameOrnament: {
    position: 'absolute',
    top: 16,
    width: 60,
    height: 2,
    backgroundColor: '#f5f5dc',
    opacity: 0.3,
  },
  arabicName: {
    fontSize: 40,
    fontWeight: '700',
    color: '#f5f5dc',
    marginTop: 12,
    marginBottom: 8,
  },
  englishName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a8c5c5',
    marginBottom: 16,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#f5f5dc',
    opacity: 0.3,
    marginBottom: 16,
  },
  nameMeaning: {
    fontSize: 15,
    color: '#f5f5dc',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  duaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  duaText: {
    fontSize: 14,
    color: '#f5f5dc',
    fontStyle: 'italic',
  },
  
  textInputContainer: {
    backgroundColor: 'rgba(26, 95, 95, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.1)',
    padding: 4,
  },
  textInput: {
    fontSize: 15,
    color: '#f5f5dc',
    lineHeight: 22,
    padding: 16,
    minHeight: 120,
    fontFamily: 'System',
  },
  
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#156565',
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f5f5dc',
  },
  saveButtonDisabled: {
    backgroundColor: '#0d4040',
    borderColor: 'rgba(245, 245, 220, 0.3)',
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f5f5dc',
    letterSpacing: 0.5,
  },
  
  // ENTRIES SCREEN
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#f5f5dc',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a8c5c5',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyStateButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#156565',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5f5dc',
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f5f5dc',
  },
  
  entriesList: {
    flex: 1,
    paddingTop: 20,
  },
  entryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: 'rgba(26, 95, 95, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.1)',
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDate: {
    fontSize: 12,
    color: '#a8c5c5',
  },
  emotionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  emotionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f5f5dc',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  entryNameSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.1)',
  },
  entryArabic: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f5f5dc',
    marginBottom: 4,
  },
  entryEnglish: {
    fontSize: 14,
    color: '#a8c5c5',
    fontWeight: '600',
  },
  
  entryText: {
    fontSize: 14,
    color: '#f5f5dc',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  futureCommentSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f5f5dc',
  },
  futureCommentText: {
    flex: 1,
    fontSize: 13,
    color: '#a8c5c5',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  
  entryFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 245, 220, 0.1)',
  },
  entryDua: {
    fontSize: 13,
    color: '#a8c5c5',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  
  headerBackButton: {
    position: 'absolute',
    left: 20,
    padding: 6,
    borderRadius: 20,
  },
  
});