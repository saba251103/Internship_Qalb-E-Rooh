/**
 * PilgrimageScreen.tsx — Qalb-E-Rooh
 * Production-grade. react-native-responsive-screen + react-native-size-matters.
 * Accessibility-safe. Works on phones, tablets, foldables, all orientations.
 *
 * Install:
 *   npm install react-native-responsive-screen react-native-size-matters
 *
 * AndroidManifest.xml:
 *   <uses-permission android:name="android.permission.INTERNET" />
 *
 * Sizing rules:
 *   wp('x%') / hp('x%') → container widths / heights  (% based, rotation-safe)
 *   s(n)                → horizontal scale  (icons, horizontal pad)
 *   vs(n)               → vertical scale    (row heights, vertical pad)
 *   ms(n)               → moderate scale    (misc component sizing)
 *   fs(n)               → font sizes        (ms factor 0.3, accessibility-safe)
 *   sp(n)               → spacing / gaps    (ms factor 0.4)
 *   br(n)               → border radii      (ms factor 0.25)
 */

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
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
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale as ms, scale as s, verticalScale as vs } from 'react-native-size-matters';
import { PilgrimageService } from '../services/pilgrimageService';

// ─── Sizing shortcuts ──────────────────────────────────────
const fs = (n: number) => ms(n, 0.3);
const sp = (n: number) => ms(n, 0.4);
const br = (n: number) => ms(n, 0.25);

// ─── Design tokens ─────────────────────────────────────────
const C = {
  bg: '#EEF2F0', heroBg: '#0A4A4A', surface: '#FFFFFF',
  border: '#DDE8E3', borderDark: 'rgba(255,255,255,0.15)',
  teal: '#0D5C4A', tealLight: 'rgba(13,92,74,0.08)', tealBorder: 'rgba(13,92,74,0.18)', tealMid: 'rgba(13,92,74,0.55)',
  gold: '#C9933A', goldDim: 'rgba(201,147,58,0.12)', goldBorder: 'rgba(201,147,58,0.28)',
  textPrimary: '#0D2B22', textSecond: '#4A7066', textMuted: '#7FA898', shadow: 'rgba(13,92,74,0.10)',
};

const cardShadow = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10 },
  android: { elevation: 3 },
});

// ─── Types ─────────────────────────────────────────────────
type Tag       = { icon: string; label: string };
type BadgeType = 'mandatory' | 'essential' | 'premium' | 'luxury' | null;
type AccordionItem = {
  id: string; name: string; tagline: string; meta: string; metaIcon: string;
  bio: string; tags: Tag[]; ctaLabel: string; website: string; badge: BadgeType;
};

// ─── Data ──────────────────────────────────────────────────
const DATA: AccordionItem[] = [
  {
    id: 'haj-committee', name: 'Haj Committee of India',
    tagline: 'Official Pan-India Hajj Portal', meta: 'Govt of India · Hajj', metaIcon: 'office-building-cog',
    bio: 'The central authority for Hajj pilgrims across all Indian states. Manages the official quota, online applications, Qurrah (draw of lots), flight schedules from regional embarkation points, and standardized logistics.',
    tags: [{ icon: 'form-select', label: 'Hajj Application' }, { icon: 'airplane-takeoff', label: 'Embarkation' }, { icon: 'ticket-confirmation-outline', label: 'Qurrah Status' }],
    ctaLabel: 'Open Portal', website: 'https://hajcommittee.gov.in', badge: 'mandatory',
  },
  {
    id: 'nusuk', name: 'Nusuk',
    tagline: 'Official Saudi Portal for Umrah', meta: 'KSA Ministry · Umrah & Ziyarat', metaIcon: 'mosque',
    bio: 'While Saudi-owned, Nusuk is an essential platform for Indian Muslims planning Umrah. It allows booking for Umrah permits, Rawdah Ziyarat in Madinah, and e-visa processing for Indian passport holders.',
    tags: [{ icon: 'passport', label: 'E-Visa' }, { icon: 'calendar-check', label: 'Umrah Permits' }, { icon: 'star-crescent', label: 'Rawdah Booking' }],
    ctaLabel: 'Open Portal', website: 'https://www.nusuk.sa', badge: 'essential',
  },
  {
    id: 'atlas-tours', name: 'Atlas Tours & Travels',
    tagline: 'Premium Hajj & Umrah Packages', meta: 'Mumbai HQ · 37+ Years Exp', metaIcon: 'map-marker-path',
    bio: 'With over 37 years of trusted experience, Atlas Tours & Travels provides comprehensive, end-to-end Hajj, Umrah, and Ziyarat services across India. Highly regarded for customized premium packages, quality accommodations very close to the Haram, and reliable 24/7 on-ground support.',
    tags: [{ icon: 'shield-star', label: '37+ Years Exp' }, { icon: 'food-halal', label: 'Indian Meals' }, { icon: 'map-marker-distance', label: 'Near Haram' }],
    ctaLabel: 'Open Website', website: 'https://www.atlasumrah.com', badge: 'premium',
  },
  {
    id: 'al-irfan-tours', name: 'Al Irfan Tours & Travels',
    tagline: 'Registered Haj & Umrah Operators', meta: 'Govt Registered · Luxury Tours', metaIcon: 'crown',
    bio: 'A highly respected private tour operator with nearly 40 years of experience. Registered with the Ministry of Minority Affairs (Govt of India), Al Irfan offers curated luxury Hajj and Ramadan Umrah packages. Known for Arabic-speaking guides, lavish Indian buffets, and 5-star hotel partnerships.',
    tags: [{ icon: 'certificate', label: 'Govt Registered' }, { icon: 'account-tie-voice', label: 'Arabic Guides' }, { icon: 'silverware-fork-knife', label: 'Lavish Buffet' }],
    ctaLabel: 'Open Website', website: 'https://www.alirfantours.com', badge: 'luxury',
  },
];

const BADGE_CFG = {
  mandatory: { label: 'Most Popular', bg: '#0D5C4A', text: '#FFF' },
  essential: { label: 'Essential',    bg: '#C9933A', text: '#FFF' },
  premium:   { label: 'Premium',      bg: '#0F766E', text: '#FFF' },
  luxury:    { label: 'Luxury',       bg: '#B45309', text: '#FFF' },
};

// ─── SectionLabel ───────────────────────────────────────────
const SectionLabel = ({ text }: { text: string }) => (
  <View style={sl.row}>
    <View style={sl.line} />
    <MaterialCommunityIcons name="star-four-points" size={s(11)} color={C.gold} style={sl.star} />
    <View style={sl.pill}><Text style={sl.txt}>{text}</Text></View>
    <MaterialCommunityIcons name="star-four-points" size={s(11)} color={C.gold} style={sl.star} />
    <View style={sl.line} />
  </View>
);

// ─── RankBadge ──────────────────────────────────────────────
const RankBadge = ({ badge }: { badge: BadgeType }) => {
  if (!badge) return null;
  const cfg = BADGE_CFG[badge];
  return <View style={[bS.badge, { backgroundColor: cfg.bg }]}><Text style={[bS.text, { color: cfg.text }]}>{cfg.label}</Text></View>;
};

// ─── HeroHeader ─────────────────────────────────────────────
const HeroHeader = ({ title, arabicVerse, verseTranslation, verseRef, subtitle, onBack }: {
  title: string; arabicVerse: string; verseTranslation: string; verseRef: string; subtitle: string; onBack: () => void;
}) => (
  <View style={hh.hero}>
    <View style={hh.circle1} /><View style={hh.circle2} />
    <View style={hh.nav}>
      <TouchableOpacity style={hh.backBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Go back">
        <Feather name="arrow-left" size={s(17)} color="#FFF" />
      </TouchableOpacity>
      <Text style={hh.title}>{title}</Text>
      <View style={{ width: ms(48) }} />
    </View>
    <View style={hh.verseWrap}>
      <Text style={hh.arabic}>{arabicVerse}</Text>
      <View style={hh.ornRow}><View style={hh.ornLine} /><View style={hh.ornDiamond} /><View style={hh.ornLine} /></View>
      <Text style={hh.translation}>{verseTranslation}</Text>
      <Text style={hh.ref}>{verseRef}</Text>
    </View>
    <Text style={hh.subtitle}>{subtitle}</Text>
  </View>
);

// ─── OnboardingHint ─────────────────────────────────────────
const OnboardingHint = () => {
  const opacity = useSharedValue(1);
  useEffect(() => {
    const t = setTimeout(() => { opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }); }, 3500);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[hiS.container, style]} pointerEvents="none">
      <Feather name="chevrons-down" size={s(14)} color={C.tealMid} />
      <Text style={hiS.text}>Tap a platform to explore details</Text>
    </Animated.View>
  );
};

// ─── AccordionCard ──────────────────────────────────────────
const AccordionCard = React.memo(({ item, views, isLoaded }: { item: AccordionItem; views: number; isLoaded: boolean }) => {
  const [expanded, setExpanded]     = useState(false);
  const [localViews, setLocalViews] = useState(views);
  const hasClickedRef               = useRef(false);
  useEffect(() => { setLocalViews(views); }, [views]);

  const heightProgress  = useSharedValue(0);
  const chevronRotation = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !expanded;
    if (next) { setLocalViews(p => p + 1); PilgrimageService.trackView(item.id); }
    heightProgress.value  = withTiming(next ? 1 : 0, { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    chevronRotation.value = withTiming(next ? 1 : 0, { duration: 250 });
    setExpanded(next);
  }, [expanded, item.id]);

  const handleOpenWebsite = useCallback(async () => {
    Alert.alert('Open External Portal', `You're about to open ${item.name} in your browser.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open', onPress: async () => {
        try {
          if (!hasClickedRef.current) { hasClickedRef.current = true; PilgrimageService.trackClick(item.id); }
          const ok = await Linking.canOpenURL(item.website);
          if (ok) await Linking.openURL(item.website);
          else Alert.alert('Unable to Open Link', 'Please check if you have a browser installed.');
        } catch { Alert.alert('Something Went Wrong', 'Please try again in a moment.'); }
      }},
    ]);
  }, [item]);

  const dropdownStyle = useAnimatedStyle(() => ({ opacity: heightProgress.value, transform: [{ translateY: (1 - heightProgress.value) * -10 }], display: heightProgress.value === 0 && !expanded ? 'none' : 'flex' }));
  const chevronStyle  = useAnimatedStyle(() => ({ transform: [{ rotate: `${chevronRotation.value * 180}deg` }] }));
  const previewTags   = item.tags.slice(0, 2);
  const visibleTags   = item.tags.slice(0, 3);
  const extraCount    = item.tags.length - 3;

  return (
    <View style={[ac.card, expanded && ac.cardActive]}>
      {expanded && <View style={ac.accentBar} />}
      <TouchableOpacity activeOpacity={0.85} onPress={toggle} style={ac.headerTouch}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}: ${item.tagline}. ${expanded ? 'Collapse' : 'Expand'} details.`}
        accessibilityState={{ expanded }}>
        {item.badge && <RankBadge badge={item.badge} />}
        <View style={ac.row}>
          <View style={[ac.iconCircle, expanded && ac.iconCircleActive]}>
            <MaterialCommunityIcons name={item.metaIcon as any} size={s(22)} color={expanded ? '#FFF' : C.teal} />
          </View>
          <View style={ac.infoCol}>
            <Text style={ac.name}>{item.name}</Text>
            <Text style={ac.tagline}>{item.tagline}</Text>
            <View style={ac.metaRow}>
              <Feather name="map-pin" size={s(10)} color={C.gold} />
              <Text style={ac.metaTxt}>{item.meta}</Text>
            </View>
            {!expanded && (
              <View style={ac.previewTags}>
                {previewTags.map(t => <View key={t.label} style={ac.previewTag}><Text style={ac.previewTagTxt}>{t.label}</Text></View>)}
                {item.tags.length > 2 && <View style={ac.previewTagMore}><Text style={ac.previewTagMoreTxt}>+{item.tags.length - 2}</Text></View>}
              </View>
            )}
          </View>
          <View style={ac.rightCol}>
            <View style={ac.viewBadge}>
              <Feather name="eye" size={s(11)} color={C.gold} />
              <Text style={ac.viewNum}>{isLoaded ? localViews.toLocaleString() : '—'}</Text>
            </View>
            <Animated.View style={chevronStyle}>
              <Feather name="chevron-down" size={s(19)} color={expanded ? C.teal : C.textMuted} style={{ marginTop: vs(8) }} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
      {expanded && (
        <Animated.View style={[ac.dropdown, dropdownStyle]}>
          <View style={ac.divider} />
          <View style={ac.aboutRow}><View style={ac.aboutLine} /><Text style={ac.aboutLabel}>ABOUT</Text><View style={ac.aboutLine} /></View>
          <Text style={ac.bio}>{item.bio}</Text>
          <View style={ac.tagsWrap}>
            {visibleTags.map(t => (
              <View key={t.label} style={ac.tag}>
                <MaterialCommunityIcons name={t.icon as any} size={s(13)} color={C.teal} />
                <Text style={ac.tagTxt}>{t.label}</Text>
              </View>
            ))}
            {extraCount > 0 && <View style={[ac.tag, ac.tagMore]}><Text style={ac.tagMoreTxt}>+{extraCount} more</Text></View>}
          </View>
          <TouchableOpacity style={ac.cta} activeOpacity={0.85} onPress={handleOpenWebsite}
            accessibilityRole="button" accessibilityLabel={`${item.ctaLabel} for ${item.name}`}>
            <Text style={ac.ctaTxt}>{item.ctaLabel}</Text>
            <Feather name="external-link" size={s(14)} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
});

// ─── Main Screen ────────────────────────────────────────────
export default function PilgrimageScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet  = width > 700;
  const [statsMap, setStatsMap] = useState<Record<string, { views: number; loaded: boolean }>>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const all = await PilgrimageService.getBatchStats(DATA.map(a => a.id));
        if (isMounted) {
          const map: Record<string, { views: number; loaded: boolean }> = {};
          DATA.forEach(a => { map[a.id] = { views: all[a.id]?.views ?? 0, loaded: true }; });
          setStatsMap(map);
        }
      } catch {
        if (isMounted) {
          const map: Record<string, { views: number; loaded: boolean }> = {};
          DATA.forEach(a => { map[a.id] = { views: 0, loaded: false }; });
          setStatsMap(map);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const renderItem   = useCallback(({ item }: { item: AccordionItem }) => {
    const stat = statsMap[item.id];
    return <AccordionCard item={item} views={stat?.views ?? 0} isLoaded={stat?.loaded ?? false} />;
  }, [statsMap]);
  const keyExtractor = useCallback((item: AccordionItem) => item.id, []);

  return (
    <SafeAreaView style={scr.safe} edges={['top', 'left', 'right', 'bottom']}>
      <HeroHeader
        title="Hajj & Umrah"
        arabicVerse="وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا"
        verseTranslation="AND [DUE] TO ALLAH FROM THE PEOPLE IS A PILGRIMAGE TO THE HOUSE..."
        verseRef="AL-IMRAN 3:97"
        subtitle="Trusted platforms for your spiritual journey"
        onBack={() => router.back()}
      />
      <View style={[scr.contentWrap, isTablet && scr.contentTablet]}>
        <FlatList
          data={DATA} keyExtractor={keyExtractor} renderItem={renderItem}
          ListHeaderComponent={<><OnboardingHint /><SectionLabel text="PLATFORMS & OPERATORS" /><View style={{ height: vs(8) }} /></>}
          ListFooterComponent={
            <>
              <View style={scr.noteBanner}>
                <MaterialCommunityIcons name="information-outline" size={s(18)} color={C.teal} />
                <Text style={scr.noteTxt}>All listed platforms are trusted services dedicated to facilitating Hajj, Umrah, and Ziyarat for Indian pilgrims.</Text>
              </View>
              <View style={{ height: Math.max(insets.bottom, vs(40)) + vs(40) }} />
            </>
          }
          contentContainerStyle={scr.listContent}
          showsVerticalScrollIndicator removeClippedSubviews
          initialNumToRender={5} maxToRenderPerBatch={5} windowSize={5}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const bS  = StyleSheet.create({ badge: { alignSelf: 'flex-start', paddingHorizontal: sp(10), paddingVertical: vs(4), borderRadius: br(20), marginBottom: vs(8) }, text: { fontSize: fs(10), fontWeight: '800', letterSpacing: 0.5 } });
const hiS = StyleSheet.create({ container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(6), paddingVertical: vs(10), marginBottom: vs(4) }, text: { fontSize: fs(12), color: C.tealMid, fontWeight: '500', letterSpacing: 0.3 } });
const sl  = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: wp('5%'), marginBottom: vs(16) }, line: { flex: 1, height: 1, backgroundColor: C.border }, star: { marginHorizontal: ms(4) },
  pill: { backgroundColor: C.teal, borderRadius: br(20), paddingHorizontal: sp(16), paddingVertical: vs(6) }, txt: { fontSize: fs(10), fontWeight: '700', color: '#FFF', letterSpacing: 2 },
});
const hh  = StyleSheet.create({
  hero: { backgroundColor: C.heroBg, paddingHorizontal: wp('5%'), paddingBottom: vs(28), overflow: 'hidden' },
  circle1: { position: 'absolute', top: -ms(50), right: -ms(40), width: ms(200), height: ms(200), borderRadius: br(100), backgroundColor: 'rgba(255,255,255,0.025)' },
  circle2: { position: 'absolute', bottom: 0, left: ms(40), width: ms(120), height: ms(120), borderRadius: br(60), backgroundColor: 'rgba(255,255,255,0.018)' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: vs(10), marginBottom: vs(22) },
  backBtn: { width: ms(48), height: ms(48), borderRadius: br(14), backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: C.borderDark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fs(17), fontWeight: '800', color: '#FFF', letterSpacing: 0.4 },
  verseWrap: { alignItems: 'center', marginBottom: vs(14) },
  arabic: { fontSize: fs(22), color: '#FFF', fontWeight: '700', textAlign: 'center', lineHeight: fs(22) * 1.55, marginBottom: vs(10) },
  ornRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8), width: '70%', marginBottom: vs(10) },
  ornLine: { flex: 1, height: 1, backgroundColor: C.gold, opacity: 0.25 }, ornDiamond: { width: ms(7), height: ms(7), backgroundColor: C.gold, transform: [{ rotate: '45deg' }], opacity: 0.7 },
  translation: { fontSize: fs(11), color: 'rgba(255,255,255,0.55)', letterSpacing: 1.4, textAlign: 'center', fontWeight: '600' },
  ref: { fontSize: fs(10), color: C.gold, marginTop: vs(4), fontWeight: '600', letterSpacing: 0.5 },
  subtitle: { textAlign: 'center', fontSize: fs(13), color: 'rgba(255,255,255,0.50)', fontWeight: '400' },
});
const ac  = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: br(16), marginBottom: vs(12), borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...cardShadow },
  cardActive: { borderColor: C.teal, borderWidth: 1.5 }, accentBar: { height: vs(3), backgroundColor: C.teal }, headerTouch: { padding: sp(18) },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconCircle: { width: ms(52), height: ms(52), borderRadius: br(14), backgroundColor: C.tealLight, borderWidth: 1, borderColor: C.tealBorder, alignItems: 'center', justifyContent: 'center', marginRight: ms(14), flexShrink: 0 },
  iconCircleActive: { backgroundColor: C.teal, borderColor: C.teal }, infoCol: { flex: 1 },
  name: { fontSize: fs(16), fontWeight: '800', color: C.textPrimary, letterSpacing: -0.2 },
  tagline: { fontSize: fs(12), color: C.textSecond, marginTop: vs(2), fontWeight: '400' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: ms(4), marginTop: vs(5) }, metaTxt: { fontSize: fs(11), color: C.textMuted, fontWeight: '500' },
  rightCol: { alignItems: 'flex-end' },
  viewBadge: { flexDirection: 'row', alignItems: 'center', gap: ms(4), backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.goldBorder, borderRadius: br(20), paddingHorizontal: sp(9), paddingVertical: vs(4) },
  viewNum: { fontSize: fs(11), fontWeight: '800', color: C.gold },
  previewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(5), marginTop: vs(8) },
  previewTag: { backgroundColor: C.tealLight, borderWidth: 1, borderColor: C.tealBorder, borderRadius: br(6), paddingHorizontal: sp(8), paddingVertical: vs(3) }, previewTagTxt: { fontSize: fs(10), fontWeight: '600', color: C.teal },
  previewTagMore: { backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.goldBorder, borderRadius: br(6), paddingHorizontal: sp(8), paddingVertical: vs(3) }, previewTagMoreTxt: { fontSize: fs(10), fontWeight: '700', color: C.gold },
  dropdown: { paddingHorizontal: wp('4.5%'), paddingBottom: vs(18) }, divider: { height: 1, backgroundColor: C.border, marginBottom: vs(14) },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8), marginBottom: vs(10) }, aboutLine: { flex: 1, height: 1, backgroundColor: C.border }, aboutLabel: { fontSize: fs(9), fontWeight: '700', color: C.teal, letterSpacing: 2.5 },
  bio: { fontSize: fs(13), color: C.textSecond, lineHeight: fs(13) * 1.6, fontWeight: '400' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(8), marginTop: vs(14) },
  tag: { flexDirection: 'row', alignItems: 'center', gap: ms(6), backgroundColor: C.tealLight, borderWidth: 1, borderColor: C.tealBorder, borderRadius: br(8), paddingHorizontal: sp(10), paddingVertical: vs(7) },
  tagMore: { backgroundColor: C.goldDim, borderColor: C.goldBorder }, tagTxt: { fontSize: fs(11), fontWeight: '600', color: C.teal }, tagMoreTxt: { fontSize: fs(11), fontWeight: '700', color: C.gold },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(7), backgroundColor: C.teal, borderRadius: br(12), paddingVertical: vs(13), marginTop: vs(14), minHeight: vs(48) },
  ctaTxt: { fontSize: fs(13), fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
});
const scr = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.heroBg }, contentWrap: { flex: 1, backgroundColor: C.bg }, contentTablet: { maxWidth: 700, width: '100%', alignSelf: 'center' },
  listContent: { paddingHorizontal: wp('5%'), paddingTop: vs(20) },
  noteBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(10), marginTop: vs(6), marginBottom: vs(12), backgroundColor: C.surface, borderRadius: br(14), padding: sp(14), borderWidth: 1, borderColor: C.border, borderLeftWidth: ms(3), borderLeftColor: C.teal, ...cardShadow },
  noteTxt: { flex: 1, fontSize: fs(12), color: C.textSecond, lineHeight: fs(12) * 1.5 },
});