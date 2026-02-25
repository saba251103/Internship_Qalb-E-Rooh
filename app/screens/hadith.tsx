/**
 * HadithOfTheDay.tsx — Qalb-E-Rooh
 * Sacred Luxury design: #0A4A4A teal + gold + cream
 * Full-screen immersive Hadith reading experience
 */

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import sahihBukhariData from '../../assets/data/sahih_bukhari.json';

/* ─────────────────────────────────────────────────────────────
   RESPONSIVE SYSTEM
───────────────────────────────────────────────────────────── */
const { width: W, height: H } = Dimensions.get('window');
const SCALE = Math.min(Math.max(W / 390, 0.78), 1.28);
const rs = (n: number) => Math.round(n * SCALE);
const PAD = rs(22);

/* ─────────────────────────────────────────────────────────────
   COLOR SYSTEM — matches app-wide Sacred Luxury palette
───────────────────────────────────────────────────────────── */
const C = {
  bg:      '#EAF4F2',
  surface: '#FFFFFF',

  t0: '#041C1C',
  t1: '#072828',
  t2: '#0A4A4A',
  t3: '#0D5C5C',
  t4: '#126868',
  t5: '#1C8A80',
  t6: '#3AADA0',
  t7: '#7DD4CC',
  t8: '#C2EDEA',

  g2: '#D4942A',
  g3: '#E8B84B',
  g4: '#F2CE7A',
  g5: '#FAE8B8',
  g6: '#FEF8ED',

  ink:   '#041C1C',
  inkB:  '#1A4848',
  inkC:  '#4A8A84',
  inkD:  '#8BBFBA',

  white:  '#FFFFFF',
  shadow: '#021414',
};

/* ─────────────────────────────────────────────────────────────
   DATA TYPES
───────────────────────────────────────────────────────────── */
interface HadithEntry {
  info: string;
  by: string;
  text: string;
  bookName: string;
  volumeName: string;
}

/* ─────────────────────────────────────────────────────────────
   SHADOW HELPER
───────────────────────────────────────────────────────────── */
const sh = (y = 4, op = 0.12, r = 10, el = 4) =>
  Platform.select({
    ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: y }, shadowOpacity: op, shadowRadius: r },
    android: { elevation: el },
  });

/* ─────────────────────────────────────────────────────────────
   STAR ORNAMENT
───────────────────────────────────────────────────────────── */
const Star: React.FC<{ color: string; size?: number; opacity?: number }> = ({
  color, size = rs(14), opacity = 1,
}) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity }}>
    <View style={{ position: 'absolute', width: size * 0.6, height: size * 0.6, borderWidth: 1.2, borderColor: color }} />
    <View style={{ position: 'absolute', width: size * 0.6, height: size * 0.6, borderWidth: 1.2, borderColor: color, transform: [{ rotate: '45deg' }] }} />
  </View>
);

/* ─────────────────────────────────────────────────────────────
   BOUNCE PRESS
───────────────────────────────────────────────────────────── */
const Press: React.FC<{ onPress: () => void; style?: any; children: React.ReactNode }> = ({ onPress, style, children }) => {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ transform: [{ scale: sc }] }, style]}>
      <TouchableOpacity
        activeOpacity={1} onPress={onPress}
        onPressIn={() => Animated.spring(sc, { toValue: 0.955, useNativeDriver: true, speed: 55, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 7 }).start()}
      >{children}</TouchableOpacity>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const HadithOfTheDay: React.FC = () => {
  const router = useRouter();

  const [hadith,  setHadith]  = useState<HadithEntry | null>(null);
  const [allHadiths, setAll]  = useState<HadithEntry[]>([]);
  const [dayIdx,  setDayIdx]  = useState(0);
  const [offset,  setOffset]  = useState(0); // browse offset from today's hadith
  const [bookmarked, setBM]   = useState(false);
  const [liked,   setLiked]   = useState(false);

  /* Entrance animations */
  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(rs(32))).current;
  const cardSc = useRef(new Animated.Value(0.96)).current;

  /* ── Load all hadiths ── */
  useEffect(() => {
    try {
      const all: HadithEntry[] = [];
      (sahihBukhariData as any[]).forEach(vol =>
        vol.books.forEach((book: any) =>
          book.hadiths.forEach((h: any) =>
            all.push({ ...h, bookName: book.name, volumeName: vol.name })
          )
        )
      );
      const now  = new Date();
      const doy  = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
      setAll(all);
      setDayIdx(doy % all.length);
      setHadith(all[doy % all.length]);
    } catch (e) { console.error(e); }
  }, []);

  /* ── Animate in once hadith is ready ── */
  useEffect(() => {
    if (!hadith) return;
    Animated.parallel([
      Animated.timing(fade,   { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 13, bounciness: 5 }),
      Animated.spring(cardSc, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
  }, [hadith]);

  /* ── Animate card flip on browse ── */
  const animateCardChange = (newOffset: number) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade,   { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.spring(cardSc, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 0 }),
      ]),
      Animated.parallel([
        Animated.timing(fade,   { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(cardSc, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 5 }),
      ]),
    ]).start();
    const newOff = offset + newOffset;
    const newIdx = (dayIdx + newOff + allHadiths.length * 100) % allHadiths.length;
    setOffset(newOff);
    setHadith(allHadiths[newIdx]);
    setLiked(false);
    setBM(false);
  };

  /* ── Share ── */
  const handleShare = async () => {
    if (!hadith) return;
    await Share.share({
      message: `"${hadith.text.trim()}"\n\n— ${hadith.by}\n${hadith.volumeName} · ${hadith.bookName}\n${hadith.info}\n\nShared from Qalb-E-Rooh`,
    });
  };

  /* ── Day label ── */
  const dayLabel = useMemo(() => {
    if (offset === 0) return 'Today';
    if (offset === -1) return 'Yesterday';
    if (offset === 1) return 'Tomorrow';
    return offset > 0 ? `+${offset} days` : `${offset} days`;
  }, [offset]);

  /* ── Loading ── */
  if (!hadith) {
    return (
      <View style={{ flex: 1, backgroundColor: C.t2, alignItems: 'center', justifyContent: 'center', gap: rs(20) }}>
        <LinearGradient colors={[C.t1, C.t2, C.t3]} style={StyleSheet.absoluteFill} />
        <Star color={C.g3} size={rs(48)} />
        <Text style={{ color: C.t8, fontSize: rs(13), letterSpacing: 1, fontWeight: '500' }}>Loading Hadith…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>

      {/* ── HERO HEADER ── */}
      <View style={s.hero}>
        <LinearGradient
          colors={[C.t0, C.t1, C.t2, C.t3]}
          start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Concentric ring ornaments */}
        {[rs(220), rs(155), rs(100)].map((sz, i) => (
          <View key={i} style={{
            position: 'absolute', top: -sz * 0.35, right: -sz * 0.35,
            width: sz, height: sz, borderRadius: sz / 2, borderWidth: 1,
            borderColor: ['rgba(125,212,204,0.12)', 'rgba(232,184,75,0.14)', 'rgba(255,255,255,0.07)'][i],
          }} />
        ))}
        {/* Gold shimmer line */}
        <LinearGradient
          colors={['transparent', `${C.g3}80`, `${C.g4}90`, `${C.g3}50`, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rs(2.5) }}
        />

        {/* Nav row */}
        <View style={s.navRow}>
          <Press onPress={() => router.back()} style={s.navBtn}>
            <View style={s.navBtnInner}>
              <Feather name="chevron-left" size={rs(20)} color={C.t8} />
            </View>
          </Press>

          <View style={s.navCenter}>
            <Star color={C.g3} size={rs(10)} opacity={0.8} />
            <Text style={s.navTitle}>Hadith of the Day</Text>
            <Star color={C.g3} size={rs(10)} opacity={0.8} />
          </View>

          <Press onPress={handleShare} style={s.navBtn}>
            <View style={s.navBtnInner}>
              <Feather name="share-2" size={rs(17)} color={C.t8} />
            </View>
          </Press>
        </View>

        {/* Day navigator */}
        <View style={s.dayNav}>
          <Press onPress={() => animateCardChange(-1)} style={s.dayArrow}>
            <Feather name="chevron-left" size={rs(16)} color={C.g3} />
          </Press>
          <View style={s.dayPill}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={rs(12)} color={C.g3} />
            <Text style={s.dayTxt}>{dayLabel}</Text>
          </View>
          <Press onPress={() => animateCardChange(1)} style={s.dayArrow}>
            <Feather name="chevron-right" size={rs(16)} color={C.g3} />
          </Press>
        </View>

        {/* Hadith number badge */}
        <View style={s.numBadge}>
          <Text style={s.numTxt}>#{(dayIdx + offset + allHadiths.length * 100) % allHadiths.length + 1}</Text>
          <Text style={s.numSub}>of {allHadiths.length.toLocaleString()} hadiths</Text>
        </View>
      </View>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sheet that slides up over hero */}
        <View style={s.sheet}>

          {/* ── MAIN HADITH CARD ── */}
          <Animated.View style={[s.hadithCard, { opacity: fade, transform: [{ scale: cardSc }, { translateY: slideY }] }]}>

            {/* Corner ornaments */}
            {[
              { top: 0, left: 0,    borderTopWidth: 2,    borderLeftWidth: 2  },
              { top: 0, right: 0,   borderTopWidth: 2,    borderRightWidth: 2 },
              { bottom: 0, left: 0,  borderBottomWidth: 2, borderLeftWidth: 2  },
              { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
            ].map((style, i) => (
              <View key={i} style={[s.corner, style]} />
            ))}

            {/* Subtle top teal wash */}
            <LinearGradient
              colors={[`${C.t2}08`, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Top quote ornament */}
            <View style={s.quoteTop}>
              <View style={s.quoteLineL} />
              <View style={s.quoteCircle}>
                <MaterialCommunityIcons name="format-quote-open" size={rs(22)} color={C.t2} style={{ opacity: 0.30 }} />
              </View>
              <View style={s.quoteLineR} />
            </View>

            {/* Arabic invocation */}
            <View style={s.invocWrap}>
              <Text style={s.invocArabic}>بِسْمِ اللَّهِ</Text>
            </View>

            {/* Hadith text */}
            <Text style={s.hadithText}>"{hadith.text.trim()}"</Text>

            {/* Gold gradient rule */}
            <View style={s.ruleWrap}>
              <LinearGradient
                colors={['transparent', C.g3, C.g4, C.g3, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.rule}
              />
              <View style={s.ruleStar}>
                <Star color={C.g3} size={rs(12)} />
              </View>
            </View>

            {/* Attribution block */}
            <View style={s.attribution}>
              <Text style={s.attrBy}>{hadith.by}</Text>
              <Text style={s.attrInfo}>{hadith.info}</Text>
              <View style={s.attrSourceRow}>
                <View style={s.attrSourcePill}>
                  <Text style={s.attrSourceTxt}>{hadith.volumeName}</Text>
                </View>
                <Text style={s.attrDot}>·</Text>
                <Text style={s.attrBook}>{hadith.bookName}</Text>
              </View>
            </View>

            {/* Bottom quote close */}
            <View style={s.quoteBottom}>
              <MaterialCommunityIcons name="format-quote-close" size={rs(22)} color={C.t2} style={{ opacity: 0.18, alignSelf: 'flex-end' }} />
            </View>
          </Animated.View>

          {/* ── ACTION ROW ── */}
          <Animated.View style={[s.actionRow, { opacity: fade }]}>
            {/* Bookmark */}
            <Press onPress={() => setBM(v => !v)} style={s.actionBtn}>
              <View style={[s.actionBtnInner, bookmarked && s.actionBtnActive]}>
                <MaterialCommunityIcons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={rs(20)}
                  color={bookmarked ? C.g3 : C.inkC}
                />
                <Text style={[s.actionLbl, bookmarked && { color: C.g3 }]}>Save</Text>
              </View>
            </Press>

            {/* Like */}
            <Press onPress={() => setLiked(v => !v)} style={s.actionBtn}>
              <View style={[s.actionBtnInner, liked && s.actionBtnActiveRed]}>
                <MaterialCommunityIcons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={rs(20)}
                  color={liked ? '#E85050' : C.inkC}
                />
                <Text style={[s.actionLbl, liked && { color: '#E85050' }]}>Like</Text>
              </View>
            </Press>

            {/* Share */}
            <Press onPress={handleShare} style={s.actionBtn}>
              <View style={s.actionBtnInner}>
                <Feather name="share-2" size={rs(19)} color={C.inkC} />
                <Text style={s.actionLbl}>Share</Text>
              </View>
            </Press>

            {/* Copy — just visual, extend as needed */}
            <Press onPress={() => {}} style={s.actionBtn}>
              <View style={s.actionBtnInner}>
                <Feather name="copy" size={rs(18)} color={C.inkC} />
                <Text style={s.actionLbl}>Copy</Text>
              </View>
            </Press>
          </Animated.View>

          {/* ── BOOK + VOLUME INFO CARD ── */}
          <Animated.View style={[s.metaCard, { opacity: fade }]}>
            <LinearGradient
              colors={[`${C.t2}10`, `${C.t2}04`]}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.metaRow}>
              <View style={s.metaIcon}>
                <MaterialCommunityIcons name="book-open-variant" size={rs(22)} color={C.t2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.metaTitle}>Sahih Al-Bukhari</Text>
                <Text style={s.metaSub}>{hadith.volumeName}</Text>
              </View>
              <View style={s.metaChapter}>
                <Text style={s.metaChapLbl}>Chapter</Text>
                <Text style={s.metaChapVal}>{hadith.bookName}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── BROWSE MORE CARD ── */}
          <Animated.View style={[s.browseCard, { opacity: fade }]}>
            <View style={s.browseHeader}>
              <Star color={C.g3} size={rs(11)} />
              <Text style={s.browseTitle}>Browse Hadiths</Text>
              <Star color={C.g3} size={rs(11)} />
            </View>
            <View style={s.browseRow}>
              <Press onPress={() => animateCardChange(-1)} style={{ flex: 1 }}>
                <LinearGradient
                  colors={[C.t3, C.t2]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.browseBtn}
                >
                  <Feather name="chevron-left" size={rs(16)} color={C.white} />
                  <Text style={s.browseBtnTxt}>Previous</Text>
                </LinearGradient>
              </Press>
              <Press onPress={() => { setOffset(0); const now = new Date(); const doy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000); setHadith(allHadiths[doy % allHadiths.length]); animateCardChange(0); }} style={s.todayBtn}>
                <View style={[s.browseBtnOutline]}>
                  <Text style={s.browseBtnOutlineTxt}>Today</Text>
                </View>
              </Press>
              <Press onPress={() => animateCardChange(1)} style={{ flex: 1 }}>
                <LinearGradient
                  colors={[C.t2, C.t3]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.browseBtn}
                >
                  <Text style={s.browseBtnTxt}>Next</Text>
                  <Feather name="chevron-right" size={rs(16)} color={C.white} />
                </LinearGradient>
              </Press>
            </View>
          </Animated.View>

          {/* ── READING NOTE ── */}
          <Animated.View style={[s.noteCard, { opacity: fade }]}>
            <View style={s.noteLeft}>
              <LinearGradient
                colors={[C.g3, C.g2]}
                style={s.noteBar}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.noteTitle}>About This Hadith</Text>
              <Text style={s.noteText}>
                Sahih al-Bukhari is one of the six major Hadith collections and is
                considered the most authentic book after the Quran by Sunni Muslims.
                Collected by Imam Muhammad al-Bukhari over 16 years.
              </Text>
            </View>
          </Animated.View>

          <View style={{ height: rs(32) }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.t1 },

  /* ── Hero ── */
  hero: {
    overflow: 'hidden',
    paddingHorizontal: PAD,
    paddingBottom: rs(36),
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.6, shadowRadius: 28 },
      android: { elevation: 16 },
    }),
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12), marginBottom: rs(20),
  },
  navBtn:      { borderRadius: rs(12), overflow: 'hidden' },
  navBtnInner: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  navTitle: {
    fontSize: rs(16), fontWeight: '800', color: C.white,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  /* Day navigator */
  dayNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: rs(12), marginBottom: rs(14),
  },
  dayArrow: {
    width: rs(32), height: rs(32), borderRadius: rs(10),
    backgroundColor: 'rgba(232,184,75,0.12)',
    borderWidth: 1, borderColor: 'rgba(232,184,75,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  dayPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: 'rgba(232,184,75,0.15)',
    borderWidth: 1, borderColor: 'rgba(232,184,75,0.30)',
    borderRadius: rs(20), paddingHorizontal: rs(14), paddingVertical: rs(6),
  },
  dayTxt: { color: C.g4, fontSize: rs(12), fontWeight: '700' },

  /* Hadith number */
  numBadge: { alignItems: 'center', gap: rs(2) },
  numTxt:   { color: C.white, fontSize: rs(11), fontWeight: '800', letterSpacing: 1.5 },
  numSub:   { color: C.t7,   fontSize: rs(10), fontWeight: '500' },

  /* ── Scroll ── */
  scroll:        { flex: 1 },
  scrollContent: { flexGrow: 1 },

  /* Sheet over hero */
  sheet: {
    backgroundColor: '#EAF4F2',
    borderTopLeftRadius:  rs(30),
    borderTopRightRadius: rs(30),
    marginTop: -rs(20),
    paddingTop: rs(10),
    paddingHorizontal: PAD,
    minHeight: H * 0.55,
  },

  /* ── Hadith card ── */
  hadithCard: {
    backgroundColor: C.surface,
    borderRadius: rs(24),
    padding: rs(24),
    marginTop: rs(8),
    marginBottom: rs(16),
    borderWidth: 1,
    borderColor: `${C.t2}0E`,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },
  corner: {
    position: 'absolute', width: rs(18), height: rs(18), borderColor: C.g3,
  },

  /* Quote ornament top */
  quoteTop: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: rs(18), gap: rs(10),
  },
  quoteLineL: { flex: 1, height: 1, backgroundColor: `${C.t2}14` },
  quoteLineR: { flex: 1, height: 1, backgroundColor: `${C.t2}14` },
  quoteCircle: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: `${C.t2}08`,
    borderWidth: 1, borderColor: `${C.t2}14`,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Invocation */
  invocWrap:   { alignItems: 'center', marginBottom: rs(16) },
  invocArabic: {
    color: C.t3, fontSize: rs(18),
    fontFamily: 'IndoPakQuran',
    writingDirection: 'rtl', opacity: 0.7,
  },

  /* Hadith text */
  hadithText: {
    fontSize: rs(15), color: C.ink,
    lineHeight: rs(28), textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: rs(24),
    letterSpacing: 0.1,
  },

  /* Rule */
  ruleWrap:  { alignItems: 'center', marginBottom: rs(22), position: 'relative' },
  rule:      { width: '80%', height: rs(1.5), borderRadius: rs(1) },
  ruleStar:  { position: 'absolute', top: -rs(7) },

  /* Attribution */
  attribution: { alignItems: 'center', gap: rs(5) },
  attrBy:     { fontSize: rs(14), fontWeight: '800', color: C.t2 },
  attrInfo:   { fontSize: rs(11), color: C.t5, fontWeight: '600' },
  attrSourceRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(2) },
  attrSourcePill: {
    backgroundColor: `${C.t2}12`, borderRadius: rs(20),
    borderWidth: 1, borderColor: `${C.t2}18`,
    paddingHorizontal: rs(10), paddingVertical: rs(3),
  },
  attrSourceTxt: { fontSize: rs(10), color: C.t3, fontWeight: '700' },
  attrDot:       { color: C.inkD, fontSize: rs(12) },
  attrBook:      { fontSize: rs(11), color: C.inkC, flex: 1 },

  quoteBottom: { marginTop: rs(16) },

  /* ── Action row ── */
  actionRow: {
    flexDirection: 'row', marginBottom: rs(16), gap: rs(10),
  },
  actionBtn:        { flex: 1 },
  actionBtnInner:   {
    alignItems: 'center', gap: rs(5), paddingVertical: rs(12),
    backgroundColor: C.surface, borderRadius: rs(16),
    borderWidth: 1, borderColor: `${C.t2}10`,
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  actionBtnActive: {
    backgroundColor: `${C.g3}10`, borderColor: `${C.g3}30`,
  },
  actionBtnActiveRed: {
    backgroundColor: '#E8505012', borderColor: '#E8505030',
  },
  actionLbl: { fontSize: rs(10), fontWeight: '700', color: C.inkC, letterSpacing: 0.3 },

  /* ── Meta card ── */
  metaCard: {
    backgroundColor: C.surface,
    borderRadius: rs(20), borderWidth: 1,
    borderColor: `${C.t2}10`, padding: rs(16),
    marginBottom: rs(16), overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  metaIcon: {
    width: rs(44), height: rs(44), borderRadius: rs(14),
    backgroundColor: `${C.t2}12`, borderWidth: 1, borderColor: `${C.t2}18`,
    alignItems: 'center', justifyContent: 'center',
  },
  metaTitle: { fontSize: rs(14), fontWeight: '800', color: C.ink },
  metaSub:   { fontSize: rs(11), color: C.inkC, marginTop: rs(2) },
  metaChapter: { alignItems: 'flex-end' },
  metaChapLbl: { fontSize: rs(9), color: C.inkD, fontWeight: '600', letterSpacing: 0.8 },
  metaChapVal: { fontSize: rs(11), fontWeight: '700', color: C.inkB, marginTop: rs(2), textAlign: 'right', maxWidth: rs(120) },

  /* ── Browse card ── */
  browseCard: {
    backgroundColor: C.surface,
    borderRadius: rs(22), borderWidth: 1,
    borderColor: `${C.t2}10`, padding: rs(18),
    marginBottom: rs(16),
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  browseHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: rs(8), marginBottom: rs(16),
  },
  browseTitle: { fontSize: rs(12), fontWeight: '900', color: C.t2, letterSpacing: 1.5 },
  browseRow:   { flexDirection: 'row', gap: rs(10), alignItems: 'center' },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(4), paddingVertical: rs(12), borderRadius: rs(14),
  },
  browseBtnTxt: { color: C.white, fontSize: rs(13), fontWeight: '700' },
  todayBtn:     { flex: 0.7 },
  browseBtnOutline: {
    borderWidth: 1.5, borderColor: `${C.t2}35`,
    borderRadius: rs(14), paddingVertical: rs(12),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${C.t2}08`,
  },
  browseBtnOutlineTxt: { fontSize: rs(12), fontWeight: '800', color: C.t2 },

  /* ── Note card ── */
  noteCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: rs(18), borderWidth: 1,
    borderColor: `${C.t2}0A`, padding: rs(16),
    gap: rs(14), marginBottom: rs(8),
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  noteLeft: { },
  noteBar:  { width: rs(3), borderRadius: rs(2), flex: 1 },
  noteTitle: { fontSize: rs(12), fontWeight: '800', color: C.t2, marginBottom: rs(6), letterSpacing: 0.3 },
  noteText:  { fontSize: rs(12), color: C.inkC, lineHeight: rs(20) },
});

export default HadithOfTheDay;