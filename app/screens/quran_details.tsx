import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PixelRatio,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Library 1: react-native-responsive-screen (Percentage layouts)
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

// Library 2: react-native-size-matters (Scaling fonts/spacing)
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

// --- HELPER: Font Scaling ---
// Android often scales text too aggressively. This helper keeps it balanced.
const fontScale = (size: number, factor = 0.3) => {
  return Platform.OS === 'android' ? moderateScale(size, factor) : moderateScale(size);
};

export interface Ayah {
  number: number;
  text: string;
  translation?: string;
  numberInSurah: number;
}

const SurahDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const surahNumber = params.surahNumber as string;
  const juzNumber = params.juzNumber as string;
  const surahName = params.surahName as string;

  // PixelRatio: Thinnest possible line for borders
  const hairline = 1 / PixelRatio.get();

  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'),
  });

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Settings State
  const [settingsVisible, setSettingsVisible] = useState(false);
  // Default font size scaled slightly for different screens
  const [arabicFontSize, setArabicFontSize] = useState(fontScale(28)); 
  const [showTranslation, setShowTranslation] = useState(true);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [surahNumber, juzNumber]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const arabicEdition = "quran-indian"; // IndoPak script
      const translationEdition = "en.sahih";
      let combined: Ayah[] = [];

      if (surahNumber) {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/${arabicEdition},${translationEdition}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        combined = json.data[0].ayahs.map((a: any, i: number) => ({
          ...a,
          translation: json.data[1].ayahs[i].text
        }));
      } else if (juzNumber) {
        const [resAr, resEn] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/${arabicEdition}`),
          fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/${translationEdition}`)
        ]);

        if (!resAr.ok || !resEn.ok) throw new Error("Juz API error");

        const jsonAr = await resAr.json();
        const jsonEn = await resEn.json();

        combined = jsonAr.data.ayahs.map((a: any, i: number) => ({
          ...a,
          translation: jsonEn.data.ayahs[i].text
        }));
      }
      setAyahs(combined);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (globalNumber: number, ayahNumber: number) => {
    try {
      if (sound && playingAyah === ayahNumber) {
        await sound.pauseAsync();
        setIsPlaying(false);
        setPlayingAyah(null);
        return;
      }
      if (sound) await sound.unloadAsync();

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3` },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setPlayingAyah(null);
        }
      });

      setSound(newSound);
      setPlayingAyah(ayahNumber);
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
    }
  };

  // --- SETTINGS MODAL ---
  const renderSettingsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={settingsVisible}
      onRequestClose={() => setSettingsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { borderWidth: hairline * 2 }]}>
          <Text style={styles.modalTitle}>View Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Arabic Size</Text>
            <View style={styles.fontSizeControls}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => setArabicFontSize(prev => Math.max(15, prev - 2))}
              >
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              
              {/* Display rounded font size */}
              <Text style={styles.fontSizeValue}>{Math.round(arabicFontSize)}</Text>
              
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => setArabicFontSize(prev => Math.min(60, prev + 2))}
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show Translation</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#D2B48C" }}
              thumbColor={showTranslation ? "#f5f5dc" : "#f4f3f4"}
              onValueChange={() => setShowTranslation(prev => !prev)}
              value={showTranslation}
            />
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSettingsVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, verticalScale(100)],
      outputRange: [1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.settingsIcon}>‹</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerDecoration}>
            <View style={styles.decorativeDot} />
            <View style={styles.decorativeLine} />
            <View style={styles.decorativeDot} />
          </View>
          
          <Text style={styles.surahTitle}>{surahName || `Para ${juzNumber}`}</Text>
          <Text style={styles.surahMeta}>
            {surahNumber ? `Surah ${surahNumber}` : `Juz ${juzNumber}`} • {ayahs.length} Verses
          </Text>
          
          <View style={styles.headerDecoration}>
            <View style={styles.decorativeDot} />
            <View style={styles.decorativeLine} />
            <View style={styles.decorativeDot} />
          </View>
        </View>

        {/* Bismillah Card (Only for Surahs, excluding Surah 9) */}
        {surahNumber && surahNumber !== '9' && surahNumber !== '1' && (
          <View style={styles.bismillahCard}>
            <LinearGradient
              colors={['rgba(210, 180, 140, 0.15)', 'rgba(210, 180, 140, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bismillahGradient, { borderWidth: hairline }]}
            >
              <Text style={styles.bismillahText}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
            </LinearGradient>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderAyah = ({ item }: { item: Ayah; index: number }) => {
    const isCurrentlyPlaying = playingAyah === item.numberInSurah && isPlaying;

    return (
      <View style={styles.ayaCard}>
        <LinearGradient
          colors={
            isCurrentlyPlaying
              ? ['rgba(210, 180, 140, 0.2)', 'rgba(210, 180, 140, 0.08)']
              : ['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.05)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardGradient, { borderWidth: hairline * 2 }]}
        >
          <View style={styles.cornerDecoration}>
            <View style={styles.cornerLine} />
            <View style={[styles.cornerLine, styles.cornerLineVertical]} />
          </View>

          <View style={styles.ayaHeader}>
            <View style={styles.badgeWrapper}>
              <View style={[styles.badge, { borderWidth: hairline * 2 }]}>
                <Text style={styles.badgeText}>{item.numberInSurah}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => playAudio(item.number, item.numberInSurah)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.audioButtonInner, 
                isCurrentlyPlaying && styles.audioButtonPlaying,
                { borderWidth: hairline }
              ]}>
                <Text style={styles.audioIcon}>{isCurrentlyPlaying ? '⏸' : '▶'}</Text>
                <Text style={styles.audioText}>
                  {isCurrentlyPlaying ? 'Pause' : 'Play'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Arabic Text with Dynamic Size */}
          <View style={styles.arabicContainer}>
            <Text style={[
              styles.arabicText, 
              { 
                fontSize: arabicFontSize, 
                lineHeight: arabicFontSize * 2 // Line height scales with font size
              }
            ]}>
              {item.text}
            </Text>
          </View>

          {/* Conditional Translation */}
          {showTranslation && (
            <View style={styles.translationContainer}>
              <View style={styles.translationAccent} />
              <Text style={styles.translationText}>{item.translation}</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4A4A" />
        <ActivityIndicator size="large" color="#f5f5dc" />
        <Text style={styles.loadingText}>Loading verses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4A4A" />
      {renderSettingsModal()}
      
      <Animated.FlatList
        data={ayahs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderAyah}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A4A4A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A4A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f5f5dc',
    marginTop: verticalScale(16),
    fontSize: fontScale(16),
  },
  listContent: {
    paddingBottom: verticalScale(40),
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp('85%'), // Responsive width
    backgroundColor: '#1a5c5c',
    borderRadius: moderateScale(20),
    padding: scale(24),
    borderColor: '#D2B48C',
  },
  modalTitle: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#f5f5dc',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  settingLabel: {
    color: '#f5f5dc',
    fontSize: fontScale(16),
    fontWeight: '500',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  fontSizeValue: {
    color: '#D2B48C',
    fontSize: fontScale(18),
    fontWeight: 'bold',
    width: scale(30),
    textAlign: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  controlButtonText: {
    color: '#f5f5dc',
    fontSize: fontScale(20),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    marginVertical: verticalScale(16),
  },
  closeButton: {
    backgroundColor: '#D2B48C',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(10),
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#0A4A4A',
    fontWeight: 'bold',
    fontSize: fontScale(16),
  },

  // --- HEADER STYLES ---
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? verticalScale(30) : verticalScale(10),
    marginBottom: verticalScale(20),
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? verticalScale(40) : verticalScale(30),
    right: scale(20),
    zIndex: 10,
    padding: scale(8),
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: moderateScale(20),
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? verticalScale(40) : verticalScale(30),
    left: scale(20),
    zIndex: 10,
    padding: scale(8),
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: moderateScale(20),
  },
  settingsIcon: {
    fontSize: fontScale(20),
    color: '#f5f5dc',
  },
  headerContent: {
    paddingVertical: verticalScale(24),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(16),
  },
  decorativeLine: {
    width: scale(50),
    height: verticalScale(2),
    backgroundColor: '#f5f5dc',
    borderRadius: 1,
  },
  decorativeDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#D2B48C',
  },
  surahTitle: {
    fontSize: fontScale(28),
    fontWeight: 'bold',
    color: '#f5f5dc',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  surahMeta: {
    fontSize: fontScale(14),
    color: '#D2B48C',
    textAlign: 'center',
    marginBottom: verticalScale(16),
    fontWeight: '600',
  },

  // --- BISMILLAH CARD ---
  bismillahCard: {
    marginHorizontal: wp('5%'),
    marginTop: verticalScale(20),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(3) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(6),
  },
  bismillahGradient: {
    padding: scale(28),
    borderColor: 'rgba(210, 180, 140, 0.3)',
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: fontScale(24), // Dynamic font
    color: '#f5f5dc',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: fontScale(40),
    marginBottom: verticalScale(5),
    fontFamily: 'IndoPakQuran',
  },

  // --- AYAH CARD ---
  ayaCard: {
    marginHorizontal: wp('4.5%'),
    marginVertical: verticalScale(10),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
  },
  cardGradient: {
    padding: scale(20),
    borderColor: 'rgba(245, 245, 220, 0.2)',
    position: 'relative',
  },
  cornerDecoration: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
  },
  cornerLine: {
    width: scale(20),
    height: verticalScale(2),
    backgroundColor: 'rgba(245, 245, 220, 0.3)',
    borderRadius: 1,
  },
  cornerLineVertical: {
    width: verticalScale(2),
    height: scale(20),
    position: 'absolute',
    right: 0,
  },
  ayaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  badgeWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  badge: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(20),
    minWidth: scale(55),
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 220, 0.2)',
    borderColor: 'rgba(245, 245, 220, 0.3)',
  },
  badgeText: {
    color: '#f5f5dc',
    fontSize: fontScale(16),
    fontWeight: 'bold',
  },
  audioButton: {
    borderRadius: moderateScale(20),
  },
  audioButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    gap: scale(8),
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    borderColor: 'rgba(245, 245, 220, 0.25)',
    borderRadius: moderateScale(20),
  },
  audioButtonPlaying: {
    backgroundColor: 'rgba(210, 180, 140, 0.25)',
    borderColor: 'rgba(210, 180, 140, 0.4)',
  },
  audioIcon: {
    fontSize: fontScale(14),
    color: '#f5f5dc',
  },
  audioText: {
    color: '#f5f5dc',
    fontSize: fontScale(13),
    fontWeight: '600',
  },

  // --- CONTENT ---
  arabicContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: moderateScale(12),
    padding: scale(22),
    marginBottom: verticalScale(18),
    borderLeftWidth: scale(3),
    borderLeftColor: '#D2B48C',
  },
  arabicText: {
    color: '#f5f5dc',
    textAlign: 'right',
    fontFamily: 'IndoPakQuran',
    fontWeight: '500',
    // fontSize is handled inline via state
  },
  translationContainer: {
    paddingLeft: scale(18),
    position: 'relative',
  },
  translationAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: scale(3),
    backgroundColor: '#D2B48C',
    borderRadius: 2,
  },
  translationText: {
    color: '#C4B5A0',
    fontSize: fontScale(15),
    lineHeight: verticalScale(24),
    fontWeight: '400',
  },
});

export default SurahDetailScreen;