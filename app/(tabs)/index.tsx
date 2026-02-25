import {
  Feather,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import sahihBukhariData from '../../assets/data/sahih_bukhari.json';

/* ═══════════════════════════════════════════
   RESPONSIVE SCALE — fluid across all devices
═══════════════════════════════════════════ */
const { width: W, height: H } = Dimensions.get('window');
// Fluid scale: clamp tightly so large tablets don't over-scale
const BASE = 390;
const SCALE = Math.min(Math.max(W / BASE, 0.78), 1.30);
const rs  = (n: number) => Math.round(n * SCALE);
const rsp = (pct: number) => Math.round(W * pct); // % of screen width
const PAD = rs(20);

/* ═══════════════════════════════════════════
   DESIGN TOKENS — Sacred Luxury palette
   Teal #0A4A4A + gold + warm creams
═══════════════════════════════════════════ */
const C = {
  // Base surfaces
  bg:        '#EEF7F5',   // soft mint-white page background
  surface:   '#FFFFFF',
  surfaceAlt:'#F5FAF9',

  // Teal family (dark → light)
  teal0:     '#062626',   // deepest
  teal1:     '#0A4A4A',   // primary brand
  teal2:     '#0D5858',
  teal3:     '#136060',
  teal4:     '#1A7A70',
  teal5:     '#4BA89E',
  tealLt:    '#A8DDD8',

  // Gold family
  gold:      '#D4942A',
  goldMid:   '#E8B84B',
  goldLt:    '#F5D98A',
  goldPale:  '#FDF5E0',

  // Text
  ink:       '#072424',
  inkMid:    '#2E6060',
  inkLight:  '#6AABA5',
  inkFaint:  'rgba(7,36,36,0.35)',

  // Accents
  coral:     '#E07060',
  coralLt:   '#F5BEB6',

  // Glassy
  glass:     'rgba(255,255,255,0.12)',
  glassM:    'rgba(255,255,255,0.22)',
  glassBrd:  'rgba(255,255,255,0.20)',

  white:     '#FFFFFF',
  shadow:    '#041E1E',
};

/* ═══════════════════════════════════════════
   DATA SHAPES
═══════════════════════════════════════════ */
interface HadithEntry {
  info: string;
  by: string;
  text: string;
  bookName: string;
  volumeName: string;
}

const RAMADAN_DUAS = [
  {
    id: 'sehri',
    title: 'SUHOOR DUA',
    subtitle: 'Before Fasting',
    icon: 'weather-night' as const,
    arabic: 'نَوَيْتُ أَنْ أَصُومَ غَدًا لِلَّهِ تَعَالَى مِنْ شَهْرِ رَمَضَانَ',
    gradA: '#0A4A4A',
    gradB: '#062626',
  },
  {
    id: 'iftar',
    title: 'IFTAR DUA',
    subtitle: 'Breaking Fast',
    icon: 'weather-sunset' as const,
    arabic: 'اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    gradA: '#5C2A00',
    gradB: '#3A1800',
  },
  {
    id: 'ashra1',
    title: 'ASHRA-E-REHMAT',
    subtitle: 'First 10 Days',
    icon: 'heart-outline' as const,
    arabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ',
    gradA: '#1A4A2A',
    gradB: '#0A2A12',
  },
];

const TARAWEEH_TASBEEH ="سُبْحَانَ ذِي الْمُلْكِ وَالْمَلَكُوتِ، سُبْحَانَ ذِي الْعِزَّةِ وَالْعَظَمَةِ وَالْهَيْبَةِ وَالْقُدْرَةِ وَالْكِبْرِيَاءِ وَالْجَبَرُوتِ، سُبْحَانَ الْمَلِكِ الْحَيِّ الَّذِي لَا يَنَامُ وَلَا يَمُوتُ، سُبُّوحٌ قُدُّوسٌ رَبُّنَا وَرَبُّ الْمَلَائِكَةِ وَالرُّوحِ، اللَّهُمَّ أَجِرْنَا مِنَ النَّارِ يَا مُجِيرُ يَا مُجِيرُ يَا مُجِيرُ."

const TARAWEEH_STAGES = [4, 8, 12, 16, 20];

const MAIN_FEATURES = [
  { id: 1, name: 'Khatam',   icon: 'check-decagram-outline',    route: '../../screens/khatam'      },
  { id: 2, name: 'Zakat',    icon: 'hand-coin-outline',         route: '../../screens/zakat'       },
  { id: 3, name: 'Calendar', icon: 'calendar-blank-outline',    route: '../../screens/calender'    },
  { id: 4, name: 'Makkah',   icon: 'video-outline',             route: '../../screens/makkah_live' },
  { id: 5, name: 'Duas',     icon: 'hand-heart-outline',        route: '../../screens/duas'        },
  { id: 6, name: 'Mosques',  icon: 'mosque',                    route: '../../screens/mosque'      },
  { id: 7, name: 'Prayer Tracker',    icon: 'star-four-points-outline',  route: '../../screens/tracker'       },
  { id: 8, name: 'More',     icon: 'dots-horizontal',           route: '../../screens/features'    },
];

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
const formatTime12H = (t: string) => {
  if (!t) return '--:--';
  const [hStr, min] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${min} ${ampm}`;
};

const calcCountdown = (t24: string) => {
  if (!t24) return '--h --m';
  const now = new Date();
  const [th, tm] = t24.split(':').map(Number);
  const target = new Date();
  target.setHours(th, tm, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  const ms = target.getTime() - now.getTime();
  const h  = Math.floor(ms / 3_600_000);
  const m  = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
};

/* ═══════════════════════════════════════════
   MICRO-COMPONENTS
═══════════════════════════════════════════ */

/* Islamic 8-pointed star ornament */
const StarOrn: React.FC<{ color: string; size?: number }> = ({ color, size = rs(14) }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: size * 0.6, height: size * 0.6, borderWidth: 1, borderColor: color }} />
    <View style={{ position: 'absolute', width: size * 0.6, height: size * 0.6, borderWidth: 1, borderColor: color, transform: [{ rotate: '45deg' }] }} />
  </View>
);

/* Pressable with spring scale */
const SpringPress: React.FC<{
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
}> = ({ onPress, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={press} onPressOut={release}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

/* Decorative horizontal section divider */
const Divider: React.FC<{ label: string }> = ({ label }) => (
  <View style={div.row}>
    <StarOrn color={C.goldMid} size={rs(11)} />
    <View style={div.line} />
    <View style={div.badge}>
      <Text style={div.badgeTxt}>{label}</Text>
    </View>
    <View style={div.line} />
    <StarOrn color={C.goldMid} size={rs(11)} />
  </View>
);
const div = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: PAD, marginBottom: rs(18), marginTop: rs(4) },
  line:     { flex: 1, height: 1, backgroundColor: `${C.teal1}20`, marginHorizontal: rs(8) },
  badge:    { backgroundColor: C.teal1, paddingHorizontal: rs(14), paddingVertical: rs(5), borderRadius: rs(20) },
  badgeTxt: { color: C.white, fontSize: rs(10), fontWeight: '800', letterSpacing: 1.2 },
});

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function HomeScreen() {
  const router = useRouter();

  const [loading, setLoading]             = useState(true);
  const [locationName, setLocationName]   = useState('Detecting…');
  const [timings, setTimings]             = useState<any>(null);
  const [hijriDate, setHijriDate]         = useState('');
  const [nextPrayer, setNextPrayer]       = useState({ name: 'Fajr', time: '', countdown: '' });
  const [sehriCountdown, setSehriC]       = useState('');
  const [iftarCountdown, setIftarC]       = useState('');
  const [taraweeh, setTaraweeh]           = useState(0);
  const [dailyHadith, setDailyHadith]     = useState<HadithEntry | null>(null);

  /* Fade-in on mount */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loading]);

  /* Location + prayer times */
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLocationName('Permission Denied'); setLoading(false); return; }

        const loc  = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;
        const geo  = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo.length) setLocationName(geo[0].city || geo[0].district || 'Your City');

        const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        const res     = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=1`);
        const data    = await res.json();

        if (data.code === 200) {
          setTimings(data.data.timings);
          const hd = data.data.date.hijri;
          let day  = parseInt(hd.day, 10) - 1;
          let month = hd.month.en;
          let year  = parseInt(hd.year, 10);
          if (day === 0) {
            const months = ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab',"Sha'ban",'Ramadan','Shawwal',"Dhu al-Qi'dah",'Dhu al-Hijjah'];
            let mi = months.findIndex(m => m === month) - 1;
            if (mi < 0) { mi = 11; year -= 1; }
            month = months[mi]; day = 30;
          }
          setHijriDate(`${day} ${month} ${year}`);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  /* Hadith of the day */
  useEffect(() => {
    try {
      const all: HadithEntry[] = [];
      (sahihBukhariData as any[]).forEach(vol =>
        vol.books.forEach((book: any) =>
          book.hadiths.forEach((h: any) => all.push({ ...h, bookName: book.name, volumeName: vol.name }))
        )
      );
      if (all.length) {
        const now = new Date();
        const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        setDailyHadith(all[day % all.length]);
      }
    } catch (e) { console.error(e); }
  }, []);

  /* Countdown tick */
  const tick = useCallback(() => {
    if (!timings) return;
    const prayers = [
      { name: 'Fajr', time: timings.Fajr }, { name: 'Dhuhr', time: timings.Dhuhr },
      { name: 'Asr', time: timings.Asr },   { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isha', time: timings.Isha },
    ];
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    let next  = prayers[0];
    for (const p of prayers) {
      const [h, m] = p.time.split(':').map(Number);
      if (h * 60 + m > cur) { next = p; break; }
    }
    setNextPrayer({ name: next.name, time: next.time, countdown: calcCountdown(next.time) });
    if (timings.Imsak)   setSehriC(calcCountdown(timings.Imsak));
    if (timings.Maghrib) setIftarC(calcCountdown(timings.Maghrib));
  }, [timings]);

  useEffect(() => { tick(); const id = setInterval(tick, 60_000); return () => clearInterval(id); }, [tick]);

  /* ─── LOADING SCREEN ─── */
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.teal1, justifyContent: 'center', alignItems: 'center' }}>
    
        <ActivityIndicator size="large" color={C.goldMid} style={{ marginTop: rs(24) }} />
        <Text style={{ color: C.tealLt, fontSize: rs(13), marginTop: rs(12), letterSpacing: 0.5 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* ══════════════════════════════
              HEADER — full cinematic hero
          ══════════════════════════════ */}
          <View style={s.heroWrap}>
            <LinearGradient
              colors={[C.teal0, C.teal1, C.teal3]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Geometric ring ornaments */}
            {[rs(260), rs(190), rs(130)].map((sz, i) => (
              <View key={i} style={{
                position: 'absolute', top: -sz * 0.3, right: -sz * 0.3,
                width: sz, height: sz, borderRadius: sz / 2,
                borderWidth: 1,
                borderColor: i === 0
                  ? 'rgba(77,168,158,0.12)'
                  : i === 1 ? 'rgba(212,148,42,0.14)' : 'rgba(255,255,255,0.10)',
              }} />
            ))}

            {/* Gold shimmer bar at top */}
            <LinearGradient
              colors={['transparent', C.goldMid + '88', C.goldLt + '99', C.goldMid + '55', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rs(2.5) }}
            />

            {/* App name row */}
            <View style={s.heroTop}>
              <View>
                <Text style={s.appName}>Qalb-E-Rooh</Text>
                <View style={s.locRow}>
                  <MaterialCommunityIcons name="map-marker" size={rs(13)} color={C.goldMid} />
                  <Text style={s.locTxt}>{locationName}</Text>
                </View>
              </View>
              <View style={s.heroRight}>
                <View style={s.hijriPill}>
                  <StarOrn color={C.goldMid} size={rs(9)} />
                  <Text style={s.hijriTxt}>{hijriDate}</Text>
                </View>
              </View>
            </View>

            {/* Welcome phrase */}
            <View style={s.heroMid}>
              <Text style={s.heroArabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
              <Text style={s.heroTagline}>Guiding Heart & Soul</Text>
            </View>

            {/* ── PRAYER TIME CARDS ── */}
            <View style={s.prayerRow}>
              {[
                { label: 'Sehri Ends',     val: formatTime12H(timings?.Imsak),   sub: `Ends in ${sehriCountdown}`,   icon: 'weather-night' },
                { label: `Next: ${nextPrayer.name}`, val: formatTime12H(nextPrayer.time), sub: `In ${nextPrayer.countdown}`, icon: 'clock-outline', featured: true },
                { label: 'Iftar Starts',   val: formatTime12H(timings?.Maghrib), sub: `Starts in ${iftarCountdown}`, icon: 'weather-sunset' },
              ].map((card, i) => (
                <View key={i} style={[s.pCard, card.featured && s.pCardFeatured]}>
                  {card.featured && (
                    <LinearGradient
                      colors={[C.goldMid + '22', C.goldMid + '08']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <MaterialCommunityIcons
                    name={card.icon as any}
                    size={rs(16)}
                    color={card.featured ? C.goldMid : C.tealLt}
                  />
                  <Text style={[s.pCardLabel, card.featured && { color: C.goldLt }]}>{card.label}</Text>
                  <Text style={[s.pCardVal, card.featured && { color: C.goldMid }]}>{card.val}</Text>
                  <Text style={[s.pCardSub, card.featured && { color: C.goldLt + 'CC' }]}>{card.sub}</Text>
                  {card.featured && (
                    <View style={s.pCardDot} />
                  )}
                </View>
              ))}
            </View>

            {/* Ramadan Calendar quick-link */}
            <SpringPress
              onPress={() => router.push('../../screens/Ramadantimings' as any)}
              style={s.heroLink}
            >
              <View style={s.heroLinkInner}>
                <View style={s.heroLinkIconWrap}>
                  <MaterialCommunityIcons name="calendar-month" size={rs(20)} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroLinkTitle}>Mahe Ramadan Calendar</Text>
                  <Text style={s.heroLinkSub}>Full ramadan schedule</Text>
                </View>
                <View style={s.heroLinkArrow}>
                  <Feather name="arrow-right" size={rs(14)} color={C.teal1} />
                </View>
              </View>
            </SpringPress>
          </View>

          {/* ══════════════════════════════
              FEATURES GRID
          ══════════════════════════════ */}
          <View style={s.section}>
            <Divider label="FEATURES" />
            <View style={s.featGrid}>
              {MAIN_FEATURES.map((f) => (
                <SpringPress key={f.id} onPress={() => router.push(f.route as any)} style={s.featItemWrap}>
                  <View style={s.featItem}>
                    <View style={s.featIconWrap}>
                      {/* Subtle gradient bg inside icon */}
                      <LinearGradient
                        colors={[`${C.teal1}18`, `${C.teal1}06`]}
                        style={StyleSheet.absoluteFill}
                      />
                      <MaterialCommunityIcons name={f.icon as any} size={rs(26)} color={C.teal1} />
                    </View>
                    <Text style={s.featLabel}>{f.name}</Text>
                  </View>
                </SpringPress>
              ))}
            </View>
          </View>

          {/* ══════════════════════════════
              RAMADAN DUAS — horizontal
          ══════════════════════════════ */}
          <View style={{ marginTop: rs(4) }}>
            <Divider label="RAMADAN DUAS" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: rs(6) }}
            >
              {RAMADAN_DUAS.map((dua) => (
                <SpringPress key={dua.id} onPress={() => {}} style={s.duaCardWrap}>
                  <LinearGradient
                    colors={[dua.gradA, dua.gradB]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.duaCard}
                  >
                    {/* Gold shimmer top */}
                    <LinearGradient
                      colors={[C.goldMid + '60', 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rs(2) }}
                    />
                    {/* Bg watermark */}
                    <MaterialCommunityIcons
                      name="mosque" size={rs(100)} color={C.white}
                      style={{ position: 'absolute', bottom: -rs(14), right: -rs(14), opacity: 0.05 }}
                    />
                    {/* Badge */}
                    <View style={s.duaBadge}>
                      <MaterialCommunityIcons name={dua.icon} size={rs(12)} color={C.goldMid} style={{ marginRight: rs(5) }} />
                      <Text style={s.duaBadgeTxt}>{dua.title}</Text>
                    </View>
                    <Text style={s.duaSub}>{dua.subtitle}</Text>
                    <Text style={s.duaArabic}>{dua.arabic}</Text>
                  </LinearGradient>
                </SpringPress>
              ))}
            </ScrollView>

            {/* Nav link */}
            <SpringPress
              onPress={() => router.push('../../screens/ramadanduas' as any)}
              style={s.navLinkWrap}
            >
              <View style={s.navLink}>
                <View style={s.navLinkIcon}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={rs(20)} color={C.teal1} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.navLinkTitle}>Mahe Ramadan Dua</Text>
                  <Text style={s.navLinkSub}>All duas for every day</Text>
                </View>
                <View style={s.navLinkChev}>
                  <Feather name="chevron-right" size={rs(18)} color={C.teal4} />
                </View>
              </View>
            </SpringPress>
          </View>

          {/* ══════════════════════════════
              TARAWEEH SECTION
          ══════════════════════════════ */}
          <View style={{ marginTop: rs(8) }}>
            <Divider label="TARAWEEH" />

            {/* Tasbeeh card */}
            <View style={s.tasWrap}>
              <LinearGradient
                colors={[C.teal2, C.teal0]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.tasCard}
              >
                {/* decorative rings */}
                <View style={{ position: 'absolute', top: -rs(20), right: -rs(20), width: rs(80), height: rs(80), borderRadius: rs(40), borderWidth: 1, borderColor: 'rgba(212,148,42,0.18)' }} />
                <LinearGradient
                  colors={['transparent', C.goldMid + '70', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rs(2) }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: rs(12) }}>
                  <StarOrn color={C.goldMid} size={rs(14)} />
                  <Text style={s.tasTitleTxt}>Tasbeeh-e-Taraweeh</Text>
                </View>
                <Text style={s.tasArabic}>{TARAWEEH_TASBEEH}</Text>
              </LinearGradient>
            </View>

            {/* Tracker */}
            <View style={s.trackerWrap}>
              <View style={s.trackerHeader}>
                <Text style={s.trackerTitle}>Taraweeh Tracker</Text>
                <View style={s.trackerBadge}>
                  <Text style={s.trackerBadgeTxt}>{taraweeh} / 20</Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={s.progressBg}>
                <LinearGradient
                  colors={[C.goldMid, C.gold]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${(taraweeh / 20) * 100}%` }]}
                />
              </View>
              <View style={s.trackerRow}>
                {TARAWEEH_STAGES.map((num) => {
                  const done = taraweeh >= num;
                  return (
                    <SpringPress
                      key={num}
                      onPress={() => setTaraweeh(done && taraweeh === num ? num - 4 : num)}
                      style={s.trkBtnWrap}
                    >
                      <View style={[s.trkBtn, done && s.trkBtnDone]}>
                        {done ? (
                          <LinearGradient colors={[C.goldMid, C.gold]} style={StyleSheet.absoluteFill} />
                        ) : null}
                        <MaterialCommunityIcons
                          name={done ? 'check-circle' : 'weather-night'}
                          size={rs(20)}
                          color={done ? C.teal0 : C.teal5}
                        />
                        <Text style={[s.trkNum, done && s.trkNumDone]}>{num}</Text>
                      </View>
                    </SpringPress>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ══════════════════════════════
              HADITH OF THE DAY
          ══════════════════════════════ */}
          <View style={{ marginTop: rs(8) }}>
            <Divider label="HADITH OF THE DAY" />
            <View style={s.hadithCard}>
              {/* Corner ornaments */}
              {[[0, 0], [null, 0], [0, null], [null, null]].map(([top, left], i) => (
                <View key={i} style={[
                  s.corner,
                  top !== null ? { top: 0 } : { bottom: 0 },
                  left !== null ? { left: 0 } : { right: 0 },
                  top !== null && left !== null ? { borderTopWidth: 2, borderLeftWidth: 2 }
                  : top !== null ? { borderTopWidth: 2, borderRightWidth: 2 }
                  : left !== null ? { borderBottomWidth: 2, borderLeftWidth: 2 }
                  : { borderBottomWidth: 2, borderRightWidth: 2 },
                ]} />
              ))}

              <View style={s.hadithTop}>
                <MaterialCommunityIcons name="format-quote-open" size={rs(28)} color={C.teal1} style={{ opacity: 0.2 }} />
              </View>

              <Text style={s.hadithTxt} numberOfLines={7}>
                {dailyHadith ? `"${dailyHadith.text.trim()}"` : 'Loading…'}
              </Text>

              {dailyHadith && (
                <View style={s.hadithFooter}>
                  <View style={s.hadithDivLine} />
                  <Text style={s.hadithAuthor}>{dailyHadith.by}</Text>
                  <Text style={s.hadithSrc}>{dailyHadith.volumeName} · {dailyHadith.bookName}</Text>
                  <Text style={s.hadithRef}>{dailyHadith.info}</Text>
                  <SpringPress onPress={() => router.push('../../screens/hadith' as any)} style={{ alignSelf: 'center', marginTop: rs(14) }}>
                    <LinearGradient
                      colors={[C.teal2, C.teal1]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.readMoreBtn}
                    >
                      <Text style={s.readMoreTxt}>Read More</Text>
                      <Feather name="arrow-right" size={rs(12)} color={C.white} />
                    </LinearGradient>
                  </SpringPress>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: rs(50) }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════
   STYLES
═══════════════════════════════════════════ */
const cardShadow = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12 },
  android: { elevation: 5 },
});
const heavyShadow = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.50, shadowRadius: 18 },
  android: { elevation: 12 },
});

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: rs(20) },

  /* ── Hero / Header ── */
  heroWrap: {
    overflow: 'hidden',
    paddingHorizontal: PAD,
    paddingBottom: rs(24),
    marginBottom: rs(12),
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 24 },
      android: { elevation: 14 },
    }),
  },
  heroTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginTop:      rs(14),
    marginBottom:   rs(18),
  },
  appName: {
    fontSize:   rs(28),
    fontWeight: '800',
    color:      C.white,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(4), gap: rs(4) },
  locTxt: { color: C.tealLt, fontSize: rs(12), fontWeight: '500' },
  heroRight: { alignItems: 'flex-end' },
  hijriPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               rs(6),
    backgroundColor:   'rgba(232,184,75,0.15)',
    borderWidth:       1,
    borderColor:       'rgba(232,184,75,0.30)',
    borderRadius:      rs(20),
    paddingHorizontal: rs(10),
    paddingVertical:   rs(5),
  },
  hijriTxt: { color: C.goldLt, fontSize: rs(12), fontWeight: '700' },

  heroMid: { alignItems: 'center', marginBottom: rs(22) },
  heroArabic: {
    color:      C.white,
    fontSize:   rs(22),
    textAlign:  'center',
    lineHeight: rs(38),
    fontFamily: 'IndoPakQuran',
    writingDirection: 'rtl',
    marginBottom: rs(6),
  },
  heroTagline: {
    color:         C.tealLt,
    fontSize:      rs(12),
    letterSpacing: 2,
    fontWeight:    '500',
    textTransform: 'uppercase',
  },

  /* Prayer time cards */
  prayerRow: {
    flexDirection: 'row',
    gap:           rs(10),
    marginBottom:  rs(18),
  },
  pCard: {
    flex:            1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius:    rs(16),
    borderWidth:     1,
    borderColor:     C.glassBrd,
    padding:         rs(12),
    alignItems:      'center',
    gap:             rs(3),
    overflow:        'hidden',
  },
  pCardFeatured: {
    backgroundColor: 'rgba(232,184,75,0.10)',
    borderColor:     'rgba(232,184,75,0.35)',
    borderWidth:     1.5,
  },
  pCardLabel: {
    color:         C.tealLt,
    fontSize:      rs(9),
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign:     'center',
  },
  pCardVal: {
    color:      C.white,
    fontSize:   rs(16),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pCardSub: {
    color:      C.tealLt,
    fontSize:   rs(9),
    fontWeight: '500',
    textAlign:  'center',
  },
  pCardDot: {
    position:     'absolute',
    bottom:       0,
    left:         '50%',
    width:        rs(24),
    height:       rs(2),
    borderRadius: rs(1),
    backgroundColor: C.goldMid,
    marginLeft:   -rs(12),
  },

  /* Hero quick-link */
  heroLink: { overflow: 'hidden', borderRadius: rs(16) },
  heroLinkInner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.glassM,
    borderRadius:    rs(16),
    borderWidth:     1,
    borderColor:     C.glassBrd,
    padding:         rs(14),
    gap:             rs(12),
  },
  heroLinkIconWrap: {
    width:          rs(40),
    height:         rs(40),
    borderRadius:   rs(12),
    backgroundColor: 'rgba(232,184,75,0.18)',
    borderWidth:    1,
    borderColor:    'rgba(232,184,75,0.35)',
    alignItems:     'center',
    justifyContent: 'center',
  },
  heroLinkTitle: { color: C.white,  fontSize: rs(14), fontWeight: '700' },
  heroLinkSub:   { color: C.tealLt, fontSize: rs(11), marginTop: rs(1) },
  heroLinkArrow: {
    width:          rs(32),
    height:         rs(32),
    borderRadius:   rs(10),
    backgroundColor: C.goldMid,
    alignItems:     'center',
    justifyContent: 'center',
  },

  /* ── Section wrapper ── */
  section: { marginTop: rs(8) },

  /* ── Features grid ── */
  featGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    paddingHorizontal: PAD,
    marginBottom:   rs(8),
    gap:            rs(12),
  },
  featItemWrap: {
    width: (W - PAD * 2 - rs(12) * 3) / 4,
  },
  featItem: { alignItems: 'center', gap: rs(8) },
  featIconWrap: {
    width:          rs(58),
    height:         rs(58),
    borderRadius:   rs(18),
    backgroundColor: C.surface,
    borderWidth:    1,
    borderColor:    `${C.teal1}18`,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    ...cardShadow,
  },
  featLabel: {
    color:      C.ink,
    fontSize:   rs(11),
    fontWeight: '600',
    textAlign:  'center',
  },

  /* ── Dua cards ── */
  duaCardWrap: {
    marginRight: rs(14),
  },
  duaCard: {
    width:         rsp(0.68),
    minHeight:     rs(175),
    borderRadius:  rs(20),
    padding:       rs(20),
    overflow:      'hidden',
    justifyContent: 'space-between',
    ...heavyShadow,
  },
  duaBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    alignSelf:       'flex-start',
    backgroundColor: 'rgba(232,184,75,0.18)',
    borderWidth:     1,
    borderColor:     'rgba(232,184,75,0.30)',
    borderRadius:    rs(20),
    paddingHorizontal: rs(10),
    paddingVertical:   rs(4),
    marginBottom:    rs(4),
  },
  duaBadgeTxt: { color: C.goldLt, fontSize: rs(9), fontWeight: '900', letterSpacing: 1.2 },
  duaSub: { color: 'rgba(255,255,255,0.55)', fontSize: rs(11), marginBottom: rs(12) },
  duaArabic: {
    color:            C.white,
    fontSize:         rs(22),
    textAlign:        'center',
    lineHeight:       rs(44),
    fontFamily:       'IndoPakQuran',
    writingDirection: 'rtl',
  },

  /* Nav links */
  navLinkWrap: {
    marginHorizontal: PAD,
    marginTop:        rs(16),
    marginBottom:     rs(8),
    borderRadius:     rs(16),
    overflow:         'hidden',
    ...cardShadow,
  },
  navLink: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.surface,
    borderRadius:    rs(16),
    borderWidth:     1,
    borderColor:     `${C.teal1}14`,
    padding:         rs(14),
    gap:             rs(12),
  },
  navLinkIcon: {
    width:          rs(42),
    height:         rs(42),
    borderRadius:   rs(13),
    backgroundColor: C.surfaceAlt,
    borderWidth:    1,
    borderColor:    `${C.teal1}18`,
    alignItems:     'center',
    justifyContent: 'center',
  },
  navLinkTitle: { color: C.ink,    fontSize: rs(14), fontWeight: '700' },
  navLinkSub:   { color: C.inkLight, fontSize: rs(11), marginTop: rs(2) },
  navLinkChev: {
    width:          rs(32),
    height:         rs(32),
    borderRadius:   rs(10),
    backgroundColor: `${C.teal1}10`,
    borderWidth:    1,
    borderColor:    `${C.teal1}18`,
    alignItems:     'center',
    justifyContent: 'center',
  },

  /* ── Taraweeh ── */
  tasWrap: { marginHorizontal: PAD, marginBottom: rs(16) },
  tasCard: {
    borderRadius: rs(20),
    padding:      rs(18),
    overflow:     'hidden',
    ...heavyShadow,
  },
  tasTitleTxt: {
    color:         C.white,
    fontSize:      rs(12),
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginLeft:    rs(8),
  },
  tasArabic: {
    color:            C.white,
    fontSize:         rs(18),
    textAlign:        'center',
    lineHeight:       rs(38),
    fontFamily:       'IndoPakQuran',
    writingDirection: 'rtl',
    opacity:          0.92,
  },
  trackerWrap: {
    marginHorizontal: PAD,
    backgroundColor:  C.surface,
    borderRadius:     rs(20),
    padding:          rs(18),
    borderWidth:      1,
    borderColor:      `${C.teal1}12`,
    ...cardShadow,
  },
  trackerHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   rs(14),
  },
  trackerTitle: { fontSize: rs(14), fontWeight: '800', color: C.ink },
  trackerBadge: {
    backgroundColor:   `${C.goldMid}18`,
    borderRadius:      rs(20),
    borderWidth:       1,
    borderColor:       `${C.goldMid}38`,
    paddingHorizontal: rs(10),
    paddingVertical:   rs(4),
  },
  trackerBadgeTxt: { color: C.gold, fontSize: rs(12), fontWeight: '800' },
  progressBg: {
    height:       rs(5),
    borderRadius: rs(3),
    backgroundColor: `${C.teal1}14`,
    marginBottom:  rs(16),
    overflow:      'hidden',
  },
  progressFill: { height: '100%', borderRadius: rs(3) },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trkBtnWrap: { width: (W - PAD * 2 - rs(36) - rs(48)) / 5 },
  trkBtn: {
    borderRadius:   rs(16),
    paddingVertical: rs(12),
    alignItems:     'center',
    gap:            rs(5),
    backgroundColor: C.surfaceAlt,
    borderWidth:    1,
    borderColor:    `${C.teal1}14`,
    overflow:       'hidden',
  },
  trkBtnDone: { borderColor: C.goldMid + '50' },
  trkNum:     { fontSize: rs(13), fontWeight: '700', color: C.teal5 },
  trkNumDone: { color: C.teal0 },

  /* ── Hadith card ── */
  hadithCard: {
    backgroundColor: C.surface,
    marginHorizontal: PAD,
    padding:         rs(22),
    borderRadius:    rs(20),
    borderWidth:     1,
    borderColor:     `${C.teal1}12`,
    position:        'relative',
    ...cardShadow,
  },
  corner: {
    position:    'absolute',
    width:       rs(18),
    height:      rs(18),
    borderColor: C.goldMid,
  },
  hadithTop:   { alignItems: 'center', marginBottom: rs(4) },
  hadithTxt:   {
    fontSize:   rs(14),
    color:      C.ink,
    textAlign:  'center',
    lineHeight: rs(24),
    fontStyle:  'italic',
    marginVertical: rs(10),
  },
  hadithFooter: { alignItems: 'center' },
  hadithDivLine: {
    width:            rs(40),
    height:           rs(2),
    borderRadius:     rs(1),
    backgroundColor:  C.goldMid,
    marginBottom:     rs(12),
    opacity:          0.5,
  },
  hadithAuthor: { fontSize: rs(13), fontWeight: '800', color: C.teal1, marginBottom: rs(3) },
  hadithSrc:    { fontSize: rs(11), color: C.inkLight, marginBottom: rs(2) },
  hadithRef:    { fontSize: rs(10), color: C.teal5, fontWeight: '600' },
  readMoreBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               rs(6),
    paddingHorizontal: rs(20),
    paddingVertical:   rs(10),
    borderRadius:      rs(22),
  },
  readMoreTxt: { color: C.white, fontSize: rs(12), fontWeight: '800', letterSpacing: 0.5 },
});