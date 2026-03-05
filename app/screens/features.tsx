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
   DESIGN TOKENS — Refined dark jewel palette
───────────────────────────────────────── */
const C = {
  bg:         "#060E0E",
  bgRich:     "#081212",
  panel:      "#0B1A1A",
  card:       "#0D2020",
  cardLt:     "#102828",
  cardDeep:   "#040C0C",
  beige:      "#E8DFC8",
  beigeSoft:  "#F2EBD8",
  ink:        "#EDF5F3",
  inkMid:     "#9AC4BC",
  inkDim:     "#5A8880",
  inkFaint:   "rgba(180,220,210,0.30)",
  teal:       "#2FD9C8",
  tealSoft:   "#6BE8DA",
  tealGlow:   "rgba(47,217,200,0.18)",
  tealDim:    "rgba(47,217,200,0.10)",
  gold:       "#E8B84B",
  goldSoft:   "#F5D47E",
  goldGlow:   "rgba(232,184,75,0.15)",
  coral:      "#E07265",
  coralSoft:  "#F5A090",
  coralGlow:  "rgba(224,114,101,0.15)",
  aqua:       "#1A9E94",
  shadow:     "#010707",
};

/* ─────────────────────────────────────────
   SECTION THEMES
───────────────────────────────────────── */
const SECTION_THEME = {
  Deen: {
    accent:     "#2FD9C8",
    accentSoft: "#70EAE0",
    accentDim:  "rgba(47,217,200,0.12)",
    accentGlow: "rgba(47,217,200,0.05)",
    gradA:      "#0D4E4A",
    gradB:      "#071E1C",
    iconBg:     "rgba(47,217,200,0.15)",
    border:     "rgba(47,217,200,0.22)",
    glowColor:  "rgba(47,217,200,0.06)",
  },
  Utility: {
    accent:     "#E8B84B",
    accentSoft: "#F5D47E",
    accentDim:  "rgba(232,184,75,0.12)",
    accentGlow: "rgba(232,184,75,0.05)",
    gradA:      "#3E2E08",
    gradB:      "#1A1204",
    iconBg:     "rgba(232,184,75,0.15)",
    border:     "rgba(232,184,75,0.22)",
    glowColor:  "rgba(232,184,75,0.06)",
  },
  Makkah: {
    accent:     "#E07265",
    accentSoft: "#F5A090",
    accentDim:  "rgba(224,114,101,0.12)",
    accentGlow: "rgba(224,114,101,0.05)",
    gradA:      "#3E1610",
    gradB:      "#1A0A08",
    iconBg:     "rgba(224,114,101,0.15)",
    border:     "rgba(224,114,101,0.22)",
    glowColor:  "rgba(224,114,101,0.06)",
  },
} as const;

type SectionKey = keyof typeof SECTION_THEME;
type ThemeType  = typeof SECTION_THEME[SectionKey];

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type MCIconName = keyof typeof MaterialCommunityIcons.glyphMap;
type FeatureItem = {
  label:    string;
  icon:     MCIconName;
  route:    string;
  featured?: boolean;
  desc?:    string;
};
type FeatureSection = {
  title: string;
  items: FeatureItem[];
};

/* ─────────────────────────────────────────
   DATA — with descriptions
───────────────────────────────────────── */
const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: "Deen",
    items: [
      { label: "Prayer Times", icon: "clock-outline",                  route: "/(tabs)/prayer",  featured: true, desc: "Daily salah schedule" },
      { label: "Quran",        icon: "book-open-page-variant-outline", route: "/(tabs)/quran",   desc: "Read & reflect" },
      { label: "Tasbih",       icon: "gesture-tap",                    route: "/(tabs)/tasbeeh", desc: "Digital counter" },
      { label: "Qibla",        icon: "compass-outline",                route: "/(tabs)/qibla",   desc: "Find direction" },
      { label: "Duas",         icon: "hand-heart-outline",             route: "./duas",           desc: "Supplications" },
      { label: "Khatam",       icon: "check-decagram-outline",         route: "./khatam",         desc: "Track completion" },
      { label: "Mosques",      icon: "mosque",                         route: "./mosque",         desc: "Find nearby" },
      { label: "Memorize",     icon: "head-lightbulb-outline",         route: "./memorize",       desc: "Hifz helper" },
      { label: "Immerse",      icon: "headphones",                     route: "./Immerse",        desc: "Deep listening" },
      { label: "Greetings",    icon: "email-open-outline",             route: "./greeting",       desc: "Islamic phrases" },
    ],
  },
  {
    title: "Utility",
    items: [
      { label: "Journal",  icon: "notebook-outline",            route: "./journal",   desc: "Daily reflections" },
      { label: "Tracker",  icon: "chart-bell-curve-cumulative", route: "./tracker",   desc: "Habit monitor" },
      { label: "Calendar", icon: "calendar-blank-outline",      route: "./calender",  desc: "Hijri dates" },
      { label: "Zakat",    icon: "hand-coin-outline",           route: "./zakat",     desc: "Calculate dues" },
      { label: "Shahadah", icon: "star-crescent",               route: "./kalima",    desc: "Core beliefs" },
      { label: "99 Names", icon: "star-four-points-outline",    route: "./names",     desc: "Asma ul Husna" },
    ],
  },
  {
    title: "Makkah",
    items: [
      { label: "Makkah Live", icon: "video-outline", route: "./makkah_live", featured: true, desc: "Live Kaaba stream" },
    ],
  },
];

/* ─────────────────────────────────────────
   LAYOUT
───────────────────────────────────────── */
const PAD  = rs(16);
const GAP  = rs(10);
const COLS = 3;
const TILE = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;

/* ─────────────────────────────────────────
   SPRING
───────────────────────────────────────── */
const spring = (v: Animated.Value, to: number, speed = 40, bounce = 5) =>
  Animated.spring(v, { toValue: to, useNativeDriver: true, speed, bounciness: bounce });

/* ─────────────────────────────────────────
   GEOMETRIC ORNAMENT — Islamic star pattern
───────────────────────────────────────── */
const IslamicStar: React.FC<{ color: string; size?: number; filled?: boolean }> = ({
  color, size = rs(14), filled = false,
}) => {
  const s2 = size * 0.55;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        position: "absolute",
        width: s2, height: s2,
        borderWidth: filled ? 0 : 1.2,
        borderColor: color,
        backgroundColor: filled ? color + "40" : "transparent",
      }} />
      <View style={{
        position: "absolute",
        width: s2, height: s2,
        borderWidth: filled ? 0 : 1.2,
        borderColor: color,
        backgroundColor: filled ? color + "40" : "transparent",
        transform: [{ rotate: "45deg" }],
      }} />
      {filled && (
        <View style={{
          width: s2 * 0.35, height: s2 * 0.35,
          borderRadius: s2 * 0.2,
          backgroundColor: color,
        }} />
      )}
    </View>
  );
};

/* ─────────────────────────────────────────
   FEATURED CARD — wide cinematic layout
───────────────────────────────────────── */
const FeaturedCard: React.FC<{
  item:    FeatureItem;
  theme:   ThemeType;
  onPress: () => void;
}> = ({ item, theme, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  const pressIn  = () => {
    spring(scale, 0.968, 60, 0).start();
    Animated.timing(glow, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    spring(scale, 1, 28, 8).start();
    Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[fs.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={fs.touch}
      >
        {/* Deep gradient */}
        <LinearGradient
          colors={[theme.gradA + "EE", theme.gradA + "88", theme.gradB, C.cardDeep]}
          start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Top shimmer line */}
        <LinearGradient
          colors={["transparent", theme.accent + "BB", theme.accentSoft, theme.accent + "BB", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={fs.shimmer}
        />
        {/* Radial glow blob */}
        <Animated.View style={[fs.glowBlob, {
          backgroundColor: theme.accent + "20",
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
        }]} />
        {/* Concentric rings */}
        <View style={[fs.ringOuter, { borderColor: theme.accent + "0E" }]} />
        <View style={[fs.ringInner, { borderColor: theme.accent + "16" }]} />
        {/* Glass border */}
        <View style={[StyleSheet.absoluteFill, fs.border, { borderColor: theme.border }]} />

        <View style={fs.content}>
          {/* Left column */}
          <View style={fs.left}>
            <View style={[fs.badge, { backgroundColor: theme.accentDim, borderColor: theme.border }]}>
              <IslamicStar color={theme.accent} size={rs(8)} filled />
              <Text style={[fs.badgeTxt, { color: theme.accent }]}>FEATURED</Text>
            </View>
            <Text style={fs.title}>{item.label}</Text>
            {item.desc && (
              <Text style={[fs.desc, { color: theme.accentSoft + "BB" }]}>{item.desc}</Text>
            )}
            <TouchableOpacity
              onPress={onPress}
              style={[fs.cta, { borderColor: theme.border, backgroundColor: theme.accentDim }]}
            >
              <Text style={[fs.ctaTxt, { color: theme.accentSoft }]}>Open</Text>
              <View style={[fs.ctaArrow, { backgroundColor: theme.accent }]}>
                <Feather name="arrow-right" size={rs(10)} color={C.cardDeep} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Icon orb */}
          <View style={fs.orbArea}>
            <View style={[fs.orbRing2, { borderColor: theme.border + "80" }]} />
            <View style={[fs.orbRing1, { borderColor: theme.border }]}>
              <View style={[fs.orb, { backgroundColor: theme.iconBg }]}>
                <MaterialCommunityIcons name={item.icon} size={rs(38)} color={theme.accent} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────
   STANDARD TILE — 3-column grid
───────────────────────────────────────── */
const FeatureTile: React.FC<{
  item:    FeatureItem;
  idx:     number;
  theme:   ThemeType;
  onPress: () => void;
}> = ({ item, idx, theme, onPress }) => {
  const scale  = useRef(new Animated.Value(1)).current;
  const bright = useRef(new Animated.Value(1)).current;
  const col = idx % COLS;
  const ml  = col > 0 ? GAP : 0;

  return (
    <Animated.View style={[ts.wrap, {
      width: TILE,
      marginLeft: ml,
      transform: [{ scale }],
      opacity: bright,
    }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => {
          spring(scale, 0.92, 70, 0).start();
          Animated.timing(bright, { toValue: 0.75, duration: 80, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          spring(scale, 1, 30, 7).start();
          Animated.timing(bright, { toValue: 1, duration: 140, useNativeDriver: true }).start();
        }}
        style={ts.card}
      >
        <LinearGradient
          colors={[theme.glowColor, "transparent"]}
          start={{ x: 0.3, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Accent notch */}
        <View style={[ts.notch, { backgroundColor: theme.accent }]} />
        {/* Glass border */}
        <View style={[StyleSheet.absoluteFill, ts.border, { borderColor: theme.border }]} />

 {/* Icon — centered, larger */}
        <View style={ts.iconWrap}>
          <View style={[ts.iconRing, { borderColor: theme.accent + "30" }]}>
            <View style={[ts.iconBg, { backgroundColor: theme.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={rs(30)} color={theme.accent} />
            </View>
          </View>
        </View>

        {/* Label — centered, larger */}
        <Text style={ts.label} numberOfLines={2}>{item.label}</Text>
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
  const theme    = SECTION_THEME[section.title as SectionKey] ?? SECTION_THEME.Utility;
  const featured = section.items.filter(i => i.featured);
  const standard = section.items.filter(i => !i.featured);

  const rows: FeatureItem[][] = [];
  for (let i = 0; i < standard.length; i += COLS) {
    rows.push(standard.slice(i, i + COLS));
  }

  return (
    <View style={sec.block}>
      {/* Section header */}
      <View style={sec.headerRow}>
        <IslamicStar color={theme.accent} size={rs(12)} filled />
        <Text style={[sec.title, { color: theme.accent }]}>{section.title.toUpperCase()}</Text>
        <View style={[sec.rule, { backgroundColor: theme.accent + "25" }]} />
        <View style={[sec.pill, { backgroundColor: theme.accentDim, borderColor: theme.border }]}>
          <Text style={[sec.pillTxt, { color: theme.accentSoft }]}>{section.items.length}</Text>
        </View>
      </View>

      {featured.map(item => (
        <FeaturedCard key={item.route} item={item} theme={theme} onPress={() => onPress(item.route)} />
      ))}

      {rows.map((row, ri) => (
        <View key={ri} style={sec.row}>
          {row.map((item, ci) => (
            <FeatureTile
              key={item.route}
              item={item}
              idx={ci}
              theme={theme}
              onPress={() => onPress(item.route)}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */
export default function IslamicFeaturesScreen() {
  const router = useRouter();
  const [query, setQuery]           = useState("");
  const [searchFocused, setFocused] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FEATURE_SECTIONS;
    return FEATURE_SECTIONS
      .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0);
  }, [query]);

  const navigate = (route: string) => router.push(route as any);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, rs(100)],
    outputRange: [0, -rs(12)],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, rs(80)],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={root.safe} edges={["top", "left", "right"]}>

      {/* Background mesh */}
      <View style={root.bgMesh}>
        <LinearGradient
          colors={["#0B2020", "#060E0E", "#040B0B"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={root.blob1} />
        <View style={root.blob2} />
        <View style={root.blob3} />
      </View>

      {/* ════ HEADER ════ */}
      <Animated.View style={[root.header, {
        transform: [{ translateY: headerTranslate }],
        opacity: headerOpacity,
      }]}>
        <LinearGradient
          colors={["#0E3030", "#0A2424", "#081A1A"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={root.hRing1} />
        <View style={root.hRing2} />
        <LinearGradient
          colors={["transparent", C.teal + "14", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={root.hShimmer}
        />

        {/* Nav row */}
        <View style={root.navRow}>
          <TouchableOpacity
            style={root.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <LinearGradient
              colors={[C.tealDim + "CC", C.tealDim]}
              style={[StyleSheet.absoluteFill, { borderRadius: rs(14) }]}
            />
            <View style={[StyleSheet.absoluteFill, root.backBorder]} />
            <Feather name="chevron-left" size={rs(18)} color={C.tealSoft} />
          </TouchableOpacity>

          <View style={root.titleGroup}>
            <IslamicStar color={C.gold + "80"} size={rs(11)} />
            <Text style={root.navTitle}>Features</Text>
            <IslamicStar color={C.gold + "80"} size={rs(11)} />
          </View>

          {/* Total count badge */}
          <View style={root.countBadge}>
            <LinearGradient
              colors={[C.goldGlow + "CC", C.goldGlow]}
              style={[StyleSheet.absoluteFill, { borderRadius: rs(12) }]}
            />
            <View style={[StyleSheet.absoluteFill, root.countBorder]} />
            <Text style={root.countTxt}>
              {FEATURE_SECTIONS.reduce((n, s) => n + s.items.length, 0)}
            </Text>
          </View>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={root.pillsRow}
          style={{ marginBottom: rs(14) }}
        >
          {FEATURE_SECTIONS.map(s => {
            const t = SECTION_THEME[s.title as SectionKey];
            return (
              <View key={s.title} style={[root.categoryPill, {
                backgroundColor: t.accentDim,
                borderColor: t.border,
              }]}>
                <View style={[root.pillDot, { backgroundColor: t.accent }]} />
                <Text style={[root.pillTxt, { color: t.accentSoft }]}>{s.title}</Text>
                <Text style={[root.pillCount, { color: t.accent }]}>{s.items.length}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Search bar */}
        <View style={[root.search, searchFocused && {
          borderColor: C.teal + "60",
          backgroundColor: "#0A1E1E",
        }]}>
          <Feather name="search" size={rs(14)} color={searchFocused ? C.teal : C.inkDim} />
          <TextInput
            placeholder="Search features…"
            placeholderTextColor={C.inkFaint}
            style={root.searchInput}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
            underlineColorAndroid="transparent"
            selectionColor={C.teal}
          />
          {query.length > 0 && Platform.OS === "android" && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={root.clearX}>
                <Feather name="x" size={rs(10)} color={C.inkMid} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Tri-color divider */}
      <LinearGradient
        colors={[C.teal + "70", C.gold + "40", C.coral + "25", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ height: rs(1.5) }}
      />

      {/* ════ SCROLL ════ */}
      <Animated.ScrollView
        contentContainerStyle={root.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {filtered.length === 0 ? (
          <View style={root.empty}>
            <View style={root.emptyOrb}>
              <IslamicStar color={C.teal + "55"} size={rs(40)} />
            </View>
            <Text style={root.emptyTitle}>Nothing found</Text>
            <Text style={root.emptyHint}>No results for "{query}"</Text>
          </View>
        ) : (
          filtered.map(s => (
            <SectionBlock key={s.title} section={s} onPress={navigate} />
          ))
        )}
        <View style={{ height: rs(80) }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const TILE_H = TILE * 1.08;

const shadowMd = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55, shadowRadius: 12 },
  android: { elevation: 7 },
});
const shadowLg = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.65, shadowRadius: 20 },
  android: { elevation: 13 },
});

const root = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  bgMesh:  { ...StyleSheet.absoluteFillObject },
  blob1: {
    position: "absolute", top: -rs(60), left: -rs(60),
    width: rs(280), height: rs(280), borderRadius: rs(140),
    backgroundColor: "rgba(47,217,200,0.04)",
  },
  blob2: {
    position: "absolute", top: rs(300), right: -rs(80),
    width: rs(220), height: rs(220), borderRadius: rs(110),
    backgroundColor: "rgba(232,184,75,0.03)",
  },
  blob3: {
    position: "absolute", bottom: rs(100), left: -rs(40),
    width: rs(180), height: rs(180), borderRadius: rs(90),
    backgroundColor: "rgba(224,114,101,0.03)",
  },
  header: {
    paddingHorizontal: PAD,
    paddingBottom: rs(18),
    overflow: "hidden",
  },
  hRing1: {
    position: "absolute", top: -rs(70), right: -rs(70),
    width: rs(220), height: rs(220), borderRadius: rs(110),
    borderWidth: 1, borderColor: "rgba(47,217,200,0.07)",
  },
  hRing2: {
    position: "absolute", top: -rs(35), right: -rs(35),
    width: rs(120), height: rs(120), borderRadius: rs(60),
    borderWidth: 1, borderColor: "rgba(232,184,75,0.09)",
  },
  hShimmer: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: rs(1),
  },
  navRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    marginTop: rs(8), marginBottom: rs(16),
  },
  backBtn: {
    width: rs(42), height: rs(42), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  backBorder: {
    borderRadius: rs(14), borderWidth: 1,
    borderColor: "rgba(47,217,200,0.22)",
  },
  titleGroup: {
    flexDirection: "row", alignItems: "center", gap: rs(10),
  },
  navTitle: {
    fontSize: rs(28), fontWeight: "800",
    color: C.ink, letterSpacing: -0.5,
  },
  countBadge: {
    width: rs(42), height: rs(42), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  countBorder: {
    borderRadius: rs(12), borderWidth: 1.5,
    borderColor: "rgba(232,184,75,0.30)",
  },
  countTxt: {
    fontSize: rs(13), fontWeight: "900", color: C.gold,
  },
  pillsRow: {
    paddingRight: PAD, gap: rs(8), flexDirection: "row",
  },
  categoryPill: {
    flexDirection: "row", alignItems: "center",
    borderRadius: rs(30), borderWidth: 1,
    paddingHorizontal: rs(12), paddingVertical: rs(6), gap: rs(6),
  },
  pillDot:   { width: rs(6), height: rs(6), borderRadius: rs(3) },
  pillTxt:   { fontSize: rs(11), fontWeight: "700", letterSpacing: 0.3 },
  pillCount: { fontSize: rs(10), fontWeight: "900", marginLeft: rs(2) },
  search: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#081616",
    borderWidth: 1.5, borderColor: "rgba(47,217,200,0.18)",
    borderRadius: rs(16), paddingHorizontal: rs(14), height: rs(46),
    ...Platform.select({
      ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.50, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  searchInput: {
    flex: 1, color: C.ink, fontSize: rs(14),
    fontWeight: "500", marginLeft: rs(10), paddingVertical: 0,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: "center" as const },
    }),
  },
  clearX: {
    width: rs(22), height: rs(22), borderRadius: rs(11),
    backgroundColor: "rgba(47,217,200,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  scroll: { paddingHorizontal: PAD, paddingTop: rs(20) },
  empty: { alignItems: "center", paddingTop: rs(100), gap: rs(16) },
  emptyOrb: {
    width: rs(96), height: rs(96), borderRadius: rs(48),
    backgroundColor: "rgba(47,217,200,0.07)",
    borderWidth: 1, borderColor: "rgba(47,217,200,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: {
    fontSize: rs(20), fontWeight: "800", color: C.inkMid, letterSpacing: -0.2,
  },
  emptyHint: { fontSize: rs(13), color: C.inkDim, fontWeight: "500" },
});

const sec = StyleSheet.create({
  block: { marginBottom: rs(30) },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(8), marginBottom: rs(14),
  },
  title: { fontSize: rs(10), fontWeight: "900", letterSpacing: 2.8 },
  rule:  { flex: 1, height: 1.2, borderRadius: 1 },
  pill: {
    borderRadius: rs(8), borderWidth: 1,
    paddingHorizontal: rs(8), paddingVertical: rs(2),
  },
  pillTxt: { fontSize: rs(11), fontWeight: "900" },
  row: {
    flexDirection: "row",
    marginBottom: rs(10),
    alignItems: "stretch",
  },
});

const fs = StyleSheet.create({
  wrap:  { marginBottom: rs(14), borderRadius: rs(22), ...shadowLg },
  touch: { height: rs(138), borderRadius: rs(22), overflow: "hidden" },
  shimmer: {
    position: "absolute", top: 0, left: 0, right: 0, height: rs(2),
  },
  glowBlob: {
    position: "absolute", top: rs(10), right: rs(16),
    width: rs(100), height: rs(100), borderRadius: rs(50),
  },
  ringOuter: {
    position: "absolute", top: -rs(60), right: -rs(60),
    width: rs(200), height: rs(200), borderRadius: rs(100), borderWidth: 1,
  },
  ringInner: {
    position: "absolute", top: -rs(30), right: -rs(30),
    width: rs(120), height: rs(120), borderRadius: rs(60), borderWidth: 1,
  },
  border: { borderRadius: rs(22), borderWidth: 1 },
  content: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingHorizontal: rs(20), paddingVertical: rs(16), gap: rs(12),
  },
  left: { flex: 1, gap: rs(7) },
  badge: {
    flexDirection: "row", alignSelf: "flex-start", alignItems: "center",
    gap: rs(5), borderRadius: rs(8), borderWidth: 1,
    paddingHorizontal: rs(8), paddingVertical: rs(3),
  },
  badgeTxt: { fontSize: rs(8), fontWeight: "900", letterSpacing: 1.8 },
  title: {
    fontSize: rs(22), fontWeight: "800",
    color: C.ink, letterSpacing: -0.3, lineHeight: rs(26),
  },
  desc: { fontSize: rs(11), fontWeight: "500" },
  cta: {
    flexDirection: "row", alignSelf: "flex-start", alignItems: "center",
    gap: rs(7), borderRadius: rs(20), borderWidth: 1,
    paddingLeft: rs(12), paddingRight: rs(4), paddingVertical: rs(5),
    marginTop: rs(2),
  },
  ctaTxt:   { fontSize: rs(11), fontWeight: "700" },
  ctaArrow: {
    width: rs(22), height: rs(22), borderRadius: rs(11),
    alignItems: "center", justifyContent: "center",
  },
  orbArea: { alignItems: "center", justifyContent: "center" },
  orbRing2: {
    position: "absolute",
    width: rs(88), height: rs(88), borderRadius: rs(22), borderWidth: 1,
  },
  orbRing1: {
    width: rs(76), height: rs(76), borderRadius: rs(20),
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  orb: {
    width: rs(62), height: rs(62), borderRadius: rs(17),
    alignItems: "center", justifyContent: "center",
  },
});

const ts = StyleSheet.create({
  wrap: { height: TILE_H, ...shadowMd },
  card: {
    flex: 1, backgroundColor: C.card,
    borderRadius: rs(18), overflow: "hidden", padding: rs(12),
  },
  notch: {
    position: "absolute", top: 0, left: rs(14),
    width: rs(24), height: rs(2.5), borderRadius: rs(2), opacity: 0.9,
  },
  border:   { borderRadius: rs(18), borderWidth: 1 },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(10),
  },
  iconRing: {
    width: rs(62), height: rs(62), borderRadius: rs(19), borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.018)",
  },
  iconBg: {
    width: rs(50), height: rs(50), borderRadius: rs(15),
    alignItems: "center", justifyContent: "center",
  },
  label: {
    color: C.ink, fontSize: rs(13), fontWeight: "700",
    lineHeight: rs(18),
    letterSpacing: 0.1,
    textAlign: "center",
  },
  arrow: {
    alignSelf: "flex-end",
    width: rs(22), height: rs(22), borderRadius: rs(7), borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
});