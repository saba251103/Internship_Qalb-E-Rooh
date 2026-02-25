import { useFonts } from '@expo-google-fonts/noto-naskh-arabic';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Linking,
  ListRenderItem,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import PagerView from "react-native-pager-view";
// 1. IMPORT SAFE AREA HOOK
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/* ---------------- DATA TYPES & CONTENT ---------------- */

interface Kalima {
  id: number;
  title: string;
  subtitle: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  youtubeId: string;
}

const kalimas: Kalima[] = [
  {
    id: 1,
    title: "Tayyab",
    subtitle: "First Kalima",
    arabic: "لَآ اِلٰهَ اِلَّا اللّٰهُ مُحَمَّدٌ رَّسُوْلُ اللّٰهِﷺ ",
    transliteration: "La ilaha illallah Muhammadur Rasulullah ﷺ",
    meaning: "There is no god but Allah, [and] Muhammad ﷺ is the messenger of Allah",
    youtubeId: "gjAtbuihonU"
  },
  {
    id: 2,
    title: "Shahadat",
    subtitle: "Second Kalima",
    arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "Ashahado an laa ilaaha illal laho wahdahoo la shareeka lahoo wa ash hado anna Mohammadan abdo hoo wa rasoolohoo",
    meaning: "I testify that there is none worthy of worship except Allah. He is alone and He has no partner and I testify that Muhammad ﷺ is His (Distinguished) Servant and His Prophet",
    youtubeId: "dBF-_GDReeY"
  },
  {
    id: 3,
    title: "Tamjeed",
    subtitle: "Third Kalima",
    arabic: "سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ",
    transliteration: "Subhanallahe wal hamdulillahe wa laa ilaha illal laho wallahooakbar wala haola wala quwwata illa bilahil aliyil azeem",
    meaning: "Glory be to Allah and all praise be to Allah and there is none worthy of worship except Allah,and Allah is Great and there is no power to keep away from sins and no ability to do good but from Allah who is the greatest.",
    youtubeId: "JCcMYDcqIpM"
  },
  {
    id: 4,
    title: "Tauheed",
    subtitle: "Fourth Kalima",
    arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ أَبَدًا أَبَدًا ذُو الْجَلَالِ وَالْإِكْرَامِ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illal lahoo wahdahoo la shareekalahoo lahul mulko walahul hamdo yuhee wa yumeeto wa hoa haiy yul la yaomooto abadan abada zul jalali wal ikraam beyadihil khair. Wa howa ala kulli shayi in qadeer.",
    meaning: "None is worthy of worship except Allah ﷻ He is Alone. He has no partners. ALl kingdom is for Him. Only He gives life and only He gives death. He is Alive;He will never die.[He is] Great and Glorified.In His hand is goodness and He has power over everything.",
    youtubeId: "pD7x1CXSAYQ"
  },
  {
    id: 5,
    title: "Astaghfar",
    subtitle: "Fifth Kalima",
    arabic: "أَسْتَغْفِرُ اللهَ رَبِّي مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمْدًا أَوْ خَطَأً سِرًّا أَوْ عَلَانِيَةً وَأَتُوبُ إِلَيْهِ مِنَ الذَّنْبِ الَّذِي أَعْلَمُ وَمِنَ الذَّنْبِ الَّذِي لَا أَعْلَمُ إِنَّكَ أَنْتَ عَلَّامُ الْغُيُوبِ وَسَتَّارُ الْعُيُوبِ وَغَفَّارُ الذُّنُوبِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ",
    transliteration: "Astaghfirullah Rabbi min kullay zambin aznabtuho amadan ao khat an sirran ao alaniatan wa atubu ilaihee min az zambil lazee la aalamo innaka anta allamul ghuyoobi wa sattaarul oyobi wa ghaffar uz zunoobi wala ha ola wala quwwata illa bila hil aliyil azeem. ",
    meaning: "O my Rab (ﷻ) I seek forgiveness from You for all the sins I have committed knowingly or unknowingly, secretly or openly and I repent of the sins that I am aware of and the sins that I am unaware of, for You are the Knower of Ghuyub and Sattar of faults and Forgiver of sins, and the capability to refrain from sins and the ability to do good deeds are from Allah (ﷻ) only, the Almighty and the Greatest.",
    youtubeId: "7NmlDqdS7w4"
  },
  {
    id: 6,
    title: "Radde Kufr",
    subtitle: "Sixth Kalima",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْئًا وَأَنَا أَعْلَمُ بِهِ وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ بِهِ تُبْتُ عَنْهُ وَتَبَرَّأْتُ مِنَ الْكُفْرِ وَالشِرْكِ وَالْكِذْبِ  وَالْغِيبَةِ وَالْبِدْعَةِ وَالنَّمِيمَةِ وَالْفَوَاحِشِ وَالْبُهْتَانِ وَالْمَعَاصِي كُلِّهَا وَأَسْلَمْتُ وَأَقُولُ لَا إِلٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ",
    transliteration: "Allahumma innii a'udhu bika min an ushrika bika shai-anw-wa ana a'lamu bihii. Was tagh fi ru ka limaa laa alamu bihee. Tubtu anhu wa tabarra-tu min al-kufri wash-shirki wal-kizdhbi wal-ghiibati wal-bid'ati wan-namiimati wal fawaahishi wal-buhtani w-al-ma'aasii kulliha. Wa aslamtu wa aquulu La illaha illAllahu Muhammadur RasulAllah ﷺ",
    meaning: "O Allah (ﷻ) I seek Your refuge from associating anything with You knowingly, and I seek forgiveness from You for (polytheism) that I do not know. I have repented of it and I have detested unbelief, polytheism, telling lie, backbiting, bad innovations, tale-telling, indecencies, accusations and all the sins. I embrace Islam and say there is none worthy of worship but Allah (ﷻ), Muhammad (ﷺ ) is the Prophet of Allah.",
    youtubeId: "er_jQnX7L_g"
  },
];

/* ---------------- COMPONENTS ---------------- */

// 2. MEMOIZED LIST ITEM (Performance optimization)
const KalimaCard = memo(({ item, isBookmarked, onPress, onYoutubePress }: { item: Kalima, isBookmarked: boolean, onPress: () => void, onYoutubePress: () => void }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View style={styles.cardLeft}>
      <LinearGradient colors={['#E8F5F1', '#C8E6E0']} style={styles.circle}>
        <Text style={styles.num}>{item.id}</Text>
      </LinearGradient>
      <View style={styles.cardText}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.title}>{item.title}</Text>
            {isBookmarked && (
                <Ionicons name="bookmark" size={14} color="#0D5252" style={{marginLeft: 6}} />
            )}
        </View>
        <Text style={styles.cardSubTitle}>{item.subtitle}</Text>
      </View>
    </View>

    <View style={styles.actionRow}>
        <TouchableOpacity 
            onPress={onYoutubePress}
            style={styles.listYoutubeBtn}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
            <Ionicons name="logo-youtube" size={20} color="#FF0000" />
        </TouchableOpacity>
        <View style={styles.arrowCircle}>
            <Ionicons name="chevron-forward" size={16} color="#0D5252" />
        </View>
    </View>
  </TouchableOpacity>
));

/* ---------------- MAIN SCREEN ---------------- */

export default function ShahadahScreenWrapper() {
  return (
    // 3. SAFE AREA PROVIDER (Required for Insets to work)
    <SafeAreaProvider>
      <ShahadahScreen />
    </SafeAreaProvider>
  )
}

function ShahadahScreen() {
  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'), 
  });
  const router = useRouter();
  
  // 4. USE INSETS
  const insets = useSafeAreaInsets();
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const data = await AsyncStorage.getItem("kalimaBookmarks");
      if (data) setBookmarks(JSON.parse(data));
    } catch (e) { console.log(e); }
  };

  const toggleBookmark = async (id: number) => {
    const updated = bookmarks.includes(id)
      ? bookmarks.filter((b) => b !== id)
      : [...bookmarks, id];
    
    setBookmarks(updated);
    await AsyncStorage.setItem("kalimaBookmarks", JSON.stringify(updated));
    
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const openYouTube = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const renderItem: ListRenderItem<Kalima> = useCallback(({ item, index }) => (
    <KalimaCard 
      item={item} 
      isBookmarked={bookmarks.includes(item.id)}
      onPress={() => setSelectedIndex(index)}
      onYoutubePress={() => openYouTube(item.youtubeId)}
    />
  ), [bookmarks]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D5252" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F7FAF9" }}>
      {/* 5. TRANSLUCENT STATUS BAR for edge-to-edge effect */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* -------- HEADER -------- */}
      <LinearGradient 
        colors={['#0D5252', '#166B6B']} 
        style={[styles.headerContainer, { paddingTop: insets.top + 10 }]} // Dynamic padding
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={'#FFFFFF'} />
        </TouchableOpacity>
        
        <View style={{alignItems: 'center'}}>
          <Text style={styles.headerSubtitle}>Faith Essentials</Text>
          <Text style={styles.headerTitle}>The Six Kalimas</Text>
        </View>
        
        <TouchableOpacity style={styles.headerIconBtn}>
           <Ionicons name="heart" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* -------- FLATLIST -------- */}
      <FlatList
        data={kalimas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        // 6. BOTTOM SAFE AREA PADDING so last item isn't behind gesture bar
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* -------- DETAIL MODAL -------- */}
      <Modal 
        visible={selectedIndex !== null} 
        animationType="slide"
        // 7. HANDLE MODAL STATUS BAR
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'overFullScreen'}
        onRequestClose={() => setSelectedIndex(null)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: '#F0F9F4' }}>
          <PagerView 
            style={{ flex: 1 }} 
            initialPage={selectedIndex || 0}
            onPageSelected={(e) => setSelectedIndex(e.nativeEvent.position)}
          >
            {kalimas.map((item) => (
              <View key={item.id} style={{ flex: 1 }}>
                
                {/* MODAL HEADER */}
                <LinearGradient 
                  colors={['#0D5252', '#166B6B']} 
                  style={[styles.detailHeader, { paddingTop: insets.top + 15 }]} // Dynamic modal header
                >
                  <TouchableOpacity onPress={() => setSelectedIndex(null)} style={styles.headerIconBtn}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <Text style={styles.detailHeaderTitle}>{item.subtitle}</Text>
                  
                  <TouchableOpacity onPress={() => toggleBookmark(item.id)} style={styles.headerIconBtn}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <Ionicons
                        name={bookmarks.includes(item.id) ? "bookmark" : "bookmark-outline"}
                        size={22} color="#fff"
                      />
                    </Animated.View>
                  </TouchableOpacity>
                </LinearGradient>

                <ScrollView 
                  style={styles.detailContent} 
                  contentContainerStyle={[styles.detailScrollContent, { paddingBottom: insets.bottom + 40 }]}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.arabicCard}>
                    <Text style={styles.arabic}>{item.arabic}</Text>
                  </View>

                  <View style={styles.glassSection}>
                    <View style={styles.sectionLabel}>
                      <Ionicons name="text" size={16} color="#0D5252" />
                      <Text style={styles.sectionLabelText}>TRANSLITERATION</Text>
                    </View>
                    <Text style={styles.translitText}>{item.transliteration}</Text>
                  </View>

                  <View style={styles.glassSection}>
                    <View style={styles.sectionLabel}>
                      <Ionicons name="book" size={16} color="#0D5252" />
                      <Text style={styles.sectionLabelText}>MEANING</Text>
                    </View>
                    <Text style={styles.meaningText}>{item.meaning}</Text>
                  </View>

                  {/* Page Indicator */}
                  <View style={styles.pageIndicatorContainer}>
                    {kalimas.map((_, idx) => (
                      <View 
                        key={idx} 
                        style={[styles.dot, idx === selectedIndex && styles.activeDot]} 
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </PagerView>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9F4' },
  
  headerContainer: {
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#0D5252",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 12, color: "#A8D8D8", fontWeight: "700", textTransform: 'uppercase', marginBottom: 2 },
  headerIconBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 14 },
  
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  circle: { width: 45, height: 45, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 14 },
  num: { fontWeight: "800", fontSize: 16, color: "#0D5252" },
  cardText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  cardSubTitle: { fontSize: 12, color: "#7A7A7A", marginTop: 2, fontWeight: '500' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  listYoutubeBtn: {
    padding: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0'
  },
  arrowCircle: { 
    backgroundColor: "#F7FAF9", 
    padding: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8F5F1'
  },
  
  detailHeader: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  detailHeaderTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  detailContent: { flex: 1 },
  detailScrollContent: { padding: 20 },
  
  arabicCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F5F1',
    shadowColor: '#0D5252',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  arabic: {
    fontFamily: 'IndoPakQuran', 
    fontWeight: 'normal',      
    includeFontPadding: false, // CRITICAL FOR ANDROID
    fontSize: 30,
    textAlign: "center",
    color: "#0D5252",
    lineHeight: 55,
    paddingVertical: 10 // Extra breathing room for diacritics
  },
  glassSection: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(13, 82, 82, 0.05)",
  },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionLabelText: { fontSize: 11, fontWeight: '800', color: '#0D5252', marginLeft: 8, letterSpacing: 1 },
  translitText: { fontSize: 15, color: "#444", fontStyle: "italic", lineHeight: 22 },
  meaningText: { fontSize: 15, color: "#222", fontWeight: "500", lineHeight: 22 },
  
  pageIndicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C8E6E0', marginHorizontal: 4 },
  activeDot: { width: 20, backgroundColor: '#0D5252' },
});