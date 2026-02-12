import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export interface Ayah {
  number: number;
  text: string;
  translation?: string;
  numberInSurah: number;
}

const SurahDetailScreen = () => {
  const params = useLocalSearchParams();
  const surahNumber = params.surahNumber as string;
  const juzNumber = params.juzNumber as string;
  const surahName = params.surahName as string;

  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'),
  });

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // --- NEW SETTINGS STATE ---
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [arabicFontSize, setArabicFontSize] = useState(32);
  const [showTranslation, setShowTranslation] = useState(true);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [surahNumber, juzNumber]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const arabicEdition = "quran-indian";
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

      if (sound) {
        await sound.unloadAsync();
      }

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

  // --- SETTINGS MODAL COMPONENT ---
  const renderSettingsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={settingsVisible}
      onRequestClose={() => setSettingsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>View Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Arabic Size</Text>
            <View style={styles.fontSizeControls}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => setArabicFontSize(prev => Math.max(20, prev - 2))}
              >
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.fontSizeValue}>{arabicFontSize}</Text>
              
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
      inputRange: [0, 100],
      outputRange: [1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
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

        {/* Bismillah Card */}
        {surahNumber && surahNumber !== '9' && surahNumber !== '1' && (
          <View style={styles.bismillahCard}>
            <LinearGradient
              colors={['rgba(210, 180, 140, 0.15)', 'rgba(210, 180, 140, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bismillahGradient}
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
          style={styles.cardGradient}
        >
          <View style={styles.cornerDecoration}>
            <View style={styles.cornerLine} />
            <View style={[styles.cornerLine, styles.cornerLineVertical]} />
          </View>

          <View style={styles.ayaHeader}>
            <View style={styles.badgeWrapper}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.numberInSurah}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => playAudio(item.number, item.numberInSurah)}
              activeOpacity={0.7}
            >
              <View style={[styles.audioButtonInner, isCurrentlyPlaying && styles.audioButtonPlaying]}>
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
                lineHeight: arabicFontSize * 2 
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
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#f5f5dc" />
        <Text style={styles.loadingText}>Loading verses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
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
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 40,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1a5c5c', // Slightly lighter than background
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D2B48C',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5f5dc',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    color: '#f5f5dc',
    fontSize: 16,
    fontWeight: '500',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontSizeValue: {
    color: '#D2B48C',
    fontSize: 18,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  controlButtonText: {
    color: '#f5f5dc',
    fontSize: 20,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    marginVertical: 16,
  },
  closeButton: {
    backgroundColor: '#D2B48C',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#0A4A4A',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Header
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 30 : 20,
    marginBottom: 20,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 30,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
  },
  settingsIcon: {
    fontSize: 20,
  },
  headerContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  decorativeLine: {
    width: 50,
    height: 2,
    backgroundColor: '#f5f5dc',
    borderRadius: 1,
  },
  decorativeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D2B48C',
  },
  surahTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f5f5dc',
    textAlign: 'center',
    marginBottom: 8,
  },
  surahMeta: {
    fontSize: 14,
    color: '#D2B48C',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },

  // Bismillah Card
  bismillahCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bismillahGradient: {
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(210, 180, 140, 0.3)',
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: 28,
    color: '#f5f5dc',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 46,
    marginBottom: 5,
  },

  // Ayah Card
  ayaCard: {
    marginHorizontal: 18,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
    position: 'relative',
  },
  cornerDecoration: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  cornerLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(245, 245, 220, 0.3)',
    borderRadius: 1,
  },
  cornerLineVertical: {
    width: 2,
    height: 20,
    position: 'absolute',
    right: 0,
  },
  ayaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  badge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 55,
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 220, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.3)',
  },
  badgeText: {
    color: '#f5f5dc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioButton: {
    borderRadius: 20,
  },
  audioButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.25)',
    borderRadius: 20,
  },
  audioButtonPlaying: {
    backgroundColor: 'rgba(210, 180, 140, 0.25)',
    borderColor: 'rgba(210, 180, 140, 0.4)',
  },
  audioIcon: {
    fontSize: 14,
    color: '#f5f5dc',
  },
  audioText: {
    color: '#f5f5dc',
    fontSize: 13,
    fontWeight: '600',
  },

  // Arabic Text
  arabicContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 22,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#D2B48C',
  },
  arabicText: {
    color: '#f5f5dc',
    textAlign: 'right',
    fontFamily: 'IndoPakQuran',
    fontWeight: '500',
  },

  // Translation
  translationContainer: {
    paddingLeft: 18,
    position: 'relative',
  },
  translationAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#D2B48C',
    borderRadius: 2,
  },
  translationText: {
    color: '#C4B5A0',
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '400',
  },
});

export default SurahDetailScreen;