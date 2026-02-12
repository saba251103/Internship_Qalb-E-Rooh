// app/(tabs)/quran.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const QuranScreen = () => {
  const router = useRouter();

  const handleListPress = () => {
    router.push('/screens/quran_list' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
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
          style={styles.card} 
          onPress={handleListPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(26, 95, 95, 0.2)', 'rgba(245, 245, 220, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>📖</Text>
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
                <Text style={styles.arrow}>›</Text>
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
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 30,
    alignItems: 'center',
  },
  decorativeLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
    marginVertical: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  titleEnglish: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f5f5dc',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#88A09E',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    borderWidth: 1,
    borderColor: '#a8c5c5',
    borderRadius: 20,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 245, 220, 0.1)',
  },
  icon: {
    fontSize: 32,
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#f5f5dc',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5f5dc',
  },
  statLabel: {
    fontSize: 11,
    color: '#88A09E',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    marginHorizontal: 20,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 28,
    color: '#f5f5dc',
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#f5f5dc',
  },
  infoText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  infoReference: {
    fontSize: 13,
    color: '#f5f5dc',
    textAlign: 'right',
    fontWeight: '600',
  },
});

export default QuranScreen;