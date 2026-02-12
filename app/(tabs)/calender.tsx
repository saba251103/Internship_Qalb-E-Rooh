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
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// --- Types ---

type EventType = 'fasting' | 'festival' | 'month_start' | 'sacred_month' | 'other';

interface IslamicEvent {
  id: string;
  gregorianDate: Date;
  hijriDate: string;
  title: string;
  type: EventType;
}

// --- Data ---

const RAW_EVENTS = [
  { date: "2026-01-02", title: "Fasting Ayyamul Bidh", hijri: "13 Rajab 1447 AH", type: "fasting" },
  { date: "2026-01-03", title: "Fasting Ayyamul Bidh", hijri: "14 Rajab 1447 AH", type: "fasting" },
  { date: "2026-01-04", title: "Fasting Ayyamul Bidh", hijri: "15 Rajab 1447 AH", type: "fasting" },
  { date: "2026-01-16", title: "Isra' Mi'raj", hijri: "27 Rajab 1447 AH", type: "festival" },
  { date: "2026-01-20", title: "Start of Sha'ban", hijri: "1 Sha'ban 1447 AH", type: "month_start" },
  { date: "2026-02-01", title: "Fasting Ayyamul Bidh", hijri: "13 Sha'ban 1447 AH", type: "fasting" },
  { date: "2026-02-02", title: "Fasting Ayyamul Bidh", hijri: "14 Sha'ban 1447 AH", type: "fasting" },
  { date: "2026-02-03", title: "Nisfu Sha'ban / Fasting", hijri: "15 Sha'ban 1447 AH", type: "festival" },
  { date: "2026-02-19", title: "Start of Ramadan", hijri: "1 Ramadan 1447 AH", type: "festival" },
  { date: "2026-03-07", title: "Nuzul-al Qur'an", hijri: "17 Ramadan 1447 AH", type: "other" },
  { date: "2026-03-17", title: "Laylat al-Qadr", hijri: "27 Ramadan 1447 AH", type: "festival" },
  { date: "2026-03-20", title: "Eid ul-Fitr", hijri: "1 Shawwal 1447 AH", type: "festival" },
  { date: "2026-04-01", title: "Fasting Ayyamul Bidh", hijri: "13 Shawwal 1447 AH", type: "fasting" },
  { date: "2026-04-02", title: "Fasting Ayyamul Bidh", hijri: "14 Shawwal 1447 AH", type: "fasting" },
  { date: "2026-04-03", title: "Fasting Ayyamul Bidh", hijri: "15 Shawwal 1447 AH", type: "fasting" },
  { date: "2026-04-18", title: "Start of Dhul-Qa'dah", hijri: "1 Dhul-Qa'dah 1447 AH", type: "sacred_month" },
  { date: "2026-04-30", title: "Fasting Ayyamul Bidh", hijri: "13 Dhul-Qa'dah 1447 AH", type: "fasting" },
  { date: "2026-05-01", title: "Fasting Ayyamul Bidh", hijri: "14 Dhul-Qa'dah 1447 AH", type: "fasting" },
  { date: "2026-05-02", title: "Fasting Ayyamul Bidh", hijri: "15 Dhul-Qa'dah 1447 AH", type: "fasting" },
  { date: "2026-05-18", title: "Start of Dhul-Hijjah", hijri: "1 Dhul-Hijjah 1447 AH", type: "sacred_month" },
  { date: "2026-05-26", title: "Wuquf in 'Arafa (Hajj)", hijri: "9 Dhul-Hijjah 1447 AH", type: "festival" },
  { date: "2026-05-27", title: "Eid ul-Adha", hijri: "10 Dhul-Hijjah 1447 AH", type: "festival" },
  { date: "2026-05-28", title: "Days of Tashriq", hijri: "11-13 Dhul-Hijjah", type: "other" },
  { date: "2026-05-31", title: "Fasting Ayyamul Bidh", hijri: "14 Dhul-Hijjah 1447 AH", type: "fasting" },
  { date: "2026-06-01", title: "Fasting Ayyamul Bidh", hijri: "15 Dhul-Hijjah 1447 AH", type: "fasting" },
  { date: "2026-06-16", title: "Islamic New Year", hijri: "1 Muharram 1448 AH", type: "sacred_month" },
  { date: "2026-06-24", title: "Fasting Tasu'a", hijri: "9 Muharram 1448 AH", type: "fasting" },
  { date: "2026-06-25", title: "Fasting 'Ashura", hijri: "10 Muharram 1448 AH", type: "fasting" },
  { date: "2026-06-28", title: "Fasting Ayyamul Bidh", hijri: "13 Muharram 1448 AH", type: "fasting" },
  { date: "2026-06-29", title: "Fasting Ayyamul Bidh", hijri: "14 Muharram 1448 AH", type: "fasting" },
  { date: "2026-06-30", title: "Fasting Ayyamul Bidh", hijri: "15 Muharram 1448 AH", type: "fasting" },
  { date: "2026-07-16", title: "Start of Safar", hijri: "1 Safar 1448 AH", type: "month_start" },
  { date: "2026-07-28", title: "Fasting Ayyamul Bidh", hijri: "13 Safar 1448 AH", type: "fasting" },
  { date: "2026-07-29", title: "Fasting Ayyamul Bidh", hijri: "14 Safar 1448 AH", type: "fasting" },
  { date: "2026-07-30", title: "Fasting Ayyamul Bidh", hijri: "15 Safar 1448 AH", type: "fasting" },
  { date: "2026-08-14", title: "Start of Rabi' al-Awwal", hijri: "1 Rabi' al-Awwal 1448 AH", type: "month_start" },
  { date: "2026-08-25", title: "Mawlid (Birth) of Prophet", hijri: "12 Rabi' al-Awwal 1448 AH", type: "festival" },
  { date: "2026-08-26", title: "Fasting Ayyamul Bidh", hijri: "13 Rabi' al-Awwal 1448 AH", type: "fasting" },
  { date: "2026-08-27", title: "Fasting Ayyamul Bidh", hijri: "14 Rabi' al-Awwal 1448 AH", type: "fasting" },
  { date: "2026-08-28", title: "Fasting Ayyamul Bidh", hijri: "15 Rabi' al-Awwal 1448 AH", type: "fasting" },
  { date: "2026-09-12", title: "Start of Rabi' ath-Thani", hijri: "1 Rabi' ath-Thani 1448 AH", type: "month_start" },
  { date: "2026-09-24", title: "Fasting Ayyamul Bidh", hijri: "13 Rabi' ath-Thani 1448 AH", type: "fasting" },
  { date: "2026-09-25", title: "Fasting Ayyamul Bidh", hijri: "14 Rabi' ath-Thani 1448 AH", type: "fasting" },
  { date: "2026-09-26", title: "Fasting Ayyamul Bidh", hijri: "15 Rabi' ath-Thani 1448 AH", type: "fasting" },
  { date: "2026-10-12", title: "Start of Jumada al-Ula", hijri: "1 Jumada al-Ula 1448 AH", type: "month_start" },
  { date: "2026-10-24", title: "Fasting Ayyamul Bidh", hijri: "13 Jumada al-Ula 1448 AH", type: "fasting" },
  { date: "2026-10-25", title: "Fasting Ayyamul Bidh", hijri: "14 Jumada al-Ula 1448 AH", type: "fasting" },
  { date: "2026-10-26", title: "Fasting Ayyamul Bidh", hijri: "15 Jumada al-Ula 1448 AH", type: "fasting" },
  { date: "2026-11-11", title: "Start of Jumada al-Akhirah", hijri: "1 Jumada al-Akhirah 1448 AH", type: "month_start" },
  { date: "2026-11-23", title: "Fasting Ayyamul Bidh", hijri: "13 Jumada al-Akhirah 1448 AH", type: "fasting" },
  { date: "2026-11-24", title: "Fasting Ayyamul Bidh", hijri: "14 Jumada al-Akhirah 1448 AH", type: "fasting" },
  { date: "2026-11-25", title: "Fasting Ayyamul Bidh", hijri: "15 Jumada al-Akhirah 1448 AH", type: "fasting" },
  { date: "2026-12-10", title: "Start of Rajab (Sacred)", hijri: "1 Rajab 1448 AH", type: "sacred_month" },
  { date: "2026-12-22", title: "Fasting Ayyamul Bidh", hijri: "13 Rajab 1448 AH", type: "fasting" },
  { date: "2026-12-23", title: "Fasting Ayyamul Bidh", hijri: "14 Rajab 1448 AH", type: "fasting" },
  { date: "2026-12-24", title: "Fasting Ayyamul Bidh", hijri: "15 Rajab 1448 AH", type: "fasting" },
];

const EVENTS: IslamicEvent[] = RAW_EVENTS.map((e, index) => ({
  id: index.toString(),
  gregorianDate: new Date(e.date),
  hijriDate: e.hijri,
  title: e.title,
  type: e.type as EventType,
}));

const COLORS = {
  // Primary gradient colors
  gradientStart: '#0A4A4A',
  gradientMid: '#064343',
  gradientEnd: '#032626',
  
  // Beige accents
  beige: '#f5f5dc',
  beigeSecondary: '#D2B48C',
  beigeTertiary: '#B8A488',
  
  // Card backgrounds
  cardBeige: 'rgba(245, 245, 220, 0.1)',
  cardBeigeHover: 'rgba(245, 245, 220, 0.12)',
  
  // Event type colors
  fasting: '#D2B48C',
  festival: '#f5f5dc',
  sacred: '#B8A488',
  default: '#8B7355',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const getHardcodedHijriDay = (date: Date): string => {
  const reference = new Date(2026, 0, 1);
  const refDay = 12;
  const diff = differenceInDays(date, reference);
  
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
        
        // Calculate progress (assuming 30 days max for visual effect)
        const totalMinutes = 30 * 24 * 60;
        const remainingMinutes = diffDays * 24 * 60 + diffHours * 60 + diffMinutes;
        setProgress(Math.max(0, Math.min(1, 1 - (remainingMinutes / totalMinutes))));
      } else {
        setNextEvent(null);
        setTimeLeft(null);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [events]);

  if (!nextEvent || !timeLeft) return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownTitle}>All events have passed.</Text>
    </View>
  );

  return (
    <View style={styles.countdownContainer}>
      <View style={styles.countdownHeaderRow}>
        <Ionicons name="moon" size={22} color={COLORS.beige} />
        <Text style={styles.countdownLabel}>UPCOMING EVENT</Text>
        <Ionicons name="star" size={16} color={COLORS.beigeSecondary} />
      </View>
      
      <Text style={styles.countdownEventName}>{nextEvent.title}</Text>
      <Text style={styles.countdownHijri}>{nextEvent.hijriDate}</Text>
      
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={[COLORS.beige, COLORS.beigeSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${progress * 100}%` }]}
        />
      </View>
      
      <View style={styles.timerRow}>
        <View style={styles.timerBlock}>
          <LinearGradient
            colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.05)']}
            style={styles.timerBlockBg}
          >
            <Text style={styles.timerNumber}>{timeLeft.d}</Text>
            <Text style={styles.timerLabel}>Days</Text>
          </LinearGradient>
        </View>
        
        <Text style={styles.timerSeparator}>:</Text>
        
        <View style={styles.timerBlock}>
          <LinearGradient
            colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.05)']}
            style={styles.timerBlockBg}
          >
            <Text style={styles.timerNumber}>{timeLeft.h}</Text>
            <Text style={styles.timerLabel}>Hours</Text>
          </LinearGradient>
        </View>
        
        <Text style={styles.timerSeparator}>:</Text>
        
        <View style={styles.timerBlock}>
          <LinearGradient
            colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.05)']}
            style={styles.timerBlockBg}
          >
            <Text style={styles.timerNumber}>{timeLeft.m}</Text>
            <Text style={styles.timerLabel}>Mins</Text>
          </LinearGradient>
        </View>
      </View>
      
      <View style={styles.countdownDateContainer}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.beigeSecondary} />
        <Text style={styles.countdownDate}>{format(nextEvent.gregorianDate, 'EEEE, d MMMM yyyy')}</Text>
      </View>
    </View>
  );
};

const CalendarGrid = ({ currentDate, events, onSelectDate }: { currentDate: Date; events: IslamicEvent[]; onSelectDate: (date: Date) => void; }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventColor = (type: EventType) => {
    switch(type) {
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
        colors={['rgba(245, 245, 220, 0.1)', 'rgba(245, 245, 220, 0.05)']}
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
                style={[
                  styles.dayCell, 
                  !isCurrentMonth && styles.disabledDayCell,
                ]}
                onPress={() => onSelectDate(day)}
                disabled={!isCurrentMonth}
              >
                {isToday && (
                  <LinearGradient
                    colors={[COLORS.beige, COLORS.beigeSecondary]}
                    style={styles.todayCellGradient}
                  />
                )}
                <Text style={[
                  styles.dayText, 
                  !isCurrentMonth && styles.disabledDayText,
                  isToday && styles.todayText
                ]}>
                  {format(day, 'd')}
                </Text>
                <Text style={[
                  styles.hijriDayText, 
                  !isCurrentMonth && styles.disabledHijriText,
                  isToday && styles.todayHijriText
                ]}>
                  {hijriDayNumber}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventBoxContainer}>
                    {dayEvents.slice(0, 1).map((ev, i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.eventBox, 
                          { backgroundColor: getEventColor(ev.type) }
                        ]}
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

export default function HijriCalendarApp() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [searchQuery, setSearchQuery] = useState('');
  // ADD THESE TWO STATES
  const [selectedEvent, setSelectedEvent] = useState<IslamicEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const CalendarLegend = () => {
    const legendItems = [
      { label: 'Fasting', color: COLORS.fasting },
      { label: 'Festival', color: COLORS.festival },
      { label: 'Sacred', color: COLORS.sacred },
      { label: 'Month Start', color: COLORS.beigeSecondary },
    ];
  
    return (
      <View style={styles.legendContainer}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  };
  // ADD THIS HANDLER FUNCTION
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
      return EVENTS.filter(e => 
        e.title.toLowerCase().includes(lowerQuery) || 
        e.hijriDate.toLowerCase().includes(lowerQuery)
      );
    }
    return EVENTS.filter(e => isSameMonth(e.gregorianDate, currentMonth));
  }, [currentMonth, searchQuery]);

  const getEventIcon = (type: EventType) => {
    switch(type) {
      case 'fasting': return 'moon';
      case 'festival': return 'star';
      case 'sacred_month': return 'moon';
      case 'month_start': return 'calendar';
      default: return 'ellipse';
    }
  };

  const renderEventItem = (item: IslamicEvent) => {
    let iconColor = COLORS.default;
    if (item.type === 'fasting') iconColor = COLORS.fasting;
    else if (item.type === 'festival') iconColor = COLORS.festival;
    else if (item.type === 'sacred_month') iconColor = COLORS.sacred;
    else if (item.type === 'month_start') iconColor = COLORS.beigeSecondary;

    return (
      <TouchableOpacity key={item.id} activeOpacity={0.7}>
        <LinearGradient
          colors={['rgba(245, 245, 220, 0.12)', 'rgba(245, 245, 220, 0.08)']}
          style={styles.eventCard}
        >
          <View style={[styles.eventIconContainer, { borderColor: iconColor }]}>
            <Ionicons name={getEventIcon(item.type)} size={24} color={iconColor} />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.eventRow}>
              <View style={styles.eventBadge}>
                <Ionicons name="moon-outline" size={12} color={COLORS.beigeSecondary} />
                <Text style={styles.eventHijri}>{item.hijriDate}</Text>
              </View>
              <View style={styles.eventBadge}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.beigeTertiary} />
                <Text style={styles.eventGregorian}>{format(item.gregorianDate, 'd MMM yyyy')}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.beigeTertiary} />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.headerArea}>
        <CountDown events={EVENTS} />
      </View>
      
      <View style={styles.searchContainer}>
        <LinearGradient
          colors={['rgba(245, 245, 220, 0.15)', 'rgba(245, 245, 220, 0.1)']}
          style={styles.searchGradient}
        >
          <Ionicons name="search" size={20} color={COLORS.beigeSecondary} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search events & dates..." 
            placeholderTextColor={COLORS.beigeTertiary}
            value={searchQuery} 
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.beigeSecondary} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {searchQuery.length === 0 && (
          <>
            <View style={styles.navRow}>
              <TouchableOpacity 
                onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.beige} />
              </TouchableOpacity>
              
              <View style={styles.monthTitleContainer}>
                <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
                <View style={styles.monthUnderline} />
              </View>
              
              <TouchableOpacity 
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward" size={24} color={COLORS.beige} />
              </TouchableOpacity>
            </View>

            <CalendarLegend />

            <CalendarGrid 
              currentDate={currentMonth} 
              events={EVENTS} 
              onSelectDate={handleDateSelect} // Change this from () => {}
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Ionicons name="star" size={16} color={COLORS.beigeSecondary} />
              <View style={styles.dividerLine} />
            </View>
          </>
        )}
        
        <View style={styles.sectionHeaderContainer}>
          <Ionicons 
            name={searchQuery.length > 0 ? "search" : "list"} 
            size={20} 
            color={COLORS.beigeSecondary} 
          />
          <Text style={styles.sectionHeader}>
            {searchQuery.length > 0 ? `Results (${displayEvents.length})` : 'Events This Month'}
          </Text>
        </View>
        
        <View style={styles.listContainer}>
          {displayEvents.length > 0 ? (
            displayEvents.map(renderEventItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.beigeTertiary} />
              <Text style={styles.emptyStateText}>No events found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 40 }} />
        
      </ScrollView>
      {/* ADD THIS MODAL BLOCK */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
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
                <Ionicons name={getEventIcon(selectedEvent?.type || 'other')} size={32} color={COLORS.beige} />
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.beigeSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
              <Text style={styles.modalHijri}>{selectedEvent?.hijriDate}</Text>
              
              <View style={styles.modalDivider} />
              
              <View style={styles.modalRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.beigeSecondary} />
                <Text style={styles.modalDate}>
                  {selectedEvent ? format(selectedEvent.gregorianDate, 'EEEE, d MMMM yyyy') : ''}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

    </LinearGradient> // This is your existing final tag
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContainer: { 
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.beige,
    marginBottom: 4,
  },
  modalHijri: {
    fontSize: 16,
    color: COLORS.beigeSecondary,
    marginBottom: 20,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalDate: {
    color: COLORS.beige,
    fontSize: 14,
  },
  // Update these specific keys in your StyleSheet.create({})

  headerArea: { 
    paddingTop: 50, // Reduced from 50
    paddingBottom: 20, // Reduced from 35
  },
  countdownEventName: { 
    color: COLORS.beige, 
    fontSize: 20, // Reduced from 24
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  countdownHijri: { 
    color: COLORS.beigeSecondary, 
    fontSize: 13, // Reduced from 15
    marginBottom: 12, // Reduced from 16
  },
  progressBarContainer: {
    width: '70%', // Narrowed from 80%
    height: 3, // Slimmer from 4
    backgroundColor: 'rgba(245, 245, 220, 0.2)',
    borderRadius: 2,
    marginBottom: 15,
    overflow: 'hidden',
  },
  timerBlockBg: {
    paddingHorizontal: 12, // Reduced from 16
    paddingVertical: 8, // Reduced from 12
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  timerNumber: { 
    color: COLORS.beige, 
    fontSize: 22, // Reduced from 28
    fontWeight: 'bold',
    lineHeight: 26,
  },
  timerLabel: { 
    color: COLORS.beigeSecondary, 
    fontSize: 9, // Reduced from 10
    fontWeight: '600',
    marginTop: 1,
  },
  timerSeparator: { 
    color: COLORS.beigeSecondary, 
    fontSize: 22, // Matched to timerNumber
    lineHeight: 40, // Adjusted for alignment
    opacity: 0.5,
  },
  countdownContainer: { 
    alignItems: 'center', 
    paddingHorizontal: 20,
  },
  countdownTitle: { 
    color: COLORS.beige, 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  countdownHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
    gap: 8,
  },
  countdownLabel: { 
    color: COLORS.beigeSecondary, 
    fontSize: 11, 
    fontWeight: '700', 
    letterSpacing: 1.5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  timerRow: { 
    flexDirection: 'row', 
    marginBottom: 18,
    gap: 8,
  },
  timerBlock: { 
    alignItems: 'center',
  },
  countdownDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownDate: { 
    color: COLORS.beigeSecondary, 
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: { 
    marginHorizontal: 20, 
    marginTop: 3, 
    marginBottom: 20,
    zIndex: 2,
  },
  searchGradient: {
    flexDirection: 'row', 
    alignItems: 'center',
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  searchIcon: { 
    marginRight: 12,
  },
  searchInput: { 
    flex: 1, 
    color: COLORS.beige, 
    fontSize: 15,
    fontWeight: '500',
  },
  // Event Box Styles
  eventBoxContainer: {
    position: 'absolute',
    bottom: 2,
    width: '90%',
    alignItems: 'center',
  },
  eventBox: {
    width: '100%',
    paddingVertical: 1,
    paddingHorizontal: 2,
    borderRadius: 3,
    opacity: 0.8,
  },
  eventBoxText: {
    fontSize: 7,
    color: '#032626',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Legend Styles
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBadge: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    color: COLORS.beigeSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  navRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.beige,
    letterSpacing: 0.5,
  },
  monthUnderline: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.beigeSecondary,
    marginTop: 6,
    borderRadius: 2,
  },
  calendarContainer: { 
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.2)',
  },
  calendarGradient: {
    padding: 16,
  },
  weekRow: { 
    flexDirection: 'row', 
    width: '100%',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 245, 220, 0.1)',
    paddingBottom: 8,
  },
  weekDayText: { 
    width: '14.28%', // 100% / 7 days
    color: '#D2B48C', 
    fontSize: 12, 
    textAlign: 'center',
    fontWeight: '600',
  },
  daysGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', // This allows the 8th day to wrap to a new line
    width: '100%',
  },
  dayCell: { 
    width: '14.28%', // 100% / 7 days
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: 2,
  },
  disabledDayCell: { 
    opacity: 0.3,
  },
  todayCellGradient: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 12,
  },
  dayText: { 
    fontSize: 16, 
    color: COLORS.beige, 
    fontWeight: '600',
    zIndex: 1,
  },
  hijriDayText: { 
    fontSize: 9, 
    color: COLORS.beigeSecondary, 
    fontWeight: '600',
    marginTop: 2,
    zIndex: 1,
  },
  disabledDayText: { 
    color: COLORS.beigeTertiary,
  },
  disabledHijriText: {
    color: 'rgba(184, 164, 136, 0.4)',
  },
  todayText: { 
    color: COLORS.gradientStart, 
    fontWeight: 'bold',
  },
  todayHijriText: {
    color: COLORS.gradientMid,
  },
  dotsContainer: { 
    flexDirection: 'row', 
    marginTop: 4, 
    gap: 3,
    zIndex: 1,
  },
  eventDot: { 
    width: 5, 
    height: 5, 
    borderRadius: 2.5,
  },
  divider: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20, 
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245, 245, 220, 0.2)',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 20,
    marginBottom: 16,
  },
  sectionHeader: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: COLORS.beige,
    letterSpacing: 0.5,
  },
  listContainer: { 
    paddingHorizontal: 16,
  },
  eventCard: { 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 245, 220, 0.15)',
  },
  eventIconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14,
    backgroundColor: 'rgba(245, 245, 220, 0.1)',
    borderWidth: 2,
  },
  eventInfo: { 
    flex: 1,
  },
  eventTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.beige,
    marginBottom: 6,
  },
  eventRow: { 
    flexDirection: 'row', 
    gap: 12,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventHijri: { 
    fontSize: 12, 
    color: COLORS.beigeSecondary,
    fontWeight: '500',
  },
  eventGregorian: { 
    fontSize: 12, 
    color: COLORS.beigeTertiary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    color: COLORS.beige,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: COLORS.beigeTertiary,
    fontSize: 14,
    marginTop: 6,
  },
});