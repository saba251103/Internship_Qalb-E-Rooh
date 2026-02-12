import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ---------------- RESPONSIVE SCALING ---------------- */
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/* ---------------- NOTIFICATION CONFIGURATION ---------------- */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* ---------------- TYPES ---------------- */
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

/* ---------------- CONSTANTS ---------------- */
const PRAYER_ICONS: Record<PrayerName, string> = {
  Fajr: 'weather-night',
  Sunrise: 'weather-sunset-up',
  Dhuhr: 'weather-sunny',
  Asr: 'weather-sunset-down',
  Maghrib: 'weather-sunset',
  Isha: 'moon-waning-crescent',
};

const PRAYER_ORDER: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const NOTIFICATION_MINUTES_BEFORE = 10;

/* ---------------- UTILITY FUNCTIONS ---------------- */
const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return { h, m, totalMin: h * 60 + m };
};

const formatCountdown = (hours: number, minutes: number, seconds: number): string => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatTime12Hour = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function PrayerTimesScreen() {
  const router = useRouter();
  const [selectedMadhab, setSelectedMadhab] = useState<MadhabType>('hanafi');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPrayer, setCurrentPrayer] = useState<PrayerName>('Fajr');
  const [nextPrayer, setNextPrayer] = useState<PrayerName>('Dhuhr');
  const [countdown, setCountdown] = useState<CountdownState>({ hours: 0, minutes: 0, seconds: 0 });
  const [location, setLocation] = useState('Loading...');
  const [islamicDate, setIslamicDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  /* ---------------- LOCATION SETUP ---------------- */
  useEffect(() => {
    let isMounted = true;
    const setupLocation = async () => {
      try {
        await Notifications.requestPermissionsAsync();
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!isMounted) return;
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverseGeocode[0]) {
          setLocation(reverseGeocode[0].city || reverseGeocode[0].region || 'Current Location');
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to get location');
          setLoading(false);
        }
      }
    };
    setupLocation();
    return () => { isMounted = false; };
  }, []);

  /* ---------------- FETCH PRAYER TIMES ---------------- */
  const fetchPrayerTimes = useCallback(async (madhab: MadhabType) => {
    if (!coords) return;
    try {
      setLoading(true);
      const today = new Date();
      const school = madhab === 'hanafi' ? 1 : 0;
      const url = `https://api.aladhan.com/v1/calendar?latitude=${coords.latitude}&longitude=${coords.longitude}&method=1&school=${school}&month=${today.getMonth() + 1}&year=${today.getFullYear()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200 && data.data?.[today.getDate() - 1]) {
        const dayData = data.data[today.getDate() - 1];
        setIslamicDate(`${dayData.date.hijri.day} ${dayData.date.hijri.month.en} ${dayData.date.hijri.year}`);
        const t = dayData.timings;
        const newTimings: PrayerTimes = {
          Fajr: t.Fajr.split(' ')[0],
          Sunrise: t.Sunrise.split(' ')[0],
          Dhuhr: t.Dhuhr.split(' ')[0],
          Asr: t.Asr.split(' ')[0],
          Maghrib: t.Maghrib.split(' ')[0],
          Isha: t.Isha.split(' ')[0],
        };
        setTimings(newTimings);
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    if (coords) fetchPrayerTimes(selectedMadhab);
  }, [coords, selectedMadhab, fetchPrayerTimes]);

  /* ---------------- PRAYER TIME CALCULATIONS ---------------- */
  useEffect(() => {
    if (!timings) return;
    const updatePrayer = () => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const currentSec = now.getSeconds();
      const times = PRAYER_ORDER.map(p => ({ name: p, ...parseTime(timings[p]) }));

      let current: PrayerName = 'Isha';
      let next: PrayerName = 'Fajr';

      for (let i = 0; i < times.length; i++) {
        if (currentMin >= times[i].totalMin) {
          current = times[i].name;
          next = times[(i + 1) % times.length].name;
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
    };
    const interval = setInterval(updatePrayer, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  /* ---------------- RENDERING HELPERS ---------------- */
  const madhabButtons = useMemo(() => {
    return (['hanafi', 'shafi', 'maliki', 'hanbali'] as MadhabType[]).map(m => (
      <TouchableOpacity
        key={m}
        style={[styles.madhabBtn, selectedMadhab === m && styles.madhabBtnActive]}
        onPress={() => setSelectedMadhab(m)}
      >
        <Text style={[styles.madhabBtnText, selectedMadhab === m && styles.madhabBtnTextActive]}>
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </Text>
      </TouchableOpacity>
    ));
  }, [selectedMadhab]);

  const prayerRows = useMemo(() => {
    if (!timings) return null;
    return PRAYER_ORDER.map(name => {
      const isCurrent = currentPrayer === name;
      const { h, m } = parseTime(timings[name]);
      return (
        <View key={name} style={[styles.prayerRow, isCurrent && styles.currentPrayerRow]}>
          <View style={styles.prayerLeft}>
            <View style={[styles.prayerIconCircle, isCurrent && styles.currentPrayerIconCircle]}>
              <MaterialCommunityIcons name={PRAYER_ICONS[name] as any} size={18} color="#FFF" />
            </View>
            <Text style={[styles.prayerName, isCurrent && styles.currentPrayerText]}>{name}</Text>
          </View>
          <Text style={[styles.prayerTime, isCurrent && styles.currentPrayerText]}>{formatTime12Hour(h, m)}</Text>
        </View>
      );
    });
  }, [timings, currentPrayer]);

  if (loading && !timings) {
    return (
      <LinearGradient colors={['#0A4A4A', '#145E5E']} style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color="#FFF" /></View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A4A4A', '#145E5E', '#0A4A4A']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* CUSTOM NAVIGATION BAR */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButtonCircle}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Prayer Times</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mainContent}>
          {/* HEADER INFO */}
          <View style={styles.header}>
            <Text style={styles.nextPrayerLabel}>Next Prayer: {nextPrayer} in</Text>
            <Text style={styles.countdownText}>
              {formatCountdown(countdown.hours, countdown.minutes, countdown.seconds)}
            </Text>

            <View style={styles.sehariIftarRow}>
              <View style={styles.sehariIftarItem}>
                <View style={styles.iconCircle}><MaterialCommunityIcons name="weather-night" size={16} color="#0A4A4A" /></View>
                <Text style={styles.sehariIftarText}>Sehari: {timings?.Fajr} AM</Text>
              </View>
              <View style={styles.sehariIftarItem}>
                <View style={styles.iconCircle}><MaterialCommunityIcons name="food-fork-drink" size={16} color="#0A4A4A" /></View>
                <Text style={styles.sehariIftarText}>Iftar: {timings?.Maghrib} PM</Text>
              </View>
            </View>
          </View>

          {/* MAIN CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.locationRow}>
                <View style={styles.locationIconCircle}><MaterialCommunityIcons name="map-marker" size={14} color="#FFF" /></View>
                <Text style={styles.locationText}>{location}</Text>
              </View>
              <Text style={styles.islamicDate}>{islamicDate}</Text>
            </View>

            <View style={styles.madhabRow}>{madhabButtons}</View>
            <View style={styles.prayerListContainer}>{prayerRows}</View>
          </View>
          
          <View style={{ height: 20 }} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    height: verticalScale(50),
  },
  backButtonCircle: {
    width: moderateScale(40),
    height: moderateScale(70),
    justifyContent: 'center',
    alignItems: 'center',

  },
  navTitle: { fontSize: moderateScale(18), fontWeight: '600', color: '#FFF' },
  mainContent: { flex: 1, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingVertical: verticalScale(10) },
  nextPrayerLabel: { fontSize: moderateScale(18), color: '#9FF0D0', fontWeight: '500' },
  countdownText: { fontSize: moderateScale(50), fontWeight: '300', color: '#FFF', letterSpacing: 2, marginVertical: 10 },
  sehariIftarRow: { flexDirection: 'row', gap: 15 },
  sehariIftarItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#9FF0D0', justifyContent: 'center', alignItems: 'center' },
  sehariIftarText: { color: '#FFF', fontSize: moderateScale(13) },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    marginHorizontal: scale(15),
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  cardHeader: { alignItems: 'center', marginBottom: 15 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationIconCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#4FA3A3', justifyContent: 'center', alignItems: 'center' },
  locationText: { fontSize: moderateScale(17), fontWeight: '700', color: '#0A4A4A' },
  islamicDate: { color: '#4FA3A3', fontSize: 12, marginTop: 4 },
  madhabRow: { flexDirection: 'row', gap: 5, marginBottom: 15 },
  madhabBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F0FDF8', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  madhabBtnActive: { backgroundColor: '#9FF0D0', borderColor: '#4FA3A3' },
  madhabBtnText: { fontSize: 11, fontWeight: '600', color: '#4FA3A3' },
  madhabBtnTextActive: { color: '#0A4A4A' },
  prayerListContainer: { marginTop: 5 },
  prayerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0FDF8' },
  currentPrayerRow: { backgroundColor: '#9FF0D0', borderRadius: 15, paddingHorizontal: 10, borderBottomColor: 'transparent' },
  prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#4FA3A3', justifyContent: 'center', alignItems: 'center' },
  currentPrayerIconCircle: { backgroundColor: '#0A4A4A' },
  prayerName: { fontSize: moderateScale(16), color: '#0A4A4A', fontWeight: '500' },
  prayerTime: { fontSize: moderateScale(18), fontWeight: '700', color: '#0A4A4A' },
  currentPrayerText: { fontWeight: '800' },
});