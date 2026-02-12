import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface SurahItem {
    number: number;
    englishName: string;
    name: string;
    numberOfAyahs: number;
}

// 1. Define Reciters List
const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdulsamad', name: 'Abdul Basit' },
  { id: 'ar.ahmedajamy', name: 'Ahmed Al-Ajamy' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi' },
];

export default function ImmerseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [surahList, setSurahList] = useState<SurahItem[]>([]);
  const [currentSurah, setCurrentSurah] = useState({ 
    number: Number(params.surahNumber) || 1, 
    name: params.surahName || "Al-Faatiha",
    totalAyahs: 7
  });
  const [currentAyah, setCurrentAyah] = useState(Number(params.ayahNumber) || 1);
  const [verseData, setVerseData] = useState<any>(null);
  
  // Audio & UI State
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]); // Default to Alafasy
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const [surahModalVisible, setSurahModalVisible] = useState(false);
  const [ayahModalVisible, setAyahModalVisible] = useState(false);
  const [reciterModalVisible, setReciterModalVisible] = useState(false); // New modal

  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'), 
  });

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(json => setSurahList(json.data));
  }, []);

  useEffect(() => {
    fetchVerseData();
    return () => {
        if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, [currentSurah.number, currentAyah]);

  // Sync audio whenever data OR reciter changes
  useEffect(() => {
    if (verseData && isPlaying) {
        playVerseAudio();
    }
  }, [verseData, isPlaying, selectedReciter]);

  const fetchVerseData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/ayah/${currentSurah.number}:${currentAyah}/editions/quran-indian,en.sahih`
      );
      const json = await response.json();
      
      setVerseData({
        text: json.data[0].text,
        translation: json.data[1].text,
        number: json.data[0].number,
        surah: json.data[0].surah
      });

      if (json.data[0].surah) {
          setCurrentSurah(prev => ({...prev, totalAyahs: json.data[0].surah.numberOfAyahs}));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const playVerseAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // 2. Use selected reciter ID dynamically
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedReciter.id}/${verseData.number}.mp3`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          handleNext();
        }
      });
    } catch (e) {
      console.log("Audio Sync Error:", e);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      soundRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentAyah < currentSurah.totalAyahs) {
      setCurrentAyah(prev => prev + 1);
    } else if (currentSurah.number < 114) {
      const nextS = surahList.find(s => s.number === currentSurah.number + 1);
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

  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={['#0A4A4A', '#064343', '#032626']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={28} color="#f5f5dc" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.playingFrom}>NOW PLAYING</Text>
            <Text style={styles.headerSurahName}>{currentSurah.name}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#f5f5dc" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content Container */}
        <View style={styles.mainContentArea}>
          {loading ? (
            <View style={styles.loaderWrapper}><ActivityIndicator color="#f5f5dc" size="large" /></View>
          ) : (
            <LinearGradient colors={['rgba(245, 245, 220, 0.08)', 'rgba(245, 245, 220, 0.03)']} style={styles.verseBoxGradient}>
              <ScrollView showsVerticalScrollIndicator={true} indicatorStyle="white" contentContainerStyle={styles.verseScrollPadding}>
                <Text style={styles.arabicLyric}>{verseData?.text}</Text>
                <View style={styles.verseBadge}><Text style={styles.verseBadgeText}>Ayah {currentAyah}</Text></View>
                <View style={styles.translationContainer}>
                  <View style={styles.translationLine} />
                  <Text style={styles.translationLyric}>{verseData?.translation}</Text>
                </View>
              </ScrollView>
            </LinearGradient>
          )}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomControlsArea}>
          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.pill} onPress={() => setSurahModalVisible(true)}>
              <Text style={styles.pillText}>{currentSurah.name}</Text>
              <Ionicons name="caret-down" size={14} color="#0A4A4A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => setAyahModalVisible(true)}>
              <Text style={styles.pillText}>Ayah {currentAyah}</Text>
              <Ionicons name="caret-down" size={14} color="#0A4A4A" />
            </TouchableOpacity>
          </View>

          <View style={styles.playbackRow}>
            <TouchableOpacity onPress={handlePrev}><Ionicons name="play-skip-back" size={35} color="white" /></TouchableOpacity>
            <TouchableOpacity style={styles.playButtonCircle} onPress={togglePlayback}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#0A4A4A" style={isPlaying ? {} : {marginLeft: 4}} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext}><Ionicons name="play-skip-forward" size={35} color="white" /></TouchableOpacity>
          </View>

          {/* 3. Dynamic Reciter Trigger */}
          <TouchableOpacity style={styles.reciterFooter} onPress={() => setReciterModalVisible(true)}>
            <MaterialCommunityIcons name="account-music-outline" size={20} color="#D2B48C" />
            <Text style={styles.reciterName}>{selectedReciter.name}</Text>
            <Ionicons name="chevron-up" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Reciter Selection Modal */}
        <Modal visible={reciterModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {height: '50%'}]}>
              <Text style={styles.modalHeaderTitle}>Select Reciter</Text>
              <FlatList
                data={RECITERS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalItem, selectedReciter.id === item.id && styles.selectedItem]} 
                    onPress={() => {
                      setSelectedReciter(item);
                      setReciterModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, selectedReciter.id === item.id && {color: '#f5f5dc'}]}>
                      {item.name}
                    </Text>
                    {selectedReciter.id === item.id && <Ionicons name="checkmark-circle" size={20} color="#f5f5dc" />}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setReciterModalVisible(false)} style={styles.closeBtn}><Text style={styles.closeBtnText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Surah & Ayah Modals remain the same... */}
        <Modal visible={surahModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList
                data={surahList}
                keyExtractor={(item) => item.number.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => {
                      setCurrentSurah({ number: item.number, name: item.englishName, totalAyahs: item.numberOfAyahs });
                      setCurrentAyah(1); setSurahModalVisible(false);
                    }}>
                    <Text style={styles.modalItemText}>{item.number}. {item.englishName}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setSurahModalVisible(false)} style={styles.closeBtn}><Text style={styles.closeBtnText}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={ayahModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList
                data={ayahIndices}
                keyExtractor={(item) => item.toString()}
                numColumns={4}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.gridItem} onPress={() => { setCurrentAyah(item); setAyahModalVisible(false); }}>
                    <Text style={styles.gridItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setAyahModalVisible(false)} style={styles.closeBtn}><Text style={styles.closeBtnText}>Close</Text></TouchableOpacity>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerButton: { padding: 8 },
  playingFrom: { color: '#D2B48C', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' },
  headerSurahName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  mainContentArea: { flex: 1, marginHorizontal: 20, marginBottom: 10, borderRadius: 25, overflow: 'hidden' },
  verseBoxGradient: { flex: 1, padding: 20, borderWidth: 1, borderColor: 'rgba(245, 245, 220, 0.2)' },
  verseScrollPadding: { paddingBottom: 30 },
  loaderWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  arabicLyric: { color: '#f5f5dc', fontSize: 42, fontFamily: 'IndoPakQuran', textAlign: 'right', lineHeight: 78, fontWeight: 'bold' },
  verseBadge: { alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(210, 180, 140, 0.2)', marginVertical: 25 },
  verseBadgeText: { color: '#f5f5dc', fontSize: 12, fontWeight: 'bold' },
  translationContainer: { flexDirection: 'row', paddingLeft: 15 },
  translationLine: { width: 3, backgroundColor: '#D2B48C', marginRight: 15, borderRadius: 2 },
  translationLyric: { flex: 1, color: '#E8DCC4', fontSize: 18, fontWeight: '500', lineHeight: 28 },
  bottomControlsArea: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 10 : 25 },
  selectorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pill: { flex: 1, backgroundColor: '#f5f5dc', paddingVertical: 12, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pillText: { color: '#0A4A4A', fontSize: 14, fontWeight: 'bold', marginRight: 5 },
  playbackRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  playButtonCircle: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  reciterFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 15 },
  reciterName: { color: '#f5f5dc', fontSize: 14, fontWeight: '600', marginLeft: 10, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0A4A4A', height: '65%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeaderTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  selectedItem: { backgroundColor: 'rgba(245, 245, 220, 0.1)', borderRadius: 10, paddingHorizontal: 10 },
  modalItemText: { color: 'white', fontSize: 17, fontWeight: '600' },
  gridItem: { flex: 1, padding: 15, alignItems: 'center', margin: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
  gridItemText: { color: 'white', fontWeight: 'bold' },
  closeBtn: { marginTop: 20, padding: 15, alignItems: 'center', backgroundColor: 'rgba(245, 245, 220, 0.1)', borderRadius: 15 },
  closeBtnText: { color: 'white', fontWeight: 'bold' }
});