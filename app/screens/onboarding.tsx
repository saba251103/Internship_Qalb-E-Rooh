/**
 * Qalb-E-Rooh — Ramadan Onboarding
 * FULLY RESPONSIVE — works on iPhone SE (375×667) → Pro Max (430×932)
 * and Android 360×640 → 480×960.
 *
 * KEY FIX: strict flex-column layout (header + flex:1 slides + fixed footer).
 * The footer is NEVER absolute-positioned so it can NEVER overlap content.
 * The slide area is a ScrollView so even tiny phones scroll rather than clip.
 *
 * Dependencies:
 * expo-linear-gradient, react-native-safe-area-context, @expo/vector-icons
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE SCALE HELPERS
   Base: 390×844 (iPhone 14). Hard clamped so extreme devices stay sane.
═══════════════════════════════════════════════════════════════ */
const { width: W, height: H } = Dimensions.get('window');
const rs = (n: number) =>
  Math.min(Math.max(Math.round((n / 390) * W), Math.round(n * 0.72)), Math.round(n * 1.18));
const rvs = (n: number) =>
  Math.min(Math.max(Math.round((n / 844) * H), Math.round(n * 0.62)), Math.round(n * 1.28));
const rf = (n: number) =>
  Math.min(Math.max(Math.round((n / 390) * W), Math.round(n * 0.80)), Math.round(n * 1.14));

const IS_SMALL = H < 700;
const IS_LARGE = H > 896;

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — "Majestic Forest & Teal"
═══════════════════════════════════════════════════════════════ */
const R = {
  // Rich, visible dark greens (No pure blacks)
  night0: '#041A10', // Deepest background (Dark Pine)
  night1: '#062618', // Base shadow
  night2: '#0A3622', // Mid dark green
  night3: '#0E472E', // Emerald shadow
  night4: '#145C3D', // Brightest background green
  
  // Accents
  gold:        '#D4A832',
  goldBright:  '#F0C855',
  goldLight:   '#F8DC8A',
  goldBorder:  'rgba(212,168,50,0.28)',
  copper:      '#B88645', 
  teal:        '#135245',
  tealLight:   '#1C7563',
  jade:        '#2A8B5D',
  mint:        '#45B89F', 
  
  // Typography
  textPrime:   '#F5EDD5',
  textSecond:  '#B8A880',
  textMuted:   '#6B6040',
  textDim:     '#3D361E',
  border:      'rgba(255,255,255,0.06)',
};

/* ═══════════════════════════════════════════════════════════════
   SLIDE DATA
═══════════════════════════════════════════════════════════════ */
interface SlideData {
  id: number;
  arabic: string;
  arabicSub: string;
  title: string;
  subtitle: string;
  desc: string;
  features: { icon: string; label: string }[];
  bgColors: readonly [string, string, string];
  accent: string;
  icon: string;
}

const SLIDES: SlideData[] = [
  {
    id: 0,
    arabic: 'قلب روح',
    arabicSub: 'Qalb-E-Rooh',
    title: 'Welcome to the\nHeart & Soul',
    subtitle: 'Ramadan Mubarak 🌙',
    desc: 'Your complete Ramadan companion — connecting you to Allah through prayer, recitation, and reflection.',
    features: [
      { icon: 'television-play',   label: 'Makkah Live' },
      { icon: 'book-open-variant', label: 'Holy Quran'  },
      { icon: 'location-enter',    label: 'Qibla'       },
      { icon: 'calendar-star',     label: 'Hijri Calender'   },
    ],
    bgColors: [R.night1, R.night3, R.night2],
    accent: R.gold,
    icon: 'star-crescent',
  },
  {
    id: 1,
    arabic: 'الصلاة والذكر',
    arabicSub: 'Prayer & Remembrance',
    title: 'Pray, Remember,\nBe Present',
    subtitle: 'Five Pillars · One App',
    desc: 'Never miss a salah. Track all five daily prayers, find Qibla instantly, and count your tasbeeh with a serene counter.',
    features: [
      { icon: 'alarm',             label: 'Prayer Times'  },
      { icon: 'rotate-360',        label: 'Tasbeeh'       },
      { icon: 'map-marker-radius', label: 'Qibla Finder'  },
      { icon: 'check-decagram',    label: 'Namaz Tracker' },
    ],
    bgColors: [R.night1, '#0B3829', '#082E20'], // Deep teal tint
    accent: R.tealLight,
    icon: 'alarm',
  },
  {
    id: 2,
    arabic: 'القرآن الكريم',
    arabicSub: 'Al-Quran Al-Kareem',
    title: 'Recite, Memorize\n& Complete',
    subtitle: 'Words of Allah ﷻ',
    desc: 'Read the full Quran, track your Khatam progress, memorise surahs step by step, and immerse in every sacred ayah.',
    features: [
      { icon: 'book-open-page-variant', label: 'Full Quran' },
      { icon: 'brain',                  label: 'Memorize'   },
      { icon: 'bookmark-check',         label: 'Khatam'     },
      { icon: 'headphones',             label: 'Immerse'    },
    ],
    bgColors: ['#062618', '#0A3622', '#072C1C'],
    accent: R.jade,
    icon: 'book-open-variant',
  },
  {
    id: 3,
    arabic: 'أسماء الله الحسنى',
    arabicSub: '99 Names of Allah',
    title: 'Know Allah ﷻ\nDeeper',
    subtitle: 'Spiritual Awakening',
    desc: 'Explore 99 Beautiful Names of Allah, learn the Shahadah, and discover Islamic greetings and their profound meanings.',
    features: [
      { icon: 'infinity',        label: '99 Names'  },
      { icon: 'hand-heart',      label: 'Shahadah'  },
      { icon: 'chat-processing', label: 'Greetings' },
      { icon: 'meditation',      label: 'Immerse'   },
    ],
    bgColors: ['#05211A', '#09362B', '#072E24'], // Teal dominant
    accent: R.mint,
    icon: 'infinity',
  },
  {
    id: 4,
    arabic: 'التقويم والمسجد',
    arabicSub: 'Calendar & Mosque',
    title: 'Navigate the\nSacred Calendar',
    subtitle: 'Always Connected',
    desc: 'Follow the Hijri calendar, find nearby mosques for tarawih, watch Makkah Live, and journal your daily reflections.',
    features: [
      { icon: 'calendar-moon',   label: 'Hijri Calender'   },
      { icon: 'mosque',          label: 'Mosques'     },
      { icon: 'television-play', label: 'Makkah Live' },
      { icon: 'notebook-heart',  label: 'Journal'     },
    ],
    bgColors: ['#062618', '#0A3622', '#072C1C'],
    accent: R.jade,
    icon: 'calendar-star',
  },
  {
    id: 5,
    arabic: 'رمضان مبارك',
    arabicSub: 'Blessed Ramadan',
    title: 'Zakat & Complete\nYour Deen',
    subtitle: 'Begin Your Journey ✨',
    desc: 'Calculate your Zakat with precision, fulfil the fourth pillar of Islam, and begin the most blessed journey of your life.',
    features: [
      { icon: 'hand-coin',    label: 'Zakat Calc'    },
      { icon: 'book-heart',   label: 'Dua Journal'   },
      { icon: 'star-shooting',label: 'Laylatul Qadr' },
      { icon: 'heart-pulse',  label: 'Qalb-E-Rooh'  },
    ],
    bgColors: ['#05211A', '#09362B', '#072E24'], // Teal dominant
    accent: R.mint,
    icon: 'hand-coin',
  },
];

/* ═══════════════════════════════════════════════════════════════
   STATIC PARTICLES
═══════════════════════════════════════════════════════════════ */
interface Particle { x: number; y: number; r: number; delay: number; dur: number }
const PARTICLES: Particle[] = Array.from({ length: 26 }, () => ({
  x:    Math.random() * W,
  y:    Math.random() * H * 0.6,
  r:    Math.random() * 1.6 + 0.6,
  delay:Math.random() * 3200,
  dur:  1600 + Math.random() * 2800,
}));

/* ═══════════════════════════════════════════════════════════════
   STAR FIELD
═══════════════════════════════════════════════════════════════ */
const StarField = React.memo<{ color: string }>(({ color }) => {
  const anims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach((a, i) => {
      const run = () => {
        a.setValue(0);
        Animated.sequence([
          Animated.delay(PARTICLES[i].delay),
          Animated.timing(a, { toValue: 1,   duration: PARTICLES[i].dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.1, duration: PARTICLES[i].dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]).start(run);
      };
      run();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: p.x, top: p.y,
          width: p.r * 2, height: p.r * 2, borderRadius: p.r,
          backgroundColor: color,
          opacity: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.88] }),
        }} />
      ))}
    </View>
  );
});

/* ═══════════════════════════════════════════════════════════════
   AMBIENT GLOW
═══════════════════════════════════════════════════════════════ */
const AmbientGlow: React.FC<{ x: number; y: number; r: number; color: string; peak: number }> =
  ({ x, y, r, color, peak }) => {
    const p = useRef(new Animated.Value(0.7)).current;
    useEffect(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(p, { toValue: 1,   duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(p, { toValue: 0.7, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }, []);
    return (
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', left: x - r, top: y - r,
        width: r * 2, height: r * 2, borderRadius: r,
        backgroundColor: color,
        opacity: p.interpolate({ inputRange: [0.7, 1], outputRange: [peak * 0.55, peak] }),
      }} />
    );
  };

/* ═══════════════════════════════════════════════════════════════
   ISLAMIC 8-POINT STAR
═══════════════════════════════════════════════════════════════ */
const IslamicStar: React.FC<{ size: number; color: string; opacity?: number }> = ({ size: s, color, opacity = 1 }) => (
  <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center', opacity }}>
    {[0, 22.5, 45, 67.5].map((deg, i) => (
      <View key={i} style={{
        position: 'absolute', width: s * 0.63, height: s * 0.63,
        backgroundColor: color, transform: [{ rotate: `${deg}deg` }], opacity: 0.82,
      }} />
    ))}
    <View style={{ width: s * 0.27, height: s * 0.27, backgroundColor: color, transform: [{ rotate: '45deg' }], position: 'absolute' }} />
  </View>
);

/* ═══════════════════════════════════════════════════════════════
   CRESCENT MOON
═══════════════════════════════════════════════════════════════ */
const Crescent: React.FC<{ size: number; color: string; bg: string; opacity?: number }> =
  ({ size, color, bg, opacity = 1 }) => (
    <View style={{ width: size, height: size, opacity }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
      <View style={{
        position: 'absolute',
        width: size * 0.76, height: size * 0.76,
        borderRadius: (size * 0.76) / 2,
        backgroundColor: bg,
        top: -(size * 0.04), left: size * 0.22,
      }} />
    </View>
  );

/* ═══════════════════════════════════════════════════════════════
   DIVIDER
═══════════════════════════════════════════════════════════════ */
const Divider: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(7), opacity: 0.38 }}>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color }} />
    <IslamicStar size={rs(8)} color={color} />
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color }} />
  </View>
);

/* ═══════════════════════════════════════════════════════════════
   LANTERN BANNER
═══════════════════════════════════════════════════════════════ */
const BANNER_H = IS_SMALL ? rvs(40) : rvs(52);

const LanternBanner = React.memo<{ color: string }>(({ color }) => {
  const s = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(s, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(s, { toValue: 0, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  const rot = s.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });
  const lW = IS_SMALL ? rs(11) : rs(14);
  const lH = IS_SMALL ? rs(15) : rs(19);
  const chains = IS_SMALL ? 2 : 3;

  const Lantern = () => (
    <View style={{ alignItems: 'center', gap: rs(2) }}>
      {Array.from({ length: chains }).map((_, i) => (
        <View key={i} style={{ width: rs(2), height: rs(4), borderRadius: rs(1), backgroundColor: `${color}42` }} />
      ))}
      <Animated.View style={{ width: lW, height: lH, borderRadius: rs(3), borderWidth: 1, borderColor: `${color}55`, overflow: 'hidden', transform: [{ rotate: rot }] }}>
        <LinearGradient colors={[`${color}88`, `${color}42`]} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );

  return (
    <View style={{ height: BANNER_H, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: rs(22), paddingTop: rs(4) }} pointerEvents="none">
      <Lantern />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingTop: rs(6) }}>
        <Crescent size={IS_SMALL ? rs(13) : rs(17)} color={color} bg={R.night1} opacity={0.65} />
        <IslamicStar size={IS_SMALL ? rs(7) : rs(9)} color={color} opacity={0.6} />
      </View>
      <Lantern />
    </View>
  );
});

/* ═══════════════════════════════════════════════════════════════
   FEATURE PILL
═══════════════════════════════════════════════════════════════ */
const FeaturePill: React.FC<{ icon: string; label: string; color: string; anim: Animated.Value }> =
  ({ icon, label, color, anim }) => {
    const pillVs = IS_SMALL ? rs(6) : rs(8);
    const pillHs = IS_SMALL ? rs(8) : rs(11);
    const iconSz = IS_SMALL ? rs(24) : rs(28);
    return (
      <Animated.View style={[
        pill.wrap,
        { paddingVertical: pillVs, paddingHorizontal: pillHs },
        {
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }],
        },
      ]}>
        <View style={[pill.icon, { width: iconSz, height: iconSz, backgroundColor: `${color}14`, borderColor: `${color}2E` }]}>
          <MaterialCommunityIcons name={icon as any} size={IS_SMALL ? rs(12) : rs(14)} color={color} />
        </View>
        <Text style={[pill.label, { fontSize: IS_SMALL ? rf(10) : rf(11) }]}>{label}</Text>
      </Animated.View>
    );
  };

const pill = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: rs(10), gap: rs(7),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  icon: { borderRadius: rs(7), alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  label: { fontWeight: '700', color: R.textSecond, letterSpacing: 0.1 },
});

/* ═══════════════════════════════════════════════════════════════
   DOTS
═══════════════════════════════════════════════════════════════ */
const Dots: React.FC<{ total: number; active: number; color: string }> = ({ total, active, color }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(5) }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={{
        height: rs(5), borderRadius: rs(2.5),
        width: i === active ? rs(22) : rs(5),
        backgroundColor: i === active ? color : 'rgba(255,255,255,0.18)',
      }} />
    ))}
  </View>
);

/* ═══════════════════════════════════════════════════════════════
   SLIDE CONTENT
═══════════════════════════════════════════════════════════════ */
const SlideBody: React.FC<{
  slide: SlideData;
  pillAnims: Animated.Value[];
  spinAnim: Animated.Value;
}> = ({ slide, pillAnims, spinAnim }) => {
  const outerR = IS_SMALL ? rs(100) : IS_LARGE ? rs(142) : rs(124);
  const midR   = IS_SMALL ? rs(78)  : IS_LARGE ? rs(112) : rs(96);
  const innerR = IS_SMALL ? rs(58)  : IS_LARGE ? rs(84)  : rs(72);
  const iconSz = IS_SMALL ? rs(36)  : IS_LARGE ? rs(52)  : rs(44);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={sb.wrapper}>
      <View style={[sb.ornBg, { width: rs(148), height: rs(148) }]} pointerEvents="none">
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <IslamicStar size={rs(148)} color={slide.accent} opacity={0.042} />
        </Animated.View>
      </View>

      <View style={[sb.outerRing, { width: outerR, height: outerR, borderRadius: outerR / 2, borderColor: `${slide.accent}18`, marginBottom: IS_SMALL ? rvs(12) : rvs(18) }]}>
        <View style={[sb.midRing, { width: midR, height: midR, borderRadius: midR / 2, borderColor: `${slide.accent}2A`, backgroundColor: `${slide.accent}06` }]}>
          <LinearGradient
            colors={[`${slide.accent}2C`, `${slide.accent}10`, `${slide.accent}04`]}
            style={[sb.innerRing, { width: innerR, height: innerR, borderRadius: innerR / 2 }]}
          >
            <MaterialCommunityIcons name={slide.icon as any} size={iconSz} color={slide.accent} />
          </LinearGradient>
        </View>
        <View style={{ position: 'absolute', top: -(rs(3)), right: -(rs(1)) }}>
          <Crescent size={rs(20)} color={slide.accent} bg={R.night2} opacity={0.55} />
        </View>
        <View style={{ position: 'absolute', bottom: rs(8), left: -(rs(3)) }}>
          <IslamicStar size={rs(10)} color={slide.accent} opacity={0.4} />
        </View>
      </View>

      <Text style={[sb.arabic, { fontSize: IS_SMALL ? rf(20) : IS_LARGE ? rf(28) : rf(24), color: slide.accent }]}>
        {slide.arabic}
      </Text>
      <Text style={sb.arabicSub}>{slide.arabicSub}</Text>

      <View style={[sb.divWrap, { marginVertical: IS_SMALL ? rvs(8) : rvs(12) }]}>
        <Divider color={slide.accent} />
      </View>

      <Text style={[sb.title, { fontSize: IS_SMALL ? rf(20) : IS_LARGE ? rf(27) : rf(23) }]}>
        {slide.title}
      </Text>
      <Text style={[sb.subtitle, { color: slide.accent, marginBottom: IS_SMALL ? rvs(6) : rvs(10) }]}>
        {slide.subtitle}
      </Text>
      <Text style={[sb.desc, { fontSize: IS_SMALL ? rf(12) : rf(13), marginBottom: IS_SMALL ? rvs(14) : rvs(20) }]}>
        {slide.desc}
      </Text>

      <View style={[sb.pillGrid, { gap: IS_SMALL ? rs(6) : rs(8) }]}>
        <View style={[sb.pillRow, { gap: IS_SMALL ? rs(6) : rs(8) }]}>
          <FeaturePill icon={slide.features[0].icon} label={slide.features[0].label} color={slide.accent} anim={pillAnims[0]} />
          <FeaturePill icon={slide.features[1].icon} label={slide.features[1].label} color={slide.accent} anim={pillAnims[1]} />
        </View>
        <View style={[sb.pillRow, { gap: IS_SMALL ? rs(6) : rs(8) }]}>
          <FeaturePill icon={slide.features[2].icon} label={slide.features[2].label} color={slide.accent} anim={pillAnims[2]} />
          <FeaturePill icon={slide.features[3].icon} label={slide.features[3].label} color={slide.accent} anim={pillAnims[3]} />
        </View>
      </View>
    </View>
  );
};

const sb = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingHorizontal: rs(22), paddingTop: IS_SMALL ? rvs(6) : rvs(12), paddingBottom: rvs(16) },
  ornBg: { alignItems: 'center', justifyContent: 'center', marginBottom: IS_SMALL ? rvs(-56) : rvs(-72), zIndex: 0 },
  outerRing: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  midRing:   { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  innerRing: { alignItems: 'center', justifyContent: 'center' },
  arabic:    { fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  arabicSub: { fontSize: rf(10), color: R.textMuted, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginTop: rvs(3) },
  divWrap:   { width: '52%' },
  title: {
    fontWeight: '800', color: R.textPrime,
    textAlign: 'center', letterSpacing: -0.3,
    lineHeight: IS_SMALL ? rf(26) : rf(32),
    marginBottom: rvs(6),
  },
  subtitle:  { fontSize: IS_SMALL ? rf(10) : rf(12), fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  desc:      { color: R.textSecond, textAlign: 'center', lineHeight: IS_SMALL ? rf(17) : rf(20) },
  pillGrid:  { width: '100%' },
  pillRow:   { flexDirection: 'row', justifyContent: 'center' },
});

/* ═══════════════════════════════════════════════════════════════
   SLIDE CONTAINER
═══════════════════════════════════════════════════════════════ */
const SlideContainer: React.FC<{
  slide: SlideData;
  isActive: boolean;
  fromRight: boolean;
}> = ({ slide, isActive, fromRight }) => {
  const fade   = useRef(new Animated.Value(0)).current;
  const transX = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(0.95)).current;
  const spin   = useRef(new Animated.Value(0)).current;
  const pillAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  useEffect(() => {
    if (!isActive) {
      fade.setValue(0);
      pillAnims.forEach(a => a.setValue(0));
      return;
    }
    transX.setValue(fromRight ? -W * 0.2 : W * 0.2);
    scale.setValue(0.95);
    fade.setValue(0);
    pillAnims.forEach(a => a.setValue(0));

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade,   { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(transX, { toValue: 0, friction: 11, tension: 88, useNativeDriver: true }),
        Animated.spring(scale,  { toValue: 1, friction: 10, tension: 92, useNativeDriver: true }),
      ]),
      Animated.stagger(80, pillAnims.map(a =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 230, useNativeDriver: true })
      )),
    ]).start();
  }, [isActive]);

  if (!isActive) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, {
      opacity: fade,
      transform: [{ translateX: transX }, { scale }],
    }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <SlideBody slide={slide} pillAnims={pillAnims} spinAnim={spin} />
      </ScrollView>
    </Animated.View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════════════════ */
const TOPBAR_H = rs(44);

const Header: React.FC<{ accent: string; onSkip: () => void; isLast: boolean }> = ({ accent, onSkip, isLast }) => (
  <View>
    <View style={[hdr.bar, { height: TOPBAR_H }]}>
      <View style={hdr.brand}>
        <View style={[hdr.brandCircle, { backgroundColor: `${accent}14`, borderColor: `${accent}38` }]}>
          <MaterialCommunityIcons name="star-crescent" size={rs(14)} color={accent} />
        </View>
        <Text style={[hdr.brandText, { color: accent }]}>Qalb-E-Rooh</Text>
      </View>
      {!isLast && (
        <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={hdr.skipBtn}>
          <Text style={hdr.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={rs(12)} color={R.textMuted} />
        </TouchableOpacity>
      )}
    </View>
    <LanternBanner color={accent} />
  </View>
);

const hdr = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs(20) },
  brand: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  brandCircle: { width: rs(30), height: rs(30), borderRadius: rs(15), borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: rf(14), fontWeight: '800', letterSpacing: 0.4 },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(2),
    paddingHorizontal: rs(10), paddingVertical: rs(6),
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: rs(16), borderWidth: 1, borderColor: R.border,
  },
  skipText: { fontSize: rf(11), color: R.textMuted, fontWeight: '600' },
});

/* ═══════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════ */
const BTN_H = IS_SMALL ? rs(48) : rs(54);

const Footer: React.FC<{
  total: number;
  active: number;
  accent: string;
  isLast: boolean;
  extraBottom: number;
  btnScale: Animated.Value;
  onPrev: () => void;
  onNext: () => void;
  onIn: () => void;
  onOut: () => void;
}> = ({ total, active, accent, isLast, extraBottom, btnScale, onPrev, onNext, onIn, onOut }) => (
  <View style={[ftr.root, { paddingBottom: extraBottom + rvs(12) }]}>
    <View style={[ftr.topLine, { backgroundColor: accent }]} />

    <View style={ftr.inner}>
      <View style={ftr.dotsRow}>
        <Dots total={total} active={active} color={accent} />
      </View>

      <View style={[ftr.navRow, { gap: rs(10) }]}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={active === 0}
          activeOpacity={0.75}
          style={{ opacity: active === 0 ? 0 : 1 }}
        >
          <View style={[ftr.backBtn, { height: BTN_H, width: BTN_H, borderColor: `${accent}30` }]}>
            <Ionicons name="chevron-back" size={rs(20)} color={R.textSecond} />
          </View>
        </TouchableOpacity>

        <Animated.View style={[{ flex: 1 }, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity onPress={onNext} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
            <LinearGradient
              colors={[accent, `${accent}D0`, `${accent}A6`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[ftr.nextBtn, { height: BTN_H }]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.07)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={ftr.nextLeft}>
                <View style={ftr.nextIconWrap}>
                  <MaterialCommunityIcons
                    name={isLast ? 'heart-pulse' : 'arrow-right'}
                    size={rs(17)} color="rgba(0,0,0,0.42)"
                  />
                </View>
                <Text style={ftr.nextText}>{isLast ? 'Begin My Journey' : 'Continue'}</Text>
              </View>
              {!isLast && <Text style={ftr.nextCount}>{active + 1}/{total}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={ftr.blessingRow}>
        <IslamicStar size={rs(7)} color={accent} opacity={0.42} />
        <Text style={ftr.blessingText}>رَمَضَانَ الْمُبَارَكَ</Text>
        <IslamicStar size={rs(7)} color={accent} opacity={0.42} />
      </View>
    </View>
  </View>
);

const ftr = StyleSheet.create({
  root: {
    backgroundColor: 'rgba(4,26,16,0.93)', // Match the new lighter forest green base
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.45, shadowRadius: 12 },
      android: { elevation: 16 },
    }),
  },
  topLine: { height: 1.5, opacity: 0.3 },
  inner: { paddingHorizontal: rs(18), paddingTop: IS_SMALL ? rvs(9) : rvs(12) },
  dotsRow: { alignItems: 'center', marginBottom: IS_SMALL ? rvs(8) : rvs(11) },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: IS_SMALL ? rvs(8) : rvs(10) },
  backBtn: {
    borderRadius: rs(14), borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nextBtn: {
    borderRadius: rs(15),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: rs(6), paddingRight: rs(18), overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: R.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  nextLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  nextIconWrap: {
    width: IS_SMALL ? rs(36) : rs(40), height: IS_SMALL ? rs(36) : rs(40),
    borderRadius: rs(11), backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextText: { fontSize: IS_SMALL ? rf(13) : rf(15), fontWeight: '800', color: R.night0, letterSpacing: 0.1 },
  nextCount: { fontSize: rf(11), fontWeight: '700', color: 'rgba(0,0,0,0.30)' },
  blessingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingBottom: rvs(2) },
  blessingText: { fontSize: rf(11), color: R.textDim, fontWeight: '600', letterSpacing: 0.9 },
});

/* ═══════════════════════════════════════════════════════════════
   ROOT SCREEN
═══════════════════════════════════════════════════════════════ */
export default function QalbERoohOnboarding() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [idx, setIdx]         = useState(0);
  const [fromRight, setFromRight] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  const slide  = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) { router.replace('/(tabs)'); return; }
    setFromRight(false);
    setIdx(i => i + 1);
  };
  const goPrev = () => {
    if (idx === 0) return;
    setFromRight(true);
    setIdx(i => i - 1);
  };
  const skip = () => router.replace('/(tabs)');

  const onIn  = () => Animated.spring(btnScale, { toValue: 0.94, friction: 6, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(btnScale, { toValue: 1,    friction: 5, useNativeDriver: true }).start();

  return (
    <View style={{ flex: 1, backgroundColor: R.night0 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── BACKGROUND LAYERS ── */}
      <LinearGradient
        colors={slide.bgColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
      />
      <StarField color={slide.accent === R.goldBright ? R.goldLight : 'rgba(210,185,130,0.75)'} />
      <AmbientGlow x={W * 0.13} y={H * 0.20} r={rs(95)}  color={slide.accent} peak={0.13} />
      <AmbientGlow x={W * 0.87} y={H * 0.42} r={rs(80)}  color={slide.accent} peak={0.09} />
      <AmbientGlow x={W * 0.50} y={H * 0.76} r={rs(72)}  color={slide.accent} peak={0.07} />
      
      {/* Bottom vignette — matching the new forest base */}
      <LinearGradient
        colors={[`${R.night0}00`, `${R.night0}AA`, R.night0]}
        style={[StyleSheet.absoluteFill, { top: H * 0.54 }]}
        pointerEvents="none"
      />

      {/* ══════════════════════════════════════════
          MAIN LAYOUT
      ══════════════════════════════════════════ */}
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header accent={slide.accent} onSkip={skip} isLast={isLast} />

        <View style={{ flex: 1 }}>
          {SLIDES.map(s => (
            <SlideContainer key={s.id} slide={s} isActive={s.id === idx} fromRight={fromRight} />
          ))}
        </View>

        <Footer
          total={SLIDES.length}
          active={idx}
          accent={slide.accent}
          isLast={isLast}
          extraBottom={insets.bottom}
          btnScale={btnScale}
          onPrev={goPrev}
          onNext={goNext}
          onIn={onIn}
          onOut={onOut}
        />
      </View>
    </View>
  );
}