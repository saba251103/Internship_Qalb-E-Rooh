import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import YoutubePlayer from 'react-native-youtube-iframe';
import { fetchMakkahStreams } from '../services/makkahService';

// ─────────────────────────────────────────────
// RESPONSIVE UTILITIES & CONSTRAINTS
// ─────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const fontScale = (size: number) =>
  Platform.OS === 'android' ? moderateScale(size, 0.3) : moderateScale(size);

// Calculate a perfect 16:9 aspect ratio. Cap width on tablets to 800px.
const VIDEO_WIDTH = isTablet ? Math.min(SCREEN_WIDTH * 0.85, 800) : SCREEN_WIDTH;
const VIDEO_HEIGHT = VIDEO_WIDTH * (9 / 16);

export default function MakkahLiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [playing, setPlaying] = useState(true);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Animation for the "LIVE" pulse dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulsing animation for the Live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Fetch streams from backend
    const loadStreams = async () => {
      setLoading(true);
      try {
        const streams = await fetchMakkahStreams(); 
        setVideoIds(streams);
      } catch (e) {
        console.error("Failed to load Makkah streams", e);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, []);

  const currentVideoId = videoIds[currentIndex];

  const onShare = async () => {
    if (!currentVideoId) return;
    try {
      await Share.share({
        message: `Watch Makkah Live Stream: https://www.youtube.com/watch?v=${currentVideoId}`,
      });
    } catch (error) {
      console.log("Share error:", (error as Error).message);
    }
  };

  const handlePlayerError = useCallback((errorStr: string) => {
    console.log("YouTube Player Error:", errorStr);
    if (currentIndex < videoIds.length - 1) {
      console.log(`Stream failed. Switching to backup: ${videoIds[currentIndex + 1]}`);
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } else {
      console.log("All backup streams have failed.");
    }
  }, [currentIndex, videoIds]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Deep premium gradient background */}
      <LinearGradient
        colors={['#062E2E', '#041E1E', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(12) }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={moderateScale(24)} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.headerTitle}>MAKKAH LIVE</Text>
        </View>
        
        <TouchableOpacity 
          onPress={onShare} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={moderateScale(22)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentWrapper}>
        
        {/* Video Player */}
        <View style={[styles.playerContainer, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT }]}>
          {loading ? (
            <View style={styles.loaderWrapper}>
              <ActivityIndicator size="large" color="#C8A96E" />
              <Text style={styles.loaderText}>Connecting to stream...</Text>
            </View>
          ) : currentVideoId ? (
            <View style={styles.videoMask}>
              <YoutubePlayer
                height={VIDEO_HEIGHT}
                width={VIDEO_WIDTH}
                play={playing}            
                videoId={currentVideoId}
                onError={handlePlayerError}
                initialPlayerParams={{
                  modestbranding: true,   
                  rel: false,             
                  loop: true,             
                }}
              />
            </View>
          ) : (
            <View style={styles.errorWrapper}>
              <MaterialCommunityIcons name="video-off-outline" size={moderateScale(48)} color="#6AABA5" />
              <Text style={styles.errorText}>Live stream is currently unavailable.</Text>
              <Text style={styles.errorSubText}>Please try again later.</Text>
            </View>
          )}
        </View>

        {/* Info Card Below Video */}
        {!loading && currentVideoId && (
          <View style={[styles.infoCard, { width: VIDEO_WIDTH }]}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoTitle}>Al-Masjid Al-Haram</Text>
              <Text style={styles.infoSubtitle}>Mecca, Saudi Arabia</Text>
            </View>
            <View style={styles.badgeContainer}>
              <MaterialCommunityIcons name="broadcast" size={moderateScale(14)} color="#FFFFFF" />
              <Text style={styles.badgeText}>LIVE 24/7</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingBottom: verticalScale(16),
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  liveDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FF3B30', // Apple Red for live indicators
    marginRight: scale(8),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Main Content Styles
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: verticalScale(80), // Push the video slightly up from true center
  },
  
  playerContainer: {
    backgroundColor: '#000000',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  videoMask: {
    flex: 1,
    width: '100%',
    height: '100%',
    // This prevents any white bleed edges from the WebView iframe
    overflow: 'hidden', 
  },
  
  // Loading & Error States
  loaderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#C8A96E',
    marginTop: verticalScale(12),
    fontSize: fontScale(14),
    fontWeight: '600',
  },
  errorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('10%'),
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: fontScale(16),
    fontWeight: '700',
    marginTop: verticalScale(16),
  },
  errorSubText: {
    color: '#6AABA5',
    textAlign: 'center',
    fontSize: fontScale(14),
    marginTop: verticalScale(6),
  },

  // Info Card Styles
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoLeft: {
    flex: 1,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: fontScale(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoSubtitle: {
    color: '#A8DDD8',
    fontSize: fontScale(13),
    fontWeight: '500',
    marginTop: verticalScale(4),
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(8),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: fontScale(11),
    fontWeight: '700',
    marginLeft: scale(4),
    letterSpacing: 0.5,
  },
});