import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import hisnData from '../../assets/data/hisnulmuslim.json';

/* ─────────────────────────────────────────
   RESPONSIVE SCALE (GLOBAL)
───────────────────────────────────────── */
const { width: W } = Dimensions.get('window');
// Clamp scale between 0.85 and 1.25 so large screens don't get bloated text
const clampedScale = Math.min(Math.max(W / 390, 0.85), 1.25);
const rs = (n: number) => Math.round(n * clampedScale);

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const C = {
  bg0: '#061a19',
  bg1: '#082220',
  bg2: '#0c2e2b',
  bg3: '#103836',
  bg4: '#154542',

  mint: '#5bbfb0',
  mintLight: '#7dd4c7',
  mintBg: 'rgba(91,191,176,0.12)',
  mintBorder: 'rgba(91,191,176,0.25)',

  cream: '#f0e8d5',
  beige: '#cec5ad',
  muted: '#7aada8',
  dimmed: '#3d706b',

  lavender: '#b8a9e8',
  lavenderBg: 'rgba(184,169,232,0.12)',

  border: 'rgba(255,255,255,0.06)',
  borderMid: 'rgba(91,191,176,0.18)',

  cardTints: [
    'rgba(91,191,176,0.13)', 'rgba(157,200,180,0.13)', 'rgba(130,180,210,0.13)',
    'rgba(170,210,165,0.13)', 'rgba(210,180,150,0.12)', 'rgba(160,190,220,0.13)',
    'rgba(140,200,185,0.13)', 'rgba(180,200,170,0.13)', 'rgba(200,185,210,0.11)',
    'rgba(175,210,195,0.13)',
  ],
  cardBorderTints: [
    'rgba(91,191,176,0.22)', 'rgba(157,200,180,0.22)', 'rgba(130,180,210,0.22)',
    'rgba(170,210,165,0.22)', 'rgba(210,180,150,0.20)', 'rgba(160,190,220,0.22)',
    'rgba(140,200,185,0.22)', 'rgba(180,200,170,0.22)', 'rgba(200,185,210,0.20)',
    'rgba(175,210,195,0.22)',
  ],
};

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface HisnItem { title: string; reference: string; arabic: string; english: string; }

interface CategoryDef {
  id: string; en: string; ar: string; emoji: string; colorIdx: number;
}

interface DisplayDua {
  id: string; groupId: string; originalTitle: string; arabic: string; translation: string; reference: string;
}

type ViewState = 'categories' | 'list' | 'detail';

/* ─────────────────────────────────────────
   CATEGORY DEFINITIONS
───────────────────────────────────────── */
const CATEGORIES: CategoryDef[] = [
  { id: 'Prayer',    en: 'Prayer & Worship',  ar: 'الوضوء و الصلاة',       emoji: '🕌', colorIdx: 0 },
  { id: 'Praising',  en: 'Praising Allah',    ar: 'التسابيح و الأذكار',   emoji: '📿', colorIdx: 1 },
  { id: 'Hajj',      en: 'Hajj & Umrah',      ar: 'الحج و العمرة',          emoji: '🕋', colorIdx: 2 },
  { id: 'Travel',    en: 'Travel & Movement', ar: 'التنقل و السفر',        emoji: '✈️', colorIdx: 3 },
  { id: 'Emotions',  en: 'Joy & Distress',    ar: 'الفرح و الخوف',          emoji: '🤲', colorIdx: 4 },
  { id: 'Nature',    en: 'Nature & Weather',  ar: 'الطبيعة',                 emoji: '🌿', colorIdx: 5 },
  { id: 'Etiquette', en: 'Etiquette',         ar: 'الآداب و التعامل',      emoji: '🌸', colorIdx: 6 },
  { id: 'Home',      en: 'Home & Family',     ar: 'البيت و الأهل',          emoji: '🏡', colorIdx: 7 },
  { id: 'Food',      en: 'Food & Drink',      ar: 'الطعام و الشراب',       emoji: '🍽️', colorIdx: 8 },
  { id: 'Sickness',  en: 'Sickness & Death',  ar: 'المرض و الجنائز',      emoji: '🫀', colorIdx: 9 },
];

const getGroupId = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('prayer') || t.includes('wudu') || t.includes('ablution') || t.includes('mosque') || t.includes('athan')) return 'Prayer';
  if (t.includes('hajj') || t.includes('umrah') || t.includes('talbiya') || t.includes('safa')) return 'Hajj';
  if (t.includes('travel') || t.includes('mounted') || t.includes('vehicle')) return 'Travel';
  if (t.includes('anxiety') || t.includes('sorrow') || t.includes('distress') || t.includes('angry')) return 'Emotions';
  if (t.includes('rain') || t.includes('wind') || t.includes('thunder') || t.includes('moon')) return 'Nature';
  if (t.includes('gathering') || t.includes('sneeze') || t.includes('greeting')) return 'Etiquette';
  if (t.includes('home') || t.includes('house') || t.includes('sleep') || t.includes('marriage')) return 'Home';
  if (t.includes('eating') || t.includes('food') || t.includes('drink') || t.includes('fast')) return 'Food';
  if (t.includes('sick') || t.includes('pain') || t.includes('death') || t.includes('grave')) return 'Sickness';
  return 'Praising';
};

/* ─────────────────────────────────────────
   ANIMATED PRESS WRAPPER
───────────────────────────────────────── */
const PressScale: React.FC<{
  onPress: () => void; style?: object; children: React.ReactNode; to?: number;
}> = ({ onPress, style, children, to = 0.96 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onIn} onPressOut={onOut}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────
   CATEGORY CARD
───────────────────────────────────────── */
const CategoryCard = React.memo(({
  cat, count, onPress, cardWidth, cardHeight
}: {
  cat: CategoryDef; count: number; onPress: () => void; cardWidth: number; cardHeight: number;
}) => (
  <PressScale onPress={onPress} to={0.95}>
    <View style={[
      styles.catCard,
      { width: cardWidth, height: cardHeight, backgroundColor: C.cardTints[cat.colorIdx], borderColor: C.cardBorderTints[cat.colorIdx] },
    ]}>
      <Text style={styles.catEmoji}>{cat.emoji}</Text>
      <View style={styles.catTextBlock}>
        <Text style={styles.catArabic} numberOfLines={3}>{cat.ar}</Text>
        <Text style={styles.catEnglish} numberOfLines={1}>{cat.en}</Text>
      </View>
      <View style={styles.catCountBadge}>
        <Text style={styles.catCount}>{count} duas</Text>
      </View>
    </View>
  </PressScale>
));

/* ─────────────────────────────────────────
   DUA LIST CARD
───────────────────────────────────────── */
const DuaListCard = React.memo(({
  item, isSaved, onPress, onSave,
}: {
  item: DisplayDua; isSaved: boolean; onPress: () => void; onSave: () => void;
}) => (
  <PressScale onPress={onPress} to={0.975} style={{ marginBottom: rs(10) }}>
    <View style={styles.duaCard}>
      <View style={styles.duaCardInner}>
        <View style={styles.duaCardAccent} />
        <View style={styles.duaCardText}>
          <Text style={styles.duaCardTitle} numberOfLines={2}>{item.originalTitle}</Text>
          <Text style={styles.duaCardPreview} numberOfLines={1}>{item.arabic}</Text>
        </View>
        <TouchableOpacity onPress={onSave} style={styles.duaSaveBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={rs(20)} color={isSaved ? C.lavender : C.dimmed} />
        </TouchableOpacity>
      </View>
    </View>
  </PressScale>
));

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function DuaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Responsive hook for dynamic grid calculations
  const { width } = useWindowDimensions();
  const numColumns = width > 800 ? 4 : width > 500 ? 3 : 2;
  const CARD_GAP = rs(12);
  const paddingHorizontal = rs(20);
  const availableWidth = width - (paddingHorizontal * 2) - (CARD_GAP * (numColumns - 1));
  const CARD_W = Math.floor(availableWidth / numColumns);
  const CARD_H = CARD_W * 1.05;

  const [allDuas, setAllDuas] = useState<DisplayDua[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'saved'>('categories');
  const [view, setView] = useState<ViewState>('categories');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedDua, setSelectedDua] = useState<DisplayDua | null>(null);
  const [fontsLoaded] = useFonts({
    'IndoPakQuran': require('../../assets/fonts/IndoPakQuran.ttf'),
  });
  
  useEffect(() => {
    const init = async () => {
      const processed: DisplayDua[] = (hisnData as HisnItem[]).map((item, i) => {
        const clean = item.title.replace('Chapter: ', '').trim();
        return {
          id: `dua-${i}`,
          groupId: getGroupId(clean),
          originalTitle: clean,
          arabic: item.arabic.trim(),
          translation: item.english.trim(),
          reference: item.reference.trim(),
        };
      });
      setAllDuas(processed);
      try {
        const stored = await AsyncStorage.getItem('@qalb_saved_duas');
        if (stored) setSavedIds(JSON.parse(stored));
      } catch {}
    };
    init();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.mint} />
      </View>
    );
  }

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach(c => { map[c.id] = 0; });
    allDuas.forEach(d => { if (map[d.groupId] !== undefined) map[d.groupId]++; });
    return map;
  }, [allDuas]);

  const listDuas = useMemo(() => {
    let result = allDuas;
    if (activeTab === 'saved') result = result.filter(d => savedIds.includes(d.id));
    if (activeCategoryId) result = result.filter(d => d.groupId === activeCategoryId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        d => d.originalTitle.toLowerCase().includes(q) || d.translation.toLowerCase().includes(q) || d.arabic.includes(searchQuery),
      );
    }
    return result;
  }, [allDuas, activeTab, activeCategoryId, savedIds, searchQuery]);

  const openCategory = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategoryId(id);
    setView('list');
  }, []);

  const openDua = useCallback((dua: DisplayDua) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDua(dua);
    setView('detail');
  }, []);

  const goBack = useCallback(() => {
    Haptics.selectionAsync();
    if (view === 'detail') {
      setView('list');
      setSelectedDua(null);
    } else if (view === 'list') {
      setView('categories');
      setActiveCategoryId(null);
      setSearchQuery('');
    } else {
      router.back();
    }
  }, [view, router]);

  const toggleSave = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      AsyncStorage.setItem('@qalb_saved_duas', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const handleShare = useCallback(async (dua: DisplayDua) => {
    try {
      await Share.share({ message: `${dua.arabic}\n\n${dua.translation}\n\n${dua.reference}\n\nShared via Qalb-E-Rooh` });
    } catch {}
  }, []);

  const getHeaderTitle = () => {
    if (view === 'detail' && selectedDua) return selectedDua.originalTitle;
    if (view === 'list' && activeCategoryId) return CATEGORIES.find(c => c.id === activeCategoryId)?.en ?? 'Duas';
    return 'Duas';
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + rs(8) }]}>
      <TouchableOpacity style={styles.headerBackBtn} onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="arrow-left" size={rs(22)} color={C.cream} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{getHeaderTitle()}</Text>
    </View>
  );

  /* ─────────────────────────────────────
     VIEW: DETAIL
  ───────────────────────────────────── */
  if (view === 'detail' && selectedDua) {
    const isSaved = savedIds.includes(selectedDua.id);
    const cat = CATEGORIES.find(c => c.id === selectedDua.groupId);

    return (
      <View style={styles.root}>
        <LinearGradient colors={[C.bg0, C.bg1]} style={StyleSheet.absoluteFill} />
        {renderHeader()}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.detailScroll, { paddingBottom: insets.bottom + rs(50) }]}>
          {cat && (
            <View style={styles.detailCatChip}>
              <Text style={styles.detailCatEmoji}>{cat.emoji}</Text>
              <Text style={styles.detailCatLabel}>{cat.en}</Text>
            </View>
          )}

          {/* Fixed Arabic text container */}
          <View style={styles.arabicCard}>
            <View style={styles.arabicCornerTL} />
            <View style={styles.arabicCornerBR} />
            
            <View style={{ maxHeight: rs(350) }}> 
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator indicatorStyle="white" contentContainerStyle={{ paddingVertical: rs(15), paddingHorizontal: rs(10) }}>
                <Text style={styles.arabicText}>
                  {selectedDua.arabic}
                </Text>
              </ScrollView>
            </View>
          </View>

          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>Translation</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.translationCard}>
            <Text style={styles.translationText}>{selectedDua.translation}</Text>
          </View>

          <View style={styles.refRow}>
            <Feather name="book-open" size={rs(12)} color={C.dimmed} />
            <Text style={styles.refText}>{selectedDua.reference}</Text>
          </View>

          <View style={styles.actionRow}>
            <PressScale onPress={() => handleShare(selectedDua)} style={styles.actionBtn} to={0.94}>
              <Feather name="share-2" size={rs(17)} color={C.mint} />
              <Text style={styles.actionText}>Share</Text>
            </PressScale>
            <View style={styles.actionDivider} />
            <PressScale onPress={() => toggleSave(selectedDua.id)} style={styles.actionBtn} to={0.94}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={rs(17)} color={isSaved ? C.lavender : C.mint} />
              <Text style={[styles.actionText, isSaved && { color: C.lavender }]}>{isSaved ? 'Saved' : 'Save'}</Text>
            </PressScale>
            <View style={styles.actionDivider} />
            <PressScale onPress={() => { Share.share({ message: selectedDua.arabic }); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={styles.actionBtn} to={0.94}>
              <MaterialCommunityIcons name="content-copy" size={rs(17)} color={C.mint} />
              <Text style={styles.actionText}>Copy</Text>
            </PressScale>
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ─────────────────────────────────────
     VIEW: LIST (duas within a category / saved)
  ───────────────────────────────────── */
  if (view === 'list') {
    return (
      <View style={styles.root}>
        <LinearGradient colors={[C.bg0, C.bg1]} style={StyleSheet.absoluteFill} />
        {renderHeader()}

        {activeCategoryId && (() => {
          const cat = CATEGORIES.find(c => c.id === activeCategoryId)!;
          return (
            <View style={styles.listCatStrip}>
              <Text style={styles.listCatEmoji}>{cat.emoji}</Text>
              <View>
                <Text style={styles.listCatAr}>{cat.ar}</Text>
                <Text style={styles.listCatCount}>{listDuas.length} supplications</Text>
              </View>
            </View>
          );
        })()}

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={rs(17)} color={C.muted} />
          <TextInput placeholder="Search…" placeholderTextColor={C.dimmed} style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" clearButtonMode="while-editing" selectionColor={C.mint} />
        </View>

        <FlatList
          data={listDuas}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <DuaListCard item={item} isSaved={savedIds.includes(item.id)} onPress={() => openDua(item)} onSave={() => toggleSave(item.id)} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + rs(60) }]}
          initialNumToRender={14}
          maxToRenderPerBatch={12}
          windowSize={7}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No duas found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
            </View>
          }
        />
      </View>
    );
  }

  /* ─────────────────────────────────────
     VIEW: CATEGORIES (main / home)
  ───────────────────────────────────── */
  return (
    <View style={styles.root}>
      <LinearGradient colors={[C.bg0, C.bg1]} style={StyleSheet.absoluteFill} />
      {renderHeader()}

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('categories'); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>Categories</Text>
          {activeTab === 'categories' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('saved'); setActiveCategoryId(null); setView('list'); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>My Duas {savedIds.length > 0 ? `(${savedIds.length})` : ''}</Text>
          {activeTab === 'saved' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      <View style={styles.tabDivider} />

      <View style={[styles.searchWrap, { marginHorizontal: rs(20), marginBottom: rs(4) }]}>
        <Ionicons name="search" size={rs(17)} color={C.muted} />
        <TextInput placeholder="Search duas…" placeholderTextColor={C.dimmed} style={styles.searchInput} value={searchQuery} onChangeText={text => { setSearchQuery(text); if (text.trim()) { setActiveCategoryId(null); setView('list'); } }} returnKeyType="search" clearButtonMode="while-editing" selectionColor={C.mint} />
      </View>

      <Text style={styles.sourceLabel}>Hisnul Muslim (Fortress of the Muslim)</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.catGrid, { paddingBottom: insets.bottom + rs(60) }]}>
        {CATEGORIES.reduce<CategoryDef[][]>((rows, cat, i) => {
          if (i % numColumns === 0) rows.push([cat]);
          else rows[rows.length - 1].push(cat);
          return rows;
        }, []).map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} style={[styles.catRow, { marginBottom: CARD_GAP }]}>
            {row.map(cat => (
              <CategoryCard key={cat.id} cat={cat} count={categoryCounts[cat.id] ?? 0} onPress={() => openCategory(cat.id)} cardWidth={CARD_W} cardHeight={CARD_H} />
            ))}
            {/* Filler for empty spaces in the grid */}
            {Array.from({ length: numColumns - row.length }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: CARD_W }} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg0 },

  /* ── Header ── */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs(16), paddingBottom: rs(12), backgroundColor: 'transparent' },
  headerBackBtn: { width: rs(38), height: rs(38), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: rs(17), fontWeight: '700', color: C.cream, letterSpacing: 0.2, marginHorizontal: rs(8) },

  /* ── Tabs ── */
  tabBar: { flexDirection: 'row', paddingHorizontal: rs(20) },
  tabItem: { marginRight: rs(28), paddingBottom: rs(10), position: 'relative' },
  tabText: { fontSize: rs(15), fontWeight: '600', color: C.dimmed },
  tabTextActive: { color: C.mint, fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: rs(2.5), borderRadius: rs(2), backgroundColor: C.mint },
  tabDivider: { height: 1, backgroundColor: C.border, marginBottom: rs(14) },

  /* ── Search ── */
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg2, borderRadius: rs(13), paddingHorizontal: rs(14), height: rs(44), borderWidth: 1, borderColor: C.border, marginBottom: rs(12) },
  searchInput: { flex: 1, color: C.cream, fontSize: rs(14), marginLeft: rs(10), paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center' },
  sourceLabel: { fontSize: rs(12), color: C.dimmed, fontWeight: '500', paddingHorizontal: rs(20), marginBottom: rs(14), letterSpacing: 0.2 },

  /* ── Grid & Cards ── */
  catGrid: { paddingHorizontal: rs(20), paddingTop: rs(2) },
  catRow: { flexDirection: 'row', justifyContent: 'space-between' },
  catCard: { borderRadius: rs(18), borderWidth: 1, padding: rs(14), justifyContent: 'space-between', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 4 } }) },
  catEmoji: { fontSize: rs(34), textAlign: 'right', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  catTextBlock: { marginTop: rs(8), flex: 1, justifyContent: 'flex-end' },
  catArabic: { fontSize: rs(18), fontWeight: '700', color: C.cream, lineHeight: rs(26), writingDirection: 'rtl', textAlign: 'left', marginBottom: rs(4) },
  catEnglish: { fontSize: rs(11), fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  catCountBadge: { alignSelf: 'flex-start', marginTop: rs(10), backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: rs(8), paddingHorizontal: rs(9), paddingVertical: rs(4) },
  catCount: { fontSize: rs(11), fontWeight: '700', color: C.mint },

  /* ── List ── */
  listCatStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(20), marginBottom: rs(14) },
  listCatEmoji: { fontSize: rs(32), marginRight: rs(12) },
  listCatAr: { fontSize: rs(17), fontWeight: '700', color: C.cream, writingDirection: 'rtl', lineHeight: rs(24) },
  listCatCount: { fontSize: rs(12), color: C.muted, fontWeight: '500', marginTop: rs(2) },
  listContent: { paddingHorizontal: rs(16), paddingTop: rs(6) },
  duaCard: { backgroundColor: C.bg2, borderRadius: rs(16), borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 3 } }) },
  duaCardInner: { flexDirection: 'row', alignItems: 'center' },
  duaCardAccent: { width: rs(3), alignSelf: 'stretch', backgroundColor: C.mint, opacity: 0.55 },
  duaCardText: { flex: 1, paddingVertical: rs(14), paddingHorizontal: rs(14) },
  duaCardTitle: { fontSize: rs(15), fontWeight: '700', color: C.cream, lineHeight: rs(21), marginBottom: rs(5) },
  duaCardPreview: { fontSize: rs(13), color: C.muted, writingDirection: 'rtl', lineHeight: rs(18) },
  duaSaveBtn: { paddingRight: rs(16), paddingLeft: rs(8), paddingVertical: rs(14) },

  /* ── Empty ── */
  emptyState: { alignItems: 'center', paddingTop: rs(80) },
  emptyEmoji: { fontSize: rs(48), marginBottom: rs(16) },
  emptyTitle: { fontSize: rs(18), fontWeight: '700', color: C.muted, marginBottom: rs(8) },
  emptySubtitle: { fontSize: rs(14), color: C.dimmed, textAlign: 'center' },

  /* ── Detail ── */
  detailScroll: { paddingHorizontal: rs(20), paddingTop: rs(6) },
  detailCatChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: C.mintBg, borderWidth: 1, borderColor: C.mintBorder, borderRadius: rs(20), paddingHorizontal: rs(14), paddingVertical: rs(6), marginBottom: rs(20) },
  detailCatEmoji: { fontSize: rs(15), marginRight: rs(6) },
  detailCatLabel: { fontSize: rs(12), fontWeight: '700', color: C.mint, textTransform: 'uppercase', letterSpacing: 0.8 },

  /* Arabic Fixed Container */
  arabicCard: { backgroundColor: C.bg2, borderRadius: rs(20), borderWidth: 1, borderColor: C.borderMid, padding: rs(10), marginBottom: rs(16), overflow: 'hidden', position: 'relative', ...Platform.select({ ios: { shadowColor: C.mint, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 14 }, android: { elevation: 5 } }) },
  arabicCornerTL: { position: 'absolute', top: rs(12), left: rs(12), width: rs(20), height: rs(20), borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: C.mint, opacity: 0.4, zIndex: 10 },
  arabicCornerBR: { position: 'absolute', bottom: rs(12), right: rs(12), width: rs(20), height: rs(20), borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: C.mint, opacity: 0.4, zIndex: 10 },
  
  /* CRITICAL: Arabic Text Fixes */
  arabicText: { 
    fontSize: rs(28),
    color: C.cream,
    textAlign: 'right', 
    writingDirection: 'rtl', 
    lineHeight: rs(64), // High line height stops overlapping
    fontFamily: 'IndoPakQuran', 
    includeFontPadding: false 
  },

  /* Dividers & Text */
  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(14) },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerLabel: { fontSize: rs(11), fontWeight: '700', color: C.dimmed, textTransform: 'uppercase', letterSpacing: 1.2, marginHorizontal: rs(12) },
  translationCard: { backgroundColor: C.bg2, borderRadius: rs(18), borderWidth: 1, borderColor: C.border, padding: rs(20), marginBottom: rs(12) },
  translationText: { fontSize: rs(15), color: C.beige, lineHeight: rs(25), textAlign: 'center', fontWeight: '400' },
  refRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: rs(28) },
  refText: { fontSize: rs(13), color: C.dimmed, fontStyle: 'italic', marginLeft: rs(6), textAlign: 'center', flexShrink: 1 },

  /* Actions */
  actionRow: { flexDirection: 'row', backgroundColor: C.bg2, borderRadius: rs(16), borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(15) },
  actionDivider: { width: 1, backgroundColor: C.border, marginVertical: rs(10) },
  actionText: { fontSize: rs(13), fontWeight: '600', color: C.mint, marginLeft: rs(7) },
});