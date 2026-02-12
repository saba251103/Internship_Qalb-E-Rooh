import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// --- TYPES ---
interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
}

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  audio: string;
  translation?: string;
}

interface Ayah extends ApiAyah {
  surah: Surah;
}

interface UserProgress {
  [key: number]: {
    memorized: number[];
    needsPractice: number[];
  };
}

type ScreenMode = 'LIST' | 'SELECTION' | 'MEMORIZE';
type Tab = 'TO_MEMORISE' | 'MEMORISED' | 'NEEDS_PRACTICE';
type SwipeDirection = 'left' | 'right';

// --- CONFIG ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THEME = {
  // Primary gradient colors
  gradientStart: '#0A4A4A',
  gradientMid: '#064343',
  gradientEnd: '#032626',
  
  // Beige accents
  beige: '#f5f5dc',
  beigeSecondary: '#D2B48C',
  beigeTertiary: '#B8A488',
  
  // Status colors
  memorized: '#10B981',
  needsPractice: '#E08E55',
};

const PROGRESS_KEY = '@quran_app_progress_v10';
const SPEEDS = [1.0, 1.25, 1.5, 0.75];

// --- DECORATIVE PATTERN COMPONENT ---
const IslamicPattern = () => (
  <View style={styles.patternContainer}>
    {[...Array(20)].map((_, i) => (
      <View key={i} style={[styles.patternDot, {
        top: `${(i % 5) * 25}%`,
        left: `${Math.floor(i / 5) * 25}%`,
        opacity: 0.03
      }]} />
    ))}
  </View>
);

// --- INSTRUCTION MODAL ---
const InstructionModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={styles.modalOverlay}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <Animated.View style={styles.modalContainer}>
        <LinearGradient 
          colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={[THEME.beige, THEME.beigeSecondary]}
                style={styles.modalIconGradient}
              >
                <MaterialCommunityIcons name="book-open-page-variant" size={48} color={THEME.gradientStart} />
              </LinearGradient>
            </View>
            <View style={styles.modalTitleDivider} />
            <Text style={styles.modalTitle}>Memorization Guide</Text>
            <Text style={styles.modalSubtitle}>Master the Quran with intention</Text>
          </View>

          <View style={styles.modalFeatures}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="volume-high" size={24} color={THEME.beigeSecondary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Auditory Learning</Text>
                <Text style={styles.featureDesc}>Listen and repeat with adjustable speeds</Text>
              </View>
            </View>
            {/* Additional features can go here */}
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="eye-off" size={24} color={THEME.beigeSecondary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Visual Flashcards</Text>
                <Text style={styles.featureDesc}>Hide text to test your memory</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color={THEME.beigeSecondary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Swipe Gestures</Text>
                <Text style={styles.featureDesc}>Right for memorized, left for practice</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <MaterialCommunityIcons name="hand-pointing-up" size={24} color={THEME.beigeSecondary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Track Recitations</Text>
                <Text style={styles.featureDesc}>Tap to count your repetitions</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.modalButton} onPress={onClose} activeOpacity={0.8}>
            <LinearGradient
              colors={[THEME.beige, THEME.beigeSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalButtonGradient}
            >
              <Text style={styles.modalButtonText}>Begin Journey</Text>
              <Ionicons name="arrow-forward" size={20} color={THEME.gradientStart} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  </Modal>
);

// --- CUSTOM TAB BAR ---
const CustomTabBar = ({ activeTab, onTabPress }: { activeTab: Tab, onTabPress: (t: Tab) => void }) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity onPress={() => onTabPress('TO_MEMORISE')} style={styles.tabItemWrapper} activeOpacity={0.7}>
      {activeTab === 'TO_MEMORISE' ? (
        <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} style={styles.tabItem}>
          <MaterialCommunityIcons name="book-open-variant" size={16} color={THEME.gradientStart} />
          <Text style={[styles.tabText, styles.activeTabText]}>All Surahs</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.tabItem, styles.inactiveTab]}>
          <MaterialCommunityIcons name="book-open-variant" size={16} color={THEME.beigeTertiary} />
          <Text style={styles.tabText}>All Surahs</Text>
        </View>
      )}
    </TouchableOpacity>

    <TouchableOpacity onPress={() => onTabPress('MEMORISED')} style={styles.tabItemWrapper} activeOpacity={0.7}>
      {activeTab === 'MEMORISED' ? (
        <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} style={styles.tabItem}>
          <MaterialCommunityIcons name="check-decagram" size={16} color={THEME.memorized} />
          <Text style={[styles.tabText, styles.activeTabText]}>Memorized</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.tabItem, styles.inactiveTab]}>
          <MaterialCommunityIcons name="check-decagram" size={16} color={THEME.beigeTertiary} />
          <Text style={styles.tabText}>Memorized</Text>
        </View>
      )}
    </TouchableOpacity>

    <TouchableOpacity onPress={() => onTabPress('NEEDS_PRACTICE')} style={styles.tabItemWrapper} activeOpacity={0.7}>
      {activeTab === 'NEEDS_PRACTICE' ? (
        <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} style={styles.tabItem}>
          <MaterialCommunityIcons name="book-alert" size={16} color={THEME.needsPractice} />
          <Text style={[styles.tabText, styles.activeTabText]}>Practice</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.tabItem, styles.inactiveTab]}>
          <MaterialCommunityIcons name="book-alert" size={16} color={THEME.beigeTertiary} />
          <Text style={styles.tabText}>Practice</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

// --- FLASHCARD COMPONENT ---
interface FlashcardProps {
  ayah: Ayah;
  index: number;
  active: boolean;
  onSwipe: (dir: SwipeDirection, ayah: Ayah) => void;
  playAudio: (url: string) => void;
  isPlaying: boolean;
  toggleText: () => void;
  isTextHidden: boolean;
  speed: number;
  cycleSpeed: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ 
  ayah, index, active, onSwipe, playAudio, isPlaying, 
  toggleText, isTextHidden, speed, cycleSpeed 
}) => {
  const translateX = useSharedValue(0);
  const cardRotate = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (!active) return;
      translateX.value = event.translationX;
      cardRotate.value = event.translationX / 20;
    })
    .onEnd((event) => {
      if (!active) return;
      if (Math.abs(event.translationX) > 120) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        translateX.value = withSpring(direction === 'right' ? SCREEN_WIDTH + 50 : -SCREEN_WIDTH - 50);
        runOnJS(onSwipe)(direction, ayah);
      } else {
        translateX.value = withSpring(0);
        cardRotate.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value }, 
      { rotate: `${cardRotate.value}deg` },
      { scale: active ? 1 : 0.92 }
    ],
    opacity: active ? 1 : 0.5,
    zIndex: active ? 10 : 1,
  }));

  const overlayLeft = useAnimatedStyle(() => ({ 
    opacity: interpolate(translateX.value, [-150, -50], [1, 0], Extrapolate.CLAMP) 
  }));
  
  const overlayRight = useAnimatedStyle(() => ({ 
    opacity: interpolate(translateX.value, [50, 150], [0, 1], Extrapolate.CLAMP) 
  }));

  if (index < 0) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, rStyle]}>
        {/* CHANGED: Solid background gradient for opacity */}
        <LinearGradient
          colors={['#1F5F5B', '#154845']} 
          style={styles.cardGradient}
        >
          {/* Swipe Overlays */}
          <Animated.View style={[styles.overlay, overlayLeft]}>
            <LinearGradient colors={['#E08E55', '#D67845']} style={styles.overlayGradient}>
              <MaterialCommunityIcons name="book-alert-outline" size={64} color="white" />
              <Text style={styles.overlayText}>Practice More</Text>
            </LinearGradient>
          </Animated.View>
          
          <Animated.View style={[styles.overlay, overlayRight]}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.overlayGradient}>
              <MaterialCommunityIcons name="check-decagram" size={64} color="white" />
              <Text style={styles.overlayText}>Memorized!</Text>
            </LinearGradient>
          </Animated.View>

          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.surahBadge}>
                <Text style={styles.surahBadgeText}>{ayah.surah.englishName}</Text>
              </View>
              <Text style={styles.ayahNumber}>Ayah {ayah.numberInSurah}</Text>
            </View>
            <View style={styles.verseNumberContainer}>
              <Text style={styles.verseNumber}>{ayah.numberInSurah}</Text>
            </View>
          </View>

          {/* Card Body */}
          <ScrollView 
            style={styles.cardBody} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <IslamicPattern />
            <Text style={[styles.arabicText, isTextHidden && styles.blurredText]}>
              {ayah.text}
            </Text>
            <View style={styles.translationContainer}>
              <View style={styles.translationDivider} />
              <Text style={styles.translationText}>
                {!isTextHidden ? ayah.translation : "Toggle eye icon to reveal translation"}
              </Text>
            </View>
          </ScrollView>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlBtnSmall} onPress={cycleSpeed} activeOpacity={0.7}>
              <View style={styles.controlBtnContent}>
                <Ionicons name="speedometer-outline" size={18} color={THEME.beige} />
                <Text style={styles.controlText}>{speed}x</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtnLarge} onPress={() => playAudio(ayah.audio)} activeOpacity={0.8}>
              <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} style={styles.playBtnGradient}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={36} color={THEME.gradientStart} style={{marginLeft: isPlaying ? 0 : 4}} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlBtnSmall} onPress={toggleText} activeOpacity={0.7}>
              <View style={styles.controlBtnContent}>
                <Ionicons name={isTextHidden ? "eye-off-outline" : "eye-outline"} size={22} color={THEME.beige} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Swipe Hint */}
          <View style={styles.swipeHint}>
            <View style={styles.swipeHintItem}>
              <Ionicons name="arrow-back" size={14} color={THEME.needsPractice} />
              <Text style={styles.swipeHintText}>Practice</Text>
            </View>
            <View style={styles.swipeHintDivider} />
            <View style={styles.swipeHintItem}>
              <Text style={styles.swipeHintText}>Memorized</Text>
              <Ionicons name="arrow-forward" size={14} color={THEME.memorized} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

// --- MAIN APPLICATION ---
export default function MemorizeScreen() {
  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'), 
  });

  const [screen, setScreen] = useState<ScreenMode>('LIST');
  const [activeTab, setActiveTab] = useState<Tab>('TO_MEMORISE');
  
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({});
  
  const [activeSurah, setActiveSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTextHidden, setIsTextHidden] = useState(false);
  const [recitedCount, setRecitedCount] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => { 
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    });
    loadInitialData(); 
  }, []);

  const loadInitialData = async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await response.json();
      setSurahs(data.data);
      const savedProgress = await AsyncStorage.getItem(PROGRESS_KEY);
      if (savedProgress) setUserProgress(JSON.parse(savedProgress));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSurahData = async (surahNumber: number): Promise<ApiAyah[]> => {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/ar.alafasy,en.sahih`);
      const data = await res.json();
      const arabicData = data.data[0].ayahs;
      const englishData = data.data[1].ayahs;
      return arabicData.map((item: any, i: number) => ({ ...item, translation: englishData[i].text }));
  };

  const handleSurahPress = async (surah: Surah) => {
    setActiveSurah(surah);
    setLoading(true);
    setScreen('SELECTION');

    try {
      const fullAyahs = await fetchSurahData(surah.number);
      let mappedAyahs: Ayah[] = fullAyahs.map((a: ApiAyah) => ({ ...a, surah }));

      if (activeTab === 'NEEDS_PRACTICE') {
        const weakAyahs = userProgress[surah.number]?.needsPractice || [];
        mappedAyahs = mappedAyahs.filter(a => weakAyahs.includes(a.numberInSurah));
      } else if (activeTab === 'MEMORISED') {
        const memoAyahs = userProgress[surah.number]?.memorized || [];
        mappedAyahs = mappedAyahs.filter(a => memoAyahs.includes(a.numberInSurah));
      }

      setAyahs(mappedAyahs);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startFromAyahIndex = (index: number) => {
    setCurrentIndex(index);
    setRecitedCount(0);
    setScreen('MEMORIZE');
  };

  const handleSwipe = async (direction: SwipeDirection, ayah: Ayah) => {
    const surahId = ayah.surah.number;
    const ayahNum = ayah.numberInSurah;
    const newProgress = { ...userProgress };
    
    if (!newProgress[surahId]) newProgress[surahId] = { memorized: [], needsPractice: [] };

    if (direction === 'right') { 
      if (!newProgress[surahId].memorized.includes(ayahNum)) newProgress[surahId].memorized.push(ayahNum);
      newProgress[surahId].needsPractice = newProgress[surahId].needsPractice.filter(n => n !== ayahNum);
    } else { 
      if (!newProgress[surahId].needsPractice.includes(ayahNum)) newProgress[surahId].needsPractice.push(ayahNum);
      newProgress[surahId].memorized = newProgress[surahId].memorized.filter(n => n !== ayahNum);
    }

    setUserProgress(newProgress);
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setRecitedCount(0);
    }, 300);
  };

  const playAudio = async (url: string) => {
    if (sound) { await sound.unloadAsync(); setSound(null); setIsPlaying(false); }
    
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldCorrectPitch: true, rate: speed, volume: 1.0 }
    );
    
    setSound(newSound);
    setIsPlaying(true);
    
    await newSound.playAsync();
    newSound.setOnPlaybackStatusUpdate(status => { 
      if (status.isLoaded && status.didJustFinish) setIsPlaying(false); 
    });
  };

  const cycleSpeed = async () => {
    const idx = SPEEDS.indexOf(speed);
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(nextSpeed);
    if (sound) await sound.setRateAsync(nextSpeed, true); 
  };

  // --- RENDERERS ---
  if (!fontsLoaded) return (
    <LinearGradient colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]} style={styles.emptyContainer}>
      <ActivityIndicator color={THEME.beige} size="large" />
    </LinearGradient>
  );

  const renderSelectionScreen = () => {
    if (!activeSurah) return null;
    const surahStats = userProgress[activeSurah.number] || { memorized: [], needsPractice: [] };

    return (
      <LinearGradient colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]} style={styles.container}>
        <IslamicPattern />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('LIST')} style={styles.headerBackBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={THEME.beige} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{activeSurah.englishName}</Text>
            <Text style={styles.headerSubtitle}>{activeSurah.englishNameTranslation}</Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsNumber}>{ayahs.length}</Text>
            <Text style={styles.headerStatsLabel}>ayahs</Text>
          </View>
        </View>

        <View style={styles.selectionInfo}>
          <LinearGradient colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.05)']} style={styles.selectionInfoGradient}>
            <Ionicons name="information-circle-outline" size={20} color={THEME.beigeSecondary} />
            <Text style={styles.selectionInfoText}>
              {activeTab === 'NEEDS_PRACTICE' ? 'Review verses that need practice' : 
               activeTab === 'MEMORISED' ? 'Strengthen your memorized verses' : 
               'Select any verse to begin'}
            </Text>
          </LinearGradient>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={THEME.beige} size="large" />
            <Text style={styles.loadingText}>Loading verses...</Text>
          </View>
        ) : (
          <FlatList
            data={ayahs}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={{paddingBottom: 40, paddingTop: 10}}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="book-open-variant" size={64} color={THEME.beigeTertiary} />
                <Text style={styles.emptyText}>No verses in this category</Text>
                <Text style={styles.emptySubtext}>Try selecting a different tab</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const isMemorized = surahStats.memorized.includes(item.numberInSurah);
              const isNeedsPractice = surahStats.needsPractice.includes(item.numberInSurah);

              return (
                <TouchableOpacity style={styles.ayahListItem} onPress={() => startFromAyahIndex(index)} activeOpacity={0.7}>
                  <LinearGradient colors={['rgba(245, 245, 220, 0.1)', 'rgba(245, 245, 220, 0.05)']} style={styles.ayahListGradient}>
                    <View style={[
                      styles.statusIndicator, 
                      isMemorized && {backgroundColor: THEME.memorized},
                      isNeedsPractice && {backgroundColor: THEME.needsPractice}
                    ]} />
                    <View style={styles.ayahNumberCircle}>
                      <LinearGradient
                        colors={isMemorized || isNeedsPractice ? [THEME.beigeSecondary, THEME.beigeTertiary] : ['rgba(245, 245, 220, 0.2)', 'rgba(245, 245, 220, 0.1)']}
                        style={styles.ayahNumberGradient}
                      >
                        <Text style={[styles.ayahNumberText, (isMemorized || isNeedsPractice) && {color: THEME.gradientStart}]}>
                          {item.numberInSurah}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.ayahListContent}>
                      <Text style={styles.ayahListArabic} numberOfLines={1}>{item.text}</Text>
                      <Text style={styles.ayahListTranslation} numberOfLines={2}>{item.translation}</Text>
                    </View>
                    <View style={styles.playIconContainer}>
                      <Ionicons name="play-circle" size={32} color={THEME.beigeSecondary} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </LinearGradient>
    );
  };

  const renderList = () => {
    const filteredSurahs = surahs.filter(s => {
      if (activeTab === 'TO_MEMORISE') return true;
      const stats = userProgress[s.number];
      if (!stats) return false;
      if (activeTab === 'MEMORISED') return stats.memorized.length > 0;
      if (activeTab === 'NEEDS_PRACTICE') return stats.needsPractice.length > 0;
      return false;
    });

    return (
      <LinearGradient colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]} style={styles.container}>
        <IslamicPattern />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
            <Ionicons name="menu" size={24} color={THEME.beige} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="book-open-page-variant" size={28} color={THEME.beigeSecondary} />
            <Text style={styles.headerTitle}>My Hifz</Text>
          </View>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.infoBtn} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={28} color={THEME.beige} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsOverview}>
          <LinearGradient colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.08)']} style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Object.values(userProgress).reduce((acc, p) => acc + p.memorized.length, 0)}</Text>
              <Text style={styles.statLabel}>Memorized</Text>
              <View style={[styles.statDot, {backgroundColor: THEME.memorized}]} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Object.values(userProgress).reduce((acc, p) => acc + p.needsPractice.length, 0)}</Text>
              <Text style={styles.statLabel}>Practicing</Text>
              <View style={[styles.statDot, {backgroundColor: THEME.needsPractice}]} />
            </View>
          </LinearGradient>
        </View>

        <CustomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
        
        <FlatList 
          data={filteredSurahs}
          keyExtractor={item => item.number.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => {
             const stats = userProgress[item.number];
             let subText = `${item.numberOfAyahs} verses`;
             let progressCount = 0;
             let progressColor = THEME.beigeTertiary;
             
             if (activeTab === 'NEEDS_PRACTICE' && stats) {
               subText = `${stats.needsPractice.length} need practice`;
               progressColor = THEME.needsPractice;
             }
             if (activeTab === 'MEMORISED' && stats) {
               subText = `${stats.memorized.length} memorized`;
               progressColor = THEME.memorized;
             }

             return (
               <TouchableOpacity style={styles.listItem} onPress={() => handleSurahPress(item)} activeOpacity={0.7}>
                 <LinearGradient colors={['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.06)']} style={styles.listItemGradient}>
                   <View style={styles.listLeft}>
                     <View style={styles.listNumberContainer}>
                       <LinearGradient colors={[THEME.beigeSecondary, THEME.beigeTertiary]} style={styles.listNumberGradient}>
                         <Text style={styles.listNumber}>{item.number}</Text>
                       </LinearGradient>
                     </View>
                     <View style={styles.listInfo}>
                       <Text style={styles.surahName}>{item.englishName}</Text>
                       <Text style={styles.surahEnglish}>{item.englishNameTranslation}</Text>
                       <View style={styles.verseCountContainer}>
                         <Ionicons name="bookmark-outline" size={12} color={progressColor} />
                         <Text style={[styles.verseCount, {color: progressColor}]}>{subText}</Text>
                       </View>
                     </View>
                   </View>
                   <View style={styles.listRight}>
                     <Text style={styles.surahArabic}>{item.name.replace('سورة', '').trim()}</Text>
                     <Ionicons name="chevron-forward" size={20} color={THEME.beigeTertiary} />
                   </View>
                 </LinearGradient>
               </TouchableOpacity>
             );
          }}
          contentContainerStyle={{paddingBottom: 100, paddingTop: 10}}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color={THEME.beigeTertiary} />
              <Text style={styles.emptyText}>No surahs found</Text>
              <Text style={styles.emptySubtext}>Start memorizing to see progress</Text>
            </View>
          }
        />
      </LinearGradient>
    );
  };

  const renderMemorize = () => (
      <LinearGradient colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]} style={styles.container}>
        <IslamicPattern />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('SELECTION')} style={styles.headerBackBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={THEME.beige} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Practice Session</Text>
            <Text style={styles.headerSubtitle}>{currentIndex + 1} of {ayahs.length}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.infoBtn} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={24} color={THEME.beige} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={[THEME.beige, THEME.beigeSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${((currentIndex) / ayahs.length) * 100}%` }]}
            />
          </View>
        </View>

        <View style={styles.cardArea}>
          {loading ? (
            <ActivityIndicator color={THEME.beige} size="large" />
          ) : (
            ayahs.map((ayah, index) => {
              if (index < currentIndex || index > currentIndex + 1) return null;
              
              // CHANGED: Added centering wrapper View
              return (
                <View 
                  key={ayah.number} 
                  style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Flashcard 
                    ayah={ayah} 
                    index={index} 
                    active={index === currentIndex}
                    onSwipe={handleSwipe} 
                    playAudio={playAudio} 
                    isPlaying={isPlaying}
                    toggleText={() => setIsTextHidden(!isTextHidden)} 
                    isTextHidden={isTextHidden}
                    speed={speed} 
                    cycleSpeed={cycleSpeed}
                  />
                </View>
              );
            }).reverse()
          )}
          
          {!loading && currentIndex >= ayahs.length && (
            <View style={styles.completionContainer}>
              <LinearGradient colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.08)']} style={styles.completionCard}>
                <View style={styles.completionIconContainer}>
                  <LinearGradient colors={[THEME.memorized, '#059669']} style={styles.completionIconGradient}>
                    <MaterialCommunityIcons name="check-all" size={48} color="white" />
                  </LinearGradient>
                </View>
                <Text style={styles.completionTitle}>Session Complete!</Text>
                <Text style={styles.completionSubtitle}>You've completed {ayahs.length} verses</Text>
                <TouchableOpacity onPress={() => setScreen('LIST')} style={styles.completionBtn} activeOpacity={0.8}>
                  <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.completionBtnGradient}>
                    <Text style={styles.completionBtnText}>Return to Dashboard</Text>
                    <Ionicons name="home" size={20} color={THEME.gradientStart} />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>
        
        {currentIndex < ayahs.length && (
          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.recitedPill} activeOpacity={0.7} onPress={() => setRecitedCount(prev => prev + 1)}>
              <LinearGradient colors={['rgba(245, 245, 220, 0.2)', 'rgba(245, 245, 220, 0.1)']} style={styles.recitedPillGradient}>
                <View style={styles.recitedIcon}>
                  <MaterialCommunityIcons name="hand-pointing-up" size={24} color={THEME.beigeSecondary} />
                </View>
                <View style={styles.recitedContent}>
                  <Text style={styles.recitedLabel}>Recitation Count</Text>
                  <Text style={styles.recitedCount}>{recitedCount}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex:1, backgroundColor: THEME.gradientStart}}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.gradientStart} />
        <GestureHandlerRootView style={{flex:1}}>
          {screen === 'LIST' ? renderList() : 
           screen === 'SELECTION' ? renderSelectionScreen() : 
           renderMemorize()}
          <InstructionModal visible={showHelp} onClose={() => setShowHelp(false)} />
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  patternContainer: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  patternDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.beige },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 10, zIndex: 1 },
  headerBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245, 245, 220, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: THEME.beige, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 },
  headerSubtitle: { color: THEME.beigeSecondary, fontSize: 13, marginTop: 2, fontWeight: '500' },
  headerStats: { alignItems: 'center', backgroundColor: 'rgba(245, 245, 220, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  headerStatsNumber: { color: THEME.beige, fontSize: 18, fontWeight: 'bold' },
  headerStatsLabel: { color: THEME.beigeSecondary, fontSize: 10, fontWeight: '600' },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245, 245, 220, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245, 245, 220, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  statsOverview: { paddingHorizontal: 20, marginBottom: 20, zIndex: 1 },
  statsCard: { flexDirection: 'row', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { color: THEME.beige, fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: THEME.beigeSecondary, fontSize: 13, marginTop: 4, fontWeight: '600' },
  statDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  statDivider: { width: 1, backgroundColor: 'rgba(245, 245, 220, 0.2)', marginHorizontal: 20 },
  selectionInfo: { paddingHorizontal: 20, marginBottom: 15, zIndex: 1 },
  selectionInfoGradient: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  selectionInfoText: { flex: 1, color: THEME.beige, fontSize: 14, fontWeight: '500' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10, zIndex: 1 },
  tabItemWrapper: { flex: 1 },
  tabItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, gap: 8 },
  inactiveTab: { backgroundColor: 'rgba(245, 245, 220, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  tabText: { color: THEME.beigeTertiary, fontWeight: '600', fontSize: 13 },
  activeTabText: { color: THEME.gradientStart, fontWeight: 'bold' },
  listItem: { marginHorizontal: 20, marginBottom: 12, borderRadius: 20, overflow: 'hidden' },
  listItemGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.15)' },
  listLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 15 },
  listNumberContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  listNumberGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  listNumber: { color: THEME.gradientStart, fontSize: 18, fontWeight: 'bold' },
  listInfo: { flex: 1 },
  surahName: { color: THEME.beige, fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  surahEnglish: { color: THEME.beigeSecondary, fontSize: 13, marginBottom: 6 },
  verseCountContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verseCount: { fontSize: 12, fontWeight: '600' },
  listRight: { alignItems: 'flex-end', gap: 8 },
  surahArabic: { color: THEME.beige, fontSize: 26, fontFamily: 'IndoPakQuran' },
  ayahListItem: { marginHorizontal: 20, marginBottom: 10, borderRadius: 16, overflow: 'hidden' },
  ayahListGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.15)' },
  statusIndicator: { width: 4, height: '70%', borderRadius: 2, marginRight: 12, backgroundColor: 'rgba(245, 245, 220, 0.15)' },
  ayahNumberCircle: { width: 44, height: 44, borderRadius: 22, marginRight: 12, overflow: 'hidden' },
  ayahNumberGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.3)' },
  ayahNumberText: { color: THEME.beige, fontWeight: 'bold', fontSize: 16 },
  ayahListContent: { flex: 1, marginRight: 12 },
  ayahListArabic: { color: THEME.beige, fontSize: 20, textAlign: 'left', marginBottom: 6, fontFamily: 'IndoPakQuran' },
  ayahListTranslation: { color: THEME.beigeSecondary, fontSize: 13, lineHeight: 18 },
  playIconContainer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressBarContainer: { paddingHorizontal: 20, marginBottom: 20, zIndex: 1 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(245, 245, 220, 0.15)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: { 
    width: SCREEN_WIDTH * 0.9, 
    height: SCREEN_HEIGHT * 0.55, 
    borderRadius: 28, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 24, 
    elevation: 12 
  },
  cardGradient: { flex: 1, borderRadius: 28, padding: 24, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  cardHeaderLeft: { flex: 1 },
  surahBadge: { backgroundColor: 'rgba(245, 245, 220, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 6, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  surahBadgeText: { color: THEME.beige, fontSize: 13, fontWeight: '600' },
  ayahNumber: { color: THEME.beigeSecondary, fontSize: 14, fontWeight: '600' },
  verseNumberContainer: { borderWidth: 2, borderColor: THEME.beige, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 245, 220, 0.1)' },
  verseNumber: { color: THEME.beige, fontSize: 14, fontWeight: 'bold' },
  cardBody: { flex: 1, paddingVertical: 20 },
  arabicText: { fontSize: 36, color: THEME.beige, textAlign: 'center', lineHeight: 64, fontWeight: '600', fontFamily: 'IndoPakQuran', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  blurredText: { color: 'transparent', textShadowColor: 'rgba(245, 245, 220, 0.3)', textShadowRadius: 12 },
  translationContainer: { marginTop: 30, width: '100%' },
  translationDivider: { height: 2, backgroundColor: THEME.beigeSecondary, width: 60, marginBottom: 15, alignSelf: 'center', borderRadius: 1, opacity: 0.5 },
  translationText: { color: THEME.beigeSecondary, textAlign: 'center', fontSize: 15, lineHeight: 24, fontWeight: '500' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', zIndex: 2 },
  controlBtnSmall: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  controlBtnContent: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 245, 220, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.3)', gap: 2 },
  controlText: { color: THEME.beige, fontWeight: 'bold', fontSize: 13 },
  playBtnLarge: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', shadowColor: THEME.beige, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  playBtnGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, borderRadius: 28, zIndex: 20, overflow: 'hidden' },
  overlayGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: 16, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowRadius: 8 },
  swipeHint: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, zIndex: 2 },
  swipeHintItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swipeHintText: { color: THEME.beigeTertiary, fontSize: 12, fontWeight: '600' },
  swipeHintDivider: { width: 1, height: 16, backgroundColor: 'rgba(245, 245, 220, 0.2)' },
  footerContainer: { paddingBottom: 30, paddingHorizontal: 20 },
  recitedPill: { borderRadius: 24, overflow: 'hidden', marginTop: 20 },
  recitedPillGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 16, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  recitedIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245, 245, 220, 0.15)', alignItems: 'center', justifyContent: 'center' },
  recitedContent: { flex: 1 },
  recitedLabel: { color: THEME.beigeSecondary, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  recitedCount: { color: THEME.beige, fontSize: 24, fontWeight: 'bold' },
  completionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  completionCard: { width: '100%', padding: 40, borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  completionIconContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 24, overflow: 'hidden' },
  completionIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  completionTitle: { color: THEME.beige, fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  completionSubtitle: { color: THEME.beigeSecondary, fontSize: 16, marginBottom: 32, textAlign: 'center' },
  completionBtn: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  completionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  completionBtnText: { color: THEME.gradientStart, fontWeight: 'bold', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: THEME.beigeSecondary, fontSize: 16, marginTop: 16, fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: THEME.beige, fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtext: { color: THEME.beigeTertiary, fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContainer: { width: '100%', maxWidth: 350 },
  modalContent: { borderRadius: 28, padding: 32, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  modalHeader: { alignItems: 'center', marginBottom: 32 },
  modalIconContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 20, overflow: 'hidden' },
  modalIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  modalTitleDivider: { width: 60, height: 3, backgroundColor: THEME.beigeSecondary, marginBottom: 16, borderRadius: 2 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: THEME.beige, textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 15, color: THEME.beigeSecondary, textAlign: 'center', fontWeight: '500' },
  modalFeatures: { gap: 20, marginBottom: 32 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245, 245, 220, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  featureText: { flex: 1 },
  featureTitle: { color: THEME.beige, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  featureDesc: { color: THEME.beigeSecondary, fontSize: 13, lineHeight: 18 },
  modalButton: { borderRadius: 20, overflow: 'hidden' },
  modalButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  modalButtonText: { color: THEME.gradientStart, fontWeight: 'bold', fontSize: 16 },
});