import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─────────────────────────────────────────
   RESPONSIVE SCALE
───────────────────────────────────────── */
const { width: W } = Dimensions.get("window");
const rs = (n: number) => Math.round((n / 390) * W);

/* ─────────────────────────────────────────
   DESIGN TOKENS
   Core: #0A4A4A deep jewel teal
   Complements: warm gold, soft coral, bright aqua
───────────────────────────────────────── */
const C = {
  bg:        "#0A4A4A",   // deep emerald black
  panel:     "#0B2E30",
  card:      "#0F3B3D",
  cardDeep:  "#051315",
  beige:    "#E9E2D0",
  beigeSoft:"#F3ECDA",
  ink:       "#F6F3E8",
  inkMid:    "#BFD6D1",
  inkDim:    "#6FA39C",
  inkFaint: "rgba(240,250,247,0.25)",
  gold:      "#3ED6C8",
  goldSoft:  "#9AF1E8",
  goldGlow:  "rgba(62,214,200,0.15)",
  aqua:     "#2F7A74",
  aquaLt:   "#5F9F98",
  mint:      "#4BB8A9",
  goldLt:   "#F3ECDA",     
  coral:    "#5F9F98",     
  // Glow system
  accentGlow: "rgba(47,122,116,0.06)",
  // Shadow
  shadow:   "#020F0F",
};

/* ─────────────────────────────────────────
   SECTION THEMES
───────────────────────────────────────── */
const SECTION_THEME = {
  Deen: {
    accent:     "#4DD6C8",
    accentSoft: "#8EEAE0",
    accentDim:  "rgba(62,214,200,0.13)",
    accentGlow: "rgba(62,214,200,0.06)",
    gradA:      "#0D5C58",
    gradB:      "#072C28",
    iconBg:     "rgba(62,214,200,0.18)",
    border:     "rgba(62,214,200,0.28)",
  },
  Utility: {
    accent:     "#4DD6C8",
    accentSoft: "#8EEAE0",
    accentDim:  "rgba(77,214,200,0.13)",
    accentGlow: "rgba(77,214,200,0.06)",
    gradA:      "#0D5C58",
    gradB:      "#072C28",
    iconBg:     "rgba(77,214,200,0.18)",
    border:     "rgba(77,214,200,0.28)",
  },
  Makkah: {
    accent:     "#E07265",
    accentSoft: "#F0A095",
    accentDim:  "rgba(224,114,101,0.13)",
    accentGlow: "rgba(224,114,101,0.06)",
    gradA:      "#0E5248",
    gradB:      "#07282A",
    iconBg:     "rgba(224,114,101,0.18)",
    border:     "rgba(224,114,101,0.28)",
  },
} as const;

type SectionKey = keyof typeof SECTION_THEME;
type ThemeType  = typeof SECTION_THEME[SectionKey];

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type MCIconName = keyof typeof MaterialCommunityIcons.glyphMap;
type FeatureItem = {
  label: string;
  icon:  MCIconName;
  route: string;
  featured?: boolean;
};
type FeatureSection = {
  title: string;
  items: FeatureItem[];
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: "Deen",
    items: [
      { label: "Prayer Times", icon: "clock-outline",                  route: "/(tabs)/prayer",  featured: true },
      { label: "Quran",        icon: "book-open-page-variant-outline", route: "/(tabs)/quran"  },
      { label: "Tasbih",       icon: "gesture-tap",                    route: "/(tabs)/tasbeeh"},
      { label: "Qibla",        icon: "compass-outline",                route: "/(tabs)/qibla"  },
      { label: "Duas",         icon: "hand-heart-outline",             route: "./duas"          },
      { label: "Khatam",       icon: "check-decagram-outline",         route: "./khatam"        },
      { label: "Mosques",      icon: "mosque",                         route: "./mosque"        },
      { label: "Memorize",     icon: "head-lightbulb-outline",         route: "./memorize"      },
      { label: "Immerse",      icon: "headphones",                     route: "./Immerse"       },
      { label: "Greetings",    icon: "email-open-outline",             route: "./greeting"      },
    ],
  },
  {
    title: "Utility",
    items: [
      { label: "Journal",  icon: "notebook-outline",            route: "./journal"  },
      { label: "Tracker",  icon: "chart-bell-curve-cumulative", route: "./tracker"  },
      { label: "Calendar", icon: "calendar-blank-outline",      route: "./calender" },
      { label: "Zakat",    icon: "hand-coin-outline",           route: "./zakat"    },
      { label: "Shahadah", icon: "star-crescent",               route: "./kalima"   },
      { label: "99 Names", icon: "star-four-points-outline",    route: "./names"    },
    ],
  },
  {
    title: "Makkah",
    items: [
      { label: "Makkah Live", icon: "video-outline", route: "./makkah_live", featured: true },
    ],
  },
];

/* ─────────────────────────────────────────
   LAYOUT
───────────────────────────────────────── */
const PAD  = rs(18);
const GAP  = rs(12);
const HALF = (W - PAD * 2 - GAP) / 2;

/* ─────────────────────────────────────────
   SPRING HELPER
───────────────────────────────────────── */
const spring = (v: Animated.Value, to: number, speed = 40, bounce = 4) =>
  Animated.spring(v, { toValue: to, useNativeDriver: true, speed, bounciness: bounce });

/* ─────────────────────────────────────────
   STAR ORNAMENT — two rotated squares
───────────────────────────────────────── */
const StarOrnament: React.FC<{ color: string; size?: number }> = ({ color, size = rs(16) }) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <View style={{
      position: "absolute",
      width: size * 0.58, height: size * 0.58,
      borderWidth: 1.2, borderColor: color,
    }} />
    <View style={{
      position: "absolute",
      width: size * 0.58, height: size * 0.58,
      borderWidth: 1.2, borderColor: color,
      transform: [{ rotate: "45deg" }],
    }} />
  </View>
);

/* ─────────────────────────────────────────
   FEATURED CARD
───────────────────────────────────────── */
const FeaturedCard: React.FC<{
  item:    FeatureItem;
  theme:   ThemeType;
  onPress: () => void;
}> = ({ item, theme, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[s.featWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => spring(scale, 0.97, 50, 0).start()}
        onPressOut={() => spring(scale, 1, 26, 7).start()}
        style={s.featTouch}
      >
        {/* Layered gradient bg */}
        <LinearGradient
          colors={[theme.gradA, theme.gradB, C.cardDeep]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Top shimmer */}
        <LinearGradient
          colors={[theme.accent + "00", theme.accent, theme.accentSoft, theme.accent + "00"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.featShimmer}
        />
        {/* Decorative concentric circles */}
        <View style={[s.featRingLg, { borderColor: theme.accent + "10" }]} />
        <View style={[s.featRingMd, { borderColor: theme.accent + "18" }]} />
        {/* Glow blob behind orb */}
        <View style={[s.featGlow, { backgroundColor: theme.accent + "16" }]} />
        {/* Glass border overlay */}
        <View style={[StyleSheet.absoluteFill, s.featBorderOverlay, { borderColor: theme.border }]} />
        
        <View style={s.featContent}>
          {/* Left */}
          <View style={s.featLeft}>
            <View style={[s.featTag, { backgroundColor: theme.accentDim, borderColor: theme.border }]}>
              <StarOrnament color={theme.accent} size={rs(9)} />
              <Text style={[s.featTagTxt, { color: theme.accent }]}>FEATURED</Text>
            </View>
            <Text style={s.featTitle}>{item.label}</Text>
            <View style={[s.featCta, { borderColor: theme.border, backgroundColor: theme.accentDim }]}>
              <Text style={[s.featCtaTxt, { color: theme.accentSoft }]}>Open now</Text>
              <View style={[s.featCtaDot, { backgroundColor: theme.accent }]}>
                <Feather name="arrow-right" size={rs(9)} color={C.cardDeep} />
              </View>
            </View>
          </View>
          {/* Icon orb */}
          <View style={[s.featOrbRing, { borderColor: theme.border }]}>
            <View style={[s.featOrb, { backgroundColor: theme.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={rs(34)} color={theme.accent} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────
   STANDARD TILE
───────────────────────────────────────── */
const FeatureCard: React.FC<{
  item:    FeatureItem;
  isLeft:  boolean;
  theme:   ThemeType;
  onPress: () => void;
}> = ({ item, isLeft, theme, onPress }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[s.tileWrap, {
      width: HALF, marginRight: isLeft ? GAP : 0,
      transform: [{ scale }], opacity,
    }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => {
          spring(scale, 0.94, 60, 0).start();
          Animated.timing(opacity, { toValue: 0.82, duration: 70, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          spring(scale, 1, 26, 6).start();
          Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
        }}
        style={s.tile}
      >
        {/* Subtle gradient wash */}
        <LinearGradient
          colors={[theme.accentGlow, "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Top accent notch */}
        <View style={[s.tileNotch, { backgroundColor: theme.accent }]} />
        {/* Glass border */}
        <View style={[StyleSheet.absoluteFill, s.tileBorder, { borderColor: theme.border }]} />
        {/* Icon with glow ring */}
        <View style={s.tileIconArea}>
          <View style={[s.tileRing, { borderColor: theme.accent + "28" }]}>
            <View style={[s.tileIconBg, { backgroundColor: theme.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={rs(22)} color={theme.accent} />
            </View>
          </View>
        </View>
        {/* Label row */}
        <View style={s.tileFooter}>
          <Text style={s.tileLabel} numberOfLines={2}>{item.label}</Text>
          <View style={[s.tileArrow, { borderColor: theme.border, backgroundColor: theme.accentDim }]}>
            <Feather name="arrow-up-right" size={rs(9)} color={theme.accentSoft} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────
   SECTION BLOCK
───────────────────────────────────────── */
const SectionBlock: React.FC<{
  section: FeatureSection;
  onPress: (route: string) => void;
}> = ({ section, onPress }) => {
  const theme   = SECTION_THEME[section.title as SectionKey] ?? SECTION_THEME.Utility;
  const featured = section.items.filter(i => i.featured);
  const standard = section.items.filter(i => !i.featured);
  
  return (
    <View style={s.sectionBlock}>
      {/* Header row */}
      <View style={s.secRow}>
        <StarOrnament color={theme.accent} size={rs(13)} />
        <Text style={[s.secTitle, { color: theme.accent }]}>{section.title.toUpperCase()}</Text>
        <View style={[s.secRule, { backgroundColor: theme.accent + "28" }]} />
        <View style={[s.secCount, { backgroundColor: theme.accentDim, borderColor: theme.border }]}>
          <Text style={[s.secCountTxt, { color: theme.accentSoft }]}>{section.items.length}</Text>
        </View>
      </View>
      
      {featured.map(item => (
        <FeaturedCard key={item.route} item={item} theme={theme} onPress={() => onPress(item.route)} />
      ))}
      
      {standard.length > 0 && (
        <View style={s.grid}>
          {standard.map((item, idx) => (
            <FeatureCard
              key={item.route} item={item}
              isLeft={idx % 2 === 0} theme={theme}
              onPress={() => onPress(item.route)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/* ─────────────────────────────────────────
   TOTAL COUNT
───────────────────────────────────────── */
const totalFeatures = FEATURE_SECTIONS.reduce((n, s) => n + s.items.length, 0);

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */
export default function IslamicFeaturesScreen() {
  const router = useRouter();
  const [query, setQuery]             = useState("");
  const [searchFocused, setFocused]   = useState(false);
  
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FEATURE_SECTIONS;
    return FEATURE_SECTIONS
      .map(sec => ({ ...sec, items: sec.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(sec => sec.items.length > 0);
  }, [query]);
  
  const navigate = (route: string) => router.push(route as any);
  
  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* ════ HEADER ════ */}
      <View style={s.header}>
        {/* Rich gradient mesh */}
        <LinearGradient
          colors={["#116058", "#0D5250", "#0A4A4A"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Geometric rings - decorative */}
        <View style={s.hRing1} />
        <View style={s.hRing2} />
        <View style={s.hRing3} />

        {/* ── Nav row ── */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="chevron-left" size={rs(19)} color={C.beigeSoft} />
          </TouchableOpacity>
          
          <View style={s.navCenter}>
            <Text style={s.navTitle}>Features</Text>
          </View>
          
          {/* Spacer to keep the "Features" title perfectly centered */}
          <View style={{ width: rs(40) }} />
        </View>
        
        {/* Subtitle with star ornaments */}
        <View style={s.subtitleRow}>
        </View>
        
        {/* Search */}
        <View style={[s.search, searchFocused && { borderColor: "rgba(77,214,200,0.55)" }]}>
          <Feather name="search" size={rs(15)} color={searchFocused ? C.aqua : C.inkDim} />
          <TextInput
            placeholder="Search features…"
            placeholderTextColor={C.inkFaint}
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
            underlineColorAndroid="transparent"
            selectionColor={C.aqua}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={s.searchX}>
                <Feather name="x" size={rs(11)} color={C.inkMid} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Tricolor divider */}
      <LinearGradient
        colors={[C.gold + "88", C.aqua + "55", C.coral + "35", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.divider}
      />
      
      {/* ════ SCROLL ════ */}
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyOrb}>
              <StarOrnament color={C.aqua + "55"} size={rs(34)} />
            </View>
            <Text style={s.emptyTitle}>Nothing found</Text>
            <Text style={s.emptyHint}>No results for "{query}"</Text>
          </View>
        ) : (
          filtered.map(sec => (
            <SectionBlock key={sec.title} section={sec} onPress={navigate} />
          ))
        )}
        <View style={{ height: rs(60) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const TILE_H = HALF * 0.84;
const shadowTile = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.60, shadowRadius: 14 },
  android: { elevation: 8 },
});
const shadowFeat = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.70, shadowRadius: 22 },
  android: { elevation: 14 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  
  /* ── Header ── */
  header: {
    paddingHorizontal: PAD,
    paddingBottom:     rs(20),
    overflow:          "hidden",
  },
  
  /* Decorative concentric rings in header */
  hRing1: {
    position: "absolute", top: -rs(80), right: -rs(80),
    width: rs(240), height: rs(240), borderRadius: rs(120),
    borderWidth: 1, borderColor: "rgba(77,214,200,0.08)",
  },
  hRing2: {
    position: "absolute", top: -rs(50), right: -rs(50),
    width: rs(160), height: rs(160), borderRadius: rs(80),
    borderWidth: 1, borderColor: "rgba(232,184,75,0.10)",
  },
  hRing3: {
    position: "absolute", top: -rs(25), right: -rs(25),
    width: rs(90), height: rs(90), borderRadius: rs(45),
    borderWidth: 1, borderColor: "rgba(224,114,101,0.12)",
  },

  /* Nav */
  navRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    marginTop: rs(6), marginBottom: rs(14),
  },
  navBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(13),
    backgroundColor: "rgba(77,214,200,0.10)",
    borderWidth: 1, borderColor: "rgba(77,214,200,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  navCenter: {
    flexDirection: "row", alignItems: "center", gap: rs(10),
  },
  navTitle: {
    fontSize: rs(32), // Increased text size
    fontWeight: "800",
    color: C.ink, letterSpacing: -0.6,
  },
  navBadge: {
    backgroundColor: "rgba(232,184,75,0.15)",
    borderRadius: rs(10), borderWidth: 1.5,
    borderColor: "rgba(232,184,75,0.38)",
    paddingHorizontal: rs(9), paddingVertical: rs(3),
  },
  navBadgeTxt: {
    fontSize: rs(12), fontWeight: "900", color: C.gold,
  },
  
  /* Subtitle */
  subtitleRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(8), marginBottom: rs(16),
  },
  subtitle: {
    fontSize: rs(12), color: C.inkMid,
    fontWeight: "500", letterSpacing: 0.5,
  },
  
  /* Pills */
  pillsRow: { flexDirection: "row", gap: rs(8), marginBottom: rs(16) },
  pill: {
    flexDirection: "row", alignItems: "center",
    borderRadius: rs(20), borderWidth: 1,
    paddingHorizontal: rs(10), paddingVertical: rs(5), gap: rs(5),
  },
  pillDot: { width: rs(5), height: rs(5), borderRadius: rs(3) },
  pillTxt: { fontSize: rs(11), fontWeight: "700", letterSpacing: 0.2 },
  
  /* Search */
  search: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(7,40,40,0.75)",
    borderWidth: 1.5, borderColor: "rgba(77,214,200,0.22)",
    borderRadius: rs(16), paddingHorizontal: rs(14), height: rs(48),
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  searchInput: {
    flex: 1, color: C.ink, fontSize: rs(14),
    fontWeight: "500", marginLeft: rs(10), paddingVertical: 0,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: "center" as const },
    }),
  },
  searchX: {
    width: rs(22), height: rs(22), borderRadius: rs(11),
    backgroundColor: "rgba(77,214,200,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  
  /* Divider */
  divider: { height: rs(2.5) },
  
  /* Scroll */
  scroll: { paddingHorizontal: PAD, paddingTop: rs(24) },
  
  /* ── Section ── */
  sectionBlock: { marginBottom: rs(34) },
  secRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(8), marginBottom: rs(14),
  },
  secTitle: {
    fontSize: rs(11), fontWeight: "900", letterSpacing: 2.5,
  },
  secRule: { flex: 1, height: 1.5, borderRadius: 1 },
  secCount: {
    borderRadius: rs(8), borderWidth: 1,
    paddingHorizontal: rs(8), paddingVertical: rs(2),
  },
  secCountTxt: { fontSize: rs(11), fontWeight: "900" },
  
  /* ── Featured card ── */
  featWrap: {
    marginBottom: rs(14), borderRadius: rs(24), ...shadowFeat,
  },
  featTouch: {
    height: rs(132), borderRadius: rs(24), overflow: "hidden",
  },
  featShimmer: {
    position: "absolute", top: 0, left: 0, right: 0, height: rs(2.5),
  },
  featRingLg: {
    position: "absolute", top: -rs(55), right: -rs(55),
    width: rs(190), height: rs(190), borderRadius: rs(95), borderWidth: 1,
  },
  featRingMd: {
    position: "absolute", top: -rs(28), right: -rs(28),
    width: rs(110), height: rs(110), borderRadius: rs(55), borderWidth: 1,
  },
  featGlow: {
    position: "absolute", top: rs(12), right: rs(18),
    width: rs(90), height: rs(90), borderRadius: rs(45),
  },
  featBorderOverlay: {
    borderRadius: rs(24), borderWidth: 1,
  },
  featContent: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingHorizontal: rs(22), paddingVertical: rs(18), gap: rs(14),
  },
  featLeft: { flex: 1, gap: rs(8) },
  featTag: {
    flexDirection: "row", alignSelf: "flex-start", alignItems: "center",
    gap: rs(5), borderRadius: rs(8), borderWidth: 1,
    paddingHorizontal: rs(8), paddingVertical: rs(3),
  },
  featTagTxt: { fontSize: rs(9), fontWeight: "900", letterSpacing: 1.5 },
  featTitle: {
    fontSize: rs(24), fontWeight: "800",
    color: C.ink, letterSpacing: -0.4, lineHeight: rs(28),
  },
  featCta: {
    flexDirection: "row", alignSelf: "flex-start", alignItems: "center",
    gap: rs(8), borderRadius: rs(20), borderWidth: 1,
    paddingLeft: rs(12), paddingRight: rs(5), paddingVertical: rs(5),
  },
  featCtaTxt: { fontSize: rs(12), fontWeight: "700" },
  featCtaDot: {
    width: rs(22), height: rs(22), borderRadius: rs(11),
    alignItems: "center", justifyContent: "center",
  },
  featOrbRing: {
    width: rs(76), height: rs(76), borderRadius: rs(22),
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  featOrb: {
    width: rs(62), height: rs(62), borderRadius: rs(18),
    alignItems: "center", justifyContent: "center",
  },
  
  /* ── Standard tile ── */
  grid: { flexDirection: "row", flexWrap: "wrap" },
  tileWrap: {
    height: TILE_H, marginBottom: GAP, ...shadowTile,
  },
  tile: {
    flex: 1, backgroundColor: C.card,
    borderRadius: rs(20), overflow: "hidden", padding: rs(14),
  },
  tileNotch: {
    position: "absolute", top: 0, left: rs(18),
    width: rs(28), height: rs(2.5), borderRadius: rs(1.5), opacity: 0.85,
  },
  tileBorder: {
    borderRadius: rs(20), borderWidth: 1,
  },
  tileIconArea: {
    flex: 1, alignItems: "flex-end", justifyContent: "flex-start", paddingTop: rs(4),
  },
  tileRing: {
    width: rs(52), height: rs(52), borderRadius: rs(16), borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  tileIconBg: {
    width: rs(42), height: rs(42), borderRadius: rs(13),
    alignItems: "center", justifyContent: "center",
  },
  tileFooter: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-between", marginTop: rs(6),
  },
  tileLabel: {
    flex: 1, color: C.ink, fontSize: rs(13),
    fontWeight: "700", lineHeight: rs(18), marginRight: rs(6),
  },
  tileArrow: {
    width: rs(24), height: rs(24), borderRadius: rs(8), borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  
  /* ── Empty state ── */
  empty: { alignItems: "center", paddingTop: rs(90), gap: rs(14) },
  emptyOrb: {
    width: rs(90), height: rs(90), borderRadius: rs(45),
    backgroundColor: "rgba(77,214,200,0.08)",
    borderWidth: 1, borderColor: "rgba(77,214,200,0.20)",
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: {
    fontSize: rs(20), fontWeight: "800", color: C.inkMid, letterSpacing: -0.3,
  },
  emptyHint: { fontSize: rs(13), color: C.inkDim, fontWeight: "500" },
});