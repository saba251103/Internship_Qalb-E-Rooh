import {
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import sahihBukhariData from '../../assets/data/sahih_bukhari.json';
import { fetchTimingsFromBackend } from '../services/prayerService';

/* ═══════════════════════════════════════════════════════════════════
   RESPONSIVE SCALE SYSTEM
════════════════════════════════════════════════════════════════════ */

const { width: SCREEN_W } = Dimensions.get('window');
const BASE_W = 390;

const _scale = (n: number) => (SCREEN_W / BASE_W) * n;

const rs = (n: number, f = 0.5) => {
  const base = n + (_scale(n) - n) * f;
  const iosBoost = Platform.OS === 'ios' ? 1.09 : 1;
  return Math.round(base * iosBoost);
};

const font = (n: number) => {
  const base = rs(n);
  return Platform.OS === 'ios' ? base + 1 : base;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const PAD = clamp(rs(22), 18, 30);

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════════════ */
const C = {
  bg: '#EEF7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F5FAF9',
  teal0: '#041E1E',
  teal1: '#0A4A4A',
  teal2: '#0D5858',
  teal3: '#136060',
  teal4: '#1A7A70',
  teal5: '#4BA89E',
  tealLt: '#A8DDD8',
  tealFaint: 'rgba(10,74,74,0.08)',
  gold: '#D4942A',
  goldMid: '#E8B84B',
  goldLt: '#F5D98A',
  goldGlass: 'rgba(232,184,75,0.18)',
  goldBorder: 'rgba(232,184,75,0.30)',
  ink: '#072424',
  inkMid: '#2E6060',
  inkLight: '#6AABA5',
  inkFaint: 'rgba(7,36,36,0.30)',
  white: '#FFFFFF',
  shadow: '#041E1E',
  coral: '#E07060',
  glassBrd: 'rgba(255,255,255,0.18)',
};

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════════════ */

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

const ALL_PRAYERS: { name: string; icon: string }[] = [
  { name: 'Fajr',    icon: 'weather-sunset-up' },
  { name: 'Sunrise', icon: 'white-balance-sunny' },
  { name: 'Dhuhr',   icon: 'sun-compass' },
  { name: 'Asr',     icon: 'sun-clock' },
  { name: 'Maghrib', icon: 'weather-sunset' },
  { name: 'Isha',    icon: 'moon-waning-crescent' },
];

const QUICK_ACTIONS = [
  { id: 'khatam',  label: 'Khatam',   icon: 'check-decagram-outline', route: '/screens/khatam' },
  { id: 'zakat',   label: 'Zakat',    icon: 'hand-coin-outline',       route: '/screens/zakat' },
  { id: 'duas',    label: 'Duas',     icon: 'hand-heart-outline',      route: '/screens/duas' },
  { id: 'mosque',  label: 'Mosques',  icon: 'mosque',                  route: '/screens/mosque' },
  { id: 'tracker', label: 'Tracker',  icon: 'star-four-points-outline', route: '/screens/tracker' },
  { id: 'cal',     label: 'Calendar', icon: 'calendar-blank-outline',  route: '/screens/calender' },
  { id: 'makkah',  label: 'Makkah',   icon: 'video-outline',           route: '/screens/makkah_live' },
  { id: 'more',    label: 'More',     icon: 'dots-horizontal',         route: '/screens/features' },
];

const DAILY_DUAS = [
  {
    id: 'morning',
    title: 'Morning',
    icon: 'weather-sunset-up' as const,
    arabic: 'اللّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا',
    translation: 'O Allah, by You we enter the morning and evening.',
    gradColors: [C.teal0, C.teal2] as [string, string],
  },
  {
    id: 'evening',
    title: 'Evening',
    icon: 'weather-night' as const,
    arabic: 'اللّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا',
    translation: 'O Allah, by You we enter the evening and morning.',
    gradColors: [C.teal1, C.teal3] as [string, string],
  },
  {
    id: 'sleep',
    title: 'Before Sleep',
    icon: 'power-sleep' as const,
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    translation: 'In Your name, O Allah, I die and live.',
    gradColors: [C.teal2, C.teal4] as [string, string],
  },
  {
    id: 'wakeup',
    title: 'After Waking',
    icon: 'weather-sunset' as const,
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا',
    translation: 'Praise be to Allah who gave us life after death.',
    gradColors: [C.teal0, C.teal3] as [string, string],
  },
];

interface HadithEntry {
  info: string;
  by: string;
  text: string;
  bookName: string;
  volumeName: string;
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════════ */

const toMins = (t24: string) => {
  if (!t24) return -1;
  const [h, m] = t24.split(':').map(Number);
  return h * 60 + m;
};

const fmt12 = (t24: string) => {
  if (!t24) return '--:--';
  const [hStr, min] = t24.split(':');
  let h = parseInt(hStr, 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ap}`;
};

const countdown = (t24: string) => {
  if (!t24) return '';
  const now = new Date();
  const [th, tm] = t24.split(':').map(Number);
  const tgt = new Date();
  tgt.setHours(th, tm, 0, 0);
  if (tgt <= now) tgt.setDate(tgt.getDate() + 1);
  const ms = tgt.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
};

// 🔥 Optimized O(1) Hadith selector to prevent UI blocking
const getHadithForToday = (): HadithEntry | null => {
  try {
    const data = sahihBukhariData as any[];
    if (!data?.length) return null;
    
    const totalVolumes = data.length;
    const doy = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    
    const vol = data[doy % totalVolumes];
    if (!vol?.books?.length) return null;
    
    const book = vol.books[doy % vol.books.length] || vol.books[0];
    if (!book?.hadiths?.length) return null;
    
    const hadith = book.hadiths[doy % book.hadiths.length] || book.hadiths[0];
    
    return { ...hadith, bookName: book.name, volumeName: vol.name };
  } catch (error) {
    console.error('Failed to parse Hadith:', error);
    return null;
  }
};

/* ═══════════════════════════════════════════════════════════════════
   MICRO-COMPONENTS
════════════════════════════════════════════════════════════════════ */

const PressScale: React.FC<{
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  activeScale?: number;
}> = ({ onPress, style, children, activeScale = 0.96 }) => {
  const sv = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(sv, { toValue: activeScale, useNativeDriver: true, speed: 80, bounciness: 0 }).start();

  const pressOut = () =>
    Animated.spring(sv, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 7 }).start();

  return (
    <Animated.View style={[style, { transform: [{ scale: sv }] }]}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

const GoldDivider: React.FC<{ label: string }> = ({ label }) => (
  <View style={gd.row}>
    <View style={gd.line} />
    <View style={gd.pill}>
      <Text style={gd.pillTxt}>{label}</Text>
    </View>
    <View style={gd.line} />
  </View>
);

const gd = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: PAD, marginBottom: rs(16), marginTop: rs(8) },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2, backgroundColor: C.inkFaint },
  pill: { backgroundColor: C.teal1, paddingHorizontal: rs(14), paddingVertical: rs(5), borderRadius: rs(24), marginHorizontal: rs(10) },
  pillTxt: { color: C.white, fontSize: clamp(rs(10), 9, 13), fontWeight: '800', letterSpacing: 1.4 },
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════════════════════════ */

export default function HomeScreen() {
  const router = useRouter();
  const { width: dynamicWidth } = useWindowDimensions();

  /* ── State ── */
  const [loading, setLoading]         = useState(true);
  const [locationName, setLocation]   = useState('Detecting…');
  const [timings, setTimings]         = useState<Record<string, string> | null>(null);
  const [hijriDate, setHijriDate]     = useState('');
  const [nextPrayer, setNextPrayer]   = useState({ name: 'Fajr', time: '' });
  const [countdown2next, setC2N]      = useState('');
  const [sehriEnd, setSehriEnd]       = useState('');
  const [iftarStart, setIftarStart]   = useState('');
  const [hadith, setHadith]           = useState<HadithEntry | null>(null);
  const [prayerSchool]                = useState(1);
  const [locationDenied, setLocDenied]= useState(false);

  /* ── Animations ── */
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(18)).current;

  const runEntrance = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, [fadeIn, slideY]);

  /* ── Load prayer data (with Crash Safety) ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let city = 'Mumbai', country = 'India';

        if (status === 'granted') {
          try {
            // Added 5-second timeout and balanced accuracy for rapid response
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            try {
              const geo = await Location.reverseGeocodeAsync(pos.coords);
              if (geo.length) {
                city    = geo[0].city || geo[0].district || city;
                country = geo[0].country || country;
                if (alive) setLocation(city);
              }
            } catch (geoErr) {
              console.warn('[Location] Reverse geocode timeout/fail:', geoErr);
              if (alive) setLocation('Location Found'); // Graceful degradation
            }

          } catch (posErr) {
            console.warn('[Location] Position fetch timeout/fail:', posErr);
            if (alive) setLocation('Mumbai'); // Fallback
          }
        } else {
          if (alive) {
            setLocDenied(true);
            setLocation('Mumbai'); // Fallback
          }
        }

        const res = await fetchTimingsFromBackend(city, country, prayerSchool);
        if (res && alive) {
          res.timings && setTimings(res.timings);
          if (res.hijri) {
            const { day, month, year } = res.hijri;
            setHijriDate(`${day} ${month.en} ${year} AH`);
          }
        }
      } catch (e) {
        console.error('[HomeScreen] load error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [prayerSchool]);

  useEffect(() => { if (!loading) runEntrance(); }, [loading, runEntrance]);

  useEffect(() => {
    setHadith(getHadithForToday());
  }, []);

  /* ── Tick: next prayer + countdowns (With AppState Pause) ── */
  const tick = useCallback(() => {
    if (!timings) return;
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    let next = { name: 'Fajr', time: timings['Fajr'] || '' };
    for (const name of PRAYER_NAMES) {
      const t = timings[name];
      if (t && toMins(t) > nowMins) { next = { name, time: t }; break; }
    }
    setNextPrayer(next);
    setC2N(countdown(next.time));
    setSehriEnd(timings['Imsak'] ? countdown(timings['Imsak']) : '');
    setIftarStart(timings['Maghrib'] ? countdown(timings['Maghrib']) : '');
  }, [timings]);

  useEffect(() => {
    tick(); // Initial call
    let intervalId: ReturnType<typeof setInterval> | null = setInterval(tick, 30_000);

    // Pause ticking when app is backgrounded to save battery
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        tick(); 
        if (!intervalId) intervalId = setInterval(tick, 30_000);
      } else {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      subscription.remove();
    };
  }, [tick]);

  if (loading) {
    return (
      <View style={ls.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.teal1} />
        <LinearGradient colors={[C.teal0, C.teal1]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={C.goldMid} />
        <Text style={ls.txt}>Loading prayer times…</Text>
      </View>
    );
  }

  // Dynamic grid setup to prevent Layout Thrashing on split-screen
  const dynamicCols = dynamicWidth < 360 ? 3 : dynamicWidth >= 768 ? 5 : 4;
  const dynamicCellW = (dynamicWidth - PAD * 2) / dynamicCols;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.teal0} />

      <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideY }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" overScrollMode="never">

          {/* ═══════════════ HERO ═══════════════ */}
          <View style={s.hero}>
            <LinearGradient colors={[C.teal0, C.teal1, C.teal2]} start={{ x: 0.0, y: 0.0 }} end={{ x: 1.0, y: 1.0 }} style={StyleSheet.absoluteFill} />

            {[rs(280), rs(200), rs(140)].map((sz, i) => (
              <View key={i} style={{ position: 'absolute', top: -sz * 0.28, right: -sz * 0.28, width: sz, height: sz, borderRadius: sz / 2, borderWidth: 1, borderColor: i === 1 ? 'rgba(212,148,42,0.12)' : 'rgba(77,168,158,0.10)' }} />
            ))}

            <LinearGradient colors={['transparent', C.goldMid + '99', C.goldLt + 'AA', C.goldMid + '66', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rs(2) }} />

            <View style={s.heroHeader}>
              <View style={s.heroHeaderLeft}>
                <View style={s.greetRow}>
                  <Text style={s.greetTxt}>{greeting()}</Text>
                </View>
                <Text style={s.appName}>Qalb-E-Rooh</Text>
              </View>

              <View style={s.heroHeaderRight}>
                {locationDenied ? (
                  <Pressable onPress={() => Location.requestForegroundPermissionsAsync()} style={s.locAlert}>
                    <MaterialCommunityIcons name="map-marker-off" size={rs(13)} color={C.coral} />
                    <Text style={s.locAlertTxt}>Enable location</Text>
                  </Pressable>
                ) : (
                  <View style={s.locRow}>
                    <MaterialCommunityIcons name="map-marker" size={rs(12)} color={C.goldMid} />
                    <Text style={s.locTxt} numberOfLines={1}>{locationName}</Text>
                  </View>
                )}
                {!!hijriDate && (
                  <View style={s.hijriPill}>
                    <Text style={s.hijriTxt}>{hijriDate}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={s.verseWrap}>
              <Text style={s.verseAr}>أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</Text>
              <Text style={s.verseEn}>In the remembrance of Allah do hearts find rest.</Text>
              <Text style={s.verseRef}>Surah Ar-Ra'd · 13:28</Text>
            </View>

            <View style={s.nextPrayerCard}>
              <LinearGradient colors={[C.goldGlass, 'rgba(232,184,75,0.06)']} style={StyleSheet.absoluteFill} />
              <View style={s.npc_border} />

              <View style={s.npc_left}>
                <Text style={s.npc_label}>NEXT PRAYER</Text>
                <Text style={s.npc_name}>{nextPrayer.name}</Text>
                <Text style={s.npc_time}>{fmt12(nextPrayer.time)}</Text>
              </View>

              <View style={s.npc_divider} />

              <View style={s.npc_right}>
                <MaterialCommunityIcons name="clock-outline" size={rs(22)} color={C.goldMid} style={{ marginBottom: rs(4) }} />
                <Text style={s.npc_cdLabel}>STARTS IN</Text>
                <Text style={s.npc_cd}>{countdown2next || '--'}</Text>
              </View>
            </View>

            {(!!sehriEnd || !!iftarStart) && (
              <View style={s.ramadanRow}>
                {[
                  { label: 'Sehri ends',   val: fmt12(timings?.Imsak || ''),   cd: sehriEnd,   icon: 'weather-night' },
                  { label: 'Iftar starts', val: fmt12(timings?.Maghrib || ''), cd: iftarStart, icon: 'weather-sunset' },
                ].map((item, i) => (
                  <View key={i} style={s.ramCard}>
                    <MaterialCommunityIcons name={item.icon as any} size={rs(15)} color={C.tealLt} />
                    <Text style={s.ramLabel}>{item.label}</Text>
                    <Text style={s.ramTime}>{item.val}</Text>
                    {!!item.cd && <Text style={s.ramCd}>in {item.cd}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ═══════════════ PRAYER TIMES STRIP ═══════════════ */}
          <View style={s.prayerStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.prayerStripInner} snapToInterval={rs(92)} decelerationRate="fast">
              {ALL_PRAYERS.map(({ name, icon }) => {
                const rawTime = timings?.[name] || '';
                const isNext = name === nextPrayer.name;
                return (
                  <View key={name} style={[s.pCell, isNext && s.pCellActive]}>
                    {isNext && <LinearGradient colors={[C.teal1, C.teal2]} style={StyleSheet.absoluteFill} />}
                    <MaterialCommunityIcons name={icon as any} size={rs(20)} color={isNext ? C.goldMid : C.inkLight} />
                    <Text style={[s.pCellName, isNext && s.pCellNameActive]}>{name}</Text>
                    <Text style={[s.pCellTime, isNext && s.pCellTimeActive]}>{rawTime ? fmt12(rawTime) : '--:--'}</Text>
                    {isNext && <View style={s.pCellDot} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ═══════════════ QUICK ACTIONS GRID ═══════════════ */}
          <View style={s.section}>
            <GoldDivider label="FEATURES" />
            <View style={[s.grid, { paddingHorizontal: PAD }]}>
              {QUICK_ACTIONS.map((f) => (
                <PressScale
                  key={f.id}
                  onPress={() => router.push(f.route as any)}
                  style={{ width: dynamicCellW, alignItems: 'center', marginBottom: rs(18) }}
                >
                  <View style={s.gridIconWrap}>
                    <MaterialCommunityIcons name={f.icon as any} size={rs(28)} color={C.teal1} />
                  </View>
                  <Text style={s.gridLabel} numberOfLines={1}>{f.label}</Text>
                </PressScale>
              ))}
            </View>
          </View>

          {/* ═══════════════ DAILY DUAS ═══════════════ */}
          <View style={{ marginTop: rs(4) }}>
            <GoldDivider label="DAILY DUAS" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: rs(6) }} snapToInterval={rs(260) + rs(12)} decelerationRate="fast" pagingEnabled={false}>
              {DAILY_DUAS.map((dua, i) => (
                <PressScale key={dua.id} onPress={() => router.push('/screens/duas' as any)} style={s.duaCardWrap}>
                  <LinearGradient colors={dua.gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.duaCard}>
                    <LinearGradient colors={[C.goldMid + '70', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rs(2) }} />
                    <View style={s.duaPagRow}>
                      {DAILY_DUAS.map((_, j) => <View key={j} style={[s.duaPagDot, i === j && s.duaPagDotActive]} />)}
                    </View>
                    <View style={s.duaHeader}>
                      <MaterialCommunityIcons name={dua.icon} size={rs(16)} color={C.goldMid} />
                      <Text style={s.duaTitle}>{dua.title}</Text>
                    </View>
                    <Text style={s.duaArabic} numberOfLines={3}>{dua.arabic}</Text>
                    <Text style={s.duaTrans} numberOfLines={3}>{dua.translation}</Text>
                    <View style={s.duaReadMore}>
                      <Text style={s.duaReadMoreTxt}>View full dua</Text>
                      <Feather name="arrow-right" size={rs(11)} color={C.goldLt} />
                    </View>
                  </LinearGradient>
                </PressScale>
              ))}
            </ScrollView>
          </View>

          {/* ═══════════════ HADITH OF THE DAY ═══════════════ */}
          <View style={{ marginTop: rs(8), marginBottom: rs(20) }}>
            <GoldDivider label="HADITH OF THE DAY" />
            <View style={s.hadithWrap}>
              {[
                { top: 0, left: 0, bT: 2, bL: 2 },
                { top: 0, right: 0, bT: 2, bR: 2 },
                { bottom: 0, left: 0, bB: 2, bL: 2 },
                { bottom: 0, right: 0, bB: 2, bR: 2 },
              ].map((pos, i) => (
                <View key={i} style={[ s.corner, { top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, borderTopWidth: (pos as any).bT, borderBottomWidth: (pos as any).bB, borderLeftWidth: (pos as any).bL, borderRightWidth: (pos as any).bR }]} />
              ))}

              <MaterialCommunityIcons name="format-quote-open" size={rs(32)} color={C.teal1} style={{ opacity: 0.15, alignSelf: 'center', marginBottom: rs(4) }} />

              <Text style={s.hadithText} numberOfLines={4}>{hadith ? `"${hadith.text.trim()}"` : 'Loading…'}</Text>

              {hadith && (
                <>
                  <View style={s.hadithDivider} />
                  <Text style={s.hadithAuthor}>{hadith.by}</Text>
                  <Text style={s.hadithSource}>{hadith.volumeName} · {hadith.bookName}</Text>
                  <Text style={s.hadithRef}>{hadith.info}</Text>

                  <PressScale onPress={() => router.push('/screens/hadith' as any)} style={{ alignSelf: 'center', marginTop: rs(14) }}>
                    <LinearGradient colors={[C.teal2, C.teal1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.readMoreBtn}>
                      <Text style={s.readMoreTxt}>Read Full Hadith</Text>
                      <Feather name="arrow-right" size={rs(12)} color={C.white} />
                    </LinearGradient>
                  </PressScale>
                </>
              )}
            </View>
          </View>

          <View style={{ height: rs(80) }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════════════ */
const softShadow = Platform.select({
  ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10 },
  android: { elevation: 4 },
});

const heroShadow = Platform.select({
  ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 22 },
  android: { elevation: 14 },
});

const ls = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.teal1 },
  txt: { color: C.tealLt, fontSize: rs(13), marginTop: rs(14), letterSpacing: 0.4 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: rs(10) },

  hero: { overflow: 'hidden', paddingHorizontal: PAD, paddingBottom: rs(22), marginBottom: rs(0), ...heroShadow },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: rs(14), marginBottom: rs(20) },
  heroHeaderLeft: { flex: 1, marginRight: rs(12) },
  heroHeaderRight: { alignItems: 'flex-end' },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(4) },
  greetTxt: { color: C.tealLt, fontSize: clamp(rs(11), 10, 14), fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  appName: { color: C.white, fontSize: clamp(rs(26), 22, 34), fontWeight: '800', letterSpacing: -0.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginBottom: rs(8) },
  locTxt: { color: C.tealLt, fontSize: clamp(rs(12), 10, 14), fontWeight: '500', maxWidth: rs(120) },
  locAlert: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: 'rgba(224,112,96,0.15)', borderWidth: 1, borderColor: 'rgba(224,112,96,0.30)', borderRadius: rs(12), paddingHorizontal: rs(8), paddingVertical: rs(4), marginBottom: rs(8) },
  locAlertTxt: { color: C.coral, fontSize: rs(10), fontWeight: '700' },
  hijriPill: { backgroundColor: C.goldGlass, borderWidth: 1, borderColor: C.goldBorder, borderRadius: rs(20), paddingHorizontal: rs(10), paddingVertical: rs(5) },
  hijriTxt: { color: C.goldLt, fontSize: clamp(rs(8), 7, 11), fontWeight: '700', letterSpacing: 0.3 },

  verseWrap: { alignItems: 'center', marginBottom: rs(20) },
  verseAr: { color: C.white, fontSize: clamp(rs(20), 17, 28), textAlign: 'center', lineHeight: clamp(rs(36), 30, 50), writingDirection: 'rtl', marginBottom: rs(8), fontFamily: Platform.OS === 'ios' ? 'GeezaPro' : 'serif' },
  verseEn: { color: C.tealLt, fontSize: clamp(rs(12), 11, 15), textAlign: 'center', letterSpacing: 0.3, lineHeight: rs(18), fontStyle: 'italic' },
  verseRef: { color: C.goldMid + 'AA', fontSize: clamp(rs(10), 9, 12), textAlign: 'center', marginTop: rs(4), letterSpacing: 0.8 },

  nextPrayerCard: { flexDirection: 'row', alignItems: 'center', borderRadius: rs(20), borderWidth: 1.5, borderColor: C.goldBorder, overflow: 'hidden', padding: rs(18), marginBottom: rs(14) },
  npc_border: { position: 'absolute', bottom: 0, left: '50%', width: rs(40), height: rs(3), borderRadius: rs(2), backgroundColor: C.goldMid, marginLeft: -rs(20) },
  npc_left: { flex: 1 },
  npc_label: { color: C.goldMid + 'BB', fontSize: clamp(rs(9), 8, 11), fontWeight: '800', letterSpacing: 1.6, marginBottom: rs(4) },
  npc_name: { color: C.white, fontSize: clamp(rs(28), 24, 38), fontWeight: '800', letterSpacing: -0.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  npc_time: { color: C.goldLt, fontSize: clamp(rs(16), 14, 22), fontWeight: '700', marginTop: rs(2) },
  npc_divider: { width: 1, height: rs(56), backgroundColor: C.goldBorder, marginHorizontal: rs(18) },
  npc_right: { alignItems: 'center' },
  npc_cdLabel: { color: C.tealLt, fontSize: clamp(rs(8), 7, 10), fontWeight: '700', letterSpacing: 1.2, marginBottom: rs(4) },
  npc_cd: { color: C.white, fontSize: clamp(rs(22), 18, 30), fontWeight: '800', letterSpacing: -0.5 },

  ramadanRow: { flexDirection: 'row', gap: rs(10) },
  ramCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.glassBrd, borderRadius: rs(14), padding: rs(12), alignItems: 'center', gap: rs(3) },
  ramLabel: { color: C.tealLt, fontSize: clamp(rs(9), 8, 11), fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  ramTime: { color: C.white, fontSize: clamp(rs(14), 12, 18), fontWeight: '800' },
  ramCd: { color: C.goldMid + 'BB', fontSize: clamp(rs(10), 9, 12), fontWeight: '500' },

  prayerStrip: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.tealFaint, ...softShadow },
  prayerStripInner: { paddingHorizontal: PAD, paddingVertical: rs(12), gap: rs(4) },
  pCell: { width: rs(88), alignItems: 'center', paddingVertical: rs(10), paddingHorizontal: rs(8), borderRadius: rs(14), borderWidth: 1, borderColor: C.tealFaint, marginRight: rs(8), gap: rs(3), overflow: 'hidden', backgroundColor: C.surfaceAlt },
  pCellActive: { borderColor: C.teal1, backgroundColor: C.teal1 },
  pCellName: { fontSize: clamp(rs(10), 9, 13), fontWeight: '700', color: C.inkLight, letterSpacing: 0.4 },
  pCellNameActive: { color: C.goldLt },
  pCellTime: { fontSize: clamp(rs(12), 11, 15), fontWeight: '800', color: C.ink },
  pCellTimeActive: { color: C.white },
  pCellDot: { position: 'absolute', bottom: 0, width: rs(20), height: rs(2), borderRadius: rs(1), backgroundColor: C.goldMid },

  section: { marginTop: rs(16) },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridIconWrap: { width: rs(58), height: rs(58), borderRadius: rs(18), backgroundColor: C.surface, borderWidth: 1, borderColor: `${C.teal1}14`, alignItems: 'center', justifyContent: 'center', marginBottom: rs(6), overflow: 'hidden', ...softShadow },
  gridLabel: { color: C.ink, fontSize: clamp(rs(11), 10, 13), fontWeight: '600', textAlign: 'center', letterSpacing: 0.1 },

  duaCardWrap: { marginRight: rs(12) },
  duaCard: { width: clamp(rs(260), 220, 320), height: rs(220), borderRadius: rs(20), padding: rs(18), overflow: 'hidden', justifyContent: 'space-between', ...heroShadow },
  duaPagRow: { position: 'absolute', top: rs(12), right: rs(14), flexDirection: 'row', gap: rs(4) },
  duaPagDot: { width: rs(5), height: rs(5), borderRadius: rs(3), backgroundColor: 'rgba(255,255,255,0.30)' },
  duaPagDotActive: { backgroundColor: C.goldMid, width: rs(14) },
  duaHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(7), marginBottom: rs(10) },
  duaTitle: { color: C.goldLt, fontSize: clamp(font(12), 10, 15), fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  duaArabic: { color: C.white, fontSize: clamp(rs(20), 17, 26), lineHeight: rs(28), textAlign: 'center', writingDirection: 'rtl', fontFamily: Platform.OS === 'ios' ? 'GeezaPro' : 'serif', marginBottom: rs(8) },
  duaTrans: { color: 'rgba(255,255,255,0.65)', fontSize: clamp(rs(11), 10, 13), lineHeight: rs(17), textAlign: 'center', fontStyle: 'italic', marginBottom: rs(10) },
  duaReadMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4) },
  duaReadMoreTxt: { color: C.goldLt, fontSize: clamp(rs(10), 9, 12), fontWeight: '700', letterSpacing: 0.6 },

  hadithWrap: { backgroundColor: C.surface, marginHorizontal: PAD, padding: rs(20), borderRadius: rs(20), borderWidth: 1, borderColor: `${C.teal1}12`, position: 'relative', ...softShadow },
  corner: { position: 'absolute', width: rs(18), height: rs(18), borderColor: C.goldMid, borderWidth: 0 },
  hadithText: { fontSize: clamp(rs(15), 13, 18), color: C.ink, textAlign: 'center', lineHeight: clamp(rs(24), 20, 30), fontStyle: 'italic', marginVertical: rs(10) },
  hadithDivider: { width: rs(36), height: rs(2), borderRadius: rs(1), backgroundColor: C.goldMid, alignSelf: 'center', opacity: 0.6, marginBottom: rs(12) },
  hadithAuthor: { fontSize: clamp(rs(13), 11, 16), fontWeight: '800', color: C.teal1, textAlign: 'center', marginBottom: rs(3) },
  hadithSource: { fontSize: clamp(rs(11), 10, 13), color: C.inkLight, textAlign: 'center', marginBottom: rs(2) },
  hadithRef: { fontSize: clamp(rs(10), 9, 12), color: C.teal5, fontWeight: '600', textAlign: 'center' },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(6), paddingHorizontal: rs(22), paddingVertical: rs(11), borderRadius: rs(24) },
  readMoreTxt: { color: C.white, fontSize: clamp(rs(12), 11, 14), fontWeight: '800', letterSpacing: 0.4 },
});