import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchAllSurahsFromBackend,
  fetchAudioUrlForReciterFromBackend,
  fetchAyahDetailsFromBackend
} from '../services/quranService';
// ─────────────────────────────────────────────
// RESPONSIVE UTILITIES
// ─────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 350;
const BASE_HEIGHT = 680;

const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const normalize = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(moderateScale(size)));
const wp = (pct: number) => Math.round((pct * SCREEN_WIDTH) / 100);
const hp = (pct: number) => Math.round((pct * SCREEN_HEIGHT) / 100);

// ─────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────
interface SurahItem {
  number: number;
  englishName: string;
  name: string;
  numberOfAyahs: number;
}

interface VerseData {
  arabicText: string;
  translation: string;
  /** Global ayah number used for audio URL */
  globalNumber: number;
  surahNumber: number;
  ayahNumberInSurah: number;
  totalAyahs: number;
}

const RECITERS = [
  { id: 'ar.alafasy',     name: 'Mishary Rashid Alafasy' },
  { id: 'ar.ahmedajamy', name: 'Ahmed Al-Ajamy' },
  { id: 'ar.husary',     name: 'Mahmoud Khalil Al-Husary' },
  { id: 'ar.minshawi',   name: 'Mohamed Siddiq El-Minshawi' },
];

// ─────────────────────────────────────────────
// AUDIO HELPER — single stable instance manager
// ─────────────────────────────────────────────
class AudioManager {
  private static sound: Audio.Sound | null = null;
  private static loading = false;

  static async unload() {
    AudioManager.loading = false;
    if (AudioManager.sound) {
      try {
        await AudioManager.sound.stopAsync();
        await AudioManager.sound.unloadAsync();
      } catch (_) {}
      AudioManager.sound = null;
    }
  }

  static async play(
    url: string,
    onFinish: () => void
  ): Promise<boolean> {
    // Prevent concurrent loads
    if (AudioManager.loading) return false;
    AudioManager.loading = true;

    await AudioManager.unload();
    // unload resets loading flag; re-set it
    AudioManager.loading = true;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 }
      );
      AudioManager.sound = sound;
      AudioManager.loading = false;

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish && !status.isLooping) {
          onFinish();
        }
      });
      return true;
    } catch (e) {
      console.warn('[AudioManager] play error:', e);
      AudioManager.loading = false;
      return false;
    }
  }

  static async pause() {
    try { await AudioManager.sound?.pauseAsync(); } catch (_) {}
  }

  static async resume() {
    try { await AudioManager.sound?.playAsync(); } catch (_) {}
  }

  static isLoaded() {
    return AudioManager.sound !== null;
  }
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ImmerseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [surahList, setSurahList] = useState<SurahItem[]>([]);
  const [surahNumber, setSurahNumber] = useState(Number(params.surahNumber) || 1);
  const [ayahNumber, setAyahNumber]   = useState(Number(params.ayahNumber)  || 1);

  const [verseData,    setVerseData]    = useState<VerseData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);

  const [modals, setModals] = useState({
    surah: false, ayah: false, reciter: false, info: false,
  });

  // Track whether playback should continue across verse changes
  const shouldContinueRef = useRef(false);
  // Prevent stale closures from triggering auto-advance
  const loadIdRef = useRef(0);

  const [fontsLoaded] = useFonts({
    IndoPakQuran: require('../../assets/fonts/IndoPakQuran.ttf'),
  });

  // ── 1. AUDIO SESSION SETUP ──────────────────
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS:        false,
          staysActiveInBackground:   true,
          playsInSilentModeIOS:      true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('[Audio] session setup failed:', e);
      }
    })();

    return () => { AudioManager.unload(); };
  }, []);

// ── 2. FETCH SURAH LIST VIA NESTJS ──────────────
useEffect(() => {
  (async () => {
    try {
      // 🚨 CHANGED: Fetch from backend instead of external API
      const data = await fetchAllSurahsFromBackend();
      setSurahList(data);
    } catch {
      Alert.alert('Connection Error', 'Could not load Surah list from server.');
    }
  })();
}, []);

  // ── 3. FETCH VERSE DATA ──────────────────────
  useEffect(() => {
    // Each load gets a unique id; stale loads bail out early
    const myLoadId = ++loadIdRef.current;

    let cancelled = false;
    setLoading(true);

    // Stop audio immediately; do NOT change isPlaying (we'll resume if needed)
    AudioManager.unload();

    (async () => {
      try {
        // 🚨 CHANGED: Fetch Ayah details from NestJS
        const data = await fetchAyahDetailsFromBackend(surahNumber, ayahNumber);

        if (cancelled || myLoadId !== loadIdRef.current) return;
        if (!data || data.length < 2) throw new Error('No data');

        const arabicEntry = data[0];
        const engEntry    = data[1];

        setVerseData({
          arabicText:         arabicEntry.text,
          translation:        engEntry.text,
          globalNumber:       arabicEntry.number,        // used for audio URL
          surahNumber:        arabicEntry.surah.number,
          ayahNumberInSurah:  arabicEntry.numberInSurah,
          totalAyahs:         arabicEntry.surah.numberOfAyahs,
        });
      } catch {
        if (!cancelled && myLoadId === loadIdRef.current) {
          Alert.alert('Error', 'Failed to load verse.');
        }
      } finally {
        if (!cancelled && myLoadId === loadIdRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [surahNumber, ayahNumber]);

  // ── 4. PLAY AUDIO WHEN VERSE IS READY ───────
  // Fires only when loading finishes and we have verseData.
  // Uses globalNumber (real Quran-wide ayah index) for the CDN URL,
  // which sidesteps the Bismillah offset entirely.
// ── 4. PLAY AUDIO WHEN VERSE IS READY ───────
useEffect(() => {
  if (loading || !verseData) return;
  if (!shouldContinueRef.current) return;

  const capturedLoadId = loadIdRef.current;

  // 🚨 CHANGED: Wrapped in an async IIFE to fetch the URL from backend
  (async () => {
    const url = await fetchAudioUrlForReciterFromBackend(selectedReciter.id, verseData.globalNumber);
    
    AudioManager.play(url, () => {
      if (loadIdRef.current === capturedLoadId) {
        handleAdvance();
      }
    }).then((started) => {
      if (loadIdRef.current === capturedLoadId) {
        setIsPlaying(started);
        if (!started) shouldContinueRef.current = false;
      }
    });
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading, verseData]);

  // ── 5. PLAYBACK CONTROLS ────────────────────
  const handlePlay = useCallback(async () => {
    if (loading || !verseData) return;

    if (AudioManager.isLoaded()) {
      await AudioManager.resume();
      setIsPlaying(true);
    } else {
      shouldContinueRef.current = true;
      const capturedLoadId = loadIdRef.current;
      // 🚨 CHANGED: Fetch URL from NestJS for manual play
      const url = await fetchAudioUrlForReciterFromBackend(selectedReciter.id, verseData.globalNumber);      const started = await AudioManager.play(url, () => {
        if (loadIdRef.current === capturedLoadId) handleAdvance();
      });
      setIsPlaying(started);
      if (!started) shouldContinueRef.current = false;
    }
  }, [loading, verseData, selectedReciter]);

  const handlePause = useCallback(async () => {
    await AudioManager.pause();
    setIsPlaying(false);
    shouldContinueRef.current = false;
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) handlePause();
    else           handlePlay();
  }, [isPlaying, handlePlay, handlePause]);

  const handleAdvance = useCallback(() => {
    setVerseData((prev) => {
      if (!prev) return prev;
      const atEnd = prev.ayahNumberInSurah >= prev.totalAyahs;
      if (!atEnd) {
        setAyahNumber((a) => a + 1);
      } else {
        // Move to next surah
        const nextNum = prev.surahNumber + 1;
        if (nextNum <= 114) {
          setSurahNumber(nextNum);
          setAyahNumber(1);
        } else {
          // End of Quran
          shouldContinueRef.current = false;
          setIsPlaying(false);
          AudioManager.unload();
        }
      }
      return prev;
    });
  }, []);

  const handleNext = useCallback(() => {
    shouldContinueRef.current = isPlaying; // keep playing if was playing
    handleAdvance();
  }, [isPlaying, handleAdvance]);

  const handlePrev = useCallback(() => {
    shouldContinueRef.current = isPlaying;
    setAyahNumber((a) => (a > 1 ? a - 1 : a));
  }, [isPlaying]);

  // Reciter change: stop, reload same verse with new voice
  const handleReciterChange = useCallback((reciter: typeof RECITERS[0]) => {
    const wasPlaying = isPlaying;
    setSelectedReciter(reciter);
    setModals((m) => ({ ...m, reciter: false }));

    AudioManager.unload().then(async () => { // <--- Added async here
      if (wasPlaying && verseData) {
        shouldContinueRef.current = true;
        const capturedLoadId = loadIdRef.current;
        
        // 🚨 CHANGED: Request URL for new reciter from NestJS
        const url = await fetchAudioUrlForReciterFromBackend(reciter.id, verseData.globalNumber);        AudioManager.play(url, () => {
          if (loadIdRef.current === capturedLoadId) handleAdvance();
        }).then((started) => {
          setIsPlaying(started);
          if (!started) shouldContinueRef.current = false;
        });
      } else {
        setIsPlaying(false);
      }
    });
  }, [isPlaying, verseData, handleAdvance]);

  // Derived values
  const currentSurahObj = surahList.find((s) => s.number === surahNumber);
  const surahName       = currentSurahObj?.englishName ?? (params.surahName as string) ?? 'Al-Faatiha';
  const totalAyahs      = verseData?.totalAyahs ?? currentSurahObj?.numberOfAyahs ?? 7;
  const ayahIndices     = Array.from({ length: totalAyahs }, (_, i) => i + 1);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0A4A4A' }} />;
  }

  // ── RENDER ──────────────────────────────────
  return (
    <LinearGradient colors={['#0A4A4A', '#064343', '#032626']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + hp(1.2) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={moderateScale(26)} color="#f5f5dc" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.nowReciting}>NOW RECITING</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{surahName}</Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setModals((m) => ({ ...m, info: true }))}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="information-circle-outline" size={moderateScale(24)} color="#f5f5dc" />
        </TouchableOpacity>
      </View>

      {/* VERSE DISPLAY */}
      <View style={styles.verseArea}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#f5f5dc" size="large" />
            <Text style={styles.loadingText}>Loading verse…</Text>
          </View>
        ) : (
          <LinearGradient
            colors={['rgba(245,245,220,0.08)', 'rgba(245,245,220,0.02)']}
            style={styles.verseGradient}
          >
            <ScrollView
              showsVerticalScrollIndicator
              indicatorStyle="white"
              contentContainerStyle={styles.verseScroll}
            >
              <Text style={styles.arabicText}>{verseData?.arabicText}</Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {surahName}  ·  Ayah {ayahNumber} / {totalAyahs}
                </Text>
              </View>

              <View style={styles.translationRow}>
                <View style={styles.translationBar} />
                <Text style={styles.translationText}>{verseData?.translation}</Text>
              </View>
            </ScrollView>
          </LinearGradient>
        )}
      </View>

      {/* CONTROLS */}
      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, hp(2.5)) }]}>

        {/* Surah / Ayah selectors */}
        <View style={styles.selectorRow}>
          <TouchableOpacity style={styles.pill} onPress={() => setModals((m) => ({ ...m, surah: true }))}>
            <Text style={styles.pillText} numberOfLines={1}>{surahName}</Text>
            <Ionicons name="caret-down" size={normalize(11)} color="#0A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, styles.pillSmall]} onPress={() => setModals((m) => ({ ...m, ayah: true }))}>
            <Text style={styles.pillText}>Ayah {ayahNumber}</Text>
            <Ionicons name="caret-down" size={normalize(11)} color="#0A4A4A" />
          </TouchableOpacity>
        </View>

        {/* Playback row */}
        <View style={styles.playbackRow}>
          <TouchableOpacity onPress={handlePrev} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
            <Ionicons name="play-skip-back" size={moderateScale(30)} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={togglePlayback} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#0A4A4A" size="small" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={moderateScale(34)}
                color="#0A4A4A"
                style={isPlaying ? undefined : { marginLeft: scale(3) }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
            <Ionicons name="play-skip-forward" size={moderateScale(30)} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>

        {/* Reciter */}
        <TouchableOpacity style={styles.reciterBar} onPress={() => setModals((m) => ({ ...m, reciter: true }))}>
          <MaterialCommunityIcons name="account-music-outline" size={normalize(17)} color="#D2B48C" />
          <Text style={styles.reciterText} numberOfLines={1}>{selectedReciter.name}</Text>
          <Ionicons name="chevron-up" size={normalize(13)} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* ───── MODALS ───── */}

      {/* Surah selector */}
      <Modal visible={modals.surah} animationType="slide" transparent onRequestClose={() => setModals((m) => ({ ...m, surah: false }))}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Surah</Text>
            <FlatList
              data={surahList}
              keyExtractor={(item) => String(item.number)}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({ length: hp(7), offset: hp(7) * index, index })}
              renderItem={({ item }) => {
                const active = surahNumber === item.number;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, active && styles.listItemActive]}
                    onPress={() => {
                      shouldContinueRef.current = isPlaying;
                      setSurahNumber(item.number);
                      setAyahNumber(1);
                      setModals((m) => ({ ...m, surah: false }));
                    }}
                  >
                    <View style={styles.listItemLeft}>
                      <View style={[styles.numBadge, active && styles.numBadgeActive]}>
                        <Text style={[styles.numBadgeText, active && styles.numBadgeTextActive]}>
                          {item.number}
                        </Text>
                      </View>
                      <Text style={[styles.listItemText, active && styles.listItemTextActive]}>
                        {item.englishName}
                      </Text>
                    </View>
                    <Text style={styles.listSubText}>{item.numberOfAyahs} Ayahs</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[styles.cancelBtn, { marginBottom: Math.max(insets.bottom, hp(2)) }]}
              onPress={() => setModals((m) => ({ ...m, surah: false }))}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ayah selector */}
      <Modal visible={modals.ayah} animationType="slide" transparent onRequestClose={() => setModals((m) => ({ ...m, ayah: false }))}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Ayah</Text>
            <FlatList
              data={ayahIndices}
              keyExtractor={String}
              numColumns={5}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: hp(1) }}
              renderItem={({ item }) => {
                const active = ayahNumber === item;
                return (
                  <TouchableOpacity
                    style={[styles.gridCell, active && styles.gridCellActive]}
                    onPress={() => {
                      shouldContinueRef.current = isPlaying;
                      setAyahNumber(item);
                      setModals((m) => ({ ...m, ayah: false }));
                    }}
                  >
                    <Text style={[styles.gridCellText, active && styles.gridCellTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[styles.cancelBtn, { marginBottom: Math.max(insets.bottom, hp(2)) }]}
              onPress={() => setModals((m) => ({ ...m, ayah: false }))}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reciter selector */}
      <Modal visible={modals.reciter} animationType="slide" transparent onRequestClose={() => setModals((m) => ({ ...m, reciter: false }))}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { height: hp(48) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Reciter</Text>
            <FlatList
              data={RECITERS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const active = selectedReciter.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, active && styles.listItemActive]}
                    onPress={() => handleReciterChange(item)}
                  >
                    <Text style={[styles.listItemText, active && styles.listItemTextActive]}>{item.name}</Text>
                    {active && <Ionicons name="checkmark-circle" size={normalize(18)} color="#f5f5dc" />}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[styles.cancelBtn, { marginBottom: Math.max(insets.bottom, hp(2)) }]}
              onPress={() => setModals((m) => ({ ...m, reciter: false }))}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info modal */}
      <Modal visible={modals.info} animationType="fade" transparent onRequestClose={() => setModals((m) => ({ ...m, info: false }))}>
        <View style={styles.infoOverlay}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconRing}>
              <Ionicons name="headset-outline" size={normalize(28)} color="#0A4A4A" />
            </View>
            <Text style={styles.infoTitle}>Immersive Listening</Text>
            <Text style={styles.infoBody}>
              Follow the Arabic text and its meaning in real-time. Tap{' '}
              <Text style={{ fontWeight: 'bold', color: '#0A4A4A' }}>play</Text> to begin continuous recitation that advances verse by verse automatically.
            </Text>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => setModals((m) => ({ ...m, info: false }))}
            >
              <Text style={styles.infoBtnText}>Continue Listening</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  iconBtn:     { padding: scale(8) },
  nowReciting: {
    color: '#D2B48C',
    fontSize: normalize(9),
    letterSpacing: 2,
    fontWeight: '800',
    opacity: 0.85,
  },
  headerTitle: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: 'bold',
    marginTop: hp(0.3),
  },

  // VERSE AREA
  verseArea: {
    flex: 1,
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  verseGradient: {
    flex: 1,
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.1)',
  },
  verseScroll: {
    padding: wp(5),
    paddingBottom: hp(5),
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(1.5),
  },
  loadingText: {
    color: 'rgba(245,245,220,0.5)',
    fontSize: normalize(12),
    marginTop: hp(1),
  },

  // ARABIC
  arabicText: {
    color: '#f5f5dc',
    fontFamily: 'IndoPakQuran',
    fontSize: normalize(30),
    textAlign: 'right',
    lineHeight: normalize(62),
    writingDirection: 'rtl',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginBottom: hp(1.5),
  },

  // BADGE
  badge: {
    alignSelf: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.6),
    borderRadius: scale(20),
    backgroundColor: 'rgba(210,180,140,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(210,180,140,0.3)',
    marginVertical: hp(2),
  },
  badgeText: {
    color: '#f5f5dc',
    fontSize: normalize(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // TRANSLATION
  translationRow: {
    flexDirection: 'row',
    paddingLeft: wp(1),
  },
  translationBar: {
    width: 2,
    backgroundColor: '#D2B48C',
    marginRight: wp(3.5),
    borderRadius: 2,
    opacity: 0.5,
  },
  translationText: {
    flex: 1,
    color: '#E8DCC4',
    fontSize: normalize(15),
    lineHeight: normalize(23),
    opacity: 0.9,
  },

  // CONTROLS
  controls: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.8),
    backgroundColor: 'rgba(3,38,38,0.35)',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: hp(2),
  },
  pill: {
    flex: 2,
    backgroundColor: '#f5f5dc',
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(3),
    borderRadius: scale(12),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  pillSmall: { flex: 1 },
  pillText: {
    color: '#0A4A4A',
    fontSize: normalize(11),
    fontWeight: '700',
    flexShrink: 1,
  },

  playbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginBottom: hp(2.2),
  },
  playBtn: {
    width: scale(62),
    height: scale(62),
    borderRadius: scale(31),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },

  reciterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: scale(14),
    marginBottom: hp(1),
  },
  reciterText: {
    flex: 1,
    color: '#f5f5dc',
    fontSize: normalize(12),
    fontWeight: '600',
  },

  // MODAL SHARED
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F3D3E',
    height: hp(65),
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
  },
  sheetHandle: {
    width: wp(10),
    height: hp(0.5),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: hp(1.5),
    marginTop: hp(0.8),
  },
  sheetTitle: {
    color: '#fff',
    fontSize: normalize(17),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(1.5),
  },

  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listItemActive: {
    backgroundColor: 'rgba(245,245,220,0.1)',
    borderRadius: scale(10),
    paddingHorizontal: wp(2),
    borderBottomWidth: 0,
  },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(3), flex: 1 },
  listItemText: { color: 'rgba(255,255,255,0.75)', fontSize: normalize(13), fontWeight: '600' },
  listItemTextActive: { color: '#f5f5dc', fontWeight: 'bold' },
  listSubText: { color: 'rgba(255,255,255,0.35)', fontSize: normalize(11) },
  numBadge: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numBadgeActive: { backgroundColor: 'rgba(245,245,220,0.25)' },
  numBadgeText: { color: 'rgba(255,255,255,0.5)', fontSize: normalize(10), fontWeight: '700' },
  numBadgeTextActive: { color: '#f5f5dc' },

  gridCell: {
    flex: 1,
    margin: scale(4),
    paddingVertical: hp(1.4),
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gridCellActive: { backgroundColor: '#f5f5dc', borderColor: '#f5f5dc' },
  gridCellText: { color: '#fff', fontWeight: '600', fontSize: normalize(12) },
  gridCellTextActive: { color: '#0A4A4A' },

  cancelBtn: {
    marginTop: hp(1.5),
    paddingVertical: hp(1.4),
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: scale(12),
  },
  cancelText: { color: '#f5f5dc', fontWeight: 'bold', fontSize: normalize(13) },

  // INFO MODAL
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(6),
  },
  infoCard: {
    backgroundColor: '#f5f5dc',
    width: '100%',
    maxWidth: wp(88),
    borderRadius: scale(20),
    padding: wp(7),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  infoIconRing: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(10,74,74,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  infoTitle: {
    color: '#0A4A4A',
    fontSize: normalize(17),
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  infoBody: {
    color: '#2F4F4F',
    fontSize: normalize(13),
    lineHeight: normalize(21),
    textAlign: 'center',
  },
  infoBtn: {
    backgroundColor: '#0A4A4A',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(8),
    borderRadius: scale(20),
    marginTop: hp(2),
  },
  infoBtnText: { color: '#f5f5dc', fontWeight: 'bold', fontSize: normalize(12) },
});