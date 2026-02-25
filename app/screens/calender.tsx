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
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  PixelRatio,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ==========================================
// FONT SCALING — DISABLE GLOBALLY
// ==========================================
// Monkey-patch Text & TextInput so allowFontScaling=false is the default
// across this entire screen without touching every instance.
const OriginalText = Text as any;
const OriginalTextInput = TextInput as any;

if (OriginalText.defaultProps == null) OriginalText.defaultProps = {};
OriginalText.defaultProps.allowFontScaling = false;

if (OriginalTextInput.defaultProps == null) OriginalTextInput.defaultProps = {};
OriginalTextInput.defaultProps.allowFontScaling = false;

// ==========================================
// RESPONSIVE UTILITIES
// ==========================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const normalize = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / guidelineBaseWidth);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const wp = (percentage: number) =>
  Math.round((percentage * SCREEN_WIDTH) / 100);

const hp = (percentage: number) =>
  Math.round((percentage * SCREEN_HEIGHT) / 100);

// ==========================================
// TYPES
// ==========================================
type EventType = 'fasting' | 'festival' | 'month_start' | 'sacred_month' | 'other';

interface IslamicEvent {
  id: string;
  gregorianDate: Date;
  hijriDate: string;
  title: string;
  type: EventType;
}

// ==========================================
// DATA
// ==========================================
const RAW_EVENTS = [
  { date: '2026-01-02', title: 'Fasting Ayyamul Bidh', hijri: '13 Rajab 1447 AH', type: 'fasting' },
  { date: '2026-01-03', title: 'Fasting Ayyamul Bidh', hijri: '14 Rajab 1447 AH', type: 'fasting' },
  { date: '2026-01-04', title: 'Fasting Ayyamul Bidh', hijri: '15 Rajab 1447 AH', type: 'fasting' },
  { date: '2026-01-16', title: "Isra' Mi'raj", hijri: '27 Rajab 1447 AH', type: 'festival' },
  { date: '2026-01-20', title: "Start of Sha'ban", hijri: "1 Sha'ban 1447 AH", type: 'month_start' },
  { date: '2026-02-01', title: 'Fasting Ayyamul Bidh', hijri: "13 Sha'ban 1447 AH", type: 'fasting' },
  { date: '2026-02-02', title: 'Fasting Ayyamul Bidh', hijri: "14 Sha'ban 1447 AH", type: 'fasting' },
  { date: '2026-02-03', title: 'Nisfu Sha\'ban / Fasting', hijri: "15 Sha'ban 1447 AH", type: 'festival' },
  { date: '2026-02-19', title: 'Start of Ramadan', hijri: '1 Ramadan 1447 AH', type: 'festival' },
  { date: '2026-03-07', title: 'Nuzul-al Qur\'an', hijri: '17 Ramadan 1447 AH', type: 'other' },
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

const EVENTS: IslamicEvent[] = RAW_EVENTS.map((e, index) => ({
  id: index.toString(),
  gregorianDate: new Date(e.date),
  hijriDate: e.hijri,
  title: e.title,
  type: e.type as EventType,
}));

const COLORS = {
  gradientStart: '#0A4A4A',
  gradientMid: '#064343',
  gradientEnd: '#032626',
  beige: '#f5f5dc',
  beigeSecondary: '#D2B48C',
  beigeTertiary: '#B8A488',
  cardBeige: 'rgba(245, 245, 220, 0.1)',
  fasting: '#D2B48C',
  festival: '#f5f5dc',
  sacred: '#B8A488',
  default: '#8B7355',
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const getHardcodedHijriDay = (date: Date): string => {
  const offsets = [
    { start: new Date(2026, 0, 1), hStart: 12 },
    { start: new Date(2026, 0, 20), hStart: 1 },
    { start: new Date(2026, 1, 19), hStart: 1 },
    { start: new Date(2026, 2, 20), hStart: 1 },
    { start: new Date(2026, 3, 18), hStart: 1 },
    { start: new Date(2026, 4, 18), hStart: 1 },
    { start: new Date(2026, 5, 16), hStart: 1 },
    { start: new Date(2026, 6, 16), hStart: 1 },
    { start: new Date(2026, 7, 14), hStart: 1 },
    { start: new Date(2026, 8, 12), hStart: 1 },
    { start: new Date(2026, 9, 12), hStart: 1 },
    { start: new Date(2026, 10, 11), hStart: 1 },
    { start: new Date(2026, 11, 10), hStart: 1 },
  ];

  let activeOffset = offsets[0];
  for (let i = offsets.length - 1; i >= 0; i--) {
    if (date >= offsets[i].start) {
      activeOffset = offsets[i];
      break;
    }
  }

  const daysSinceStart = differenceInDays(date, activeOffset.start);
  return (activeOffset.hStart + daysSinceStart).toString();
};

// ==========================================
// COUNTDOWN COMPONENT
// ==========================================
const CountDown = ({ events }: { events: IslamicEvent[] }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number } | null>(null);
  const [nextEvent, setNextEvent] = useState<IslamicEvent | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const upcoming = events.find(e => isAfter(e.gregorianDate, now));

      if (upcoming) {
        setNextEvent(upcoming);
        const diffDays = differenceInDays(upcoming.gregorianDate, now);
        const diffHours = differenceInHours(upcoming.gregorianDate, now) % 24;
        const diffMinutes = differenceInMinutes(upcoming.gregorianDate, now) % 60;
        setTimeLeft({ d: diffDays, h: diffHours, m: diffMinutes });

        const totalMinutes = 30 * 24 * 60;
        const remainingMinutes = diffDays * 24 * 60 + diffHours * 60 + diffMinutes;
        setProgress(Math.max(0, Math.min(1, 1 - remainingMinutes / totalMinutes)));
      } else {
        setNextEvent(null);
        setTimeLeft(null);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [events]);

  if (!nextEvent || !timeLeft) {
    return (
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownTitle}>All events have passed.</Text>
      </View>
    );
  }

  return (
    <View style={styles.countdownContainer}>
      <View style={styles.countdownHeaderRow}>
        <Ionicons name="moon" size={normalize(20)} color={COLORS.beige} />
        <Text style={styles.countdownLabel}>UPCOMING EVENT</Text>
        <Ionicons name="star" size={normalize(14)} color={COLORS.beigeSecondary} />
      </View>

      <Text style={styles.countdownEventName}>{nextEvent.title}</Text>
      <Text style={styles.countdownHijri}>{nextEvent.hijriDate}</Text>

      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={[COLORS.beige, COLORS.beigeSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${progress * 100}%` }]}
        />
      </View>

      <View style={styles.timerRow}>
        {[
          { value: timeLeft.d, label: 'Days' },
          { value: timeLeft.h, label: 'Hours' },
          { value: timeLeft.m, label: 'Mins' },
        ].map((block, idx) => (
          <React.Fragment key={block.label}>
            {idx > 0 && <Text style={styles.timerSeparator}>:</Text>}
            <View style={styles.timerBlock}>
              <LinearGradient
                colors={['rgba(245,245,220,0.15)', 'rgba(245,245,220,0.05)']}
                style={styles.timerBlockBg}
              >
                <Text style={styles.timerNumber}>{block.value}</Text>
                <Text style={styles.timerLabel}>{block.label}</Text>
              </LinearGradient>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={styles.countdownDateContainer}>
        <Ionicons name="calendar-outline" size={normalize(13)} color={COLORS.beigeSecondary} />
        <Text style={styles.countdownDate}>
          {format(nextEvent.gregorianDate, 'EEEE, d MMMM yyyy')}
        </Text>
      </View>
    </View>
  );
};

// ==========================================
// CALENDAR LEGEND COMPONENT
// ==========================================
const CalendarLegend = () => {
  const legendItems = [
    { label: 'Fasting', color: COLORS.fasting },
    { label: 'Festival', color: COLORS.festival },
    { label: 'Sacred', color: COLORS.sacred },
    { label: 'Month Start', color: COLORS.beigeSecondary },
  ];

  return (
    <View style={styles.legendContainer}>
      {legendItems.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendBadge, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ==========================================
// CALENDAR GRID COMPONENT
// ==========================================
const CalendarGrid = ({
  currentDate,
  events,
  onSelectDate,
}: {
  currentDate: Date;
  events: IslamicEvent[];
  onSelectDate: (date: Date) => void;
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'fasting': return COLORS.fasting;
      case 'festival': return COLORS.festival;
      case 'sacred_month': return COLORS.sacred;
      case 'month_start': return COLORS.beigeSecondary;
      default: return COLORS.default;
    }
  };

  return (
    <View style={styles.calendarContainer}>
      <LinearGradient
        colors={['rgba(245,245,220,0.1)', 'rgba(245,245,220,0.05)']}
        style={styles.calendarGradient}
      >
        <View style={styles.weekRow}>
          {weekDays.map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarDays.map((day: Date, index: number) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayEvents = events.filter(e => isSameDay(e.gregorianDate, day));
            const hijriDayNumber = getHardcodedHijriDay(day);

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayCell, !isCurrentMonth && styles.disabledDayCell]}
                onPress={() => onSelectDate(day)}
                disabled={!isCurrentMonth}
                activeOpacity={0.7}
              >
                {isToday && (
                  <LinearGradient
                    colors={[COLORS.beige, COLORS.beigeSecondary]}
                    style={styles.todayCellGradient}
                  />
                )}
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth && styles.disabledDayText,
                    isToday && styles.todayText,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                <Text
                  style={[
                    styles.hijriDayText,
                    !isCurrentMonth && styles.disabledHijriText,
                    isToday && styles.todayHijriText,
                  ]}
                >
                  {hijriDayNumber}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventBoxContainer}>
                    {dayEvents.slice(0, 1).map((ev, i) => (
                      <View
                        key={i}
                        style={[styles.eventBox, { backgroundColor: getEventColor(ev.type) }]}
                      >
                        <Text numberOfLines={1} style={styles.eventBoxText}>
                          {ev.title}
                        </Text>
                      </View>
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
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function HijriCalendarApp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<IslamicEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleDateSelect = (date: Date) => {
    const event = EVENTS.find(e => isSameDay(e.gregorianDate, date));
    if (event) {
      setSelectedEvent(event);
      setIsModalVisible(true);
    }
  };

  const displayEvents = useMemo(() => {
    if (searchQuery.length > 0) {
      const lowerQuery = searchQuery.toLowerCase();
      return EVENTS.filter(
        e =>
          e.title.toLowerCase().includes(lowerQuery) ||
          e.hijriDate.toLowerCase().includes(lowerQuery),
      );
    }
    return EVENTS.filter(e => isSameMonth(e.gregorianDate, currentMonth));
  }, [currentMonth, searchQuery]);

  const getEventIcon = (type: EventType): any => {
    switch (type) {
      case 'fasting': return 'moon';
      case 'festival': return 'star';
      case 'sacred_month': return 'moon';
      case 'month_start': return 'calendar';
      default: return 'ellipse';
    }
  };

  // ── FlatList header — everything ABOVE the event list ──────────────────────
  const ListHeader = () => (
    <>
      {/* ── Calendar Nav ── */}
      {searchQuery.length === 0 && (
        <>
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={normalize(22)} color={COLORS.beige} />
            </TouchableOpacity>

            <View style={styles.monthTitleContainer}>
              <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
              <View style={styles.monthUnderline} />
            </View>

            <TouchableOpacity
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={styles.navButton}
            >
              <Ionicons name="chevron-forward" size={normalize(22)} color={COLORS.beige} />
            </TouchableOpacity>
          </View>

          <CalendarLegend />
          <CalendarGrid
            currentDate={currentMonth}
            events={EVENTS}
            onSelectDate={handleDateSelect}
          />

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Ionicons name="star" size={normalize(14)} color={COLORS.beigeSecondary} />
            <View style={styles.dividerLine} />
          </View>
        </>
      )}

      {/* ── Section header ── */}
      <View style={styles.sectionHeaderContainer}>
        <Ionicons
          name={searchQuery.length > 0 ? 'search' : 'list'}
          size={normalize(18)}
          color={COLORS.beigeSecondary}
        />
        <Text style={styles.sectionHeader}>
          {searchQuery.length > 0
            ? `Results (${displayEvents.length})`
            : 'Events This Month'}
        </Text>
      </View>
    </>
  );

  // ── Empty state when no events match ───────────────────────────────────────
  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={moderateScale(44)} color={COLORS.beigeTertiary} />
      <Text style={styles.emptyStateText}>No events found</Text>
      <Text style={styles.emptyStateSubtext}>Try adjusting your search</Text>
    </View>
  );

  // ── Individual event card ──────────────────────────────────────────────────
  const renderEventItem = ({ item }: { item: IslamicEvent }) => {
    let iconColor = COLORS.default;
    if (item.type === 'fasting') iconColor = COLORS.fasting;
    else if (item.type === 'festival') iconColor = COLORS.festival;
    else if (item.type === 'sacred_month') iconColor = COLORS.sacred;
    else if (item.type === 'month_start') iconColor = COLORS.beigeSecondary;

    return (
      <TouchableOpacity activeOpacity={0.7}>
        <LinearGradient
          colors={['rgba(245,245,220,0.12)', 'rgba(245,245,220,0.08)']}
          style={styles.eventCard}
        >
          <View style={[styles.eventIconContainer, { borderColor: iconColor }]}>
            <Ionicons name={getEventIcon(item.type)} size={normalize(22)} color={iconColor} />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.eventRow}>
              <View style={styles.eventBadge}>
                <Ionicons name="moon-outline" size={normalize(11)} color={COLORS.beigeSecondary} />
                <Text style={styles.eventHijri}>{item.hijriDate}</Text>
              </View>
              <View style={styles.eventBadge}>
                <Ionicons
                  name="calendar-outline"
                  size={normalize(11)}
                  color={COLORS.beigeTertiary}
                />
                <Text style={styles.eventGregorian}>
                  {format(item.gregorianDate, 'd MMM yyyy')}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={normalize(18)} color={COLORS.beigeTertiary} />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    // ── SafeAreaView wraps the entire screen, respecting notch + home bar ──
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Translucent status bar — keeps the gradient visible on Android */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Full-screen gradient background */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
        style={styles.gradientFill}
      >
        {/* ── Fixed header: back button + countdown ── */}
        <View style={styles.headerArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={normalize(24)} color={COLORS.beige} />
          </TouchableOpacity>
          <CountDown events={EVENTS} />
        </View>

        {/* ── Sticky search bar ── */}
        <View style={styles.searchContainer}>
          <LinearGradient
            colors={['rgba(245,245,220,0.15)', 'rgba(245,245,220,0.1)']}
            style={styles.searchGradient}
          >
            <Ionicons
              name="search"
              size={normalize(18)}
              color={COLORS.beigeSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events & dates..."
              placeholderTextColor={COLORS.beigeTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={normalize(18)} color={COLORS.beigeSecondary} />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* ── Main scrollable content as FlatList ── */}
        <FlatList
          ref={flatListRef}
          data={displayEvents}
          keyExtractor={item => item.id}
          renderItem={renderEventItem}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<ListEmpty />}
          ListFooterComponent={<View style={{ height: verticalScale(24) }} />}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          // Keeps list items from shifting when keyboard opens on Android
          onScrollBeginDrag={() => { /* noop */ }}
        />
      </LinearGradient>

      {/* ── Event detail modal ── */}
      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        statusBarTranslucent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[COLORS.gradientMid, COLORS.gradientEnd]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Ionicons
                  name={getEventIcon(selectedEvent?.type ?? 'other')}
                  size={moderateScale(30)}
                  color={COLORS.beige}
                />
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={normalize(22)} color={COLORS.beigeSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
              <Text style={styles.modalHijri}>{selectedEvent?.hijriDate}</Text>

              <View style={styles.modalDivider} />

              <View style={styles.modalRow}>
                <Ionicons name="calendar-outline" size={normalize(16)} color={COLORS.beigeSecondary} />
                <Text style={styles.modalDate}>
                  {selectedEvent
                    ? format(selectedEvent.gregorianDate, 'EEEE, d MMMM yyyy')
                    : ''}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  // ── Root ───────────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gradientEnd, // matches gradient bottom so no flash
  },
  gradientFill: {
    flex: 1,
  },

  // ── FlatList ───────────────────────────────────────────────────────────────
  flatListContent: {
    paddingHorizontal: 0,
    paddingBottom: verticalScale(16),
  },

  // ── Fixed header ───────────────────────────────────────────────────────────
  headerArea: {
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
    paddingHorizontal: wp(5),
  },
  backButton: {
    alignSelf: 'flex-start',
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(245,245,220,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.2)',
    marginBottom: verticalScale(12),
  },

  // ── Countdown ──────────────────────────────────────────────────────────────
  countdownContainer: {
    alignItems: 'center',
  },
  countdownTitle: {
    color: COLORS.beige,
    fontSize: normalize(17),
    fontWeight: 'bold',
  },
  countdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    gap: scale(8),
  },
  countdownLabel: {
    color: COLORS.beigeSecondary,
    fontSize: normalize(10),
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  countdownEventName: {
    color: COLORS.beige,
    fontSize: normalize(19),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(2),
  },
  countdownHijri: {
    color: COLORS.beigeSecondary,
    fontSize: normalize(12),
    marginBottom: verticalScale(12),
  },
  progressBarContainer: {
    width: wp(70),
    height: scale(3),
    backgroundColor: 'rgba(245,245,220,0.2)',
    borderRadius: scale(2),
    marginBottom: verticalScale(14),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: scale(2),
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
    gap: scale(8),
  },
  timerBlock: {
    alignItems: 'center',
  },
  timerBlockBg: {
    paddingHorizontal: wp(3),
    paddingVertical: verticalScale(8),
    borderRadius: scale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.2)',
    minWidth: scale(54),
  },
  timerNumber: {
    color: COLORS.beige,
    fontSize: normalize(20),
    fontWeight: 'bold',
    lineHeight: normalize(24),
  },
  timerLabel: {
    color: COLORS.beigeSecondary,
    fontSize: normalize(8),
    fontWeight: '600',
    marginTop: verticalScale(1),
  },
  timerSeparator: {
    color: COLORS.beigeSecondary,
    fontSize: normalize(20),
    lineHeight: verticalScale(38),
    opacity: 0.5,
  },
  countdownDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  countdownDate: {
    color: COLORS.beigeSecondary,
    fontSize: normalize(13),
    fontWeight: '500',
  },

  // ── Search ─────────────────────────────────────────────────────────────────
  searchContainer: {
    marginHorizontal: wp(5),
    marginBottom: verticalScale(16),
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(16),
    paddingHorizontal: wp(4),
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.2)',
  },
  searchIcon: {
    marginRight: scale(12),
  },
  searchInput: {
    flex: 1,
    color: COLORS.beige,
    fontSize: normalize(14),
    fontWeight: '500',
    // Prevent Android from adding extra padding
    paddingVertical: 0,
  },

  // ── Month navigation ───────────────────────────────────────────────────────
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: verticalScale(16),
  },
  navButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(245,245,220,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.2)',
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: normalize(19),
    fontWeight: 'bold',
    color: COLORS.beige,
    letterSpacing: 0.5,
  },
  monthUnderline: {
    width: scale(60),
    height: scale(3),
    backgroundColor: COLORS.beigeSecondary,
    marginTop: verticalScale(6),
    borderRadius: scale(2),
  },

  // ── Legend ─────────────────────────────────────────────────────────────────
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scale(12),
    marginBottom: verticalScale(14),
    paddingHorizontal: wp(5),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  legendBadge: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(2),
  },
  legendText: {
    color: COLORS.beigeSecondary,
    fontSize: normalize(10),
    fontWeight: '500',
  },

  // ── Calendar grid ──────────────────────────────────────────────────────────
  calendarContainer: {
    marginHorizontal: wp(4),
    borderRadius: scale(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.2)',
  },
  calendarGradient: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: wp(3),
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,245,220,0.1)',
    paddingBottom: verticalScale(8),
  },
  weekDayText: {
    width: '14.28%',
    color: COLORS.beigeSecondary,
    fontSize: normalize(11),
    textAlign: 'center',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: '14.28%',
    height: verticalScale(56),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(1),
  },
  disabledDayCell: {
    opacity: 0.25,
  },
  todayCellGradient: {
    position: 'absolute',
    width: '88%',
    height: '88%',
    borderRadius: scale(10),
  },
  dayText: {
    fontSize: normalize(14),
    color: COLORS.beige,
    fontWeight: '600',
    zIndex: 1,
  },
  hijriDayText: {
    fontSize: normalize(8),
    color: COLORS.beigeSecondary,
    fontWeight: '600',
    marginTop: verticalScale(1),
    zIndex: 1,
  },
  disabledDayText: {
    color: COLORS.beigeTertiary,
  },
  disabledHijriText: {
    color: 'rgba(184,164,136,0.4)',
  },
  todayText: {
    color: COLORS.gradientStart,
    fontWeight: 'bold',
  },
  todayHijriText: {
    color: COLORS.gradientMid,
  },
  eventBoxContainer: {
    position: 'absolute',
    bottom: scale(2),
    width: '90%',
    alignItems: 'center',
  },
  eventBox: {
    width: '100%',
    paddingVertical: verticalScale(1),
    paddingHorizontal: wp(0.5),
    borderRadius: scale(3),
    opacity: 0.85,
  },
  eventBoxText: {
    fontSize: normalize(6),
    color: '#032626',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(5),
    marginVertical: verticalScale(20),
    gap: scale(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245,245,220,0.2)',
  },

  // ── Events list ────────────────────────────────────────────────────────────
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginLeft: wp(5),
    marginBottom: verticalScale(14),
  },
  sectionHeader: {
    fontSize: normalize(17),
    fontWeight: 'bold',
    color: COLORS.beige,
    letterSpacing: 0.5,
  },
  eventCard: {
    borderRadius: scale(16),
    paddingVertical: verticalScale(14),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    marginHorizontal: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.15)',
  },
  eventIconContainer: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
    backgroundColor: 'rgba(245,245,220,0.1)',
    borderWidth: 2,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.beige,
    marginBottom: verticalScale(5),
  },
  eventRow: {
    flexDirection: 'row',
    gap: scale(10),
    flexWrap: 'wrap',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  eventHijri: {
    fontSize: normalize(11),
    color: COLORS.beigeSecondary,
    fontWeight: '500',
  },
  eventGregorian: {
    fontSize: normalize(11),
    color: COLORS.beigeTertiary,
    fontWeight: '500',
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: verticalScale(48),
  },
  emptyStateText: {
    color: COLORS.beige,
    fontSize: normalize(17),
    fontWeight: '600',
    marginTop: verticalScale(16),
  },
  emptyStateSubtext: {
    color: COLORS.beigeTertiary,
    fontSize: normalize(13),
    marginTop: verticalScale(6),
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp(85),
    borderRadius: scale(24),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,245,220,0.2)',
  },
  modalGradient: {
    paddingVertical: verticalScale(24),
    paddingHorizontal: wp(6),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(16),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: COLORS.beige,
    marginBottom: verticalScale(4),
  },
  modalHijri: {
    fontSize: normalize(15),
    color: COLORS.beigeSecondary,
    marginBottom: verticalScale(20),
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(245,245,220,0.1)',
    marginBottom: verticalScale(20),
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  modalDate: {
    color: COLORS.beige,
    fontSize: normalize(13),
  },
});