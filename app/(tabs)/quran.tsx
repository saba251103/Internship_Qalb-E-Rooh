// app/(tabs)/quran.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  PixelRatio,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

const QuranScreen = () => {
  const router = useRouter();

  const handleListPress = () => {
    router.push('/screens/quran_list' as any);
  };

  const handleBackPress = () => {
    router.push('/(tabs)' as any);
  };

  const thinBorder = 1 / PixelRatio.get();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4A4A" />
      
      {/* Header Section */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={moderateScale(28)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.decorativeLine} />
        <Text style={styles.title}>القرآن الكريم</Text>
        <Text style={styles.titleEnglish}>The Holy Quran</Text>
        <Text style={styles.subtitle}>Read, reflect, and find peace</Text>
        <View style={styles.decorativeLine} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        
        {/* Featured Card */}
        <TouchableOpacity 
          onPress={handleListPress}
          activeOpacity={0.8}
          style={styles.cardContainer}
        >
          <LinearGradient
            colors={['rgba(26, 95, 95, 0.2)', 'rgba(245, 245, 220, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardGradient, { borderWidth: thinBorder * 2 }]} 
          >
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons 
                  name="book-open-page-variant" 
                  size={moderateScale(32)} 
                  color="#f5f5dc" 
                />
              </View>
              
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Surah List</Text>
                <Text style={styles.cardSubtitle}>Browse all 114 chapters</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>114</Text>
                    <Text style={styles.statLabel}>Surahs</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>6,236</Text>
                    <Text style={styles.statLabel}>Verses</Text>
                  </View>
                </View>
              </View>

              <View style={styles.arrowContainer}>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={moderateScale(28)} 
                  color="#f5f5dc" 
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            "Indeed, it is We who sent down the Quran and indeed, We will be its guardian."
          </Text>
          <Text style={styles.infoReference}>- Al-Hijr 15:9</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A4A4A',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? verticalScale(40) : verticalScale(10),
    paddingBottom: verticalScale(20),
    alignItems: 'center',
    position: 'relative', // Necessary for absolute positioning of back button
  },
  // New Style for Back Button
  backButton: {
    position: 'absolute',
    left: scale(20), // Aligned with content padding
    top: Platform.OS === 'android' ? verticalScale(40) : verticalScale(10), // Aligned with status bar padding
    zIndex: 10,
    padding: scale(4), // Little extra touch area
  },
  decorativeLine: {
    width: scale(60),
    height: verticalScale(2),
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
    marginVertical: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
    letterSpacing: 1,
    textAlign: 'center',
  },
  titleEnglish: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: '#f5f5dc',
    marginBottom: verticalScale(8),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#88A09E',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  cardContainer: {
    borderRadius: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
  },
  cardGradient: {
    borderColor: '#a8c5c5',
    borderRadius: moderateScale(20),
  },
  cardContent: {
    flexDirection: 'row',
    padding: scale(24),
    alignItems: 'center',
  },
  iconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.1)',
  },
  cardTextContainer: {
    flex: 1, 
    marginLeft: scale(20),
  },
  cardTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
  },
  cardSubtitle: {
    fontSize: moderateScale(14),
    color: '#f5f5dc',
    marginBottom: verticalScale(12),
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#f5f5dc',
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: '#88A09E',
    marginTop: verticalScale(2),
  },
  statDivider: {
    width: 1,
    height: verticalScale(25),
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    marginHorizontal: scale(15),
  },
  arrowContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginTop: hp('5%'), 
    padding: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: moderateScale(16),
    borderLeftWidth: scale(3),
    borderLeftColor: '#f5f5dc',
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    lineHeight: verticalScale(24),
    fontStyle: 'italic',
    marginBottom: verticalScale(8),
  },
  infoReference: {
    fontSize: moderateScale(12),
    color: '#f5f5dc',
    textAlign: 'right',
    fontWeight: '600',
  },
});

export default QuranScreen;