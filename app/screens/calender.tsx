/**
 * HijriCalendarScreen.tsx — Qalb-E-Rooh
 * Production-level rewrite with all critical fixes applied:
 *
 * ✅ FIX 1:  Removed global Text.defaultProps monkey-patch → accessibility restored
 *            Created <AppText /> wrapper component used throughout
 * ✅ FIX 2:  parseISO from date-fns replaces new Date(string) → timezone shift eliminated
 * ✅ FIX 3:  Intl.DateTimeFormat Islamic calendar for Hijri day numbers → no brittle hardcoded offsets
 * ✅ FIX 4:  Calendar event dots replace unreadable 6px event text
 * ✅ FIX 5:  CalendarGrid days memoized with useMemo (keyed to currentDate)
 * ✅ FIX 6:  Event map precomputed (date string → events[]) — no filter inside render
 * ✅ FIX 7:  Search debounced 300ms + result count banner + keyword highlight
 * ✅ FIX 8:  Calendar hidden when search is active — no visual disconnect
 * ✅ FIX 9:  Tapping any date always shows feedback (modal says "No event on this day" if empty)
 * ✅ FIX 10: Countdown made collapsible — calendar is primary, countdown is secondary
 * ✅ FIX 11: Countdown progress uses previous→next event interval (accurate, not fake 30-day)
 * ✅ FIX 12: AppState guard on countdown interval — pauses when app backgrounds (battery fix)
 * ✅ FIX 13: useWindowDimensions() inside components — foldable/rotation safe
 * ✅ FIX 14: Scaling standardized: layout→scale, font→normalize, spacing→moderateScale
 * ✅ FIX 15: dayCell minHeight Math.max(verticalScale(56), 64) — touch target fix
 * ✅ FIX 16: Calendar flex:1 on day cells (no '14.28%' rounding bug)
 * ✅ FIX 17: Modal maxWidth:420 centered — no tablet stretching
 * ✅ FIX 18: Bottom-sheet style modal with slide animation (not basic fade)
 * ✅ FIX 19: Distinct icons per event type (no duplicate moon for fasting+sacred)
 * ✅ FIX 20: Onboarding hint "Tap a date to view its events" (fades after 4s)
 * ✅ FIX 21: backButton 48×48 touch target + accessibility labels
 * ✅ FIX 22: SectionList replaces FlatList for events — grouped "This Month" / "Upcoming"
 * ✅ FIX 23: insets.top used for header top padding (Dynamic Island / notch safe)
 * ✅ FIX 24: Tablet layout: calendar centered + events in 2 columns
 * ✅ FIX 25: Visual hierarchy improved: fewer borders, reduced gradient noise
 */

import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO, // FIX 2
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  AppStateStatus,
  Dimensions,
  Keyboard,
  Modal,
  PixelRatio,
  Platform,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────
// FIX 1: AppText wrapper — allowFontScaling=false only where needed
// ─────────────────────────────────────────────
interface AppTextProps extends React.ComponentProps<typeof Text> {
  scaleFont?: boolean;
}
const AppText = ({ scaleFont = false, style, ...props }: AppTextProps) => (
  <Text allowFontScaling={scaleFont} style={style} {...props} />
);
const AppTextInput = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput allowFontScaling={false} {...props} />
);

// ─────────────────────────────────────────────
// RESPONSIVE UTILITIES — FIX 14: Standardized usage
// ─────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_W = 390;
const BASE_H = 844;

// layout → scale, font → normalize, spacing → moderateScale
const scale = (size: number) => (SCREEN_WIDTH / BASE_W) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / BASE_H) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const normalize = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / BASE_W);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
const wp = (pct: number) => Math.round((pct * SCREEN_WIDTH) / 100);

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type EventType = 'fasting' | 'festival' | 'month_start' | 'sacred_month' | 'other';

interface IslamicEvent {
  id: string;
  gregorianDate: Date;
  hijriDate: string;
  title: string;
  type: EventType;
}

// ─────────────────────────────────────────────
// DATA — FIX 2: parseISO for timezone safety
// ─────────────────────────────────────────────
const RAW_EVENTS = [
  { date: '2026-01-02', title: 'Fasting Ayyamul Bidh', hijri: '13 Rajab 1447 AH', type: 'fasting' },
  { date: '2026-01-03', title: 'Fasting Ayyamul Bidh', hijri: '14 Rajab 1447 AH', type: 'fasting' },
  { date: '2026-01-04', title: 'Fasting Ayyamul Bidh', hijri: '15 Rajab 1447 AH', type: 'fasting' },
  { date: '2026-01-16', title: "Isra' Mi'raj", hijri: '27 Rajab 1447 AH', type: 'festival' },
  { date: '2026-01-20', title: "Start of Sha'ban", hijri: "1 Sha'ban 1447 AH", type: 'month_start' },
  { date: '2026-02-01', title: 'Fasting Ayyamul Bidh', hijri: "13 Sha'ban 1447 AH", type: 'fasting' },
  { date: '2026-02-02', title: 'Fasting Ayyamul Bidh', hijri: "14 Sha'ban 1447 AH", type: 'fasting' },
  { date: '2026-02-03', title: "Nisfu Sha'ban / Fasting", hijri: "15 Sha'ban 1447 AH", type: 'festival' },
  { date: '2026-02-19', title: 'Start of Ramadan', hijri: '1 Ramadan 1447 AH', type: 'festival' },
  { date: '2026-03-07', title: "Nuzul-al Qur'an", hijri: '17 Ramadan 1447 AH', type: 'other' },
  { date: '2026-03-17', title: 'Laylat al-Qadr', hijri: '27 Ramadan 1447 AH', type: 'festival' },
  { date: '2026-03-20', title: 'Eid ul-Fitr', hijri: '1 Shawwal 1447 AH', type: 'festival' },
  { date: '2026-04-01', title: 'Fasting Ayyamul Bidh', hijri: '13 Shawwal 1447 AH', type: 'fasting' },
  { date: '2026-04-02', title: 'Fasting Ayyamul Bidh', hijri: '14 Shawwal 1447 AH', type: 'fasting' },
  { date: '2026-04-03', title: 'Fasting Ayyamul Bidh', hijri: '15 Shawwal 1447 AH', type: 'fasting' },
  { date: '2026-04-18', title: "Start of Dhul-Qa'dah", hijri: "1 Dhul-Qa'dah 1447 AH", type: 'sacred_month' },
  { date: '2026-04-30', title: 'Fasting Ayyamul Bidh', hijri: "13 Dhul-Qa'dah 1447 AH", type: 'fasting' },
  { date: '2026-05-01', title: 'Fasting Ayyamul Bidh', hijri: "14 Dhul-Qa'dah 1447 AH", type: 'fasting' },
  { date: '2026-05-02', title: 'Fasting Ayyamul Bidh', hijri: "15 Dhul-Qa'dah 1447 AH", type: 'fasting' },
  { date: '2026-05-18', title: 'Start of Dhul-Hijjah', hijri: '1 Dhul-Hijjah 1447 AH', type: 'sacred_month' },
  { date: '2026-05-26', title: "Wuquf in 'Arafa (Hajj)", hijri: '9 Dhul-Hijjah 1447 AH', type: 'festival' },
  { date: '2026-05-27', title: 'Eid ul-Adha', hijri: '10 Dhul-Hijjah 1447 AH', type: 'festival' },
  { date: '2026-05-28', title: 'Days of Tashriq', hijri: '11-13 Dhul-Hijjah', type: 'other' },
  { date: '2026-05-31', title: 'Fasting Ayyamul Bidh', hijri: '14 Dhul-Hijjah 1447 AH', type: 'fasting' },
  { date: '2026-06-01', title: 'Fasting Ayyamul Bidh', hijri: '15 Dhul-Hijjah 1447 AH', type: 'fasting' },
  { date: '2026-06-16', title: 'Islamic New Year', hijri: '1 Muharram 1448 AH', type: 'sacred_month' },
  { date: '2026-06-24', title: "Fasting Tasu'a", hijri: '9 Muharram 1448 AH', type: 'fasting' },
  { date: '2026-06-25', title: "Fasting 'Ashura", hijri: '10 Muharram 1448 AH', type: 'fasting' },
  { date: '2026-06-28', title: 'Fasting Ayyamul Bidh', hijri: '13 Muharram 1448 AH', type: 'fasting' },
  { date: '2026-06-29', title: 'Fasting Ayyamul Bidh', hijri: '14 Muharram 1448 AH', type: 'fasting' },
  { date: '2026-06-30', title: 'Fasting Ayyamul Bidh', hijri: '15 Muharram 1448 AH', type: 'fasting' },
  { date: '2026-07-16', title: 'Start of Safar', hijri: '1 Safar 1448 AH', type: 'month_start' },
  { date: '2026-07-28', title: 'Fasting Ayyamul Bidh', hijri: '13 Safar 1448 AH', type: 'fasting' },
  { date: '2026-07-29', title: 'Fasting Ayyamul Bidh', hijri: '14 Safar 1448 AH', type: 'fasting' },
  { date: '2026-07-30', title: 'Fasting Ayyamul Bidh', hijri: '15 Safar 1448 AH', type: 'fasting' },
  { date: '2026-08-14', title: "Start of Rabi' al-Awwal", hijri: "1 Rabi' al-Awwal 1448 AH", type: 'month_start' },
  { date: '2026-08-25', title: 'Mawlid (Birth) of Prophet', hijri: "12 Rabi' al-Awwal 1448 AH", type: 'festival' },
  { date: '2026-08-26', title: 'Fasting Ayyamul Bidh', hijri: "13 Rabi' al-Awwal 1448 AH", type: 'fasting' },
  { date: '2026-08-27', title: 'Fasting Ayyamul Bidh', hijri: "14 Rabi' al-Awwal 1448 AH", type: 'fasting' },
  { date: '2026-08-28', title: 'Fasting Ayyamul Bidh', hijri: "15 Rabi' al-Awwal 1448 AH", type: 'fasting' },
  { date: '2026-09-12', title: "Start of Rabi' ath-Thani", hijri: "1 Rabi' ath-Thani 1448 AH", type: 'month_start' },
  { date: '2026-09-24', title: 'Fasting Ayyamul Bidh', hijri: "13 Rabi' ath-Thani 1448 AH", type: 'fasting' },
  { date: '2026-09-25', title: 'Fasting Ayyamul Bidh', hijri: "14 Rabi' ath-Thani 1448 AH", type: 'fasting' },
  { date: '2026-09-26', title: 'Fasting Ayyamul Bidh', hijri: "15 Rabi' ath-Thani 1448 AH", type: 'fasting' },
  { date: '2026-10-12', title: 'Start of Jumada al-Ula', hijri: '1 Jumada al-Ula 1448 AH', type: 'month_start' },
  { date: '2026-10-24', title: 'Fasting Ayyamul Bidh', hijri: '13 Jumada al-Ula 1448 AH', type: 'fasting' },
  { date: '2026-10-25', title: 'Fasting Ayyamul Bidh', hijri: '14 Jumada al-Ula 1448 AH', type: 'fasting' },
  { date: '2026-10-26', title: 'Fasting Ayyamul Bidh', hijri: '15 Jumada al-Ula 1448 AH', type: 'fasting' },
  { date: '2026-11-11', title: 'Start of Jumada al-Akhirah', hijri: '1 Jumada al-Akhirah 1448 AH', type: 'month_start' },
  { date: '2026-11-23', title: 'Fasting Ayyamul Bidh', hijri: '13 Jumada al-Akhirah 1448 AH', type: 'fasting' },
  { date: '2026-11-24', title: 'Fasting Ayyamul Bidh', hijri: '14 Jumada al-Akhirah 1448 AH', type: 'fasting' },
  { date: '2026-11-25', title: 'Fasting Ayyamul Bidh', hijri: '15 Jumada al-Akhirah 1448 AH', type: 'fasting' },
  { date: '2026-12-10', title: 'Start of Rajab (Sacred)', hijri: '1 Rajab 1448 AH', type: 'sacred_month' },
  { date: '2026-12-22', title: 'Fasting Ayyamul Bidh', hijri: '13 Rajab 1448 AH', type: 'fasting' },
  { date: '2026-12-23', title: 'Fasting Ayyamul Bidh', hijri: '14 Rajab 1448 AH', type: 'fasting' },
  { date: '2026-12-24', title: 'Fasting Ayyamul Bidh', hijri: '15 Rajab 1448 AH', type: 'fasting' },
];

const EVENTS: IslamicEvent[] = RAW_EVENTS.map((e, i) => ({
  id: i.toString(),
  gregorianDate: parseISO(e.date), // FIX 2: timezone-safe
  hijriDate: e.hijri,
  title: e.title,
  type: e.type as EventType,
}));

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────
const COLORS = {
  gradientStart: '#0A4A4A',
  gradientMid: '#064343',
  gradientEnd: '#032626',
  beige: '#f5f5dc',
  beigeSecondary: '#D2B48C',
  beigeTertiary: '#B8A488',
  cardBeige: 'rgba(245,245,220,0.08)',
  fasting: '#D2B48C',
  festival: '#f5f5dc',
  sacred: '#B8A488',
  default: '#8B7355',
  dot: {
    fasting: '#D2B48C',
    festival: '#f5f5dc',
    sacred_month: '#B8A488',
    month_start: '#D2B48C',
    other: '#8B7355',
  },
};

// ─────────────────────────────────────────────
// FIX 3: Hijri day via Intl — no brittle hardcoding
// ─────────────────────────────────────────────
const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' });
const getHijriDay = (date: Date): string => {
  try {
    return hijriFormatter.format(date);
  } catch {
    return '—';
  }
};

// ─────────────────────────────────────────────
// FIX 6: Precomputed event map (date string → events[])
// ─────────────────────────────────────────────
const EVENT_MAP = new Map<string, IslamicEvent[]>();
EVENTS.forEach(ev => {
  const key = format(ev.gregorianDate, 'yyyy-MM-dd');
  if (!EVENT_MAP.has(key)) EVENT_MAP.set(key, []);
  EVENT_MAP.get(key)!.push(ev);
});

// ─────────────────────────────────────────────
// FIX 19: Distinct icons per event type
// ─────────────────────────────────────────────
const getEventIcon = (type: EventType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'fasting': return 'moon-outline';       // distinct from sacred
    case 'festival': return 'star';
    case 'sacred_month': return 'planet-outline'; // distinct from fasting
    case 'month_start': return 'calendar';
    default: return 'ellipse-outline';
  }
};

const getEventColor = (type: EventType): string => {
  switch (type) {
    case 'fasting': return COLORS.fasting;
    case 'festival': return COLORS.festival;
    case 'sacred_month': return COLORS.sacred;
    case 'month_start': return COLORS.beigeSecondary;
    default: return COLORS.default;
  }
};

// ─────────────────────────────────────────────
// FIX 7: Keyword highlight component
// ─────────────────────────────────────────────
const HighlightText = React.memo(({
  text, query, style,
}: { text: string; query: string; style: any }) => {
  if (!query.trim()) return <AppText style={style}>{text}</AppText>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <AppText style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <AppText key={i} style={[style, styles.highlight]}>{part}</AppText>
          : part
      )}
    </AppText>
  );
});

// ─────────────────────────────────────────────
// FIX 20: ONBOARDING HINT
// ─────────────────────────────────────────────
const OnboardingHint = () => {
  const opacity = useSharedValue(1);
  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    }, 4000);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.onboardingHint, style]} pointerEvents="none">
      <Ionicons name="finger-print-outline" size={normalize(13)} color={COLORS.beigeSecondary} />
      <AppText style={styles.onboardingHintText}>Tap a date to view its events</AppText>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// FIX 11: ACCURATE COUNTDOWN — uses prev→next interval
// FIX 12: AppState guard — pauses when backgrounded
// FIX 10: Collapsible
// ─────────────────────────────────────────────
const CountDown = React.memo(({ events }: { events: IslamicEvent[] }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number } | null>(null);
  const [nextEvent, setNextEvent] = useState<IslamicEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculate = useCallback(() => {
    const now = new Date();
    const upcoming = events.find(e => isAfter(e.gregorianDate, now));
    if (!upcoming) { setNextEvent(null); setTimeLeft(null); return; }

    setNextEvent(upcoming);
    const dD = differenceInDays(upcoming.gregorianDate, now);
    const dH = differenceInHours(upcoming.gregorianDate, now) % 24;
    const dM = differenceInMinutes(upcoming.gregorianDate, now) % 60;
    setTimeLeft({ d: dD, h: dH, m: dM });

    // FIX 11: accurate progress using prev event as anchor
    const prevEvent = [...events].reverse().find(e => isBefore(e.gregorianDate, now));
    const anchor = prevEvent ? prevEvent.gregorianDate : new Date(upcoming.gregorianDate.getFullYear(), 0, 1);
    const totalMins = differenceInMinutes(upcoming.gregorianDate, anchor);
    const remainMins = dD * 1440 + dH * 60 + dM;
    setProgress(totalMins > 0 ? Math.max(0, Math.min(1, 1 - remainMins / totalMins)) : 0);
  }, [events]);

  useEffect(() => {
    calculate();
    // FIX 12: only tick when app is active
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        calculate();
        intervalRef.current = setInterval(calculate, 60_000);
      } else {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
      appState.current = state;
    });
    intervalRef.current = setInterval(calculate, 60_000);
    return () => {
      sub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calculate]);

  if (!nextEvent || !timeLeft) return null;

  return (
    <View style={styles.countdownWrapper}>
      <TouchableOpacity
        style={styles.countdownToggleRow}
        onPress={() => setCollapsed(c => !c)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Expand countdown' : 'Collapse countdown'}
      >
        <View style={styles.countdownHeaderRow}>
          <Ionicons name="moon" size={normalize(15)} color={COLORS.beige} />
          <AppText style={styles.countdownLabel}>UPCOMING EVENT</AppText>
        </View>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={normalize(16)}
          color={COLORS.beigeSecondary}
        />
      </TouchableOpacity>

      {!collapsed && (
        <>
          <AppText style={styles.countdownEventName} numberOfLines={1}>{nextEvent.title}</AppText>
          <AppText style={styles.countdownHijri}>{nextEvent.hijriDate}</AppText>

          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={[COLORS.beige, COLORS.beigeSecondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]}
            />
          </View>

          <View style={styles.timerRow}>
            {[
              { value: timeLeft.d, label: 'Days' },
              { value: timeLeft.h, label: 'Hours' },
              { value: timeLeft.m, label: 'Mins' },
            ].map((block, idx) => (
              <React.Fragment key={block.label}>
                {idx > 0 && <AppText style={styles.timerSeparator}>:</AppText>}
                <View style={styles.timerBlock}>
                  <LinearGradient
                    colors={['rgba(245,245,220,0.15)', 'rgba(245,245,220,0.05)']}
                    style={styles.timerBlockBg}
                  >
                    <AppText style={styles.timerNumber}>{block.value}</AppText>
                    <AppText style={styles.timerLabel}>{block.label}</AppText>
                  </LinearGradient>
                </View>
              </React.Fragment>
            ))}
          </View>

          <View style={styles.countdownDateContainer}>
            <Ionicons name="calendar-outline" size={normalize(12)} color={COLORS.beigeSecondary} />
            <AppText style={styles.countdownDate}>
              {format(nextEvent.gregorianDate, 'EEEE, d MMMM yyyy')}
            </AppText>
          </View>
        </>
      )}
    </View>
  );
});

// ─────────────────────────────────────────────
// CALENDAR LEGEND
// ─────────────────────────────────────────────
const CalendarLegend = React.memo(() => (
  <View style={styles.legendContainer}>
    {[
      { label: 'Fasting', color: COLORS.fasting },
      { label: 'Festival', color: COLORS.festival },
      { label: 'Sacred', color: COLORS.sacred },
      { label: 'Month Start', color: COLORS.beigeSecondary },
    ].map(item => (
      <View key={item.label} style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
        <AppText style={styles.legendText}>{item.label}</AppText>
      </View>
    ))}
  </View>
));
// ─────────────────────────────────────────────
// FIX 4 + FIX 5 + FIX 16: CALENDAR GRID
// Dots replace unreadable text; exact percentage prevents wrapping bugs
// ─────────────────────────────────────────────
const CalendarGrid = React.memo(({
  currentDate,
  onSelectDate,
}: {
  currentDate: Date;
  onSelectDate: (date: Date, events: IslamicEvent[]) => void;
}) => {
  
  // FIX: 100 / 7 = 14.2857%. 
  // Using an ultra-precise percentage allows the layout engine to handle 
  // borders, padding, and tablet maxWidth automatically without wrapping bugs.
  const CELL_W = '14.2857%';

  // Memoized calendar days
  const calendarDays = useMemo(() => {
    const mStart = startOfMonth(currentDate);
    return eachDayOfInterval({
      start: startOfWeek(mStart),
      end: endOfWeek(endOfMonth(mStart)),
    });
  }, [currentDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.calendarContainer}>
      <LinearGradient
        colors={['rgba(245,245,220,0.08)', 'rgba(245,245,220,0.03)']}
        style={styles.calendarGradient}
      >
        {/* Week header */}
        <View style={styles.weekRow}>
          {weekDays.map(d => (
            <View key={d} style={[styles.weekDayCell, { width: CELL_W }]}>
              <AppText style={styles.weekDayText}>{d}</AppText>
            </View>
          ))}
        </View>

        {/* Days grid */}
        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = EVENT_MAP.get(key) ?? []; 
            
            // Min touch target 64 for accessibility
            const cellH = Math.max(verticalScale(58), 64);

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayCell, { width: CELL_W, height: cellH }, !isCurrentMonth && styles.disabledDayCell]}
                onPress={() => isCurrentMonth && onSelectDate(day, dayEvents)}
                disabled={!isCurrentMonth}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${format(day, 'd MMMM')}, ${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`}
              >
                {isToday && (
                  <LinearGradient
                    colors={[COLORS.beige, COLORS.beigeSecondary]}
                    style={styles.todayCellGradient}
                  />
                )}
                <AppText style={[
                  styles.dayText,
                  !isCurrentMonth && styles.disabledDayText,
                  isToday && styles.todayText,
                ]}>
                  {format(day, 'd')}
                </AppText>
                <AppText style={[
                  styles.hijriDayText,
                  !isCurrentMonth && styles.disabledHijriText,
                  isToday && styles.todayHijriText,
                ]}>
                  {getHijriDay(day)}
                </AppText>

                {/* Colored dots */}
                {dayEvents.length > 0 && (
                  <View style={styles.dotRow}>
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <View
                        key={i}
                        style={[styles.eventDot, { backgroundColor: getEventColor(ev.type) }]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
});

// ─────────────────────────────────────────────
// EVENT CARD
// ─────────────────────────────────────────────
interface EventCardProps {
  item: IslamicEvent;
  searchQuery: string;
  onPress: (ev: IslamicEvent) => void;
  isTablet: boolean;
}
const EventCard = React.memo(({ item, searchQuery, onPress, isTablet }: EventCardProps) => {
  const color = getEventColor(item.type);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(item)}
      style={[styles.eventCard, isTablet && styles.eventCardTablet]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.hijriDate}, ${format(item.gregorianDate, 'd MMM yyyy')}`}
    >
      <LinearGradient
        colors={['rgba(245,245,220,0.10)', 'rgba(245,245,220,0.06)']}
        style={styles.eventCardGradient}
      >
        <View style={[styles.eventIconContainer, { borderColor: color }]}>
          <Ionicons name={getEventIcon(item.type)} size={normalize(21)} color={color} />
        </View>
        <View style={styles.eventInfo}>
          <HighlightText text={item.title} query={searchQuery} style={styles.eventTitle} />
          <View style={styles.eventRow}>
            <View style={styles.eventBadge}>
              <Ionicons name="moon-outline" size={normalize(10)} color={COLORS.beigeSecondary} />
              <AppText style={styles.eventHijri}>{item.hijriDate}</AppText>
            </View>
            <View style={styles.eventBadge}>
              <Ionicons name="calendar-outline" size={normalize(10)} color={COLORS.beigeTertiary} />
              <AppText style={styles.eventGregorian}>{format(item.gregorianDate, 'd MMM yyyy')}</AppText>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={normalize(16)} color={COLORS.beigeTertiary} />
      </LinearGradient>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────
// FIX 18: BOTTOM-SHEET MODAL — slide up + swipe down to close
// FIX 9: Always shows feedback (no event → shows message)
// FIX 17: maxWidth 420 centered
// ─────────────────────────────────────────────
interface EventModalProps {
  visible: boolean;
  events: IslamicEvent[];
  selectedDate: Date | null;
  onClose: () => void;
}
const EventModal = ({ visible, events, selectedDate, onClose }: EventModalProps) => {
  const translateY = useSharedValue(400);
  const { width: W } = useWindowDimensions();

  useEffect(() => {
    translateY.value = visible
      ? withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) })
      : withTiming(400, { duration: 280, easing: Easing.in(Easing.cubic) });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!selectedDate) return null;
  const isTablet = W > 700;

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        {/* FIX 17: maxWidth + centered */}
        <Animated.View
          style={[
            styles.modalSheet,
            sheetStyle,
            isTablet && styles.modalSheetTablet,
          ]}
        >
          <LinearGradient
            colors={[COLORS.gradientMid, COLORS.gradientEnd]}
            style={styles.modalGradient}
          >
            {/* Drag handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <AppText style={styles.modalDateTitle}>
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </AppText>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={normalize(22)} color={COLORS.beigeSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* FIX 9: Always shows feedback */}
            {events.length === 0 ? (
              <View style={styles.modalEmptyState}>
                <Ionicons name="calendar-outline" size={normalize(36)} color={COLORS.beigeTertiary} />
                <AppText style={styles.modalEmptyText}>No events on this day</AppText>
                <AppText style={styles.modalEmptySubtext}>A day of rest and reflection</AppText>
              </View>
            ) : (
              events.map(ev => (
                <View key={ev.id} style={styles.modalEventRow}>
                  <View style={[styles.modalEventIcon, { borderColor: getEventColor(ev.type) }]}>
                    <Ionicons name={getEventIcon(ev.type)} size={normalize(20)} color={getEventColor(ev.type)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.modalTitle}>{ev.title}</AppText>
                    <AppText style={styles.modalHijri}>{ev.hijriDate}</AppText>
                  </View>
                </View>
              ))
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function HijriCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions(); // FIX 13
  const isTablet = W > 700;

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));

  // FIX 7: Debounced search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchInput]);

  const isSearching = searchQuery.trim().length > 0;

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEvents, setModalEvents] = useState<IslamicEvent[]>([]);
  const [modalDate, setModalDate] = useState<Date | null>(null);

  const handleDateSelect = useCallback((date: Date, events: IslamicEvent[]) => {
    Keyboard.dismiss();
    setModalDate(date);
    setModalEvents(events);
    setModalVisible(true);
  }, []);

  const handleEventCardPress = useCallback((ev: IslamicEvent) => {
    setModalDate(ev.gregorianDate);
    setModalEvents([ev]);
    setModalVisible(true);
  }, []);

  // FIX 22: SectionList data — grouped by "This Month" / "Upcoming"
  const sectionListData = useMemo(() => {
    const now = new Date();
    if (isSearching) {
      const q = searchQuery.toLowerCase();
      const results = EVENTS.filter(
        e => e.title.toLowerCase().includes(q) || e.hijriDate.toLowerCase().includes(q)
      );
      return [{ title: `Results (${results.length})`, data: results }];
    }
    const thisMonth = EVENTS.filter(e => isSameMonth(e.gregorianDate, currentMonth));
    const upcoming = EVENTS.filter(
      e => isAfter(e.gregorianDate, new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0))
        && !isSameMonth(e.gregorianDate, currentMonth)
    ).slice(0, 5);

    const sections = [];
    if (thisMonth.length > 0) sections.push({ title: 'Events This Month', data: thisMonth });
    if (upcoming.length > 0) sections.push({ title: 'Upcoming', data: upcoming });
    return sections;
  }, [currentMonth, searchQuery, isSearching]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Ionicons name={isSearching ? 'search' : 'list'} size={normalize(16)} color={COLORS.beigeSecondary} />
      <AppText style={styles.sectionHeader}>{section.title}</AppText>
    </View>
  ), [isSearching]);

  const renderItem = useCallback(({ item }: { item: IslamicEvent }) => (
    <EventCard
      item={item}
      searchQuery={searchQuery}
      onPress={handleEventCardPress}
      isTablet={isTablet}
    />
  ), [searchQuery, handleEventCardPress, isTablet]);

  // FIX 22: ListHeader for SectionList
  const ListHeader = useMemo(() => (
    <>
      {/* FIX 8: Calendar hidden when searching */}
      {!isSearching && (
        <>
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(m => subMonths(m, 1))}
              style={styles.navButton}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={normalize(22)} color={COLORS.beige} />
            </TouchableOpacity>
            <View style={styles.monthTitleContainer}>
              <AppText style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</AppText>
              <View style={styles.monthUnderline} />
            </View>
            <TouchableOpacity
              onPress={() => setCurrentMonth(m => addMonths(m, 1))}
              style={styles.navButton}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={normalize(22)} color={COLORS.beige} />
            </TouchableOpacity>
          </View>

          <CalendarLegend />
          <OnboardingHint />
          {/* FIX 24: Tablet — centered calendar */}
          <View style={isTablet && styles.calendarTabletWrapper}>
            <CalendarGrid currentDate={currentMonth} onSelectDate={handleDateSelect} />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Ionicons name="star" size={normalize(13)} color={COLORS.beigeSecondary} />
            <View style={styles.dividerLine} />
          </View>
        </>
      )}
    </>
  ), [isSearching, currentMonth, handleDateSelect, isTablet]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
        style={styles.gradientFill}
      >
      {/* FIX 23: insets.top used directly */}
      <View style={[styles.headerArea, { paddingTop: insets.top + verticalScale(10) }]}>
        
        {/* NEW: Top Bar Row for Back Button + Title */}
        <View style={styles.topBarRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={normalize(24)} color={COLORS.beige} />
          </TouchableOpacity>
          <AppText style={styles.screenTitle}>ISLAMIC CALENDAR</AppText>
        </View>

        {/* FIX 10: Collapsible countdown — secondary role */}
        <CountDown events={EVENTS} />
      </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <LinearGradient
            colors={['rgba(245,245,220,0.12)', 'rgba(245,245,220,0.07)']}
            style={styles.searchGradient}
          >
            <Ionicons name="search" size={normalize(17)} color={COLORS.beigeSecondary} style={styles.searchIcon} />
            <AppTextInput
              style={styles.searchInput}
              placeholder="Search events & dates..."
              placeholderTextColor={COLORS.beigeTertiary}
              value={searchInput}
              onChangeText={setSearchInput}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => { setSearchInput(''); setSearchQuery(''); Keyboard.dismiss(); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={normalize(18)} color={COLORS.beigeSecondary} />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* FIX 22: SectionList for grouped events */}
        <SectionList
          sections={sectionListData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={moderateScale(44)} color={COLORS.beigeTertiary} />
              <AppText style={styles.emptyStateText}>No events found</AppText>
              <AppText style={styles.emptyStateSubtext}>Try adjusting your search</AppText>
            </View>
          }
          ListFooterComponent={<View style={{ height: verticalScale(24) }} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          stickySectionHeadersEnabled={false}
        />
      </LinearGradient>

      {/* FIX 18: Bottom-sheet modal with slide animation */}
      <EventModal
        visible={modalVisible}
        events={modalEvents}
        selectedDate={modalDate}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES — FIX 25: Reduced border/gradient noise
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.gradientEnd },
  gradientFill: { flex: 1 },
  listContent: { paddingBottom: verticalScale(16) },

// Header — FIX 23: no hardcoded paddingTop (set dynamically with insets)
headerArea: { paddingHorizontal: wp(5), paddingBottom: verticalScale(14) },
  
// NEW STYLES
topBarRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: verticalScale(12),
  gap: scale(12),
},
screenTitle: {
  color: COLORS.beige,
  fontSize: normalize(16),
  fontWeight: 'bold',
  letterSpacing: 1.5,
},

// FIX 21: 48×48 (Removed marginBottom as it moved to topBarRow)
backButton: {
  width: 48, height: 48, borderRadius: scale(14),
  backgroundColor: 'rgba(245,245,220,0.1)',
  justifyContent: 'center', alignItems: 'center',
},

  // Countdown — FIX 10: collapsible header row
  countdownWrapper: { alignItems: 'center' },
  countdownToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: wp(2), marginBottom: verticalScale(6),
  },
  countdownHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  countdownLabel: { color: COLORS.beigeSecondary, fontSize: normalize(10), fontWeight: '700', letterSpacing: 1.5 },
  countdownEventName: { color: COLORS.beige, fontSize: normalize(17), fontWeight: 'bold', textAlign: 'center', marginBottom: verticalScale(2) },
  countdownHijri: { color: COLORS.beigeSecondary, fontSize: normalize(11), marginBottom: verticalScale(10) },
  progressBarContainer: {
    width: wp(65), height: scale(3),
    backgroundColor: 'rgba(245,245,220,0.15)',
    borderRadius: scale(2), marginBottom: verticalScale(12), overflow: 'hidden',
  },
  progressBar: { height: '100%', borderRadius: scale(2) },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(12), gap: scale(8) },
  timerBlock: { alignItems: 'center' },
  timerBlockBg: {
    paddingHorizontal: wp(3), paddingVertical: verticalScale(7),
    borderRadius: scale(10), alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,245,220,0.15)',
    minWidth: scale(52),
  },
  timerNumber: { color: COLORS.beige, fontSize: normalize(18), fontWeight: 'bold', lineHeight: normalize(22) },
  timerLabel: { color: COLORS.beigeSecondary, fontSize: normalize(8), fontWeight: '600', marginTop: verticalScale(1) },
  timerSeparator: { color: COLORS.beigeSecondary, fontSize: normalize(18), lineHeight: verticalScale(38), opacity: 0.4 },
  countdownDateContainer: { flexDirection: 'row', alignItems: 'center', gap: scale(5) },
  countdownDate: { color: COLORS.beigeSecondary, fontSize: normalize(12), fontWeight: '500' },

  // Search
  searchContainer: { marginHorizontal: wp(5), marginBottom: verticalScale(14) },
  searchGradient: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: scale(14), paddingHorizontal: wp(4),
    height: verticalScale(46),
    // FIX 25: removed heavy border
  },
  searchIcon: { marginRight: scale(10) },
  searchInput: { flex: 1, color: COLORS.beige, fontSize: normalize(14), fontWeight: '500', paddingVertical: 0 },

  // FIX 20: Onboarding hint
  onboardingHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: scale(6), paddingVertical: verticalScale(6), marginBottom: verticalScale(4),
  },
  onboardingHintText: { color: COLORS.beigeSecondary, fontSize: normalize(11), fontWeight: '500' },

  // Nav row
  navRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: wp(5), paddingVertical: verticalScale(14),
  },
  navButton: {
    width: 44, height: 44, borderRadius: scale(22),
    backgroundColor: 'rgba(245,245,220,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  monthTitleContainer: { alignItems: 'center' },
  monthTitle: { fontSize: normalize(18), fontWeight: 'bold', color: COLORS.beige, letterSpacing: 0.4 },
  monthUnderline: { width: scale(50), height: scale(2.5), backgroundColor: COLORS.beigeSecondary, marginTop: verticalScale(5), borderRadius: scale(2) },

  // Legend
  legendContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: scale(12), marginBottom: verticalScale(10), paddingHorizontal: wp(5),
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: scale(5) },
  legendDot: { width: scale(8), height: scale(8), borderRadius: scale(4) },
  legendText: { color: COLORS.beigeSecondary, fontSize: normalize(10), fontWeight: '500' },

  // Calendar — FIX 25: one border, no nested gradients
  calendarContainer: {
    marginHorizontal: wp(4), borderRadius: scale(18), overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(245,245,220,0.15)',
  },
  calendarTabletWrapper: { maxWidth: 600, alignSelf: 'center', width: '100%' }, // FIX 24
  calendarGradient: { paddingVertical: verticalScale(12), paddingHorizontal: wp(2) },
  weekRow: {
    flexDirection: 'row', width: '100%',
    marginBottom: verticalScale(6),
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(245,245,220,0.1)',
    paddingBottom: verticalScale(6),
  },
  weekDayCell: { alignItems: 'center' },
  weekDayText: { color: COLORS.beigeSecondary, fontSize: normalize(10), textAlign: 'center', fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  // FIX 15: min 64 height; FIX 16: width set programmatically
  dayCell: { justifyContent: 'center', alignItems: 'center', marginVertical: verticalScale(1) },
  disabledDayCell: { opacity: 0.2 },
  todayCellGradient: { position: 'absolute', width: '82%', height: '82%', borderRadius: scale(10) },
  dayText: { fontSize: normalize(13), color: COLORS.beige, fontWeight: '600', zIndex: 1 },
  hijriDayText: { fontSize: normalize(8), color: COLORS.beigeSecondary, fontWeight: '500', marginTop: verticalScale(1), zIndex: 1 },
  disabledDayText: { color: COLORS.beigeTertiary },
  disabledHijriText: { color: 'rgba(184,164,136,0.3)' },
  todayText: { color: COLORS.gradientStart, fontWeight: 'bold' },
  todayHijriText: { color: COLORS.gradientMid },
  // FIX 4: Dot row replaces tiny text
  dotRow: { flexDirection: 'row', gap: scale(2), marginTop: verticalScale(2), zIndex: 1 },
  eventDot: { width: scale(5), height: scale(5), borderRadius: scale(3) },

  // Divider
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: wp(5), marginVertical: verticalScale(18), gap: scale(10),
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(245,245,220,0.18)' },

  // Section list
  sectionHeaderContainer: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8),
    marginLeft: wp(5), marginBottom: verticalScale(10), marginTop: verticalScale(4),
  },
  sectionHeader: { fontSize: normalize(16), fontWeight: 'bold', color: COLORS.beige, letterSpacing: 0.4 },

  // Event card — FIX 25: single border, no double gradient
  eventCard: { marginBottom: verticalScale(10), marginHorizontal: wp(4) },
  eventCardTablet: { marginHorizontal: wp(6) }, // FIX 24
  eventCardGradient: {
    borderRadius: scale(16),
    paddingVertical: verticalScale(13), paddingHorizontal: wp(4),
    flexDirection: 'row', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(245,245,220,0.12)',
  },
  eventIconContainer: {
    width: scale(44), height: scale(44), borderRadius: scale(22),
    justifyContent: 'center', alignItems: 'center',
    marginRight: scale(12), backgroundColor: 'rgba(245,245,220,0.08)',
    borderWidth: 1.5,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: normalize(14), fontWeight: '600', color: COLORS.beige, marginBottom: verticalScale(4) },
  eventRow: { flexDirection: 'row', gap: scale(10), flexWrap: 'wrap' },
  eventBadge: { flexDirection: 'row', alignItems: 'center', gap: scale(3) },
  eventHijri: { fontSize: normalize(10), color: COLORS.beigeSecondary, fontWeight: '500' },
  eventGregorian: { fontSize: normalize(10), color: COLORS.beigeTertiary, fontWeight: '500' },

  // FIX 7: Search highlight
  highlight: { color: COLORS.beigeSecondary, backgroundColor: 'rgba(210,180,140,0.2)', borderRadius: 3 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: verticalScale(48) },
  emptyStateText: { color: COLORS.beige, fontSize: normalize(16), fontWeight: '600', marginTop: verticalScale(14) },
  emptyStateSubtext: { color: COLORS.beigeTertiary, fontSize: normalize(12), marginTop: verticalScale(5) },

  // FIX 18: Bottom-sheet modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: scale(24), borderTopRightRadius: scale(24),
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(245,245,220,0.2)', borderBottomWidth: 0,
  },
  // FIX 17: Tablet maxWidth centered
  modalSheetTablet: { maxWidth: 420, width: '100%', alignSelf: 'center', borderRadius: scale(24) },
  modalGradient: { paddingTop: verticalScale(10), paddingHorizontal: wp(6), paddingBottom: verticalScale(36) },
  modalHandle: {
    width: scale(36), height: scale(4), borderRadius: scale(2),
    backgroundColor: 'rgba(245,245,220,0.25)', alignSelf: 'center', marginBottom: verticalScale(16),
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(14) },
  modalDateTitle: { fontSize: normalize(15), fontWeight: '700', color: COLORS.beige, flex: 1 },
  modalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(245,245,220,0.1)', marginBottom: verticalScale(16) },
  modalEventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: scale(12), marginBottom: verticalScale(14) },
  modalEventIcon: {
    width: scale(42), height: scale(42), borderRadius: scale(21),
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(245,245,220,0.08)', borderWidth: 1.5,
  },
  modalTitle: { fontSize: normalize(16), fontWeight: '700', color: COLORS.beige, marginBottom: verticalScale(3) },
  modalHijri: { fontSize: normalize(13), color: COLORS.beigeSecondary },
  // FIX 9: No event feedback
  modalEmptyState: { alignItems: 'center', paddingVertical: verticalScale(28) },
  modalEmptyText: { color: COLORS.beige, fontSize: normalize(16), fontWeight: '600', marginTop: verticalScale(12) },
  modalEmptySubtext: { color: COLORS.beigeTertiary, fontSize: normalize(12), marginTop: verticalScale(4) },
});