import { Ionicons } from "@expo/vector-icons";
import { useFonts } from 'expo-font'; // Fixed incorrect font import
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import YoutubePlayer from "react-native-youtube-iframe";
import { Kalima, kalimaService } from '../services/kalimaService';

/* ─────────────────────────────────────────
   RESPONSIVE UTILITIES & TABLET CONSTRAINTS
───────────────────────────────────────── */
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const fontScale = (size: number) =>
  Platform.OS === 'android' ? moderateScale(size, 0.3) : moderateScale(size);

// Tablet Constraint: Cap content width so it doesn't stretch infinitely on iPads
const CONTENT_MAX_WIDTH = 700;
const ACTUAL_WIDTH = isTablet ? Math.min(SCREEN_WIDTH * 0.85, CONTENT_MAX_WIDTH) : wp('90%');
const VIDEO_HEIGHT = ACTUAL_WIDTH * (9 / 16);
const ARABIC_FONT_SIZE = isTablet ? 36 : 28;

/* ─────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────── */
const KalimaCard = memo(({ item, onPress }: { item: Kalima; onPress: () => void }) => (
  <TouchableOpacity style={[styles.card, { width: ACTUAL_WIDTH }]} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.cardLeft}>
      <LinearGradient colors={['#E8F5F1', '#C8E6E0']} style={styles.circle}>
        <Text style={styles.num}>{item.id}</Text>
      </LinearGradient>
      <View style={styles.cardText}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.cardSubTitle}>{item.subtitle}</Text>
      </View>
    </View>
    <View style={styles.arrowCircle}>
      <Ionicons name="chevron-forward" size={moderateScale(16)} color="#0D5252" />
    </View>
  </TouchableOpacity>
));

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */
export default function ShahadahScreenWrapper() {
  return (
    <SafeAreaProvider>
      <ShahadahScreen />
    </SafeAreaProvider>
  );
}

function ShahadahScreen() {
  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'), 
  });
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [kalimas, setKalimas] = useState<Kalima[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKalima, setSelectedKalima] = useState<Kalima | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await kalimaService.getAllKalimas();
        setKalimas(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderItem: ListRenderItem<Kalima> = useCallback(({ item }) => (
    <KalimaCard item={item} onPress={() => setSelectedKalima(item)} />
  ), []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D5252" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* -------- HEADER -------- */}
      <LinearGradient 
        colors={['#0D5252', '#166B6B']} 
        style={[styles.headerContainer, { paddingTop: insets.top + verticalScale(10) }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
          <Ionicons name="chevron-back" size={moderateScale(24)} color={'#FFFFFF'} />
        </TouchableOpacity>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerSubtitle}>Faith Essentials</Text>
          <Text style={styles.headerTitle}>The Six Kalimas</Text>
        </View>
        <View style={{ width: moderateScale(44) }} /> 
      </LinearGradient>

      {/* -------- LIST -------- */}
      <FlatList
        data={kalimas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: insets.bottom + verticalScale(20) }
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
      />

      {/* -------- DETAIL MODAL -------- */}
      <Modal 
        visible={selectedKalima !== null} 
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setSelectedKalima(null)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient 
            colors={['#0D5252', '#166B6B']} 
            style={[styles.detailHeader, { paddingTop: insets.top + verticalScale(15) }]}
          >
            <TouchableOpacity onPress={() => setSelectedKalima(null)} style={styles.headerIconBtn}>
              <Ionicons name="close" size={moderateScale(24)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>{selectedKalima?.subtitle}</Text>
            <View style={{ width: moderateScale(44) }} />
          </LinearGradient>

          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={[
              styles.modalScrollContent, 
              { paddingBottom: insets.bottom + verticalScale(40) }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Tablet wrapper for inner content */}
            <View style={{ width: ACTUAL_WIDTH }}>
              <View style={styles.arabicCard}>
                <Text style={styles.arabic}>{selectedKalima?.arabic}</Text>
              </View>

              <View style={styles.glassSection}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="text" size={moderateScale(14)} color="#0D5252" />
                  <Text style={styles.sectionLabelText}>TRANSLITERATION</Text>
                </View>
                <Text style={styles.translitText}>{selectedKalima?.transliteration}</Text>
              </View>

              <View style={styles.glassSection}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="book" size={moderateScale(14)} color="#0D5252" />
                  <Text style={styles.sectionLabelText}>MEANING</Text>
                </View>
                <Text style={styles.meaningText}>{selectedKalima?.meaning}</Text>
              </View>

              {selectedKalima?.youtubeId && (
                <View style={styles.videoWrapper}>
                  <View style={styles.videoContainer}>
                    <YoutubePlayer
                      height={VIDEO_HEIGHT}
                      width={ACTUAL_WIDTH}
                      videoId={selectedKalima.youtubeId}
                      webViewStyle={{ opacity: 0.99 }}
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F7FAF9" 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F0F9F4' 
  },
  headerContainer: {
    paddingBottom: verticalScale(25),
    paddingHorizontal: wp('5%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: moderateScale(30),
    borderBottomRightRadius: moderateScale(30),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTextWrapper: { 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: fontScale(22), 
    fontWeight: "800", 
    color: "#fff" 
  },
  headerSubtitle: { 
    fontSize: fontScale(11), 
    color: "#A8D8D8", 
    fontWeight: "700", 
    textTransform: 'uppercase' 
  },
  headerIconBtn: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    padding: moderateScale(10), 
    borderRadius: moderateScale(12) 
  },
  scrollContent: { 
    paddingVertical: verticalScale(20),
    alignItems: 'center', // Centers the cards on tablets
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  circle: { 
    width: moderateScale(44), 
    height: moderateScale(44), 
    borderRadius: moderateScale(12), 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: scale(15) 
  },
  num: { 
    fontWeight: "800", 
    fontSize: fontScale(16), 
    color: "#0D5252" 
  },
  cardText: { 
    flex: 1 
  },
  title: { 
    fontSize: fontScale(17), 
    fontWeight: "700", 
    color: "#1A1A1A" 
  },
  cardSubTitle: { 
    fontSize: fontScale(13), 
    color: "#7A7A7A", 
    marginTop: verticalScale(2) 
  },
  arrowCircle: { 
    backgroundColor: "#F7FAF9", 
    padding: moderateScale(8), 
    borderRadius: moderateScale(10) 
  },
  
  // Modal Styles
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#F0F9F4' 
  },
  detailHeader: {
    paddingBottom: verticalScale(20),
    paddingHorizontal: wp('5%'),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: moderateScale(30),
    borderBottomRightRadius: moderateScale(30),
  },
  detailHeaderTitle: { 
    fontSize: fontScale(18), 
    fontWeight: "700", 
    color: "#fff" 
  },
  modalScrollContent: {
    paddingVertical: verticalScale(20),
    alignItems: 'center', // Centers modal content on tablets
  },
  arabicCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(24),
    padding: moderateScale(24),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: '#E8F5F1',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  arabic: {
    fontFamily: 'IndoPakQuran', 
    fontSize: fontScale(ARABIC_FONT_SIZE),
    textAlign: "center",
    color: "#0D5252",
    lineHeight: fontScale(ARABIC_FONT_SIZE * 1.8),
  },
  glassSection: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: moderateScale(18),
    padding: moderateScale(18),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: "rgba(13, 82, 82, 0.05)",
  },
  sectionLabel: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: verticalScale(8) 
  },
  sectionLabelText: { 
    fontSize: fontScale(10), 
    fontWeight: '800', 
    color: '#0D5252', 
    marginLeft: scale(8), 
    letterSpacing: 1 
  },
  translitText: { 
    fontSize: fontScale(15), 
    color: "#444", 
    fontStyle: "italic", 
    lineHeight: fontScale(22) 
  },
  meaningText: { 
    fontSize: fontScale(15), 
    color: "#222", 
    fontWeight: "500", 
    lineHeight: fontScale(22) 
  },
  videoWrapper: { 
    marginTop: verticalScale(10), 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  videoContainer: { 
    borderRadius: moderateScale(20), 
    overflow: 'hidden', 
    backgroundColor: '#000' 
  },
});