import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// --- RESPONSIVE UTILITIES ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const isTablet = SCREEN_WIDTH >= 768;

const scale = (size: number): number => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number): number => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size: number, factor = 0.5): number => size + (scale(size) - size) * factor;

const responsiveFontSize = (size: number): number => {
  const normalized = size / PixelRatio.getFontScale();
  return Math.round(PixelRatio.roundToNearestPixel(normalized));
};

const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(40),
};

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
const THEME = {
  gradientStart: '#0A4A4A',
  gradientMid: '#064343',
  gradientEnd: '#032626',
  beige: '#f5f5dc',
  beigeSecondary: '#D2B48C',
  beigeTertiary: '#B8A488',
  memorized: '#10B981',
  needsPractice: '#E08E55',
};

const PROGRESS_KEY = '@quran_app_progress_v10';
const SPEEDS = [1.0, 1.25, 1.5, 0.75];

const getCardDimensions = () => {
  const cardWidth = isTablet ? SCREEN_WIDTH * 0.7 : SCREEN_WIDTH * 0.9;
  const cardHeight = isTablet ? SCREEN_HEIGHT * 0.6 : isSmallDevice ? SCREEN_HEIGHT * 0.5 : SCREEN_HEIGHT * 0.55;
  return { width: cardWidth, height: cardHeight };
};

const SWIPE_THRESHOLD = 100;

// --- DECORATIVE PATTERN COMPONENT ---
const IslamicPattern = () => (
  <View style={styles.patternContainer}>
    {[...Array(isTablet ? 30 : 20)].map((_, i) => (
      <View key={i} style={[styles.patternDot, {
        top: `${(i % (isTablet ? 6 : 5)) * (isTablet ? 16.67 : 25)}%`,
        left: `${Math.floor(i / (isTablet ? 6 : 5)) * (isTablet ? 16.67 : 25)}%`,
        opacity: 0.03,
        width: scale(8),
        height: scale(8),
        borderRadius: scale(4),
      }]} />
    ))}
  </View>
);

// --- INSTRUCTION MODAL ---
// Place this array outside the component or inside the file scope
const MODAL_FEATURES = [
  {
    icon: 'volume-high',
    lib: Ionicons,
    text: 'Listen, Pause & Repeat'
  },
  {
    icon: 'eye-off',
    lib: Ionicons,
    text: 'Hide text to test memory'
  },
  {
    icon: 'gesture-swipe',
    lib: MaterialCommunityIcons,
    text: 'Swipe Right if Memorized'
  },
];

const InstructionModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => (
  <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
    <View style={styles.modalOverlay}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.modalContainer}>
        <LinearGradient 
          colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
          style={styles.modalContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <LinearGradient 
                colors={[THEME.beige, 'rgba(245, 245, 220, 0.5)']} 
                style={styles.modalIconGradient}
              >
                <MaterialCommunityIcons name="book-open-page-variant" size={moderateScale(42)} color={THEME.gradientStart} />
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>Memorization Guide</Text>
            <View style={styles.modalTitleDivider} />
            <Text style={styles.modalSubtitle}>Master your journey with these tools</Text>
          </View>
          
          {/* Features List */}
          <ScrollView style={styles.modalFeaturesScroll} contentContainerStyle={styles.modalFeatures}>
            {MODAL_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <feature.lib name={feature.icon as any} size={moderateScale(22)} color={THEME.beige} />
                </View>
                <Text style={styles.featureDesc}>{feature.text}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Button */}
          <TouchableOpacity style={styles.modalButton} onPress={onClose} activeOpacity={0.8}>
            <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} style={styles.modalButtonGradient}>
              <Text style={styles.modalButtonText}>Begin Journey</Text>
              <Ionicons name="arrow-forward" size={18} color={THEME.gradientStart} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  </Modal>
);

// --- CUSTOM TAB BAR ---
const CustomTabBar = ({ activeTab, onTabPress }: { activeTab: Tab, onTabPress: (t: Tab) => void }) => (
  <View style={styles.tabContainer}>
    {['TO_MEMORISE', 'MEMORISED', 'NEEDS_PRACTICE'].map((tab) => {
      const isSelected = activeTab === tab;
      const icons = { TO_MEMORISE: 'book-open-variant', MEMORISED: 'check-decagram', NEEDS_PRACTICE: 'book-alert' };
      const labels = { TO_MEMORISE: 'All Surahs', MEMORISED: 'Memorized', NEEDS_PRACTICE: 'Practice' };
      const colors = { TO_MEMORISE: THEME.gradientStart, MEMORISED: THEME.memorized, NEEDS_PRACTICE: THEME.needsPractice };
      
      return (
        <TouchableOpacity key={tab} onPress={() => onTabPress(tab as Tab)} style={styles.tabItemWrapper} activeOpacity={0.7}>
          {isSelected ? (
            <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} style={styles.tabItem}>
              <MaterialCommunityIcons name={icons[tab as keyof typeof icons] as any} size={moderateScale(16)} color={colors[tab as keyof typeof colors]} />
              <Text style={[styles.tabText, styles.activeTabText]}>{labels[tab as keyof typeof labels]}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.tabItem, styles.inactiveTab]}>
              <MaterialCommunityIcons name={icons[tab as keyof typeof icons] as any} size={moderateScale(16)} color={THEME.beigeTertiary} />
              <Text style={styles.tabText}>{labels[tab as keyof typeof labels]}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// --- FLASHCARD COMPONENT ---
interface FlashcardProps {
  ayah: Ayah;
  index: number;
  active: boolean;
  onSwipe: (dir: SwipeDirection, ayah: Ayah) => void;
  playAudio: () => void;
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
  const cardDimensions = getCardDimensions();

  const handleSwipeComplete = useCallback((direction: SwipeDirection) => {
    onSwipe(direction, ayah);
  }, [ayah, onSwipe]);

  const pan = Gesture.Pan()
    .enabled(active)
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      cardRotate.value = event.translationX / 20;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        translateX.value = withTiming(direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100, { duration: 300 });
        runOnJS(handleSwipeComplete)(direction);
      } else {
        translateX.value = withSpring(0);
        cardRotate.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${cardRotate.value}deg` }, { scale: active ? 1 : 0.94 }],
    opacity: active ? 1 : 0.8, // Increased opacity so the next card is visible
    zIndex: active ? 10 : 1,
  }), [active]);

  const overlayLeft = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [-150, -50], [1, 0], Extrapolate.CLAMP) }));
  const overlayRight = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [50, 150], [0, 1], Extrapolate.CLAMP) }));

  if (index < 0) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, rStyle, { width: cardDimensions.width, height: cardDimensions.height }]}>
        <LinearGradient colors={['#1F5F5B', '#154845']} style={styles.cardGradient}>
          <Animated.View style={[styles.overlay, overlayLeft]} pointerEvents="none">
            <LinearGradient colors={['#E08E55', '#D67845']} style={styles.overlayGradient}>
              <MaterialCommunityIcons name="book-alert-outline" size={moderateScale(64)} color="white" />
              <Text style={styles.overlayText}>Practice More</Text>
            </LinearGradient>
          </Animated.View>
          <Animated.View style={[styles.overlay, overlayRight]} pointerEvents="none">
            <LinearGradient colors={['#10B981', '#059669']} style={styles.overlayGradient}>
              <MaterialCommunityIcons name="check-decagram" size={moderateScale(64)} color="white" />
              <Text style={styles.overlayText}>Memorized!</Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.surahBadge}><Text style={styles.surahBadgeText}>{ayah.surah.englishName}</Text></View>
              <Text style={styles.ayahNumber}>Ayah {ayah.numberInSurah}</Text>
            </View>
            <View style={styles.verseNumberContainer}><Text style={styles.verseNumber}>{ayah.numberInSurah}</Text></View>
          </View>

          <ScrollView 
            style={styles.cardBody} 
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.md }}
            scrollEnabled={active}
          >
            <IslamicPattern />
            {/* FIXED: Text visibility for Android */}
            {!isTextHidden ? (
              <Text style={styles.arabicText}>
                {ayah.text}
              </Text>
            ) : (
              <View style={styles.hiddenPlaceholder}>
                <Ionicons 
                  name="eye-off-outline" 
                  size={moderateScale(32)} 
                  color={THEME.beigeSecondary} 
                />
                <Text style={styles.hiddenHint}>
                  Tap eye icon to reveal
                </Text>
              </View>
            )}

            <View style={styles.translationContainer}>
              <View style={styles.translationDivider} />
              <Text style={styles.translationText}>
                {!isTextHidden ? ayah.translation : "Toggle eye icon to reveal translation"}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlBtnSmall} onPress={cycleSpeed}>
              <View style={styles.controlBtnContent}>
                <Ionicons name="speedometer-outline" size={moderateScale(18)} color={THEME.beige} />
                <Text style={styles.controlText}>{speed}x</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtnLarge} onPress={playAudio}>
              <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} style={styles.playBtnGradient}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={moderateScale(36)} 
                  color={THEME.gradientStart} 
                  style={{marginLeft: isPlaying ? 0 : scale(4)}} 
                />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtnSmall} onPress={toggleText}>
              <View style={styles.controlBtnContent}>
                <Ionicons name={isTextHidden ? "eye-off-outline" : "eye-outline"} size={moderateScale(22)} color={THEME.beige} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.swipeHint}>
            <View style={styles.swipeHintItem}><Ionicons name="arrow-back" size={moderateScale(14)} color={THEME.needsPractice} /><Text style={styles.swipeHintText}>Practice</Text></View>
            <View style={styles.swipeHintDivider} />
            <View style={styles.swipeHintItem}><Text style={styles.swipeHintText}>Memorized</Text><Ionicons name="arrow-forward" size={moderateScale(14)} color={THEME.memorized} /></View>
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

// --- MAIN APPLICATION ---
export default function MemorizeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ 'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf') });
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
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

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
      return data.data[0].ayahs.map((item: any, i: number) => ({ ...item, translation: data.data[1].ayahs[i].text }));
  };

  const handleSurahPress = async (surah: Surah) => {
    setActiveSurah(surah);
    setLoading(true);
    setScreen('SELECTION');
    try {
      const fullAyahs = await fetchSurahData(surah.number);
      let mappedAyahs: Ayah[] = fullAyahs.map((a: ApiAyah) => ({ ...a, surah }));
      if (activeTab === 'NEEDS_PRACTICE') {
        const weak = userProgress[surah.number]?.needsPractice || [];
        mappedAyahs = mappedAyahs.filter(a => weak.includes(a.numberInSurah));
      } else if (activeTab === 'MEMORISED') {
        const memo = userProgress[surah.number]?.memorized || [];
        mappedAyahs = mappedAyahs.filter(a => memo.includes(a.numberInSurah));
      }
      setAyahs(mappedAyahs);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startFromAyahIndex = (index: number) => {
    setCurrentIndex(index);
    setRecitedCount(0);
    setScreen('MEMORIZE');
  };

  const handleSwipe = useCallback(async (direction: SwipeDirection, ayah: Ayah) => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }

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
    }, 350);
  }, [userProgress, sound]);

  const playAudio = async () => {
    const currentAyah = ayahs[currentIndex];
    if (!currentAyah) return;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        } else {
          await loadAndPlay(currentAyah.audio);
        }
      } else {
        await loadAndPlay(currentAyah.audio);
      }
    } catch (error) {
      console.log("Error playing audio", error);
    }
  };

  const loadAndPlay = async (url: string) => {
    if (sound) await sound.unloadAsync();
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldCorrectPitch: true, rate: speed, volume: 1.0 }
    );
    setSound(newSound);
    setIsPlaying(true);
    await newSound.playAsync();
    newSound.setOnPlaybackStatusUpdate(status => { 
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
        newSound.setPositionAsync(0); 
      }
    });
  };

  // Reset Audio when index changes
  useEffect(() => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  }, [currentIndex]);

  const cycleSpeed = async () => {
    const idx = SPEEDS.indexOf(speed);
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(nextSpeed);
    if (sound) await sound.setRateAsync(nextSpeed, true); 
  };

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
            <Ionicons name="arrow-back" size={moderateScale(24)} color={THEME.beige} />
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
            <Ionicons name="information-circle-outline" size={moderateScale(20)} color={THEME.beigeSecondary} />
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
            contentContainerStyle={{paddingBottom: spacing.xxl, paddingTop: spacing.sm}}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
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
                      <Ionicons name="play-circle" size={moderateScale(32)} color={THEME.beigeSecondary} />
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
          <TouchableOpacity onPress={() => router.back()} style={styles.menuBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={moderateScale(24)} color={THEME.beige} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="book-open-page-variant" size={moderateScale(28)} color={THEME.beigeSecondary} />
            <Text style={styles.headerTitle}>My Hifz</Text>
          </View>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.infoBtn} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={moderateScale(28)} color={THEME.beige} />
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
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({item}) => {
             const stats = userProgress[item.number];
             let subText = `${item.numberOfAyahs} verses`;
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
                         <Ionicons name="bookmark-outline" size={moderateScale(12)} color={progressColor} />
                         <Text style={[styles.verseCount, {color: progressColor}]}>{subText}</Text>
                       </View>
                     </View>
                   </View>
                   <View style={styles.listRight}>
                     <Text style={styles.surahArabic}>{item.name.replace('سورة', '').trim()}</Text>
                     <Ionicons name="chevron-forward" size={moderateScale(20)} color={THEME.beigeTertiary} />
                   </View>
                 </LinearGradient>
               </TouchableOpacity>
             );
          }}
          contentContainerStyle={{paddingBottom: verticalScale(100), paddingTop: spacing.sm}}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="book-open-variant" size={moderateScale(64)} color={THEME.beigeTertiary} />
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
            <Ionicons name="arrow-back" size={moderateScale(24)} color={THEME.beige} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Practice Session</Text>
            <Text style={styles.headerSubtitle}>{currentIndex + 1} of {ayahs.length}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.infoBtn} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={moderateScale(24)} color={THEME.beige} />
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
            <>
              {/* Next Card (Background) */}
              {currentIndex + 1 < ayahs.length && (
                 <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 0 }]}>
                    <Flashcard 
                      key={ayahs[currentIndex + 1].number}
                      ayah={ayahs[currentIndex + 1]} 
                      index={currentIndex + 1} 
                      active={false} 
                      onSwipe={handleSwipe} 
                      playAudio={playAudio} 
                      isPlaying={false} 
                      toggleText={() => setIsTextHidden(!isTextHidden)} 
                      isTextHidden={isTextHidden} 
                      speed={speed} 
                      cycleSpeed={cycleSpeed} 
                    />
                 </View>
              )}

              {/* Current Card (Foreground) */}
              {currentIndex < ayahs.length && (
                 <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}>
                    <Flashcard 
                      key={ayahs[currentIndex].number}
                      ayah={ayahs[currentIndex]} 
                      index={currentIndex} 
                      active={true} 
                      onSwipe={handleSwipe} 
                      playAudio={playAudio} 
                      isPlaying={isPlaying} 
                      toggleText={() => setIsTextHidden(!isTextHidden)} 
                      isTextHidden={isTextHidden} 
                      speed={speed} 
                      cycleSpeed={cycleSpeed} 
                    />
                 </View>
              )}
            </>
          )}
          
          {!loading && currentIndex >= ayahs.length && (
            <View style={styles.completionContainer}>
              <LinearGradient colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.08)']} style={styles.completionCard}>
                <View style={styles.completionIconContainer}>
                  <LinearGradient colors={[THEME.memorized, '#059669']} style={styles.completionIconGradient}>
                    <MaterialCommunityIcons name="check-all" size={moderateScale(48)} color="white" />
                  </LinearGradient>
                </View>
                <Text style={styles.completionTitle}>Session Complete!</Text>
                <Text style={styles.completionSubtitle}>You've completed {ayahs.length} verses</Text>
                <TouchableOpacity onPress={() => setScreen('LIST')} style={styles.completionBtn} activeOpacity={0.8}>
                  <LinearGradient colors={[THEME.beige, THEME.beigeSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.completionBtnGradient}>
                    <Text style={styles.completionBtnText}>Return to Dashboard</Text>
                    <Ionicons name="home" size={moderateScale(20)} color={THEME.gradientStart} />
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
                  <MaterialCommunityIcons name="hand-pointing-up" size={moderateScale(24)} color={THEME.beigeSecondary} />
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
  patternDot: { position: 'absolute', backgroundColor: THEME.beige },
  
  // FIX: Android Text Visibility 
  // On Android, textShadow creates a solid black block if color is transparent.
  // We switch strategies per platform.
  arabicText: { 
    fontSize: responsiveFontSize(isTablet ? 42 : isSmallDevice ? 32 : 36), 
    color: THEME.beige, 
    textAlign: 'center', 
    lineHeight: responsiveFontSize(isTablet ? 72 : isSmallDevice ? 56 : 64), 
    fontWeight: '600', 
    fontFamily: 'IndoPakQuran', 
    textShadowColor: 'rgba(0, 0, 0, 0.3)', 
    textShadowOffset: { width: 0, height: 2 }, 
    textShadowRadius: 4 
  },
  hiddenText: Platform.select({
    ios: {
      color: 'transparent',
      textShadowColor: 'rgba(245, 245, 220, 0.5)',
      textShadowRadius: 10,
    },
    android: {
      color: THEME.gradientMid, // Match background to hide text
      backgroundColor: 'rgba(245, 245, 220, 0.1)', // Subtle block to show where text is
      borderRadius: 8,
      textShadowColor: 'transparent', // Remove shadow to prevent artifacts
    },
    default: {
      color: 'transparent'
    }
  }),

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingTop: spacing.sm, zIndex: 1 },
  headerBackBtn: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(22), backgroundColor: 'rgba(245, 245, 220, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: THEME.beige, fontSize: responsiveFontSize(22), fontWeight: '700', letterSpacing: 0.5 },
  headerSubtitle: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(13), marginTop: scale(2), fontWeight: '500' },
  headerStats: { alignItems: 'center', backgroundColor: 'rgba(245, 245, 220, 0.1)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: moderateScale(12), borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  headerStatsNumber: { color: THEME.beige, fontSize: responsiveFontSize(18), fontWeight: 'bold' },
  headerStatsLabel: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(10), fontWeight: '600' },
  menuBtn: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(22), backgroundColor: 'rgba(245, 245, 220, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoBtn: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(22), backgroundColor: 'rgba(245, 245, 220, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  statsOverview: { paddingHorizontal: spacing.md, marginBottom: spacing.md, zIndex: 1 },
  statsCard: { flexDirection: 'row', borderRadius: moderateScale(20), padding: spacing.md, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { color: THEME.beige, fontSize: responsiveFontSize(32), fontWeight: 'bold' },
  statLabel: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(13), marginTop: scale(4), fontWeight: '600' },
  statDot: { width: scale(6), height: scale(6), borderRadius: scale(3), marginTop: spacing.sm },
  statDivider: { width: 1, backgroundColor: 'rgba(245, 245, 220, 0.2)', marginHorizontal: spacing.md },
  selectionInfo: { paddingHorizontal: spacing.md, marginBottom: spacing.md, zIndex: 1 },
  selectionInfoGradient: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: moderateScale(16), gap: spacing.sm, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  selectionInfoText: { flex: 1, color: THEME.beige, fontSize: responsiveFontSize(14), fontWeight: '500' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm, zIndex: 1 },
  tabItemWrapper: { flex: 1 },
  tabItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: moderateScale(16), gap: spacing.sm },
  inactiveTab: { backgroundColor: 'rgba(245, 245, 220, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  tabText: { color: THEME.beigeTertiary, fontWeight: '600', fontSize: responsiveFontSize(13) },
  activeTabText: { color: THEME.gradientStart, fontWeight: 'bold' },
  listItem: { marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: moderateScale(20), overflow: 'hidden' },
  listItemGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.15)' },
  listLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
  listNumberContainer: { width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(25), overflow: 'hidden' },
  listNumberGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  listNumber: { color: THEME.gradientStart, fontSize: responsiveFontSize(18), fontWeight: 'bold' },
  listInfo: { flex: 1 },
  surahName: { color: THEME.beige, fontSize: responsiveFontSize(17), fontWeight: 'bold', marginBottom: scale(4) },
  surahEnglish: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(13), marginBottom: spacing.xs },
  verseCountContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  verseCount: { fontSize: responsiveFontSize(12), fontWeight: '600' },
  listRight: { alignItems: 'flex-end', gap: spacing.sm },
  surahArabic: { color: THEME.beige, fontSize: responsiveFontSize(26), fontFamily: 'IndoPakQuran' },
  ayahListItem: { marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: moderateScale(16), overflow: 'hidden' },
  ayahListGradient: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.15)' },
  statusIndicator: { width: scale(4), height: '70%', borderRadius: scale(2), marginRight: spacing.sm, backgroundColor: 'rgba(245, 245, 220, 0.15)' },
  ayahNumberCircle: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(22), marginRight: spacing.sm, overflow: 'hidden' },
  ayahNumberGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.3)' },
  ayahNumberText: { color: THEME.beige, fontWeight: 'bold', fontSize: responsiveFontSize(16) },
  ayahListContent: { flex: 1, marginRight: spacing.sm },
  ayahListArabic: { color: THEME.beige, fontSize: responsiveFontSize(20), textAlign: 'left', marginBottom: spacing.xs, fontFamily: 'IndoPakQuran' },
  ayahListTranslation: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(13), lineHeight: moderateScale(18) },
  playIconContainer: { width: moderateScale(40), height: moderateScale(40), alignItems: 'center', justifyContent: 'center' },
  progressBarContainer: { paddingHorizontal: spacing.md, marginBottom: spacing.md, zIndex: 1 },
  progressBarBg: { height: scale(6), backgroundColor: 'rgba(245, 245, 220, 0.15)', borderRadius: scale(3), overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: scale(3) },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  card: { borderRadius: moderateScale(28), shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 },
  cardGradient: { flex: 1, borderRadius: moderateScale(28), padding: spacing.lg, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  cardHeaderLeft: { flex: 1 },
  surahBadge: { backgroundColor: 'rgba(245, 245, 220, 0.15)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: moderateScale(12), alignSelf: 'flex-start', marginBottom: spacing.xs, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  surahBadgeText: { color: THEME.beige, fontSize: responsiveFontSize(13), fontWeight: '600' },
  ayahNumber: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(14), fontWeight: '600' },
  verseNumberContainer: { borderWidth: 2, borderColor: THEME.beige, borderRadius: moderateScale(20), width: moderateScale(40), height: moderateScale(40), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 245, 220, 0.1)' },
  verseNumber: { color: THEME.beige, fontSize: responsiveFontSize(14), fontWeight: 'bold' },
  cardBody: { flex: 1, paddingVertical: spacing.md },
  translationContainer: { marginTop: spacing.lg, width: '100%' },
  translationDivider: { height: scale(2), backgroundColor: THEME.beigeSecondary, width: scale(60), marginBottom: spacing.md, alignSelf: 'center', borderRadius: scale(1), opacity: 0.5 },
  translationText: { color: THEME.beigeSecondary, textAlign: 'center', fontSize: responsiveFontSize(15), lineHeight: moderateScale(24), fontWeight: '500' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', zIndex: 2 },
  controlBtnSmall: { width: moderateScale(56), height: moderateScale(56), borderRadius: moderateScale(28), overflow: 'hidden' },
  controlBtnContent: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 245, 220, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.3)', gap: scale(2) },
  controlText: { color: THEME.beige, fontWeight: 'bold', fontSize: responsiveFontSize(13) },
  playBtnLarge: { width: moderateScale(80), height: moderateScale(80), borderRadius: moderateScale(40), overflow: 'hidden', shadowColor: THEME.beige, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  playBtnGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, borderRadius: moderateScale(28), zIndex: 20, overflow: 'hidden' },
  overlayGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: 'white', fontSize: responsiveFontSize(28), fontWeight: 'bold', marginTop: spacing.md, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowRadius: 8 },
  swipeHint: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, zIndex: 2 },
  swipeHintItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swipeHintText: { color: THEME.beigeTertiary, fontSize: responsiveFontSize(12), fontWeight: '600' },
  swipeHintDivider: { width: 1, height: scale(16), backgroundColor: 'rgba(245, 245, 220, 0.2)' },
  footerContainer: { paddingBottom: spacing.lg, paddingHorizontal: spacing.md },
  recitedPill: { borderRadius: moderateScale(24), overflow: 'hidden', marginTop: spacing.md },
  recitedPillGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  recitedIcon: { width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24), backgroundColor: 'rgba(245, 245, 220, 0.15)', alignItems: 'center', justifyContent: 'center' },
  recitedContent: { flex: 1 },
  recitedLabel: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(13), fontWeight: '600', marginBottom: scale(2) },
  recitedCount: { color: THEME.beige, fontSize: responsiveFontSize(24), fontWeight: 'bold' },
  completionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl },
  completionCard: { width: '100%', padding: spacing.xxl, borderRadius: moderateScale(28), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  completionIconContainer: { width: moderateScale(100), height: moderateScale(100), borderRadius: moderateScale(50), marginBottom: spacing.lg, overflow: 'hidden' },
  completionIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  completionTitle: { color: THEME.beige, fontSize: responsiveFontSize(28), fontWeight: 'bold', marginBottom: spacing.sm, textAlign: 'center' },
  completionSubtitle: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(16), marginBottom: spacing.xl, textAlign: 'center' },
  completionBtn: { width: '100%', borderRadius: moderateScale(20), overflow: 'hidden' },
  completionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  completionBtnText: { color: THEME.gradientStart, fontWeight: 'bold', fontSize: responsiveFontSize(16) },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(16), marginTop: spacing.md, fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: verticalScale(60) },
  emptyText: { color: THEME.beige, fontSize: responsiveFontSize(18), fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { color: THEME.beigeTertiary, fontSize: responsiveFontSize(14), marginTop: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContainer: { width: '100%', maxWidth: isTablet ? 500 : 350 },
  modalContent: { borderRadius: moderateScale(28), padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  modalHeader: { alignItems: 'center', marginBottom: spacing.xl },
  modalIconContainer: { width: moderateScale(100), height: moderateScale(100), borderRadius: moderateScale(50), marginBottom: spacing.md, overflow: 'hidden' },
  modalIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  modalTitleDivider: { width: scale(60), height: scale(3), backgroundColor: THEME.beigeSecondary, marginBottom: spacing.md, borderRadius: scale(2) },
  modalTitle: { fontSize: responsiveFontSize(26), fontWeight: 'bold', color: THEME.beige, textAlign: 'center', marginBottom: spacing.sm },
  modalSubtitle: { fontSize: responsiveFontSize(15), color: THEME.beigeSecondary, textAlign: 'center', fontWeight: '500' },
  modalFeaturesScroll: { maxHeight: SCREEN_HEIGHT * 0.4 },
  modalFeatures: { gap: spacing.md, marginBottom: spacing.xl },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIconBox: { width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24), backgroundColor: 'rgba(245, 245, 220, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  featureText: { flex: 1 },
  featureTitle: { color: THEME.beige, fontSize: responsiveFontSize(15), fontWeight: '600', marginBottom: scale(4) },
  featureDesc: { color: THEME.beigeSecondary, fontSize: responsiveFontSize(13), lineHeight: moderateScale(18) },
  modalButton: { borderRadius: moderateScale(20), overflow: 'hidden' },
  modalButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  modalButtonText: { color: THEME.gradientStart, fontWeight: 'bold', fontSize: responsiveFontSize(16) },
  hiddenPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  
  hiddenHint: {
    color: THEME.beigeSecondary,
    fontSize: responsiveFontSize(14),
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  
});