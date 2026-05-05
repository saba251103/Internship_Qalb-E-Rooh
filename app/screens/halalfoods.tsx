// HalalNearbyComingSoon.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Added
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

/* ───────── COLORS ───────── */
const C = {
  bg: '#020F0F',
  teal: '#0A4040',
  tealLight: '#9FF0D0',
  tealSoft: '#4DC99A',
  gold: '#D4942A',
  goldLight: '#F5D98A',
  white: '#FFFFFF',
};

/* ───────── RESPONSIVE SCALE ───────── */
const BASE_WIDTH = 390;
const useScale = () => {
  const { width } = useWindowDimensions();
  return Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.25);
};
const rs = (size: number, scale: number) => Math.round(size * scale);

/* ───────── TEXT FIX (ANDROID SAFE) ───────── */
const baseText = {
  includeFontPadding: false as const,
  textAlignVertical: 'center' as const,
};

/* ───────── MAIN ───────── */
export default function HalalNearbyComingSoon() {
  const scale = useScale();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation(); // Hook for navigation

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={s.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={[C.bg, '#041818', C.teal]}
        style={StyleSheet.absoluteFill}
      />

      {/* BACK BUTTON */}
      <TouchableOpacity 
        style={[s.backButton, { top: insets.top + 10 }]} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name="chevron-left" 
          size={rs(28, scale)} 
          color={C.tealLight} 
        />
      </TouchableOpacity>

      <SafeAreaView style={s.safe} edges={['left', 'right']}>
        <View
          style={[
            s.container,
            {
              paddingTop: insets.top + 10,
              paddingBottom: insets.bottom + 10
            },
          ]}
        >
          {/* TOP LABEL */}
          <Animated.Text
            style={[
              s.topLabel,
              {
                opacity: fade,
                fontSize: rs(12, scale),
                lineHeight: rs(16, scale),
              },
            ]}
          >
            HALAL NEARBY
          </Animated.Text>

          {/* CENTER */}
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateY: slide }],
              alignItems: 'center',
            }}
          >
            <Animated.View style={{ transform: [{ translateY: floatY }] }}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={rs(70, scale)}
                color={C.goldLight}
              />
            </Animated.View>

            <Text
              style={[
                s.coming,
                {
                  fontSize: rs(30, scale),
                  lineHeight: rs(36, scale),
                },
              ]}
            >
              Coming Soon
            </Text>

            <View style={s.divider} />

            <Text
              style={[
                s.desc,
                {
                  fontSize: rs(14, scale),
                  lineHeight: rs(22, scale),
                },
              ]}
            >
              Find halal restaurants near you{'\n'}
              with location, reviews & directions
            </Text>

            <View style={s.pills}>
              {['Nearby', 'Verified', 'Directions'].map((item) => (
                <View key={item} style={s.pill}>
                  <Text style={[s.pillText, { fontSize: rs(11, scale) }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* FOOTER */}
          <Animated.Text
            style={[
              s.footer,
              {
                opacity: fade,
                fontSize: rs(12, scale),
                lineHeight: rs(16, scale),
              },
            ]}
          >
            QALB-E-ROOH
          </Animated.Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ───────── STYLES ───────── */
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020F0F',
  },

  safe: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(159, 240, 208, 0.1)',
  },

  topLabel: {
    ...baseText,
    color: '#9FF0D0',
    letterSpacing: 3,
    opacity: 0.7,
  },

  coming: {
    ...baseText,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 20,
  },

  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#D4942A',
    marginVertical: 12,
    opacity: 0.6,
  },

  desc: {
    ...baseText,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },

  pills: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },

  pill: {
    borderWidth: 1,
    borderColor: 'rgba(159,240,208,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  pillText: {
    ...baseText,
    color: '#9FF0D0',
  },

  footer: {
    ...baseText,
    color: '#F5D98A',
    fontWeight: '700',
    letterSpacing: 4,
    opacity: 0.6,
  },
});