import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// 1. Import Safe Area
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// --- UTILITY FUNCTIONS ---

// Calculates the angle from current location to Mecca relative to True North
function calculateQiblaAngle(lat: number, lng: number) {
  const PI = Math.PI;
  const latRad = (lat * PI) / 180;
  const lngRad = (lng * PI) / 180;
  const kaabaLatRad = (KAABA_LAT * PI) / 180;
  const kaabaLngRad = (KAABA_LNG * PI) / 180;

  const y = Math.sin(kaabaLngRad - lngRad);
  const x =
    Math.cos(latRad) * Math.tan(kaabaLatRad) -
    Math.sin(latRad) * Math.cos(kaabaLngRad - lngRad);
  
  let qibla = (Math.atan2(y, x) * 180) / PI;
  return (qibla + 360) % 360; // Normalize to 0-360
}

// --- MAIN COMPONENT ---

export default function QiblaScreenWrapper() {
  return (
    <SafeAreaProvider>
      <QiblaScreen />
    </SafeAreaProvider>
  );
}

function QiblaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Dynamic Safe Area Values
  
  // Animation State
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Data State
  const [heading, setHeading] = useState<number>(0);
  const [qiblaBearing, setQiblaBearing] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<boolean>(false);
  
  // Logic State
  const [isAligned, setIsAligned] = useState<boolean>(false);

  // 2. LOAD LOCATION & CALCULATE QIBLA BEARING
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location is required to find the Qibla.');
          setLocationError(true);
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const qiblaAngle = calculateQiblaAngle(loc.coords.latitude, loc.coords.longitude);
        setQiblaBearing(qiblaAngle);
        setLoading(false);
      } catch (e) {
        setLocationError(true);
        setLoading(false);
      }
    })();
  }, []);

  // 3. WATCH DEVICE HEADING (COMPASS)
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startCompass = async () => {
      // Check if device has compass capabilities
      const providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.gpsAvailable) {
        // Handle devices without GPS/Compass if necessary
      }

      subscription = await Location.watchHeadingAsync((data) => {
        // Use trueHeading if available (more accurate), otherwise magneticHeading
        const currentHeading = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        setHeading(currentHeading);
      });
    };

    startCompass();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // 4. SMOOTH NEEDLE ANIMATION (PREVENTS 360 FLIP)
  useEffect(() => {
    // The visual rotation is the Qibla bearing minus the device's current heading
    let rotation = qiblaBearing - heading;

    // Normalize rotation to keep it within -180 to 180 degrees
    // This creates the "Shortest Path" animation
    while (rotation > 180) rotation -= 360;
    while (rotation < -180) rotation += 360;

    // Determine alignment (Green Glow)
    // We align when the device points roughly at the Qibla (rotation ~ 0)
    // Or when the needle points Up relative to the phone
    const isPerfect = Math.abs(rotation) < 5; // 5 degrees tolerance
    setIsAligned(isPerfect);

    Animated.timing(spinValue, {
      toValue: rotation,
      duration: 300, // Slightly smoother duration
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

  }, [heading, qiblaBearing]);

  // Interpolate rotation for style
  const rotate = spinValue.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#062E2E', '#0A4A4A', '#021818']} style={styles.container}>
      {/* HEADER SECTION - NO CUT OFF */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Qibla Compass</Text>
        
        {/* Dummy View for layout balance */}
        <View style={{ width: 40 }} />
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.contentContainer}>
        
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" />
        ) : locationError ? (
          <Text style={styles.errorText}>Please enable location services.</Text>
        ) : (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.angleLabel}>Qibla Angle</Text>
              <Text style={styles.angleValue}>{Math.round(qiblaBearing)}° N</Text>
            </View>

            {/* COMPASS DIAL */}
            <View style={[styles.compassWrapper, isAligned && styles.compassGlow]}>
              {/* Outer Ring */}
              <View style={styles.outerRing} />
              
              {/* Decorative Ticks (Static background) */}
              {Array.from({ length: 12 }).map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.tickMark, 
                    { transform: [{ rotate: `${i * 30}deg` }] }
                  ]} 
                />
              ))}

              {/* Kaaba Icon (Always stays at top of compass visually if aligned) */}
              <View style={[styles.kaabaContainer, isAligned && { opacity: 1 }]}>
                 <MaterialCommunityIcons name="mosque" size={36} color={isAligned ? "#10B981" : "#4FA3A3"} />
              </View>

              {/* ROTATING NEEDLE */}
              <Animated.View style={[styles.needleContainer, { transform: [{ rotate }] }]}>
                {/* The Green part points to Qibla */}
                <View style={styles.needleNorth}>
                   <View style={styles.needleLineGreen} />
                </View>
                {/* The Red part points opposite */}
                <View style={styles.needleSouth}>
                   <View style={styles.needleLineRed} />
                </View>
                {/* Center Pin */}
                <View style={styles.centerPin} />
              </Animated.View>
            </View>

            {/* FEEDBACK TEXT */}
            <View style={[styles.feedbackContainer, { paddingBottom: insets.bottom + 20 }]}>
              {isAligned ? (
                <View style={styles.successBadge}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
                  <Text style={styles.successText}>You are facing Qibla</Text>
                </View>
              ) : (
                <Text style={styles.instructionText}>
                  Rotate your phone until the green needle points up
                </Text>
              )}
              
              
              
              <Text style={styles.calibrationText}>
                
              </Text>
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  // Header styles using Flexbox to prevent overlaps
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Content Logic
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly', // Distributes space vertically
  },
  infoContainer: {
    alignItems: 'center',
  },
  angleLabel: {
    color: '#8CA3A3',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  angleValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },

  // Compass Visuals
  compassWrapper: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: '#1F2937', // Dark inner dial
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#4FA3A3', // Gold/Teal Ring
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    position: 'relative',
  },
  compassGlow: {
    borderColor: '#10B981', // Turns green when aligned
    shadowColor: '#10B981',
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  outerRing: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tickMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: '100%',
    zIndex: 0,
  },
  
  // Kaaba Icon fixed at the "North" of the dial visual
  kaabaContainer: {
    position: 'absolute',
    top: 20,
    zIndex: 1,
    opacity: 0.5,
  },

  // Needle Logic
  needleContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  needleNorth: {
    position: 'absolute',
    top: 30,
    bottom: '50%',
    width: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  needleLineGreen: {
    width: 6,
    height: '100%',
    backgroundColor: '#10B981', // Green points to Qibla
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  needleSouth: {
    position: 'absolute',
    top: '50%',
    bottom: 30,
    width: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  needleLineRed: {
    width: 6,
    height: '100%',
    backgroundColor: '#EF4444', // Red tail
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  centerPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 4,
    borderColor: '#4FA3A3',
    zIndex: 10,
  },

  // Footer / Feedback
  feedbackContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#A1A1AA',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  successText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 8,
  },
  calibrationText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 15,
  },
});