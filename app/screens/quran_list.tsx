import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function QuranListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'surah' | 'para'>('surah');
  const [surahs, setSurahs] = useState([]);
  const [paras] = useState(Array.from({ length: 30 }, (_, i) => i + 1));
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<any>(null);
  const [slideAnim] = useState(new Animated.Value(0));

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

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'surah' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeTab]);

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

  const renderSurah = ({ item, index }: any) => {
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
          style={styles.cardGradient}
        >
          {/* Decorative Corner Accent */}
          <View style={styles.cornerAccent} />
          
          {/* Number Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.number}</Text>
            </View>
          </View>

          {/* Middle Section */}
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

          {/* Arabic Name */}
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

  const renderPara = ({ item, index }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleParaPress(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cornerAccent} />
        
        {/* Number Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item}</Text>
          </View>
        </View>

        {/* Middle Section */}
        <View style={[styles.middleSection, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Para {item}</Text>
          <Text style={styles.cardTranslation}>Juz' al-Qur'an {item}</Text>
        </View>

        {/* Chevron */}
        <View style={styles.chevronCircle}>
          <Text style={styles.chevron}>›</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#f5f5dc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
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
              style={styles.recentGradient}
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
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, (width - 48) / 2 + 4],
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
    marginTop: 16,
    fontSize: 16,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? 30 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  decorativeLine: {
    width: 40,
    height: 2,
    backgroundColor: '#f5f5dc',
    borderRadius: 1,
  },
  decorativeLineShort: {
    width: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#f5f5dc',
    marginBottom: 4,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D2B48C',
    fontWeight: '600',
    marginBottom: 12,
  },

  // Recent Section
  recentSection: {
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D2B48C',
    marginRight: 8,
  },
  sectionTitle: {
    color: '#f5f5dc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  recentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(210, 180, 140, 0.3)',
  },
  recentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.2)',
    marginRight: 14,
  },
  recentIcon: {
    fontSize: 26,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    color: '#f5f5dc',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recentMeta: {
    color: '#B8A488',
    fontSize: 12,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  resumeText: {
    color: '#f5f5dc',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 13,
  },
  resumeArrow: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Tab Bar
  tabSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    width: (width - 48) / 2 - 4,
    height: 44,
    backgroundColor: '#0D5F5F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    color: '#B8A488',
    fontWeight: '600',
    fontSize: 15,
  },
  activeTabText: {
    color: '#f5f5dc',
    fontWeight: 'bold',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Card
  card: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
    position: 'relative',
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(245, 245, 220, 0.08)',
    borderBottomLeftRadius: 40,
  },
  badgeContainer: {
    marginRight: 16,
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.3)',
  },
  badgeText: {
    color: '#f5f5dc',
    fontSize: 17,
    fontWeight: 'bold',
  },
  middleSection: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardTranslation: {
    color: '#B8A488',
    fontSize: 13,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  makkiBadge: {
    backgroundColor: 'rgba(210, 180, 140, 0.2)',
  },
  madaniBadge: {
    backgroundColor: 'rgba(176, 196, 222, 0.2)',
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#f5f5dc',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f5f5dc',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(245, 245, 220, 0.2)',
    marginHorizontal: 10,
  },
  verseCount: {
    color: '#B8A488',
    fontSize: 11,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  arabicName: {
    color: '#f5f5dc',
    fontSize: 22,
    fontWeight: '600',
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 245, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  chevron: {
    color: '#f5f5dc',
    fontSize: 20,
    fontWeight: 'bold',
  },
});