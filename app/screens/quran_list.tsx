import { MaterialCommunityIcons } from '@expo/vector-icons'; // Added Icon Import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  PixelRatio,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Library 1: react-native-responsive-screen
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

// Library 2: react-native-size-matters
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

// --- FONT SCALING HELPER ---
const fontScale = (size: number) => {
  return Platform.OS === 'android' ? moderateScale(size, 0.3) : moderateScale(size);
};

export default function QuranListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'surah' | 'para'>('surah');
  const [surahs, setSurahs] = useState([]);
  const [paras] = useState(Array.from({ length: 30 }, (_, i) => i + 1));
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<any>(null);
  const [slideAnim] = useState(new Animated.Value(0));

  const hairline = 1 / PixelRatio.get();

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(json => {
        setSurahs(json.data);
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('recent_read').then(val => {
        if (val) setRecent(JSON.parse(val));
      });
    }, [])
  );

  const TAB_CONTAINER_WIDTH = wp('90%'); 
  const TAB_WIDTH = (TAB_CONTAINER_WIDTH - scale(8)) / 2;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'surah' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeTab]);

  const handleBackPress = () => {
    //<Press onPress={() => router.back()} style={s.navBtn}>
    router.back(); // Navigate back to Quran Screen
  };

  const handleSurahPress = (number: number, name: string) => {
    const recentData = { number, name, time: new Date().toLocaleDateString() };
    AsyncStorage.setItem('recent_read', JSON.stringify(recentData));
    router.push({ 
      pathname: '/screens/quran_details', 
      params: { surahNumber: number, surahName: name } 
    } as any);
  };

  const handleParaPress = (paraNumber: number) => {
    router.push({ 
      pathname: '/screens/quran_details', 
      params: { juzNumber: paraNumber } 
    } as any);
  };

  const renderSurah = ({ item }: any) => {
    const isMakki = item.revelationType === 'Meccan';
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleSurahPress(item.number, item.englishName)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardGradient, { borderWidth: hairline * 2 }]}
        >
          <View style={styles.cornerAccent} />
          
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.number}</Text>
            </View>
          </View>

          <View style={styles.middleSection}>
            <Text style={styles.cardTitle}>{item.englishName}</Text>
            <Text style={styles.cardTranslation}>{item.englishNameTranslation}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.typeBadge, isMakki ? styles.makkiBadge : styles.madaniBadge]}>
                <View style={styles.typeDot} />
                <Text style={styles.typeText}>{isMakki ? 'Makki' : 'Madani'}</Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.verseCount}>{item.numberOfAyahs} verses</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.arabicName}>{item.name}</Text>
            <View style={styles.chevronCircle}>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPara = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleParaPress(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardGradient, { borderWidth: hairline * 2 }]}
      >
        <View style={styles.cornerAccent} />
        
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item}</Text>
          </View>
        </View>

        <View style={[styles.middleSection, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Para {item}</Text>
          <Text style={styles.cardTranslation}>Juz' al-Qur'an {item}</Text>
        </View>

        <View style={styles.chevronCircle}>
          <Text style={styles.chevron}>›</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4A4A" />
        <ActivityIndicator size="large" color="#f5f5dc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4A4A" />

      {/* Header */}
      <View style={styles.header}>
        {/* Back Button Added */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={moderateScale(28)} color="#f5f5dc" />
        </TouchableOpacity>

        <View style={styles.headerDecoration}>
          <View style={styles.decorativeLine} />
          <View style={[styles.decorativeLine, styles.decorativeLineShort]} />
        </View>
        <Text style={styles.headerTitle}>القرآن الكريم</Text>
        <Text style={styles.headerSubtitle}>The Noble Quran</Text>
        <View style={styles.headerDecoration}>
          <View style={[styles.decorativeLine, styles.decorativeLineShort]} />
          <View style={styles.decorativeLine} />
        </View>
      </View>

      {/* Recent Read Card */}
      {recent && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Continue Reading</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.recentCard} 
            onPress={() => handleSurahPress(recent.number, recent.name)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(210, 180, 140, 0.2)', 'rgba(210, 180, 140, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.recentGradient, { borderWidth: hairline * 2 }]}
            >
              <View style={styles.recentIconContainer}>
                <Text style={styles.recentIcon}>📖</Text>
              </View>
              
              <View style={styles.recentContent}>
                <Text style={styles.recentName}>{recent.name}</Text>
                <Text style={styles.recentMeta}>Last read {recent.time}</Text>
              </View>
              
              <View style={styles.resumeButton}>
                <Text style={styles.resumeText}>Resume</Text>
                <Text style={styles.resumeArrow}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabSection}>
        <View style={styles.tabBar}>
          <Animated.View 
            style={[
              styles.tabIndicator,
              {
                width: TAB_WIDTH,
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [scale(4), TAB_WIDTH + scale(4)],
                  })
                }]
              }
            ]} 
          />
          
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('surah')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'surah' && styles.activeTabText]}>
              Surah
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('para')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'para' && styles.activeTabText]}>
              Para (Juz)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'surah' ? surahs : paras}
        renderItem={activeTab === 'surah' ? renderSurah : renderPara}
        keyExtractor={(item: any) => (activeTab === 'surah' ? item.number : item).toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A4A4A' 
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#0A4A4A', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    color: '#f5f5dc',
    marginTop: verticalScale(16),
    fontSize: fontScale(16),
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? verticalScale(30) : verticalScale(10),
    paddingBottom: verticalScale(24),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
    position: 'relative', // Necessary for absolute positioning of back button
  },
  // Back Button Style
  backButton: {
    position: 'absolute',
    left: scale(20),
    top: Platform.OS === 'android' ? verticalScale(35) : verticalScale(15), 
    zIndex: 10,
    padding: scale(4),
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  decorativeLine: {
    width: scale(40),
    height: verticalScale(2),
    backgroundColor: '#f5f5dc',
    borderRadius: 1,
  },
  decorativeLineShort: {
    width: scale(20),
  },
  headerTitle: {
    fontSize: fontScale(28), 
    fontWeight: 'bold',
    color: '#f5f5dc',
    marginBottom: verticalScale(4),
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: fontScale(15),
    color: '#D2B48C',
    fontWeight: '600',
    marginBottom: verticalScale(12),
  },

  // Recent Section
  recentSection: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(16),
    paddingHorizontal: wp('5%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  sectionDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#D2B48C',
    marginRight: scale(8),
  },
  sectionTitle: {
    color: '#f5f5dc',
    fontSize: fontScale(15),
    fontWeight: 'bold',
  },
  recentCard: {
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(3) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(6),
  },
  recentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(18),
    borderColor: 'rgba(210, 180, 140, 0.3)',
  },
  recentIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.2)',
    marginRight: scale(14),
  },
  recentIcon: {
    fontSize: fontScale(24),
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    color: '#f5f5dc',
    fontSize: fontScale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  recentMeta: {
    color: '#B8A488',
    fontSize: fontScale(11),
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  resumeText: {
    color: '#f5f5dc',
    fontWeight: 'bold',
    marginRight: scale(4),
    fontSize: fontScale(12),
  },
  resumeArrow: {
    color: '#f5f5dc',
    fontSize: fontScale(16),
    fontWeight: 'bold',
  },

  // Tab Bar
  tabSection: {
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  tabBar: {
    width: wp('90%'),
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: moderateScale(12),
    padding: scale(4),
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
  },
  tabIndicator: {
    position: 'absolute',
    top: scale(4),
    height: '100%',
    maxHeight: verticalScale(44),
    backgroundColor: '#0D5F5F',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    color: '#B8A488',
    fontWeight: '600',
    fontSize: fontScale(14),
  },
  activeTabText: {
    color: '#f5f5dc',
    fontWeight: 'bold',
  },

  // List
  listContent: {
    paddingHorizontal: wp('5%'),
    paddingBottom: verticalScale(20),
  },

  // Card
  card: {
    marginBottom: verticalScale(14),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderColor: 'rgba(245, 245, 220, 0.2)',
    position: 'relative',
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(40),
    height: moderateScale(40),
    backgroundColor: 'rgba(245, 245, 220, 0.08)',
    borderBottomLeftRadius: moderateScale(40),
  },
  badgeContainer: {
    marginRight: scale(14),
  },
  badge: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(23),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.3)',
  },
  badgeText: {
    color: '#f5f5dc',
    fontSize: fontScale(15),
    fontWeight: 'bold',
  },
  middleSection: {
    flex: 1,
    marginRight: scale(8),
  },
  cardTitle: {
    color: '#f5f5dc',
    fontSize: fontScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  cardTranslation: {
    color: '#B8A488',
    fontSize: fontScale(12),
    marginBottom: verticalScale(8),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    gap: scale(6),
  },
  makkiBadge: {
    backgroundColor: 'rgba(210, 180, 140, 0.2)',
  },
  madaniBadge: {
    backgroundColor: 'rgba(176, 196, 222, 0.2)',
  },
  typeDot: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
    backgroundColor: '#f5f5dc',
  },
  typeText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#f5f5dc',
  },
  divider: {
    width: 1,
    height: verticalScale(14),
    backgroundColor: 'rgba(245, 245, 220, 0.2)',
    marginHorizontal: scale(8),
  },
  verseCount: {
    color: '#B8A488',
    fontSize: fontScale(10),
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: verticalScale(6),
  },
  arabicName: {
    color: '#f5f5dc',
    fontSize: fontScale(20),
    fontWeight: '600',
  },
  chevronCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  chevron: {
    color: '#f5f5dc',
    fontSize: fontScale(18),
    fontWeight: 'bold',
  },
});