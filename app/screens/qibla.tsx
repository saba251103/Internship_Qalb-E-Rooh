import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function getQiblaDirection(lat: number, lng: number) {
  const φ = lat * Math.PI / 180;
  const λ = lng * Math.PI / 180;
  const φk = KAABA_LAT * Math.PI / 180;
  const λk = KAABA_LNG * Math.PI / 180;
  const dλ = λk - λ;
  const y = Math.sin(dλ);
  const x = Math.cos(φ) * Math.tan(φk) - Math.sin(φ) * Math.cos(dλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function QiblaScreen() {
  const router=useRouter();
  const needleRotate = useRef(new Animated.Value(0)).current;
  const [heading, setHeading] = useState(0);
  const [qibla, setQibla] = useState(0);
  const [aligned, setAligned] = useState(false);
  const [directionText, setDirectionText] = useState('');

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      const loc = await Location.getCurrentPositionAsync({});
      setQibla(getQiblaDirection(loc.coords.latitude, loc.coords.longitude));
    })();
  }, []);

  useEffect(() => {
    let sub: Location.LocationSubscription;
    Location.watchHeadingAsync(h => setHeading(h.trueHeading)).then(s => sub = s);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    const rotation = qibla - heading;

    Animated.timing(needleRotate, {
      toValue: rotation,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    setAligned(Math.abs(rotation) < 4);

    if (Math.abs(rotation) < 4) setDirectionText('You are facing Qibla');
    else if (rotation > 0) setDirectionText('Turn Right');
    else setDirectionText('Turn Left');
  }, [heading, qibla]);

  const spin = needleRotate.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return ( 
    <LinearGradient colors={['#062E2E', '#0A4A4A']} style={styles.container}>
<View style={styles.header}>
  <TouchableOpacity 
    onPress={() => router.push("./features")} 
    style={styles.backButton}
  >
    <MaterialCommunityIcons name="chevron-left" size={30} color="#FFF" />
  </TouchableOpacity>
 
  <Text style={styles.title}>Qibla Compass</Text>

  {/* Empty view to balance right side so title stays centered */}
  <View style={{ width: 40 }} />
</View>
        <Text style={styles.angle}>Qibla Angle: {Math.round(qibla)}°</Text>
      <View style={styles.compassWrapper}>
        <View style={styles.goldRing} />

        {/* WHITE DIAL */}
        <View style={styles.whiteDial} />
        <View style={styles.innerShadow} />
        <View style={styles.innerRing} />

        <View style={[styles.kaabaAura, aligned && styles.kaabaAuraActive]} />

        <MaterialCommunityIcons
          name="mosque"
          size={42}
          color="#0A4A4A"
          style={styles.kaaba}
        />

        <Animated.View
          style={[
            styles.needleContainer,
            { transform: [{ rotate: spin }] },
            aligned && styles.glow,
          ]}
        >
          <View style={styles.greenTip} />
          <View style={styles.needleBody} />
          <View style={styles.redTip} />
        </Animated.View>

        <View style={styles.pivotOuter}>
          <View style={styles.pivotInner} />
        </View>
      </View>

      <Text style={styles.direction}>{directionText}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 140 },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
    position: "absolute",
    top: '10%',
  },
  
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  
  title: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },
  angle: { color: '#CFEDE8', marginTop: 8, fontSize: 15 },

  compassWrapper: {
    marginTop: 60,
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },

  goldRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 6,
    borderColor: "#4FA3A3",
  },

  whiteDial: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFFFFF',
  },

  innerShadow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  innerRing: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },

  kaabaAura: {
    position: 'absolute',
    top: 18,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },

  kaabaAuraActive: {
    backgroundColor: 'rgba(16,185,129,0.3)',
    shadowColor: '#10B981',
    shadowOpacity: 1,
    shadowRadius: 20,
  },

  kaaba: {
    position: 'absolute',
    top: 22,
  },

  pivotOuter: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pivotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A4A4A',
  },

  needleContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  needleBody: {
    width: 5,
    height: 135,
    backgroundColor: '#1F2937',
    borderRadius: 3,
  },

  greenTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#10B981',
  },

  redTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#DC2626',
  },

  glow: {
    shadowColor: '#10B981',
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 18,
  },

  direction: { marginTop: 40, fontSize: 22, fontWeight: '600', color: '#fff' },
  tip: { marginTop: 15, fontSize: 13, color: '#BEE3DF', textAlign: 'center', paddingHorizontal: 40 },
 

});
