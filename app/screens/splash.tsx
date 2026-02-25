/**
 * Qalb-E-Rooh — Ramadan Splash Screen
 * "The Unveiling" — a cinematic, fully orchestrated reveal sequence.
 *
 * Animation timeline (total ~3.2s before navigation):
 * 0ms   — deep darkness
 * 200ms — background gradient blooms in
 * 400ms — star field particles twinkle to life (staggered)
 * 600ms — outer geometric star ring fades + scales in
 * 900ms — mid ring appears
 * 1100ms — inner glow ring appears
 * 1300ms — crescent moon slides in from upper right
 * 1500ms — centre icon scales up with spring bounce
 * 1750ms — app name "Qalb-E-Rooh" fades up letter by letter
 * 2000ms — Arabic title دعاء rises
 * 2200ms — ornamental divider draws across
 * 2400ms — tagline fades in
 * 2700ms — bottom blessing appears
 * 3000ms — loading dots animate
 * 3200ms — navigate to onboarding / home
 *
 * Dependencies: expo-linear-gradient, react-native-safe-area-context, @expo/vector-icons
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─────────────────────────────────────────────────────────────
   RESPONSIVE HELPERS
───────────────────────────────────────────────────────────── */
const { width: W, height: H } = Dimensions.get('window');
const rs  = (n: number) => Math.min(Math.max(Math.round((n / 390) * W), Math.round(n * 0.72)), Math.round(n * 1.18));
const rvs = (n: number) => Math.min(Math.max(Math.round((n / 844) * H), Math.round(n * 0.62)), Math.round(n * 1.28));
const rf  = (n: number) => Math.min(Math.max(Math.round((n / 390) * W), Math.round(n * 0.80)), Math.round(n * 1.14));

const IS_SMALL = H < 700;
const IS_LARGE = H > 896;

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS — "Abyssal Forest" (Almost Pitch Black Green)
───────────────────────────────────────────────────────────── */
const T = {
  // Canvas depths (Barely perceptible, ultra-dark greens)
  void:    '#000000', // Pure Black
  night0:  '#010502',
  night1:  '#010A05',
  night2:  '#02140A',
  night3:  '#031E0F',
  night4:  '#042B15', // The "brightest" background color, still very dark

  // Gold hero accent
  gold:        '#D4A832',
  goldBright:  '#F0C855',
  goldLight:   '#FAE095',
  goldFaint:   'rgba(212,168,50,0.07)',
  goldGlow:    'rgba(240,200,85,0.12)',
  goldBorder:  'rgba(212,168,50,0.25)',
  goldStrong:  'rgba(212,168,50,0.50)',
  goldMid:     'rgba(212,168,50,0.18)',

  // Teal secondary (Deepened to match)
  teal:       '#135245',
  tealLight:  '#1C7563',

  // Text
  textPrime:  '#F5EDD5',
  textSecond: '#B8A880',
  textMuted:  '#6B6040',
  textDim:    '#3D361E',
};

/* ─────────────────────────────────────────────────────────────
   PARTICLE DATA — static, generated once
───────────────────────────────────────────────────────────── */
interface P { x: number; y: number; r: number; delay: number; dur: number; opacity: number }
const STARS: P[] = Array.from({ length: 38 }, () => ({
  x:       Math.random() * W,
  y:       Math.random() * H,
  r:       Math.random() * 1.8 + 0.5,
  delay:   400 + Math.random() * 1200,
  dur:     1800 + Math.random() * 2400,
  opacity: 0.15 + Math.random() * 0.7,
}));

/* ─────────────────────────────────────────────────────────────
   ISLAMIC 8-POINT STAR
───────────────────────────────────────────────────────────── */
const Star8: React.FC<{ size: number; color: string; opacity?: number }> = ({ size: s, color, opacity = 1 }) => (
  <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center', opacity }}>
    {[0, 22.5, 45, 67.5].map((deg, i) => (
      <View key={i} style={{
        position: 'absolute', width: s * 0.63, height: s * 0.63,
        backgroundColor: color, transform: [{ rotate: `${deg}deg` }], opacity: 0.80,
      }} />
    ))}
    <View style={{ width: s * 0.26, height: s * 0.26, backgroundColor: color, transform: [{ rotate: '45deg' }], position: 'absolute' }} />
  </View>
);

/* ─────────────────────────────────────────────────────────────
   CRESCENT MOON
───────────────────────────────────────────────────────────── */
const Crescent: React.FC<{ size: number; color: string; bgColor: string; opacity?: number }> =
  ({ size, color, bgColor, opacity = 1 }) => (
    <View style={{ width: size, height: size, opacity }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
      <View style={{
        position: 'absolute',
        width: size * 0.75, height: size * 0.75,
        borderRadius: (size * 0.75) / 2,
        backgroundColor: bgColor,
        top: -(size * 0.05), left: size * 0.23,
      }} />
    </View>
  );

/* ─────────────────────────────────────────────────────────────
   ANIMATED STAR FIELD
───────────────────────────────────────────────────────────── */
const StarField: React.FC<{ masterFade: Animated.Value }> = ({ masterFade }) => {
  const anims = useRef(STARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    STARS.forEach((star, i) => {
      const loop = () => {
        anims[i].setValue(0);
        Animated.sequence([
          Animated.delay(star.delay),
          Animated.timing(anims[i], { toValue: 1, duration: star.dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anims[i], { toValue: 0.1, duration: star.dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]).start(loop);
      };
      loop();
    });
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: masterFade }]} pointerEvents="none">
      {STARS.map((star, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: star.x, top: star.y,
          width: star.r * 2, height: star.r * 2, borderRadius: star.r,
          backgroundColor: T.goldLight,
          opacity: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, star.opacity] }),
        }} />
      ))}
    </Animated.View>
  );
};

/* ─────────────────────────────────────────────────────────────
   GEOMETRIC RING SYSTEM
───────────────────────────────────────────────────────────── */
const GeomRing: React.FC<{
  size: number;
  borderColor: string;
  borderWidth?: number;
  rotationDur?: number;
  clockwise?: boolean;
  dashOpacity?: number;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  showStars?: boolean;
  starCount?: number;
  starColor?: string;
}> = ({
  size, borderColor, borderWidth = 1, rotationDur = 25000,
  clockwise = true, fadeAnim, scaleAnim,
  showStars = false, starCount = 8, starColor = T.gold,
}) => {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, {
        toValue: 1, duration: rotationDur,
        easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: clockwise ? ['0deg', '360deg'] : ['360deg', '0deg'],
  });

  return (
    <Animated.View style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth, borderColor,
      alignItems: 'center', justifyContent: 'center',
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }, { rotate }],
    }}>
      {showStars && Array.from({ length: starCount }).map((_, i) => {
        const angle = (i / starCount) * 2 * Math.PI;
        const r = size / 2;
        return (
          <View key={i} style={{
            position: 'absolute',
            left: r + r * Math.cos(angle) - rs(4),
            top:  r + r * Math.sin(angle) - rs(4),
          }}>
            <Star8 size={rs(8)} color={starColor} opacity={0.55} />
          </View>
        );
      })}
    </Animated.View>
  );
};

/* ─────────────────────────────────────────────────────────────
   LOADING DOTS
───────────────────────────────────────────────────────────── */
const LoadingDots: React.FC<{ color: string; visible: Animated.Value }> = ({ color, visible }) => {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.25))).current;

  useEffect(() => {
    const animate = (i: number) => {
      Animated.sequence([
        Animated.delay(i * 180),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dots[i], { toValue: 1,    duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(dots[i], { toValue: 0.25, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        ),
      ]).start();
    };
    dots.forEach((_, i) => animate(i));
  }, []);

  return (
    <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), opacity: visible }}>
      {dots.map((anim, i) => (
        <Animated.View key={i} style={{
          width: rs(5), height: rs(5), borderRadius: rs(2.5),
          backgroundColor: color, opacity: anim,
        }} />
      ))}
    </Animated.View>
  );
};

/* ─────────────────────────────────────────────────────────────
   LETTER REVEAL
───────────────────────────────────────────────────────────── */
const LetterReveal: React.FC<{
  text: string;
  style: any;
  startDelay: number;
  stagger?: number;
  color?: string;
}> = ({ text, style, startDelay, stagger = 55, color }) => {
  const letters = text.split('');
  const anims   = useRef(letters.map(() => new Animated.Value(0))).current;
  const slides  = useRef(letters.map(() => new Animated.Value(14))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(startDelay),
      Animated.stagger(stagger, letters.map((_, i) =>
        Animated.parallel([
          Animated.timing(anims[i],  { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slides[i], { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ])
      )),
    ]).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      {letters.map((char, i) => (
        <Animated.Text key={i} style={[style, color ? { color } : {}, {
          opacity: anims[i],
          transform: [{ translateY: slides[i] }],
        }]}>
          {char}
        </Animated.Text>
      ))}
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────
   DIVIDER DRAW
───────────────────────────────────────────────────────────── */
const DrawDivider: React.FC<{ color: string; delay: number; width: number }> = ({ color, delay, width }) => {
  const left  = useRef(new Animated.Value(0)).current;
  const right = useRef(new Animated.Value(0)).current;
  const starF = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(left,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(right, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(starF, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad),  useNativeDriver: true  }),
      ]),
    ]).start();
  }, []);

  const lineW = (width - rs(20)) / 2;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width, justifyContent: 'center', gap: rs(8) }}>
      <Animated.View style={{
        width: left.interpolate({ inputRange: [0, 1], outputRange: [0, lineW] }),
        height: StyleSheet.hairlineWidth,
        backgroundColor: color, opacity: 0.45,
      }} />
      <Animated.View style={{ opacity: starF }}>
        <Star8 size={rs(9)} color={color} opacity={0.7} />
      </Animated.View>
      <Animated.View style={{
        width: right.interpolate({ inputRange: [0, 1], outputRange: [0, lineW] }),
        height: StyleSheet.hairlineWidth,
        backgroundColor: color, opacity: 0.45,
      }} />
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN SPLASH SCREEN
───────────────────────────────────────────────────────────── */
export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* ── Master animation values ── */
  const bgFade       = useRef(new Animated.Value(0)).current;
  const starsFade    = useRef(new Animated.Value(0)).current;

  // Ring anims [ring1outer, ring2, ring3, ring4inner]
  const ringFade  = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const ringScale = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.7))).current;

  // Central glow bloom
  const glowScale   = useRef(new Animated.Value(0.4)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Crescent
  const crescentFade  = useRef(new Animated.Value(0)).current;
  const crescentTX    = useRef(new Animated.Value(rs(40))).current;
  const crescentTY    = useRef(new Animated.Value(-rs(20))).current;

  // Centre icon
  const iconScale   = useRef(new Animated.Value(0.1)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconRotate  = useRef(new Animated.Value(-0.08)).current;

  // Arabic text
  const arabicFade  = useRef(new Animated.Value(0)).current;
  const arabicSlide = useRef(new Animated.Value(rvs(16))).current;

  // Tagline
  const tagFade   = useRef(new Animated.Value(0)).current;
  const tagSlide  = useRef(new Animated.Value(rvs(12))).current;

  // Blessing + dots
  const blessFade = useRef(new Animated.Value(0)).current;
  const dotsFade  = useRef(new Animated.Value(0)).current;

  // Full screen exit fade
  const exitFade  = useRef(new Animated.Value(1)).current;

  /* ── Continuous slow pulse on centre glow ── */
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  /* ── Orchestrated reveal sequence ── */
  useEffect(() => {
    const t = (ms: number, anim: Animated.Value, to: number, dur: number, ease = Easing.out(Easing.cubic)) =>
      Animated.sequence([
        Animated.delay(ms),
        Animated.timing(anim, { toValue: to, duration: dur, easing: ease, useNativeDriver: true }),
      ]);

    const sp = (ms: number, anim: Animated.Value, to: number, friction = 8, tension = 70) =>
      Animated.sequence([
        Animated.delay(ms),
        Animated.spring(anim, { toValue: to, friction, tension, useNativeDriver: true }),
      ]);

    Animated.parallel([
      // Background blooms
      t(180, bgFade, 1, 700, Easing.out(Easing.quad)),

      // Stars twinkle in
      t(380, starsFade, 1, 600),

      // Ring 1 (outermost)
      t(520, ringFade[0],  1, 600),
      sp(520, ringScale[0], 1, 10, 55),

      // Ring 2
      t(700, ringFade[1],  1, 500),
      sp(700, ringScale[1], 1, 9, 60),

      // Ring 3
      t(860, ringFade[2],  1, 450),
      sp(860, ringScale[2], 1, 9, 65),

      // Ring 4 (innermost)
      t(1000, ringFade[3],  1, 400),
      sp(1000, ringScale[3], 1, 8, 70),

      // Centre glow bloom
      t(900,  glowOpacity, 1, 500),
      sp(900,  glowScale, 1, 7, 60),

      // Crescent slides in
      t(1250, crescentFade, 1, 450),
      t(1250, crescentTX,   0, 550, Easing.out(Easing.back(1.4))),
      t(1250, crescentTY,   0, 550, Easing.out(Easing.back(1.4))),

      // Icon springs in
      t(1460, iconOpacity, 1, 350),
      sp(1460, iconScale, 1, 7, 80),
      t(1460, iconRotate, 0, 550, Easing.out(Easing.back(1.2))),

      // Arabic text rises
      t(2050, arabicFade,  1, 450),
      t(2050, arabicSlide, 0, 450),

      // Tagline rises
      t(2380, tagFade,  1, 400),
      t(2380, tagSlide, 0, 400),

      // Bottom blessing
      t(2750, blessFade, 1, 400),

      // Loading dots appear
      t(3000, dotsFade, 1, 300),
    ]).start();

    // Navigate after reveal completes
    const navTimer = setTimeout(() => {
      Animated.timing(exitFade, {
        toValue: 0, duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        router.replace('../../screens/onboarding'); // adjust to your route
      });
    }, 3500);

    return () => clearTimeout(navTimer);
  }, []);

  /* ── Derived transforms ── */
  const iconRot = iconRotate.interpolate({ inputRange: [-0.08, 0], outputRange: ['-8deg', '0deg'] });

  /* ── Responsive hero sizes ── */
  const ring1 = IS_SMALL ? rs(250) : IS_LARGE ? rs(320) : rs(285);
  const ring2 = IS_SMALL ? rs(200) : IS_LARGE ? rs(258) : rs(228);
  const ring3 = IS_SMALL ? rs(158) : IS_LARGE ? rs(202) : rs(178);
  const ring4 = IS_SMALL ? rs(120) : IS_LARGE ? rs(154) : rs(136);
  const glow  = IS_SMALL ? rs(88)  : IS_LARGE ? rs(115) : rs(100);
  const iconSize = IS_SMALL ? rs(52) : IS_LARGE ? rs(68) : rs(60);
  const crescentSize = IS_SMALL ? rs(36) : IS_LARGE ? rs(50) : rs(44);

  return (
    <Animated.View style={[spl.root, { opacity: exitFade }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── BACKGROUND ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        <LinearGradient
          colors={[T.void, T.night1, T.night2, T.night3, T.night2, T.night1]}
          locations={[0, 0.15, 0.35, 0.55, 0.8, 1]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── STAR FIELD ── */}
      <StarField masterFade={starsFade} />

      {/* ── AMBIENT GLOW HALOS (atmospheric) ── */}
      <View style={[spl.halo, { width: rs(400), height: rs(400), borderRadius: rs(200), backgroundColor: T.gold, opacity: 0.035, top: H * 0.18, left: W * 0.5 - rs(200) }]} pointerEvents="none" />
      <View style={[spl.halo, { width: rs(280), height: rs(280), borderRadius: rs(140), backgroundColor: T.teal, opacity: 0.04, top: H * 0.68, left: W * 0.5 - rs(140) }]} pointerEvents="none" />

      {/* ── HERO CENTRE ── */}
      <View style={spl.heroWrap}>

        {/* Ring 1 — outermost, slow spin, tiny star ornaments */}
        <GeomRing
          size={ring1}
          borderColor={`rgba(212,168,50,0.10)`}
          borderWidth={1}
          rotationDur={40000}
          clockwise
          fadeAnim={ringFade[0]}
          scaleAnim={ringScale[0]}
          showStars
          starCount={8}
          starColor={T.gold}
        />

        {/* Ring 2 — counter-clockwise */}
        <GeomRing
          size={ring2}
          borderColor={`rgba(212,168,50,0.16)`}
          borderWidth={1}
          rotationDur={28000}
          clockwise={false}
          fadeAnim={ringFade[1]}
          scaleAnim={ringScale[1]}
          showStars
          starCount={4}
          starColor={T.goldBright}
        />

        {/* Ring 3 */}
        <GeomRing
          size={ring3}
          borderColor={`rgba(212,168,50,0.24)`}
          borderWidth={1}
          rotationDur={18000}
          clockwise
          fadeAnim={ringFade[2]}
          scaleAnim={ringScale[2]}
        />

        {/* Ring 4 — innermost */}
        <GeomRing
          size={ring4}
          borderColor={`rgba(212,168,50,0.35)`}
          borderWidth={1.5}
          rotationDur={12000}
          clockwise={false}
          fadeAnim={ringFade[3]}
          scaleAnim={ringScale[3]}
        />

        {/* ── Centre glow ── */}
        <Animated.View style={[spl.centreGlow, {
          width: glow, height: glow, borderRadius: glow / 2,
          opacity: glowOpacity,
          transform: [{ scale: Animated.multiply(glowScale, pulseAnim) }],
        }]}>
          <LinearGradient
            colors={[`${T.goldBright}40`, `${T.gold}25`, `${T.gold}08`]}
            style={[StyleSheet.absoluteFill, { borderRadius: glow / 2 }]}
          />
          {/* Inner bright core */}
          <View style={[spl.glowCore, {
            width: glow * 0.55, height: glow * 0.55,
            borderRadius: glow * 0.275,
          }]}>
            <LinearGradient
              colors={[`${T.goldBright}60`, `${T.gold}30`]}
              style={[StyleSheet.absoluteFill, { borderRadius: glow * 0.275 }]}
            />
          </View>
        </Animated.View>

        {/* ── Centre Icon ── */}
        <Animated.View style={[spl.iconWrap, {
          opacity: iconOpacity,
          transform: [{ scale: iconScale }, { rotate: iconRot }],
        }]}>
          <MaterialCommunityIcons name="star-crescent" size={iconSize} color={T.goldBright} />
        </Animated.View>

        {/* ── Floating crescent (top-right of hero) ── */}
        <Animated.View style={[spl.crescentWrap, {
          opacity: crescentFade,
          transform: [{ translateX: crescentTX }, { translateY: crescentTY }],
          width: crescentSize, height: crescentSize,
        }]}>
          <Crescent size={crescentSize} color={T.goldBright} bgColor={T.night2} opacity={0.85} />
        </Animated.View>

        {/* ── Small star accents ── */}
        <View style={[spl.starAccent, { top: -ring3 * 0.28, left: -ring3 * 0.42 }]}>
          <Animated.View style={{ opacity: ringFade[2] }}>
            <Star8 size={rs(12)} color={T.gold} opacity={0.5} />
          </Animated.View>
        </View>
        <View style={[spl.starAccent, { bottom: -ring3 * 0.25, right: -ring3 * 0.40 }]}>
          <Animated.View style={{ opacity: ringFade[2] }}>
            <Star8 size={rs(9)} color={T.gold} opacity={0.38} />
          </Animated.View>
        </View>
      </View>

      {/* ── TEXT BLOCK ── */}
      <View style={[spl.textBlock, { marginTop: IS_SMALL ? rvs(28) : rvs(36) }]}>

        {/* App name — letter by letter */}
        <LetterReveal
          text="Qalb-E-Rooh"
          startDelay={1750}
          stagger={52}
          style={spl.appName}
          color={T.textPrime}
        />

        {/* Arabic subtitle */}
        <Animated.View style={[spl.arabicWrap, { opacity: arabicFade, transform: [{ translateY: arabicSlide }] }]}>
          <Text style={spl.arabicText}>قلب روح</Text>
        </Animated.View>

        {/* Ornamental divider draws in */}
        <View style={{ marginTop: IS_SMALL ? rvs(10) : rvs(14), marginBottom: IS_SMALL ? rvs(10) : rvs(14) }}>
          <DrawDivider color={T.gold} delay={2200} width={IS_SMALL ? rs(180) : rs(210)} />
        </View>

        {/* Tagline */}
        <Animated.View style={{ opacity: tagFade, transform: [{ translateY: tagSlide }], alignItems: 'center' }}>
          <Text style={spl.tagline}>Your Sacred Ramadan Companion</Text>
        </Animated.View>
      </View>

      {/* ── BOTTOM: blessing + loading dots ── */}
      <View style={[spl.bottom, { paddingBottom: insets.bottom + rvs(24) }]}>
        {/* Ramadan blessing */}
        <Animated.View style={[spl.blessingRow, { opacity: blessFade }]}>
          <Star8 size={rs(7)} color={T.gold} opacity={0.45} />
          <Text style={spl.blessingText}>رَمَضَانَ الْمُبَارَكَ</Text>
          <Star8 size={rs(7)} color={T.gold} opacity={0.45} />
        </Animated.View>

        {/* Loading dots */}
        <View style={{ marginTop: IS_SMALL ? rvs(10) : rvs(14) }}>
          <LoadingDots color={T.gold} visible={dotsFade} />
        </View>

        {/* Version / tagline tiny */}
        <Animated.View style={{ opacity: blessFade, marginTop: rvs(8) }}>
          <Text style={spl.versionText}>v1.0.0 · Built with love for the Ummah</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const spl = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.void,
    alignItems: 'center',
    justifyContent: 'center',
  },

  halo: {
    position: 'absolute',
  },

  /* Hero composition */
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: IS_SMALL ? rs(250) : IS_LARGE ? rs(320) : rs(285),
    height: IS_SMALL ? rs(250) : IS_LARGE ? rs(320) : rs(285),
  },

  centreGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: T.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: rs(30),
      },
    }),
  },
  glowCore: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: T.goldBright,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: rs(18),
      },
      android: { elevation: 10 },
    }),
  },

  crescentWrap: {
    position: 'absolute',
    top: IS_SMALL ? rs(2) : rs(6),
    right: IS_SMALL ? rs(2) : rs(4),
  },

  starAccent: {
    position: 'absolute',
  },

  /* Text */
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: rs(32),
  },

  appName: {
    fontSize: IS_SMALL ? rf(30) : IS_LARGE ? rf(40) : rf(35),
    fontWeight: '800',
    color: T.textPrime,
    letterSpacing: IS_SMALL ? 1.5 : 2,
    ...Platform.select({
      ios: {
        shadowColor: T.goldBright,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: rs(8),
      },
    }),
  },

  arabicWrap: { alignItems: 'center', marginTop: rvs(6) },
  arabicText: {
    fontSize: IS_SMALL ? rf(22) : IS_LARGE ? rf(30) : rf(26),
    fontWeight: '800',
    color: T.gold,
    letterSpacing: 3,
    ...Platform.select({
      ios: {
        shadowColor: T.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: rs(10),
      },
    }),
  },

  tagline: {
    fontSize: IS_SMALL ? rf(12) : rf(13),
    color: T.textSecond,
    fontWeight: '500',
    letterSpacing: 0.6,
    textAlign: 'center',
    lineHeight: rf(20),
  },

  /* Bottom */
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  blessingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(9),
  },
  blessingText: {
    fontSize: rf(13),
    color: T.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },

  versionText: {
    fontSize: rf(10),
    color: T.textDim,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});