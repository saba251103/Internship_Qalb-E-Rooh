/**
 * Qalb-E-Rooh — Prayer Times Screen
 * Play Store Ready: 100% Responsive, Accessible, and Battery-Optimized
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  PixelRatio,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchTimingsFromBackend } from '../services/prayerService';

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type MadhabType = 'hanafi' | 'shafi' | 'maliki' | 'hanbali';
type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const BASE_W = 350;
const BASE_H = 680;

const PRAYER_ICONS: Record<PrayerName, string> = {
  Fajr: 'weather-night',
  Sunrise: 'weather-sunset-up',
  Dhuhr: 'weather-sunny',
  Asr: 'weather-sunset-down',
  Maghrib: 'weather-sunset',
  Isha: 'moon-waning-crescent',
};

const PRAYER_ORDER: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const platformShadow = (elevation = 10) =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation * 0.35 },
      shadowOpacity: 0.18,
      shadowRadius: elevation * 0.75,
    },
    android: {
      elevation: elevation * 0.5,
      shadowColor: '#000',
    },
  });

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════ */
const parseTime = (timeStr: string) => {
  if (!timeStr) return { h: 0, m: 0, totalMin: 0 };
  const [h, m] = timeStr.split(':').map(Number);
  return { h, m, totalMin: h * 60 + m };
};

const formatCountdown = (h: number, m: number, s: number): string =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

const formatTime12Hour = (hour: number, minute: number): string => {
  if (isNaN(hour) || isNaN(minute)) return '--:--';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

const calculateSehariTime = (fajrTimeStr: string, minutesToSubtract: number): string => {
  if (!fajrTimeStr) return '--:-- AM';
  const { h, m } = parseTime(fajrTimeStr);
  let total = h * 60 + m - minutesToSubtract;
  if (total < 0) total += 1440;
  return formatTime12Hour(Math.floor(total / 60), total % 60);
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function PrayerTimesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* ── RESPONSIVE SYSTEM (FIX: Reactive via useWindowDimensions) ── */
  const { width: W, height: H } = useWindowDimensions();

  const scale = useCallback((size: number) => Math.round(Math.min(Math.max((W / BASE_W) * size, size * 0.75), size * 1.30)), [W]);
  const vs = useCallback((size: number) => Math.round(Math.min(Math.max((H / BASE_H) * size, size * 0.65), size * 1.35)), [H]);
  const ms = useCallback((size: number, factor = 0.5) => Math.round(size + (scale(size) - size) * factor), [scale]);
  const wp = useCallback((pct: number) => Math.round((pct / 100) * W), [W]);
  
  // FIX: Removed `/ fontScale` to respect device accessibility settings (Must Fix)
  const normalize = useCallback((size: number) => {
    const scaled = size * (W / BASE_W);
    const clamped = Math.min(Math.max(scaled, size * 0.82), size * 1.18);
    return Math.round(PixelRatio.roundToNearestPixel(clamped));
  }, [W]);

  // States
  const [selectedMadhab, setSelectedMadhab] = useState<MadhabType>('hanafi');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [sehariFormatted, setSehariFormatted] = useState('--:-- AM');
  const [iftarFormatted, setIftarFormatted] = useState('--:-- PM');
  const [loading, setLoading] = useState(true);
  const [currentPrayer, setCurrentPrayer] = useState<PrayerName>('Fajr');
  const [nextPrayer, setNextPrayer] = useState<PrayerName>('Dhuhr');
  const [countdown, setCountdown] = useState<CountdownState>({ hours: 0, minutes: 0, seconds: 0 });
  const [location, setLocation] = useState('Loading...');
  const [country, setCountry] = useState('India');
  const [islamicDate, setIslamicDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const appState = useRef(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── 1. Unified Location Logic ── */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) { setError('Location permission denied'); setLoading(false); }
          return;
        }

        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Platform.OS === 'android' ? Location.Accuracy.Low : Location.Accuracy.Balanced
          });
        }

        if (!isMounted || !loc) return;
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });

        if (geo[0] && isMounted) {
          const detectedCity = geo[0].city || geo[0].subregion || geo[0].region || 'Mumbai';
          const detectedCountry = geo[0].country || 'India';
          setLocation(detectedCity);
          setCountry(detectedCountry);
        }
      } catch (err) {
        if (isMounted) { setError('Failed to get location'); setLoading(false); }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  /* ── 2. Fetch from Backend ── */
  const fetchPrayerTimes = useCallback(async () => {
    if (!coords || location === 'Loading...') return;

    try {
      setLoading(true);
      setError(null);

      const schoolNumber = selectedMadhab === 'hanafi' ? 1 : 0;
      const data = await fetchTimingsFromBackend(location, country, schoolNumber);
      const serverTimings = data.timings;

      const newTimings: PrayerTimes = {
        Fajr: serverTimings.Fajr.split(' ')[0],
        Sunrise: serverTimings.Sunrise.split(' ')[0],
        Dhuhr: serverTimings.Dhuhr.split(' ')[0],
        Asr: serverTimings.Asr.split(' ')[0],
        Maghrib: serverTimings.Maghrib.split(' ')[0],
        Isha: serverTimings.Isha.split(' ')[0],
      };

      setTimings(newTimings);
      setSehariFormatted(calculateSehariTime(newTimings.Fajr, 10));

      const { h, m } = parseTime(newTimings.Maghrib);
      setIftarFormatted(formatTime12Hour(h, m));

      const today = new Date();
      setIslamicDate(today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));

    } catch (err) {
      setError('Connection to Qalb-E-Rooh server failed');
    } finally {
      setLoading(false);
    }
  }, [coords, location, country, selectedMadhab]);

  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes, selectedMadhab]);

  /* ── 3. Countdown Ticker (FIX: Battery Optimized via AppState) ── */
  const updatePrayer = useCallback(() => {
    if (!timings) return;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const currentSec = now.getSeconds();
    const times = PRAYER_ORDER.map(p => ({ name: p, ...parseTime(timings[p]) }));

    let current: PrayerName = 'Isha';
    let next: PrayerName = 'Fajr';

    for (let i = 0; i < times.length; i++) {
      if (currentMin >= times[i].totalMin) {
        current = times[i].name as PrayerName;
        next = times[(i + 1) % times.length].name as PrayerName;
      }
    }

    const nextTime = times.find(t => t.name === next)!.totalMin;
    let totalSeconds = (nextTime - currentMin) * 60 - currentSec;
    if (totalSeconds < 0) totalSeconds += 86400;

    setCountdown({
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    });
    setCurrentPrayer(current);
    setNextPrayer(next);
  }, [timings]);

  useEffect(() => {
    if (!timings) return;

    const startTimer = () => {
      updatePrayer();
      intervalRef.current = setInterval(updatePrayer, 1000);
    };

    const stopTimer = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    startTimer();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        startTimer();
      } else if (nextAppState.match(/inactive|background/)) {
        stopTimer();
      }
      appState.current = nextAppState;
    });

    return () => {
      stopTimer();
      subscription.remove();
    };
  }, [timings, updatePrayer]);

  /* ── 4. Dynamic Styles ── */
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    safeCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(6) },
    innerContainer: { flex: 1 },
    loadingText: { color: '#FFF', fontSize: normalize(15), marginTop: vs(16), fontWeight: '500' },
    errorText: { color: '#FFF', fontSize: normalize(15), marginTop: vs(16), textAlign: 'center', paddingHorizontal: wp(4), lineHeight: normalize(15) * 1.4 },
    retryButton: { marginTop: vs(20), backgroundColor: '#9FF0D0', paddingHorizontal: wp(8), paddingVertical: vs(13), borderRadius: scale(12), minWidth: wp(30), alignItems: 'center' },
    retryButtonText: { color: '#0A4A4A', fontSize: normalize(15), fontWeight: '700' },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(4), height: vs(56) },
    backButtonCircle: { width: scale(40), height: scale(40), justifyContent: 'center', alignItems: 'center' },
    navTitle: { fontSize: normalize(17), fontWeight: '600', color: '#FFF', flex: 1, textAlign: 'center' },
    scrollContent: { paddingHorizontal: wp(4), paddingTop: vs(4), flexGrow: 1 },
    // FIX: Tablet Layout Constraint
    tabletWrapper: { width: '100%', maxWidth: 600, alignSelf: 'center' },
    header: { alignItems: 'center', paddingVertical: vs(12) },
    nextPrayerLabel: { fontSize: normalize(16), color: '#9FF0D0', fontWeight: '500' },
    countdownText: { fontSize: normalize(46), fontWeight: '300', color: '#FFF', letterSpacing: ms(2), marginVertical: vs(8), fontVariant: ['tabular-nums'], lineHeight: normalize(56) },
    sehariIftarRow: { flexDirection: 'row', gap: scale(10), marginTop: vs(8), paddingHorizontal: wp(2) },
    sehariIftarItem: { flexDirection: 'row', alignItems: 'center', gap: scale(8), backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: scale(11), paddingVertical: vs(7), borderRadius: scale(20), flex: 1 },
    iconCircle: { width: scale(22), height: scale(22), borderRadius: scale(11), backgroundColor: '#9FF0D0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    sehariIftarText: { color: '#FFF', fontSize: normalize(12), fontWeight: '600', flexShrink: 1 },
    card: { backgroundColor: '#FFF', borderRadius: scale(28), paddingVertical: vs(18), paddingHorizontal: wp(5), ...platformShadow(10) },
    cardHeader: { alignItems: 'center', marginBottom: vs(14) },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: scale(5), maxWidth: '85%' },
    locationIconCircle: { width: scale(18), height: scale(18), borderRadius: scale(9), backgroundColor: '#4FA3A3', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    locationText: { fontSize: normalize(15), fontWeight: '700', color: '#0A4A4A', flexShrink: 1 },
    islamicDate: { color: '#4FA3A3', fontSize: normalize(11), marginTop: vs(4), fontWeight: '500' },
    madhabRow: { flexDirection: 'row', gap: scale(5), marginBottom: vs(14) },
    madhabBtn: { flex: 1, height: vs(40), borderRadius: scale(12), backgroundColor: '#F0FDF8', alignItems: 'center', borderWidth: 1, borderColor: 'transparent', justifyContent: 'center' },
    madhabBtnActive: { backgroundColor: '#9FF0D0', borderColor: '#4FA3A3' },
    madhabBtnText: { fontSize: normalize(10), fontWeight: '600', color: '#4FA3A3' },
    madhabBtnTextActive: { color: '#0A4A4A' },
    prayerListContainer: { marginTop: vs(4) },
    prayerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: vs(55), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8F8F0' },
    prayerRowLast: { borderBottomWidth: 0 },
    currentPrayerRow: { backgroundColor: '#9FF0D0', borderRadius: scale(14), paddingHorizontal: wp(3), borderBottomColor: 'transparent', marginVertical: vs(2) },
    prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: scale(12), flex: 1 },
    prayerIconCircle: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: '#4FA3A3', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    currentPrayerIconCircle: { backgroundColor: '#0A4A4A' },
    prayerName: { fontSize: normalize(14), color: '#0A4A4A', fontWeight: '500' },
    prayerTime: { fontSize: normalize(16), fontWeight: '700', color: '#0A4A4A', fontVariant: ['tabular-nums'], flexShrink: 0 },
    currentPrayerText: { fontWeight: '800' },
  }), [W, H, scale, vs, ms, normalize, wp]);

  /* ── 5. Derived Views ── */
  const madhabButtons = useMemo(() =>
    (['hanafi', 'shafi', 'maliki', 'hanbali'] as MadhabType[]).map(m => (
      <TouchableOpacity
        key={m}
        style={[styles.madhabBtn, selectedMadhab === m && styles.madhabBtnActive]}
        onPress={() => setSelectedMadhab(m)}
        activeOpacity={0.75}
        hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      >
        <Text style={[styles.madhabBtnText, selectedMadhab === m && styles.madhabBtnTextActive]}>
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </Text>
      </TouchableOpacity>
    )),
  [selectedMadhab, styles]);

  const prayerRows = useMemo(() => {
    if (!timings) return null;
    return PRAYER_ORDER.map((name, idx) => {
      const isCurrent = currentPrayer === name;
      const { h, m } = parseTime(timings[name]);
      const isLast = idx === PRAYER_ORDER.length - 1;

      return (
        <View key={name} style={[styles.prayerRow, isCurrent && styles.currentPrayerRow, isLast && styles.prayerRowLast]}>
          <View style={styles.prayerLeft}>
            <View style={[styles.prayerIconCircle, isCurrent && styles.currentPrayerIconCircle]}>
              <MaterialCommunityIcons name={PRAYER_ICONS[name] as any} size={normalize(16)} color="#FFF" />
            </View>
            <Text style={[styles.prayerName, isCurrent && styles.currentPrayerText]}>{name}</Text>
          </View>
          <Text style={[styles.prayerTime, isCurrent && styles.currentPrayerText]}>{formatTime12Hour(h, m)}</Text>
        </View>
      );
    });
  }, [timings, currentPrayer, styles, normalize]);

  /* ── Render: Loading ── */
  if (loading && !timings) {
    return (
      <LinearGradient colors={['#0A4A4A', '#145E5E']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeCenter} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading Prayer Times...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  /* ── Render: Error ── */
  if (error && !timings) {
    return (
      <LinearGradient colors={['#0A4A4A', '#145E5E']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeCenter} edges={['top', 'bottom']}>
          <MaterialCommunityIcons name="alert-circle" size={ms(60)} color="#FFF" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() => { setError(null); setLoading(true); fetchPrayerTimes(); }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  /* ── Render: Main ── */
  return (
    <LinearGradient colors={['#0A4A4A', '#145E5E', '#0A4A4A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.innerContainer}>
          
          {/* NAV BAR */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButtonCircle} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="chevron-left" size={ms(26)} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.navTitle} numberOfLines={1}>Prayer Times</Text>
            <View style={{ width: scale(40) }} />
          </View>

          {/* SCROLLABLE BODY */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vs(20) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={Platform.OS === 'ios'}
            overScrollMode="never"
          >
            {/* TABLET CONSTRAINT WRAPPER */}
            <View style={styles.tabletWrapper}>
              
              {/* HEADER */}
              <View style={styles.header}>
                <Text style={styles.nextPrayerLabel}>Next Prayer: {nextPrayer} in</Text>
                <Text style={styles.countdownText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                  {formatCountdown(countdown.hours, countdown.minutes, countdown.seconds)}
                </Text>
                <View style={styles.sehariIftarRow}>
                  <View style={styles.sehariIftarItem}>
                    <View style={styles.iconCircle}><MaterialCommunityIcons name="weather-night" size={normalize(14)} color="#0A4A4A" /></View>
                    <Text style={styles.sehariIftarText} numberOfLines={1}>Sehari: {sehariFormatted}</Text>
                  </View>
                  <View style={styles.sehariIftarItem}>
                    <View style={styles.iconCircle}><MaterialCommunityIcons name="food-fork-drink" size={normalize(14)} color="#0A4A4A" /></View>
                    <Text style={styles.sehariIftarText} numberOfLines={1}>Iftar: {iftarFormatted}</Text>
                  </View>
                </View>
              </View>

              {/* MAIN CARD */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.locationRow}>
                    <View style={styles.locationIconCircle}><MaterialCommunityIcons name="map-marker" size={normalize(12)} color="#FFF" /></View>
                    <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">{location}</Text>
                  </View>
                  <Text style={styles.islamicDate} numberOfLines={1}>{islamicDate}</Text>
                </View>
                <View style={styles.madhabRow}>{madhabButtons}</View>
                <View style={styles.prayerListContainer}>{prayerRows}</View>
              </View>
            
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}