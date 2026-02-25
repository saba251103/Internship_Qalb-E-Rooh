import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  PixelRatio,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ==========================================
// RESPONSIVE UTILITIES
// ==========================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 350;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 680) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const normalize = (size: number) => Math.round(PixelRatio.roundToNearestPixel(scale(size)));
const wp = (percentage: number) => Math.round((percentage * SCREEN_WIDTH) / 100);
const hp = (percentage: number) => Math.round((percentage * SCREEN_HEIGHT) / 100);

// ==========================================
// TYPES & CONSTANTS
// ==========================================
interface SurahItem {
  number: number;
  englishName: string;
  name: string;
  numberOfAyahs: number;
}

const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdulsamad', name: 'Abdul Basit' },
  { id: 'ar.ahmedajamy', name: 'Ahmed Al-Ajamy' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi' },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ImmerseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // STATE
  const [surahList, setSurahList] = useState<SurahItem[]>([]);
  const [currentSurah, setCurrentSurah] = useState({
    number: Number(params.surahNumber) || 1,
    name: params.surahName || "Al-Faatiha",
    totalAyahs: 7
  });
  const [currentAyah, setCurrentAyah] = useState(Number(params.ayahNumber) || 1);
  const [verseData, setVerseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  
  // MODALS STATE
  const [modals, setModals] = useState({
    surah: false,
    ayah: false,
    reciter: false,
    understanding: false
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'),
  });

  // 1. SETUP AUDIO SESSION (CRITICAL FOR PRODUCTION)
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true, // Requires background permission in app.json
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn("Audio setup failed", e);
      }
    };
    setupAudio();
    
    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // 2. FETCH SURAH LIST
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const json = await res.json();
        if (json.code === 200) setSurahList(json.data);
      } catch (error) {
        Alert.alert("Connection Error", "Could not load Surah list. Please check your internet.");
      }
    };
    fetchSurahs();
  }, []);

  // 3. FETCH VERSE DATA
  useEffect(() => {
    let isMounted = true;
    const loadVerse = async () => {
      setLoading(true);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
      }

      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/ayah/${currentSurah.number}:${currentAyah}/editions/quran-indian,en.sahih`
        );
        const json = await response.json();
        
        if (isMounted && json.data) {
          setVerseData({
            text: json.data[0].text,
            translation: json.data[1].text,
            number: json.data[0].number,
            surah: json.data[0].surah
          });

          if (json.data[0].surah) {
            setCurrentSurah(prev => ({
              ...prev,
              totalAyahs: json.data[0].surah.numberOfAyahs
            }));
          }
          
          // Auto-play if we were already playing (Continuous Playback)
          if (isPlaying) playVerseAudio(); 
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load verse data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVerse();
    return () => { isMounted = false; };
  }, [currentSurah.number, currentAyah]);

  // 4. AUDIO PLAYER LOGIC
  useEffect(() => {
    if (!loading && verseData && isPlaying && !soundRef.current) {
      playVerseAudio();
    }
  }, [verseData, isPlaying, selectedReciter, loading]);

  const playVerseAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const audioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedReciter.id}/${verseData.number}.mp3`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          handleNext();
        }
      });
    } catch (e) {
      console.log("Audio Play Error:", e);
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    if (!soundRef.current) {
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentAyah < currentSurah.totalAyahs) {
      setCurrentAyah(prev => prev + 1);
    } else if (currentSurah.number < 114) {
      // Move to next Surah
      const nextSurahNum = currentSurah.number + 1;
      const nextS = surahList.find(s => s.number === nextSurahNum);
      if (nextS) {
        setCurrentSurah({ 
          number: nextS.number, 
          name: nextS.englishName,
          totalAyahs: nextS.numberOfAyahs
        });
        setCurrentAyah(1);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentAyah > 1) setCurrentAyah(prev => prev - 1);
  };

  const ayahIndices = Array.from({ length: currentSurah.totalAyahs }, (_, i) => i + 1);

  if (!fontsLoaded) return <View style={[styles.container, {backgroundColor: '#0A4A4A'}]} />;

  return (
    <LinearGradient colors={['#0A4A4A', '#064343', '#032626']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER - Using Safe Area Insets for seamless transparency */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={moderateScale(26)} color="#f5f5dc" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.playingFrom}>NOW RECITING</Text>
          <Text style={styles.headerSurahName}>{currentSurah.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => setModals({...modals, understanding: true})}
        >
          <Ionicons name="information-circle-outline" size={moderateScale(24)} color="#f5f5dc" />
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContentArea}>
        {loading ? (
          <View style={styles.loaderWrapper}>
            <ActivityIndicator color="#f5f5dc" size="large" />
          </View>
        ) : (
          <LinearGradient 
            colors={['rgba(245, 245, 220, 0.08)', 'rgba(245, 245, 220, 0.02)']} 
            style={styles.verseBoxGradient}
          >
            <ScrollView 
              showsVerticalScrollIndicator={true} 
              indicatorStyle="white" 
              contentContainerStyle={styles.verseScrollPadding}
            >
              {/* ARABIC TEXT */}
              <Text style={styles.arabicLyric}>{verseData?.text}</Text>
              
              <View style={styles.verseBadge}>
                <Text style={styles.verseBadgeText}>Ayah {currentAyah}</Text>
              </View>
              
              {/* TRANSLATION */}
              <View style={styles.translationContainer}>
                <View style={styles.translationLine} />
                <Text style={styles.translationLyric}>{verseData?.translation}</Text>
              </View>
            </ScrollView>
          </LinearGradient>
        )}
      </View>

      {/* BOTTOM CONTROLS - Adapts to bottom safe area (home indicator) */}
      <View style={[styles.bottomControlsArea, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.selectorRow}>
          <TouchableOpacity style={styles.pill} onPress={() => setModals({...modals, surah: true})}>
            <Text style={styles.pillText} numberOfLines={1}>{currentSurah.name}</Text>
            <Ionicons name="caret-down" size={normalize(12)} color="#0A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => setModals({...modals, ayah: true})}>
            <Text style={styles.pillText}>Ayah {currentAyah}</Text>
            <Ionicons name="caret-down" size={normalize(12)} color="#0A4A4A" />
          </TouchableOpacity>
        </View>

        <View style={styles.playbackRow}>
          <TouchableOpacity onPress={handlePrev} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="play-skip-back" size={moderateScale(32)} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButtonCircle} onPress={togglePlayback} activeOpacity={0.9}>
             {loading ? (
                <ActivityIndicator color="#0A4A4A" size="small" />
             ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={moderateScale(36)} 
                  color="#0A4A4A" 
                  style={isPlaying ? {} : {marginLeft: scale(4)}} 
                />
             )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="play-skip-forward" size={moderateScale(32)} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.reciterFooter} onPress={() => setModals({...modals, reciter: true})}>
          <MaterialCommunityIcons name="account-music-outline" size={normalize(18)} color="#D2B48C" />
          <Text style={styles.reciterName}>{selectedReciter.name}</Text>
          <Ionicons name="chevron-up" size={normalize(14)} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      {/* ================= MODALS ================= */}
      
      {/* 1. SURAH SELECTION */}
      <Modal visible={modals.surah} animationType="slide" transparent={true} onRequestClose={() => setModals({...modals, surah: false})}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>Select Surah</Text>
            <FlatList
              data={surahList}
              keyExtractor={(item) => item.number.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, currentSurah.number === item.number && styles.selectedItem]} 
                  onPress={() => {
                    setCurrentSurah({ number: item.number, name: item.englishName, totalAyahs: item.numberOfAyahs });
                    setCurrentAyah(1);
                    setModals({...modals, surah: false});
                  }}
                >
                  <Text style={[styles.modalItemText, currentSurah.number === item.number && styles.selectedItemText]}>
                    {item.number}. {item.englishName}
                  </Text>
                  <Text style={styles.modalSubText}>{item.numberOfAyahs} Ayahs</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModals({...modals, surah: false})} style={[styles.closeBtn, {marginBottom: insets.bottom}]}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. AYAH SELECTION */}
      <Modal visible={modals.ayah} animationType="slide" transparent={true} onRequestClose={() => setModals({...modals, ayah: false})}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>Select Ayah</Text>
            <FlatList
              data={ayahIndices}
              keyExtractor={(item) => item.toString()}
              numColumns={4}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.gridItem, currentAyah === item && styles.selectedGridItem]} 
                  onPress={() => { setCurrentAyah(item); setModals({...modals, ayah: false}); }}
                >
                  <Text style={[styles.gridItemText, currentAyah === item && styles.selectedItemText]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModals({...modals, ayah: false})} style={[styles.closeBtn, {marginBottom: insets.bottom}]}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. RECITER SELECTION */}
      <Modal visible={modals.reciter} animationType="slide" transparent={true} onRequestClose={() => setModals({...modals, reciter: false})}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {height: hp(50)}]}>
            <Text style={styles.modalHeaderTitle}>Select Reciter</Text>
            <FlatList
              data={RECITERS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, selectedReciter.id === item.id && styles.selectedItem]} 
                  onPress={() => { setSelectedReciter(item); setModals({...modals, reciter: false}); }}
                >
                  <Text style={[styles.modalItemText, selectedReciter.id === item.id && styles.selectedItemText]}>{item.name}</Text>
                  {selectedReciter.id === item.id && <Ionicons name="checkmark-circle" size={normalize(18)} color="#f5f5dc" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModals({...modals, reciter: false})} style={[styles.closeBtn, {marginBottom: insets.bottom}]}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. UNDERSTANDING MODAL */}
      <Modal 
  visible={modals.understanding} 
  animationType="fade" 
  transparent={true} 
  onRequestClose={() => setModals({...modals, understanding: false})}>  
  <View style={[styles.modalOverlay, {justifyContent: 'center',alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)'}]}>
          <View style={styles.understandingCard}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="headset-outline" size={30} color="#0A4A4A" />
            </View>
            <Text style={styles.understandingTitle}>About This Feature</Text>
            <Text style={styles.understandingText}>
              This immersive space is designed specifically for you to <Text style={{fontWeight: 'bold', color: '#0A4A4A'}}>listen to the Holy Quran</Text> with focus.
              {"\n\n"}
              Follow the Arabic text and meaning in real-time to connect deeply with the words and find peace through the rhythmic flow of the verses.
            </Text>
            <TouchableOpacity style={styles.understandBtn} onPress={() => setModals({...modals, understanding: false})}>
              <Text style={styles.understandBtnText}>Continue Listening</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // HEADER
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: wp(5), 
    paddingBottom: verticalScale(10), 
    alignItems: 'center',
    zIndex: 10
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerButton: { padding: scale(8) },
  playingFrom: { 
    color: '#D2B48C', 
    fontSize: normalize(10), 
    letterSpacing: 1.5, 
    fontWeight: '800', 
    opacity: 0.8 
  },
  headerSurahName: { 
    color: 'white', 
    fontSize: normalize(16), 
    fontWeight: 'bold',
    marginTop: 2 
  },

  // MAIN CONTENT
  mainContentArea: { 
    flex: 1, 
    marginHorizontal: wp(4), 
    marginVertical: verticalScale(5), 
    borderRadius: scale(20), 
    overflow: 'hidden' 
  },
  verseBoxGradient: { 
    flex: 1, 
    paddingVertical: verticalScale(10),
    paddingHorizontal: wp(5),
    borderWidth: 1, 
    borderColor: 'rgba(245, 245, 220, 0.1)',
    borderRadius: scale(20)
  },
  verseScrollPadding: { 
    paddingVertical: verticalScale(20),
    paddingBottom: verticalScale(40) 
  },
  loaderWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // TEXT RENDERERS
  arabicLyric: { 
    color: '#f5f5dc', 
    fontSize: normalize(32), 
    fontFamily: 'IndoPakQuran', 
    textAlign: 'right', 
    lineHeight: normalize(65), 
    // CRITICAL FOR ANDROID PLAY STORE:
    textAlignVertical: 'center', 
    includeFontPadding: false,
    writingDirection: 'rtl',
    marginBottom: verticalScale(10)
  },
  translationContainer: { flexDirection: 'row', paddingLeft: wp(2), marginTop: verticalScale(10) },
  translationLine: { width: 2, backgroundColor: '#D2B48C', marginRight: wp(4), borderRadius: 2, opacity: 0.5 },
  translationLyric: { 
    flex: 1, 
    color: '#E8DCC4', 
    fontSize: normalize(16), 
    fontWeight: '400', 
    lineHeight: normalize(24),
    opacity: 0.9 
  },
  verseBadge: { 
    alignSelf: 'center', 
    paddingHorizontal: wp(4), 
    paddingVertical: verticalScale(4), 
    borderRadius: scale(20), 
    backgroundColor: 'rgba(210, 180, 140, 0.15)', 
    marginVertical: verticalScale(15),
    borderWidth: 1,
    borderColor: 'rgba(210, 180, 140, 0.3)'
  },
  verseBadgeText: { color: '#f5f5dc', fontSize: normalize(10), fontWeight: '700', letterSpacing: 0.5 },

  // CONTROLS
  bottomControlsArea: { 
    paddingHorizontal: wp(6), 
    paddingTop: verticalScale(15), 
    backgroundColor: 'rgba(3, 38, 38, 0.3)' // Subtle background for controls
  },
  selectorRow: { flexDirection: 'row', gap: scale(10), marginBottom: verticalScale(15) },
  pill: { 
    flex: 1, 
    backgroundColor: '#f5f5dc', 
    paddingVertical: verticalScale(10), 
    borderRadius: scale(12), 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pillText: { color: '#0A4A4A', fontSize: normalize(12), fontWeight: '700', marginRight: scale(5) },
  playbackRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(20), paddingHorizontal: wp(4) },
  playButtonCircle: { 
    width: scale(65), 
    height: scale(65), 
    borderRadius: scale(35), 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  reciterFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    paddingVertical: verticalScale(12),
    paddingHorizontal: wp(4),
    borderRadius: scale(16),
    marginBottom: verticalScale(10)
  },
  reciterName: { color: '#f5f5dc', fontSize: normalize(12), fontWeight: '600', marginLeft: wp(3), flex: 1 },

  // MODALS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#0F3D3E', 
    height: hp(65), 
    borderTopLeftRadius: scale(25), 
    borderTopRightRadius: scale(25), 
    paddingVertical: verticalScale(20),
    paddingHorizontal: wp(6),
  },
  modalHeaderTitle: { color: 'white', fontSize: normalize(18), fontWeight: 'bold', textAlign: 'center', marginBottom: verticalScale(15) },
  modalItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: verticalScale(16), 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  selectedItem: { backgroundColor: 'rgba(245, 245, 220, 0.1)', borderRadius: scale(10), paddingHorizontal: wp(3), borderBottomWidth: 0 },
  modalItemText: { color: 'rgba(255,255,255,0.8)', fontSize: normalize(14), fontWeight: '600' },
  selectedItemText: { color: '#f5f5dc', fontWeight: 'bold' },
  modalSubText: { color: 'rgba(255,255,255,0.4)', fontSize: normalize(11) },
  
  gridItem: { 
    flex: 1, 
    paddingVertical: verticalScale(12),
    alignItems: 'center', 
    margin: scale(4), 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  selectedGridItem: { backgroundColor: '#f5f5dc', borderColor: '#f5f5dc' },
  gridItemText: { color: 'white', fontWeight: '600', fontSize: normalize(12) },
  
  closeBtn: { 
    marginTop: verticalScale(15), 
    paddingVertical: verticalScale(12),
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: scale(12) 
  },
  closeBtnText: { color: '#f5f5dc', fontWeight: 'bold', fontSize: normalize(13) },

  // INFO CARD
  understandingCard: {
    backgroundColor: '#f5f5dc',
    width: wp(85),
    borderRadius: scale(20),
    padding: wp(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    alignSelf: 'center',
    elevation: 10,
  },
  infoIconCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(10, 74, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  understandingTitle: { color: '#0A4A4A', fontSize: normalize(18), fontWeight: 'bold', marginBottom: verticalScale(8) },
  understandingText: { color: '#2F4F4F', fontSize: normalize(13), lineHeight: normalize(20), textAlign: 'center' },
  understandBtn: { backgroundColor: '#0A4A4A', paddingVertical: verticalScale(10), paddingHorizontal: wp(8), borderRadius: scale(20), marginTop: verticalScale(15) },
  understandBtnText: { color: '#f5f5dc', fontWeight: 'bold', fontSize: normalize(12) },
});