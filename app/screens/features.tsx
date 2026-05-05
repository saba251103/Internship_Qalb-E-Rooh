import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

/* ─────────────────────────────────────────
   RESPONSIVE UTILITIES & TABLET CONSTRAINTS
───────────────────────────────────────── */
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

const fontScale = (size: number) =>
  Platform.OS === "android" ? moderateScale(size, 0.3) : moderateScale(size);

const CONTENT_MAX_WIDTH = 800;
const ACTUAL_CONTENT_WIDTH = isTablet ? Math.min(SCREEN_WIDTH, CONTENT_MAX_WIDTH) : SCREEN_WIDTH;

/* ─────────────────────────────────────────
   DESIGN TOKENS — Matching Home Screen
───────────────────────────────────────── */
const C = {
  bg:           "#0A4A4A",
  bgDeep:       "#062E2E",
  bgMid:        "#0D5858",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F0F8F6",
  surfaceDim:   "#E6F4F2",

  teal0:        "#041E1E",
  teal1:        "#0A4A4A",
  teal2:        "#0D5858",
  teal3:        "#12706E",
  teal4:        "#1A9490",
  teal5:        "#4BA89E",
  tealLt:       "#A8DDD8",
  tealPale:     "#D4EFEC",

  gold:         "#D4942A",
  goldBright:   "#E8B84B",
  goldDeep:     "#B8791E",
  goldPale:     "#FDF5E0",
  goldSoft:     "#F5E8C8",

  ink:          "#072424",
  inkMid:       "#2E6060",
  inkLight:     "#6AABA5",
  inkFaint:     "rgba(7,36,36,0.30)",
  white:        "#FFFFFF",
  whiteSemi:    "rgba(255,255,255,0.92)",
  whiteGhost:   "rgba(255,255,255,0.12)",
  whiteHush:    "rgba(255,255,255,0.06)",

  coral:        "#E07060",
  rose:         "#D4607A",
  purple:       "#7C6BA8",
  moss:         "#4A7A5A",
};

/* ─────────────────────────────────────────
   SECTION THEMES
───────────────────────────────────────── */
const THEMES = {
  Deen: {
    primary:   C.teal3,
    light:     "#E8F5F3",
    border:    "#C8E8E4",
    gradient:  ["#0A4A4A", "#12706E"] as [string, string],
    cardBg:    "#F0FAF8",
    icon:      "🌙",
  },
  Utility: {
    primary:   C.gold,
    light:     C.goldPale,
    border:    C.goldSoft,
    gradient:  ["#B8791E", "#D4942A"] as [string, string],
    cardBg:    "#FDFAF2",
    icon:      "⚡",
  },
  Makkah: {
    primary:   C.coral,
    light:     "#FDF2F0",
    border:    "#F7DAD6",
    gradient:  ["#C05848", "#E07060"] as [string, string],
    cardBg:    "#FFF4F2",
    icon:      "🕌",
  },
  Marketplace: {
    primary:   "#7C6BA8",
    light:     "#F2F0F8",
    border:    "#DDD8EE",
    gradient:  ["#5C4E88", "#7C6BA8"] as [string, string],
    cardBg:    "#F6F4FC",
    icon:      "🛍️",
  },
} as const;

type SectionKey = keyof typeof THEMES;
type ThemeType  = typeof THEMES[SectionKey];

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
  badge?:   string;
};

type FeatureSection = {
  title:     string;
  subtitle?: string;
  gridCols?: number;
  items:     FeatureItem[];
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: "Deen",
    subtitle: "Spiritual essentials",
    gridCols: 3,
    items: [
      { label: "Prayer Times", icon: "clock-outline",                  route: "/(tabs)/prayer",  featured: true, desc: "Daily salah schedule", badge: "LIVE" },
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
    subtitle: "Tools & trackers",
    gridCols: 3,
    items: [
      { label: "Reflect",   icon: "notebook-outline",             route: "./journal",   desc: "Daily reflections" },
      { label: "Tracker",   icon: "chart-bell-curve-cumulative",  route: "./tracker",   desc: "Habit monitor" },
      { label: "Calendar",  icon: "calendar-blank-outline",       route: "./calender",  desc: "Hijri dates" },
      { label: "Zakat",     icon: "hand-coin-outline",            route: "./zakat",     desc: "Calculate dues" },
      { label: "Shahadah",  icon: "star-crescent",                route: "./kalima",    desc: "Core beliefs" },
      { label: "99 Names",  icon: "star-four-points-outline",     route: "./names",     desc: "Asma ul Husna" },
    ],
  },
  {
    title: "Marketplace",
    subtitle: "Halal commerce",
    gridCols: 2,
    items: [
      { label: "Matrimonial",  icon: "account-heart-outline", route: "./Matrimonial", desc: "Find your life partner", badge: "NEW" },
      { label: "Halal Food",   icon: "food-halal",            route: "./halalfoods",        desc: "Certified eateries" },
      { label: "Pilgrim Tour", icon: "mosque",                route: "./pilgrim",     desc: "Hajj & Umrah services" },
      { label: "Halal Travel", icon: "airplane",              route: "./travel",      desc: "Muslim-friendly trips" },
    ],
  },
  {
    title: "Makkah",
    subtitle: "Sacred connections",
    gridCols: 3,
    items: [
      { label: "Makkah Live", icon: "video-outline", route: "./makkah_live", featured: true, desc: "Live Kaaba stream", badge: "LIVE" },
    ],
  },
];

/* ─────────────────────────────────────────
   LAYOUT CONSTANTS
───────────────────────────────────────── */
const PAD = moderateScale(16);
const GAP = scale(10);

/* ─────────────────────────────────────────
   SPRING HELPER
───────────────────────────────────────── */
const spring = (v: Animated.Value, to: number, speed = 40, bounce = 5) =>
  Animated.spring(v, { toValue: to, useNativeDriver: true, speed, bounciness: bounce });

/* ─────────────────────────────────────────
   ISLAMIC GEOMETRIC ORNAMENT
───────────────────────────────────────── */
const StarOrnament: React.FC<{ color: string; size?: number; opacity?: number }> = ({
  color, size = moderateScale(16), opacity = 1,
}) => {
  const sq = size * 0.52;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", opacity }}>
      <View style={{ position: "absolute", width: sq, height: sq, backgroundColor: color }} />
      <View style={{ position: "absolute", width: sq, height: sq, backgroundColor: color, transform: [{ rotate: "45deg" }] }} />
    </View>
  );
};

/* ─────────────────────────────────────────
   ARABESQUE BACKGROUND PATTERN
───────────────────────────────────────── */
const ArabesquePattern: React.FC<{ color: string }> = ({ color }) => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    {[0, 1, 2, 3].map(i => (
      <View key={i} style={{
        position: "absolute",
        top: verticalScale(i * 55 - 20),
        right: scale(i % 2 === 0 ? -15 : 30),
        width: moderateScale(80), height: moderateScale(80),
        borderRadius: moderateScale(4),
        borderWidth: 1,
        borderColor: color,
        transform: [{ rotate: `${45 + i * 22.5}deg` }],
        opacity: 0.15 - i * 0.02,
      }} />
    ))}
  </View>
);

/* ─────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────── */
const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  count: number;
  theme: ThemeType;
}> = ({ title, subtitle, count, theme }) => (
  <View style={sh.wrap}>
    <LinearGradient
      colors={[theme.gradient[0] + "22", theme.gradient[1] + "11", "transparent"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={sh.gradient}
    />
    <View style={sh.left}>
      <View style={[sh.iconCluster, { backgroundColor: theme.gradient[0] + "18", borderColor: theme.border }]}>
        <StarOrnament color={theme.primary} size={moderateScale(10)} />
      </View>
      <View style={sh.textGroup}>
        <Text style={[sh.title, { color: C.white }]}>{title.toUpperCase()}</Text>
        {subtitle && <Text style={[sh.subtitle, { color: C.white + "CC" }]}>{subtitle}</Text>}
      </View>
    </View>
    <View style={[sh.badge, { backgroundColor: theme.light, borderColor: theme.border }]}>
      <Text style={[sh.badgeNum, { color: theme.gradient[0] }]}>{count}</Text>
      <Text style={[sh.badgeLabel, { color: theme.gradient[0] }]}> features</Text>
    </View>
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glow      = useRef(new Animated.Value(0)).current;

  return (
    <Animated.View style={[fc.outer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => {
          spring(scaleAnim, 0.972, 60, 0).start();
          Animated.timing(glow, { toValue: 1, duration: 120, useNativeDriver: false }).start();
        }}
        onPressOut={() => {
          spring(scaleAnim, 1, 28, 9).start();
          Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: false }).start();
        }}
        style={fc.touchable}
      >
        <LinearGradient
          colors={[theme.gradient[0], theme.gradient[1], theme.gradient[0] + "CC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <ArabesquePattern color={C.white} />
        <Animated.View style={[fc.glowRing, {
          borderColor: C.white,
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
        }]} />
        {item.badge && (
          <View style={[fc.livePill, { backgroundColor: C.white + "22" }]}>
            {item.badge === "LIVE" && <View style={fc.liveDot} />}
            <Text style={fc.liveText}>{item.badge}</Text>
          </View>
        )}
        <View style={fc.content}>
          <View style={fc.left}>
            <Text style={fc.label}>{item.label}</Text>
            {item.desc && <Text style={fc.desc}>{item.desc}</Text>}
            <View style={[fc.cta, { backgroundColor: C.white + "20" }]}>
              <Text style={fc.ctaText}>Open</Text>
              <View style={[fc.ctaArrow, { backgroundColor: C.white + "30" }]}>
                <Feather name="arrow-right" size={moderateScale(11)} color={C.white} />
              </View>
            </View>
          </View>
          <View style={fc.orbWrap}>
            <View style={[fc.orbOuter, { borderColor: C.white + "25" }]}>
              <View style={[fc.orbInner, { backgroundColor: C.white + "18" }]}>
                <MaterialCommunityIcons name={item.icon} size={moderateScale(42)} color={C.white} />
              </View>
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
const FeatureTile: React.FC<{
  item:      FeatureItem;
  idx:       number;
  cols:      number;
  tileWidth: number;
  theme:     ThemeType;
  onPress:   () => void;
}> = ({ item, idx, cols, tileWidth, theme, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bright    = useRef(new Animated.Value(1)).current;
  const ml = idx % cols > 0 ? GAP : 0;

  return (
    <Animated.View style={[tt.wrap, { width: tileWidth, marginLeft: ml, transform: [{ scale: scaleAnim }], opacity: bright }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => {
          spring(scaleAnim, 0.91, 70, 0).start();
          Animated.timing(bright, { toValue: 0.78, duration: 70, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          spring(scaleAnim, 1, 32, 8).start();
          Animated.timing(bright, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        }}
        style={[tt.card, { borderColor: theme.border, backgroundColor: theme.cardBg }]}
      >
        <LinearGradient
          colors={[theme.gradient[0], theme.gradient[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tt.stripe}
        />
        {item.badge && (
          <View style={[tt.badge, { backgroundColor: theme.light }]}>
            <Text style={[tt.badgeTxt, { color: theme.gradient[0] }]}>{item.badge}</Text>
          </View>
        )}
        <View style={[tt.iconBg, { backgroundColor: theme.light }]}>
          <MaterialCommunityIcons name={item.icon} size={moderateScale(35)} color={theme.primary} />
        </View>
        <Text style={[tt.label, { color: C.ink }]} numberOfLines={2}>{item.label}</Text>
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
  const theme    = THEMES[section.title as SectionKey] ?? THEMES.Utility;
  const featured = section.items.filter(i => i.featured);
  const standard = section.items.filter(i => !i.featured);
  
  // Dynamic columns based on device: give tablets +1 column naturally 
  const cols = isTablet ? (section.gridCols === 2 ? 3 : 4) : (section.gridCols || 3);
  
  // Tile width calculation uses the centered content wrapper width, not full device width
  const tileW = (ACTUAL_CONTENT_WIDTH - (PAD * 2) - (GAP * (cols - 1))) / cols;

  const rows: FeatureItem[][] = [];
  for (let i = 0; i < standard.length; i += cols) rows.push(standard.slice(i, i + cols));

  return (
    <View style={sb.block}>
      <SectionHeader title={section.title} subtitle={section.subtitle} count={section.items.length} theme={theme} />
      {featured.map(item => <FeaturedCard key={item.route} item={item} theme={theme} onPress={() => onPress(item.route)} />)}
      {rows.map((row, ri) => (
        <View key={ri} style={sb.row}>
          {row.map((item, ci) => (
            <FeatureTile key={item.route} item={item} idx={ci} cols={cols} tileWidth={tileW} theme={theme} onPress={() => onPress(item.route)} />
          ))}
        </View>
      ))}
    </View>
  );
};

/* ─────────────────────────────────────────
   SEARCH BAR
───────────────────────────────────────── */
const SearchBar: React.FC<{
  query:    string;
  focused:  boolean;
  onChange: (v: string) => void;
  onFocus:  () => void;
  onBlur:   () => void;
}> = ({ query, focused, onChange, onFocus, onBlur }) => {
  const bar = useRef(new Animated.Value(0)).current;

  const focusIn  = () => Animated.spring(bar, { toValue: 1, useNativeDriver: false, speed: 25, bounciness: 4 }).start();
  const focusOut = () => Animated.spring(bar, { toValue: 0, useNativeDriver: false, speed: 25, bounciness: 4 }).start();

  const borderColor = bar.interpolate({ inputRange: [0, 1], outputRange: [C.whiteGhost, C.tealLt + "80"] });

  return (
    <Animated.View style={[srch.wrap, { borderColor }]}>
      <Feather name="search" size={moderateScale(17)} color={focused ? C.tealLt : C.white + "60"} />
      <TextInput
        placeholder="Search all features…"
        placeholderTextColor={C.white + "80"}
        style={srch.input}
        value={query}
        onChangeText={onChange}
        onFocus={() => { onFocus(); focusIn(); }}
        onBlur={() => { onBlur(); focusOut(); }}
        returnKeyType="search"
        clearButtonMode="while-editing"
        underlineColorAndroid="transparent"
        selectionColor={C.goldBright}
      />
      {query.length > 0 && Platform.OS === "android" && (
        <TouchableOpacity onPress={() => onChange("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={srch.clearBtn}>
            <Feather name="x" size={moderateScale(12)} color={C.white} />
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

/* ─────────────────────────────────────────
   CATEGORY PILLS ROW
───────────────────────────────────────── */
const CategoryPills: React.FC<{ onPress: (t: string) => void; active?: string }> = ({ onPress, active }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pills.row}>
    {Object.entries(THEMES).map(([key, theme]) => {
      const isActive = active === key;
      return (
        <TouchableOpacity key={key} onPress={() => onPress(key)} activeOpacity={0.8}>
          <LinearGradient
            colors={isActive ? theme.gradient : [C.whiteGhost, C.whiteGhost]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[pills.pill, isActive && pills.pillActive]}
          >
            <StarOrnament color={isActive ? C.white : theme.primary} size={moderateScale(8)} />
            <Text style={[pills.txt, { color: isActive ? C.white : C.white + "CC" }]}>{key}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

/* ─────────────────────────────────────────
   STAT BADGE ROW
───────────────────────────────────────── */
const StatRow: React.FC = () => {
  const total = FEATURE_SECTIONS.reduce((n, s) => n + s.items.length, 0);
  const cats  = FEATURE_SECTIONS.length;
  return (
    <View style={stat.row}>
      <View style={stat.item}>
        <Text style={stat.num}>{total}</Text>
        <Text style={stat.lbl}>Features</Text>
      </View>
      <View style={stat.divider} />
      <View style={stat.item}>
        <Text style={stat.num}>{cats}</Text>
        <Text style={stat.lbl}>Categories</Text>
      </View>
      <View style={stat.divider} />
      <View style={stat.item}>
        <View style={stat.liveDot} />
        <Text style={stat.lbl}>All Active</Text>
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────
   MAIN SCREEN 
───────────────────────────────────────── */
export default function IslamicFeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); 

  const [query,   setQuery]   = useState("");
  const [focused, setFocused] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FEATURE_SECTIONS;
    return FEATURE_SECTIONS
      .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q) || (i.desc ?? "").toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0);
  }, [query]);

  const navigate = (route: string) => router.push(route as any);

  const headerO = scrollY.interpolate({ inputRange: [0, verticalScale(80)], outputRange: [1, 0.95], extrapolate: "clamp" });

  return (
    <View style={root.safe}>
      {/* GLOBAL STATUS BAR LOCK */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={[C.bgDeep, C.bg, C.bgMid + "EE"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      />
      
      <View style={root.meshWrap} pointerEvents="none">
        {[0, 1, 2].map(i => (
          <View key={i} style={[root.meshCircle, {
            width: moderateScale(180 + i * 60), height: moderateScale(180 + i * 60),
            top:  verticalScale(-40 + i * 110),
            right: scale(-60 + i * 20),
            borderRadius: moderateScale((180 + i * 60) / 2),
            borderColor: C.white + (i === 0 ? "0A" : i === 1 ? "07" : "05"),
          }]} />
        ))}
      </View>

      {/* FIXED HEADER WITH INSETS APPLIED */}
      <Animated.View style={[root.header, { paddingTop: insets.top + verticalScale(8), opacity: headerO }]}>
        <View style={root.navRow}>
          <TouchableOpacity
            style={root.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={moderateScale(19)} color={C.white} />
          </TouchableOpacity>

          <View style={root.titleArea}>
            <StarOrnament color={C.goldBright} size={moderateScale(10)} opacity={0.8} />
            <Text style={root.title}>Features</Text>
            <StarOrnament color={C.goldBright} size={moderateScale(10)} opacity={0.8} />
          </View>

          <View style={[root.totalBadge, { backgroundColor: C.gold }]}>
            <Text style={root.totalNum}>
              {FEATURE_SECTIONS.reduce((n, s) => n + s.items.length, 0)}
            </Text>
          </View>
        </View>

        {/* Center alignment wrapper for tablet screens for inner header content */}
        <View style={root.tabletHeaderWrapper}>
          <View style={root.goldRule}>
            <View style={[root.ruleLine, { backgroundColor: C.goldBright + "30" }]} />
            <StarOrnament color={C.goldBright} size={moderateScale(8)} opacity={0.6} />
            <View style={[root.ruleLine, { backgroundColor: C.goldBright + "30" }]} />
          </View>

          <StatRow />
          <CategoryPills onPress={() => {}} />

          <SearchBar
            query={query}
            focused={focused}
            onChange={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
      </Animated.View>

      <View style={{ height: 1, backgroundColor: C.white + "12" }} />

      <Animated.ScrollView
        contentContainerStyle={root.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Tablet Centering Main Wrapper */}
        <View style={root.tabletContentWrapper}>
          {filtered.length === 0 ? (
            <View style={root.empty}>
              <View style={[root.emptyOrb, { backgroundColor: C.whiteGhost, borderColor: C.white + "15" }]}>
                <Feather name="search" size={moderateScale(32)} color={C.tealLt} />
              </View>
              <Text style={[root.emptyTitle, { color: C.white }]}>Nothing found</Text>
              <Text style={[root.emptyHint, { color: C.tealLt }]}>No results for "{query}"</Text>
            </View>
          ) : (
            filtered.map(s => (
              <SectionBlock key={s.title} section={s} onPress={navigate} />
            ))
          )}
          <View style={{ height: verticalScale(100) }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────
   SHADOWS
───────────────────────────────────────── */
const softShadow = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
  android: { elevation: 3 },
});
const strongShadow = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
  android: { elevation: 8 },
});

/* ─────────────────────────────────────────
   ROOT STYLES
───────────────────────────────────────── */
const root = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bgDeep },
  meshWrap:    { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  meshCircle:  { position: "absolute", borderWidth: 1 },
  
  header: {
    paddingHorizontal: wp('4.5%'),
    paddingBottom:     verticalScale(14),
    zIndex:            10,
    overflow:          "visible", 
  },
  tabletHeaderWrapper: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  
  navRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(14),
  },
  backBtn: {
    width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20),
    backgroundColor: C.whiteGhost,
    borderWidth: 1, borderColor: C.white + "15",
    alignItems: "center", justifyContent: "center",
  },
  titleArea: {
    flexDirection: "row", alignItems: "center", gap: scale(10),
  },
  title: {
    fontSize: fontScale(26), fontWeight: "800",
    color: C.white, letterSpacing: -0.5,
  },
  totalBadge: {
    paddingHorizontal: scale(12), paddingVertical: verticalScale(7),
    borderRadius: moderateScale(14), alignItems: "center", justifyContent: "center",
  },
  totalNum: { fontSize: fontScale(13), fontWeight: "800", color: C.white },
  
  goldRule: {
    flexDirection: "row", alignItems: "center",
    gap: scale(8), marginBottom: verticalScale(12),
  },
  ruleLine: { flex: 1, height: 1 },
  
  scrollContent: { paddingHorizontal: PAD, paddingTop: verticalScale(14) },
  tabletContentWrapper: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  
  empty: {
    alignItems: "center", paddingTop: verticalScale(80), gap: verticalScale(16),
  },
  emptyOrb: {
    width: moderateScale(80), height: moderateScale(80), borderRadius: moderateScale(40),
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: fontScale(20), fontWeight: "800", letterSpacing: -0.2 },
  emptyHint:  { fontSize: fontScale(14), fontWeight: "500" },
});

/* ─────────────────────────────────────────
   STAT ROW STYLES
───────────────────────────────────────── */
const stat = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.whiteGhost,
    borderRadius: moderateScale(16), borderWidth: 1, borderColor: C.white + "10",
    paddingVertical: verticalScale(10), paddingHorizontal: scale(20),
    marginBottom: verticalScale(14), gap: 0,
  },
  item: {
    flex: 1, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: scale(6),
  },
  num:  { fontSize: fontScale(16), fontWeight: "800", color: C.white },
  lbl:  { fontSize: fontScale(11), color: C.tealLt, fontWeight: "600" },
  divider: { width: 1, height: verticalScale(22), backgroundColor: C.white + "15" },
  liveDot: {
    width: moderateScale(7), height: moderateScale(7), borderRadius: moderateScale(4),
    backgroundColor: "#4ADE80",
  },
});

/* ─────────────────────────────────────────
   PILLS STYLES
───────────────────────────────────────── */
const pills = StyleSheet.create({
  row: {
    paddingRight: PAD, gap: scale(8),
    flexDirection: "row", marginBottom: verticalScale(14),
  },
  pill: {
    flexDirection: "row", alignItems: "center", gap: scale(6),
    borderRadius: moderateScale(20), borderWidth: 1, borderColor: C.white + "15",
    paddingHorizontal: scale(14), paddingVertical: verticalScale(8),
  },
  pillActive: {
    borderColor: "transparent",
  },
  txt: { fontSize: fontScale(12), fontWeight: "700" },
});

/* ─────────────────────────────────────────
   SEARCH STYLES
───────────────────────────────────────── */
const srch = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.whiteGhost,
    borderWidth: 1.5,
    borderRadius: moderateScale(16), paddingHorizontal: scale(14), height: verticalScale(50),
  },
  input: {
    flex: 1, color: C.white, fontSize: fontScale(15),
    fontWeight: "500", marginLeft: scale(10), paddingVertical: 0,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: "center" as const },
    }),
  },
  clearBtn: {
    width: moderateScale(24), height: moderateScale(24), borderRadius: moderateScale(12),
    backgroundColor: C.white + "20",
    alignItems: "center", justifyContent: "center",
  },
});

/* ─────────────────────────────────────────
   SECTION HEADER STYLES
───────────────────────────────────────── */
const sh = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(14), paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12), borderRadius: moderateScale(14),
    overflow: "hidden", position: "relative",
    backgroundColor: C.surface + "08",
    borderWidth: 1, borderColor: C.white + "10",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: moderateScale(14),
  },
  left: {
    flexDirection: "row", alignItems: "center", gap: scale(10),
  },
  iconCluster: {
    width: moderateScale(32), height: moderateScale(32), borderRadius: moderateScale(10),
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  textGroup: { gap: verticalScale(1) },
  title: {
    fontSize: fontScale(12), fontWeight: "800", letterSpacing: 2,
  },
  subtitle: {
    fontSize: fontScale(10), fontWeight: "600", letterSpacing: 0.5,
    opacity: 0.8,
  },
  badge: {
    flexDirection: "row", alignItems: "center",
    borderRadius: moderateScale(10), borderWidth: 1,
    paddingHorizontal: scale(10), paddingVertical: verticalScale(5),
  },
  badgeNum:   { fontSize: fontScale(14), fontWeight: "800" },
  badgeLabel: { fontSize: fontScale(10), fontWeight: "600" },
});

/* ─────────────────────────────────────────
   FEATURED CARD STYLES
───────────────────────────────────────── */
const fc = StyleSheet.create({
  outer: {
    borderRadius: moderateScale(22), marginBottom: verticalScale(14),
    overflow: "hidden", ...strongShadow,
  },
  touchable: {
    height: verticalScale(140), borderRadius: moderateScale(22),
    overflow: "hidden", position: "relative",
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: moderateScale(22), borderWidth: 1.5,
    margin: moderateScale(2),
  },
  livePill: {
    position: "absolute", top: verticalScale(12), right: scale(12),
    flexDirection: "row", alignItems: "center", gap: scale(5),
    borderRadius: moderateScale(12), paddingHorizontal: scale(10), paddingVertical: verticalScale(5),
  },
  liveDot: {
    width: moderateScale(6), height: moderateScale(6), borderRadius: moderateScale(3),
    backgroundColor: "#4ADE80",
  },
  liveText: { fontSize: fontScale(10), fontWeight: "800", color: C.white, letterSpacing: 1.2 },
  content: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingHorizontal: scale(20), paddingVertical: verticalScale(20), gap: scale(16),
  },
  left:  { flex: 1, gap: verticalScale(5) },
  label: { fontSize: fontScale(22), fontWeight: "900", color: C.white, letterSpacing: -0.5 },
  desc:  { fontSize: fontScale(12), color: C.white + "E6", fontWeight: "600" }, 
  cta: {
    flexDirection: "row", alignSelf: "flex-start", alignItems: "center",
    gap: scale(8), borderRadius: moderateScale(16), marginTop: verticalScale(6),
    paddingLeft: scale(12), paddingRight: scale(8), paddingVertical: verticalScale(7),
  },
  ctaText:  { fontSize: fontScale(12), fontWeight: "700", color: C.white },
  ctaArrow: {
    width: moderateScale(20), height: moderateScale(20), borderRadius: moderateScale(10),
    alignItems: "center", justifyContent: "center",
  },
  orbWrap: { alignItems: "center", justifyContent: "center" },
  orbOuter: {
    width: moderateScale(80), height: moderateScale(80), borderRadius: moderateScale(40),
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  orbInner: {
    width: moderateScale(66), height: moderateScale(66), borderRadius: moderateScale(33),
    alignItems: "center", justifyContent: "center",
  },
});

/* ─────────────────────────────────────────
   TILE STYLES
───────────────────────────────────────── */
const tt = StyleSheet.create({
  wrap: { 
    height: verticalScale(140),
    ...softShadow 
  },
  card: {
    flex: 1, borderRadius: moderateScale(20), overflow: "hidden",
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    paddingTop: verticalScale(12), paddingBottom: verticalScale(10), gap: verticalScale(10),
  },
  stripe: {
    position: "absolute", top: 0, left: 0, right: 0, height: verticalScale(4),
  },
  badge: {
    position: "absolute", top: verticalScale(8), right: scale(8),
    borderRadius: moderateScale(6), paddingHorizontal: scale(6), paddingVertical: verticalScale(3),
  },
  badgeTxt: { fontSize: fontScale(9), fontWeight: "800", letterSpacing: 0.8 },
  iconBg: {
    width: moderateScale(60), height: moderateScale(60), borderRadius: moderateScale(18),
    alignItems: "center", justifyContent: "center",
  },
  label: {
    fontSize: fontScale(14), fontWeight: "800", textAlign: "center",
    lineHeight: fontScale(18), letterSpacing: 0.3, paddingHorizontal: scale(8),
  },
});

/* ─────────────────────────────────────────
   SECTION BLOCK STYLES
───────────────────────────────────────── */
const sb = StyleSheet.create({
  block: { marginBottom: verticalScale(32) },
  row:   { flexDirection: "row", marginBottom: verticalScale(10), alignItems: "stretch" },
});