import { Feather } from '@expo/vector-icons';
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// ✅ react-native-safe-area-context — NOT the deprecated RN SafeAreaView
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─────────────────────────────────────────
   RESPONSIVE SCALE
───────────────────────────────────────── */
const { width: W, height: H } = Dimensions.get('window');
const rs  = (n: number) => Math.round((n / 390) * W);
const rvs = (n: number) => Math.round((n / 844) * H);

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const C = {
  bg:         '#f5f1e8',
  bgCard:     '#ffffff',
  teal0:      '#071f1c',
  teal1:      '#0a2e2a',
  teal2:      '#0d3e39',
  teal3:      '#105047',
  emerald:    '#10b981',
  mintBg:     'rgba(13,62,57,0.09)',
  mintBorder: 'rgba(13,62,57,0.15)',
  cream:      '#f0e8d5',
  beige:      '#d9d0bb',
  textDark:   '#071f1c',
  textMid:    '#2d6b60',
  textSoft:   '#5a9e8f',
  textDim:    '#a0bdb8',
  white:      '#ffffff',
  shadow:     '#071f1c',
  divider:    'rgba(7,31,28,0.07)',
};

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface RamadanDay {
  hijriDay:      number;
  gregorianDate: string;   // "D-M-YYYY"
  displayDate:   string;   // "19 Feb"
  sehri:         string;
  iftar:         string;
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const fmt = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const subtractMins = (d: Date, m: number) =>
  new Date(d.getTime() - m * 60_000);

const todayKey = (() => {
  const d = new Date();
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
})();

const isPast = (key: string) => {
  const [d, m, y] = key.split('-').map(Number);
  const [td, tm, ty] = todayKey.split('-').map(Number);
  return new Date(y, m - 1, d) < new Date(ty, tm - 1, td);
};

/* ─────────────────────────────────────────
   MOON DECORATION (pure Views)
───────────────────────────────────────── */
const MoonDecor = ({ size }: { size: number }) => (
  <View style={{ width: size, height: size }}>
    <View style={{
      position: 'absolute', width: size, height: size,
      borderRadius: size / 2, backgroundColor: C.cream, opacity: 0.13,
    }} />
    <View style={{
      position: 'absolute', width: size * 0.77, height: size * 0.77,
      borderRadius: (size * 0.77) / 2, backgroundColor: C.teal2,
      top: size * 0.05, right: -size * 0.1,
    }} />
  </View>
);

/* ─────────────────────────────────────────
   ROW ITEM (memoised + stagger fade)
───────────────────────────────────────── */
const RowItem = React.memo(({
  item, index, isToday,
}: {
  item: RamadanDay; index: number; isToday: boolean;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 280,
      delay: Math.min(index * 14, 380),
      useNativeDriver: true,
    }).start();
  }, []);

  /* ── TODAY gradient card ── */
  if (isToday) {
    return (
      <Animated.View style={[s.rowWrap, { opacity }]}>
        <LinearGradient
          colors={[C.teal2, C.emerald]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.todayRow}
        >
          {/* Day bubble */}
          <View style={s.todayBubble}>
            <Text style={s.todayBubbleNum}>{String(item.hijriDay).padStart(2, '0')}</Text>
            <Text style={s.todayBubbleSub}>DAY</Text>
          </View>

          {/* Date + badge */}
          <View style={s.todayDateCol}>
            <Text style={s.todayDate}>{item.displayDate}</Text>
            <View style={s.todayBadge}>
              <Text style={s.todayBadgeTxt}>TODAY</Text>
            </View>
          </View>

          {/* Sehri */}
          <View style={s.todayTimeCol}>
            <Text style={s.todayTimeLbl}>🌙 Sehri</Text>
            <Text style={s.todayTimeVal}>{item.sehri}</Text>
          </View>

          {/* Iftar */}
          <View style={[s.todayTimeCol, { alignItems: 'flex-end' }]}>
            <Text style={s.todayTimeLbl}>☀️ Iftar</Text>
            <Text style={s.todayTimeVal}>{item.iftar}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  /* ── PAST / FUTURE card ── */
  const past = isPast(item.gregorianDate);

  return (
    <Animated.View style={[s.rowWrap, { opacity }]}>
      <View style={[s.row, past && s.rowPast]}>
        <View style={[s.dayPill, past && s.dayPillPast]}>
          <Text style={[s.dayNum, past && s.txtPast]}>
            {String(item.hijriDay).padStart(2, '0')}
          </Text>
        </View>

        <View style={s.dateCol}>
          <Text style={[s.dateText, past && s.txtPast]}>{item.displayDate}</Text>
        </View>

        <View style={s.timeCol}>
          <Text style={[s.timeVal, past && s.txtPast]}>{item.sehri}</Text>
        </View>

        <View style={[s.timeCol, { alignItems: 'flex-end' }]}>
          <Text style={[s.timeVal, past && s.txtPast]}>{item.iftar}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */
export default function RamadanTimetable() {
  const router = useRouter();
  const insets = useSafeAreaInsets();   // ✅ from react-native-safe-area-context
  const listRef = useRef<FlatList>(null);

  const [timetable,    setTimetable]    = useState<RamadanDay[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [locationName, setLocationName] = useState('Detecting…');

  /* ── Generate from adhan ── */
  const generate = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Permission denied');

      const loc    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = new Coordinates(loc.coords.latitude, loc.coords.longitude);

      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      if (place) {
        const city = place.city || place.subregion || place.region || 'Unknown';
        setLocationName(`${city}, ${place.country ?? ''}`);
      }

      const params  = CalculationMethod.Karachi();
      params.madhab = Madhab.Hanafi;

      const START = new Date(2026, 1, 19);
      const days: RamadanDay[] = [];

      for (let i = 0; i < 30; i++) {
        const date = new Date(START);
        date.setDate(START.getDate() + i);
        const pt = new PrayerTimes(coords, date, params);

        days.push({
          hijriDay:      i + 1,
          gregorianDate: `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
          displayDate:   date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          sehri:         fmt(subtractMins(pt.fajr, 10)),
          iftar:         fmt(pt.maghrib),
        });
      }

      setTimetable(days);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { generate(); }, [generate]);

  const todayIndex = useMemo(
    () => timetable.findIndex(d => d.gregorianDate === todayKey),
    [timetable],
  );
  const todayItem = todayIndex >= 0 ? timetable[todayIndex] : null;

  /* Auto-scroll to today */
  useEffect(() => {
    if (timetable.length && todayIndex >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: todayIndex, animated: true, viewOffset: rs(10),
        });
      }, 650);
    }
  }, [timetable, todayIndex]);

  /* ─────────── LOADING ─────────── */
  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <LinearGradient colors={[C.teal0, C.teal2]} style={StyleSheet.absoluteFill} />
        <MoonDecor size={rs(88)} />
        <ActivityIndicator size="large" color={C.cream} style={{ marginTop: rs(22) }} />
        <Text style={s.loadingTitle}>Calculating Local Timings</Text>
        <Text style={s.loadingSub}>{locationName}</Text>
      </View>
    );
  }

  /* ─────────── ERROR ─────────── */
  if (error) {
    return (
      <View style={[s.root, s.center, { backgroundColor: C.bg }]}>
        <Text style={{ fontSize: rs(50) }}>📍</Text>
        <Text style={s.errTitle}>Location Required</Text>
        <Text style={s.errSub}>
          Enable location permission to{'\n'}calculate accurate prayer times
        </Text>
        <TouchableOpacity style={s.retryBtn} onPress={generate} activeOpacity={0.8}>
          <Feather name="refresh-cw" size={rs(14)} color={C.teal0} />
          <Text style={s.retryTxt}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ─────────── MAIN ─────────── */
  return (
    <View style={s.root}>

      {/* ════ HEADER ════ */}
      <LinearGradient
        colors={[C.teal0, C.teal2]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        // ✅ paddingTop uses insets.top — no SafeAreaView wrapper needed
        style={[s.header, { paddingTop: insets.top + rs(10) }]}
      >
        {/* Decorative moon */}
        <View style={s.moonWrap} pointerEvents="none">
          <MoonDecor size={rs(115)} />
        </View>

        {/* Nav */}
        <View style={s.navRow}>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={rs(20)} color={C.cream} />
          </TouchableOpacity>

          <View style={s.navCenter}>
            <Text style={s.navTitle}>Ramadan 1447 H</Text>
            <Text style={s.navSub}>2026</Text>
          </View>

          <View style={{ width: rs(38) }} />
        </View>

        {/* Title */}
        <Text style={s.headerTitle}>Ramadan Timetable</Text>
        <Text style={s.headerSub}>{locationName} · Hanafi</Text>

        {/* Today hero card */}
        {todayItem && (
          <View style={s.heroCard}>
            <View>
              <Text style={s.heroLabel}>Today · Day {todayItem.hijriDay}</Text>
              <Text style={s.heroDate}>{todayItem.displayDate}</Text>
            </View>
            <View style={s.heroTimes}>
              <View style={s.heroTimeItem}>
                <Text style={s.heroTimeLbl}>🌙 Sehri</Text>
                <Text style={s.heroTimeVal}>{todayItem.sehri}</Text>
              </View>
              <View style={s.heroDiv} />
              <View style={s.heroTimeItem}>
                <Text style={s.heroTimeLbl}>☀️ Iftar</Text>
                <Text style={s.heroTimeVal}>{todayItem.iftar}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Progress bar */}
        {todayItem && (
          <View style={s.progressRow}>
            <View style={s.progressTrack}>
              <LinearGradient
                colors={[C.cream, C.emerald]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.progressFill, {
                  width: `${(todayItem.hijriDay / 30) * 100}%` as any,
                }]}
              />
            </View>
            <Text style={s.progressLbl}>{todayItem.hijriDay} / 30</Text>
          </View>
        )}
      </LinearGradient>

      {/* ════ COLUMN HEADERS ════ */}
      <View style={s.colRow}>
        <Text style={[s.colHead, { flex: 0.65 }]}>Day</Text>
        <Text style={[s.colHead, { flex: 1.3 }]}>Date</Text>
        <Text style={[s.colHead, { flex: 1, textAlign: 'center' }]}>Sehri</Text>
        <Text style={[s.colHead, { flex: 1, textAlign: 'right' }]}>Iftar</Text>
      </View>

      {/* ════ LIST ════ */}
      <FlatList
        ref={listRef}
        data={timetable}
        keyExtractor={item => item.gregorianDate}
        renderItem={({ item, index }) => (
          <RowItem item={item} index={index} isToday={item.gregorianDate === todayKey} />
        )}
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: insets.bottom + rs(30) },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={16}
        maxToRenderPerBatch={10}
        windowSize={8}
        removeClippedSubviews={Platform.OS === 'android'}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true }), 300);
        }}
      />
    </View>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const CARD_SHADOW = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 2 },
});

const TODAY_SHADOW = Platform.select({
  ios:     { shadowColor: C.teal2, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.38, shadowRadius: 14 },
  android: { elevation: 9 },
});

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  /* ─ Loading ─ */
  loadingTitle: { fontSize: rs(16), fontWeight: '700', color: C.cream, marginTop: rs(18) },
  loadingSub:   { fontSize: rs(13), color: C.cream, opacity: 0.48, marginTop: rs(6), fontWeight: '500' },

  /* ─ Error ─ */
  errTitle: { fontSize: rs(20), fontWeight: '800', color: C.teal0, marginTop: rs(16), marginBottom: rs(8) },
  errSub: {
    fontSize: rs(14), color: C.textSoft, textAlign: 'center',
    lineHeight: rs(22), paddingHorizontal: rs(40), marginBottom: rs(24),
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.cream,
    borderRadius: rs(20), paddingHorizontal: rs(24), paddingVertical: rs(13),
  },
  retryTxt: { fontSize: rs(14), fontWeight: '800', color: C.teal0, marginLeft: rs(8) },

  /* ─ Header ─ */
  header: {
    paddingHorizontal: rs(20),
    paddingBottom:     rs(22),
    overflow:          'hidden',
  },
  moonWrap: { position: 'absolute', top: -rs(16), right: -rs(14), opacity: 0.58 },

  /* Nav */
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: rs(16),
  },
  navBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(12),
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  navCenter: { alignItems: 'center' },
  navTitle: {
    fontSize: rs(12), fontWeight: '700', color: C.cream,
    opacity: 0.65, textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: rs(2),
  },
  navSub: { fontSize: rs(12), fontWeight: '600', color: C.cream, opacity: 0.4 },

  /* Header text */
  headerTitle: {
    fontSize: rs(26), fontWeight: '900', color: C.cream,
    letterSpacing: 0.3, marginBottom: rs(4),
  },
  headerSub: {
    fontSize: rs(13), color: C.cream, opacity: 0.5,
    fontWeight: '500', marginBottom: rs(18),
  },

  /* Hero card */
  heroCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: rs(18), borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: rs(16), marginBottom: rs(14),
  },
  heroLabel: {
    fontSize: rs(10), fontWeight: '700', color: C.cream,
    opacity: 0.55, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(4),
  },
  heroDate: { fontSize: rs(21), fontWeight: '900', color: C.cream },
  heroTimes: { flexDirection: 'row', alignItems: 'center' },
  heroTimeItem: { alignItems: 'center' },
  heroTimeLbl: { fontSize: rs(11), color: C.cream, opacity: 0.55, fontWeight: '600', marginBottom: rs(4) },
  heroTimeVal: { fontSize: rs(18), fontWeight: '800', color: C.cream, fontVariant: ['tabular-nums'] },
  heroDiv: {
    width: 1, height: rs(32),
    backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: rs(18),
  },

  /* Progress */
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressTrack: {
    flex: 1, height: rs(5), borderRadius: rs(3),
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden', marginRight: rs(12),
  },
  progressFill: { height: '100%', borderRadius: rs(3) },
  progressLbl: {
    fontSize: rs(12), fontWeight: '700', color: C.cream,
    opacity: 0.55, minWidth: rs(40), textAlign: 'right',
  },

  /* Column header row */
  colRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(20), paddingVertical: rs(10),
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  colHead: {
    fontSize: rs(10), fontWeight: '700', color: C.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.9,
  },

  /* List */
  listContent: { paddingHorizontal: rs(14), paddingTop: rs(8) },
  rowWrap:     { marginBottom: rs(8) },

  /* Regular row */
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: rs(16),
    paddingVertical: rs(13), paddingHorizontal: rs(14),
    borderWidth: 1, borderColor: C.divider,
    ...CARD_SHADOW,
  },
  rowPast: { backgroundColor: '#faf8f4', borderColor: 'rgba(7,31,28,0.04)' },

  /* Day pill */
  dayPill: {
    flex: 0.65, width: rs(34), height: rs(34), borderRadius: rs(10),
    backgroundColor: C.mintBg, borderWidth: 1, borderColor: C.mintBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  dayPillPast: { backgroundColor: 'rgba(7,31,28,0.04)', borderColor: 'rgba(7,31,28,0.07)' },
  dayNum: { fontSize: rs(13), fontWeight: '800', color: C.teal2 },

  /* Date */
  dateCol:  { flex: 1.3, paddingLeft: rs(10) },
  dateText: { fontSize: rs(14), fontWeight: '600', color: C.textDark },

  /* Time columns */
  timeCol: { flex: 1, alignItems: 'center' },
  timeVal: { fontSize: rs(14), fontWeight: '700', color: C.textDark, fontVariant: ['tabular-nums'] },
  txtPast: { color: C.textDim, fontWeight: '500' },

  /* Today row */
  todayRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: rs(18), paddingVertical: rs(15), paddingHorizontal: rs(14),
    ...TODAY_SHADOW,
  },
  todayBubble: {
    flex: 0.65, width: rs(36), height: rs(36), borderRadius: rs(11),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  todayBubbleNum: { fontSize: rs(13), fontWeight: '900', color: C.white, lineHeight: rs(15) },
  todayBubbleSub: {
    fontSize: rs(7), fontWeight: '700',
    color: 'rgba(255,255,255,0.58)',
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  todayDateCol:  { flex: 1.3, paddingLeft: rs(10) },
  todayDate:     { fontSize: rs(14), fontWeight: '800', color: C.white, marginBottom: rs(4) },
  todayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: rs(5), paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  todayBadgeTxt: { fontSize: rs(8), fontWeight: '800', color: C.white, letterSpacing: 0.8 },
  todayTimeCol:  { flex: 1, alignItems: 'center' },
  todayTimeLbl: {
    fontSize: rs(10), fontWeight: '600',
    color: 'rgba(255,255,255,0.58)', marginBottom: rs(3), textAlign: 'center',
  },
  todayTimeVal: {
    fontSize: rs(14), fontWeight: '800', color: C.white, fontVariant: ['tabular-nums'],
  },
});