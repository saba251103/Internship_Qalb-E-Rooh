/**
 * DuaScreen.tsx — Qalb-E-Rooh
**/
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import { fetchSavedDuasFromBackend, syncDuaToggleWithBackend } from '../services/duaService';

// ─────────────────────────────────────────────
// RESPONSIVE SCALE
// ─────────────────────────────────────────────
const { width: W } = Dimensions.get('window');
// FIX 14: Cap raised to 1.25 for larger phones/tablets
const fontScale = Math.min(Math.max(W / 390, 0.9), 1.25);
const rs = (n: number) => Math.round(n * fontScale);

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg: '#041412',
  surface: '#0A1E1C',
  surfaceHighlight: '#0F2A27',
  surfaceElevated: '#122420', // FIX: slight elevation variety

  mint: '#5bbfb0',
  mintDim: 'rgba(91,191,176,0.12)',
  mintGlow: 'rgba(91,191,176,0.3)',

  textHigh: '#F5F5F0',
  textMed: '#A8BDBA',
  // FIX 17: Raised from #627D79 → #7A9E9A (~4.6:1 contrast on dark bg — WCAG AA)
  textLow: '#7A9E9A',

  border: 'rgba(91,191,176,0.08)',
  divider: 'rgba(245,245,240,0.05)',
  skeleton: 'rgba(91,191,176,0.06)',

  toastBg: 'rgba(10,30,28,0.97)',
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const FLOATING_BAR_HEIGHT = rs(100); // FIX 11: known height for paddingBottom
const STORAGE_KEY_SAVED = '@qalb_saved_duas';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface DisplayDua {
  id: string;
  groupId: string;
  originalTitle: string;
  arabic: string;
  translation: string;
  reference: string;
}

type ScreenState =
  | { name: 'home' }
  | { name: 'category'; categoryId: string; title: string }
  | { name: 'detail'; dua: DisplayDua; categoryDuas: DisplayDua[] };

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
const BASE_CATEGORIES = [
  { id: 'Prayer',    en: 'Prayer & Wudu',  ar: 'الوضوء و الصلاة',   emoji: '🕌', keywords: ['prayer', 'wudu', 'ablution', 'mosque', 'athan', 'salah'] },
  { id: 'Praising',  en: 'Dhikr',          ar: 'التسابيح و الأذكار', emoji: '📿', keywords: ['praise', 'glorification', 'remembrance', 'morning', 'evening'] },
  { id: 'Hajj',      en: 'Hajj & Umrah',   ar: 'الحج و العمرة',      emoji: '🕋', keywords: ['hajj', 'umrah', 'talbiya', 'safa', 'marwa', 'arafat'] },
  { id: 'Travel',    en: 'Travel',         ar: 'التنقل و السفر',    emoji: '✈️', keywords: ['travel', 'mounted', 'vehicle', 'returning', 'journey'] },
  { id: 'Emotions',  en: 'Emotions',       ar: 'الفرح و الخوف',      emoji: '🤲', keywords: ['anxiety', 'sorrow', 'distress', 'angry', 'fear', 'hardship'] },
  { id: 'Nature',    en: 'Nature',         ar: 'الطبيعة',             emoji: '🌿', keywords: ['rain', 'wind', 'thunder', 'moon', 'storm'] },
  { id: 'Etiquette', en: 'Etiquette',      ar: 'الآداب',             emoji: '🌸', keywords: ['gathering', 'sneeze', 'greeting', 'guest', 'clothing'] },
  { id: 'Home',      en: 'Home & Sleep',   ar: 'البيت و الأهل',      emoji: '🏡', keywords: ['home', 'house', 'sleep', 'marriage', 'waking'] },
  { id: 'Food',      en: 'Food & Drink',   ar: 'الطعام و الشراب',   emoji: '🍽️', keywords: ['eating', 'food', 'drink', 'fast', 'iftar'] },
  { id: 'Sickness',  en: 'Healing',        ar: 'المرض',             emoji: '🫀', keywords: ['sick', 'pain', 'death', 'grave', 'condolence'] },
];

const assignCategory = (title: string): string => {
  const t = title.toLowerCase();
  for (const cat of BASE_CATEGORIES) {
    if (cat.keywords.some(kw => t.includes(kw))) return cat.id;
  }
  return 'Praising';
};

// ─────────────────────────────────────────────
// PRESS SCALE WRAPPER
// ─────────────────────────────────────────────
const PressScale = ({ onPress, style, children, disabled }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => animate(0.96)}
        onPressOut={() => animate(1)}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// SKELETON LOADER for Arabic text
// ─────────────────────────────────────────────
const ArabicSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ opacity }}>
      {[100, 85, 90, 70].map((w, i) => (
        <View
          key={i}
          style={{
            height: rs(20),
            width: `${w}%`,
            backgroundColor: C.skeleton,
            borderRadius: rs(6),
            marginBottom: rs(12),
            alignSelf: 'flex-end',
          }}
        />
      ))}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// HIGHLIGHTED TEXT (keyword match)
// ─────────────────────────────────────────────
const HighlightedText = React.memo(({
  text, query, style, numberOfLines,
}: { text: string; query: string; style: any; numberOfLines?: number }) => {
  if (!query.trim()) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <Text key={i} style={[style, styles.highlight]}>{part}</Text>
          : part
      )}
    </Text>
  );
});

// ─────────────────────────────────────────────
// MEMOIZED DUA CARD
// ─────────────────────────────────────────────
interface DuaCardProps {
  item: DisplayDua;
  isSaved: boolean;
  searchQuery: string;
  onPress: (dua: DisplayDua) => void;
  onToggleSave: (id: string) => void;
}

const DuaCard = React.memo(({ item, isSaved, searchQuery, onPress, onToggleSave }: DuaCardProps) => (
  <PressScale onPress={() => onPress(item)}>
    <View style={styles.listCard}>
      <View style={styles.listCardContent}>
        <HighlightedText
          text={item.originalTitle}
          query={searchQuery}
          style={styles.listCardTitle}
          numberOfLines={2}
        />
        <Text style={styles.listCardPreview} numberOfLines={1}>{item.arabic}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onToggleSave(item.id)}
        style={styles.listCardAction}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel={isSaved ? 'Remove from saved' : 'Save dua'}
      >
        <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={rs(22)} color={isSaved ? C.mint : C.textLow} />
      </TouchableOpacity>
    </View>
  </PressScale>
));

// ─────────────────────────────────────────────
// COPY ACTION SHEET
// ─────────────────────────────────────────────
interface CopySheetProps {
  visible: boolean;
  onClose: () => void;
  onCopyArabic: () => void;
  onCopyFull: () => void;
}
const CopyActionSheet = ({ visible, onClose, onCopyArabic, onCopyFull }: CopySheetProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Copy Dua</Text>
        <TouchableOpacity style={styles.sheetOption} onPress={onCopyArabic}>
          <Feather name="type" size={rs(20)} color={C.mint} />
          <Text style={styles.sheetOptionText}>Copy Arabic Text Only</Text>
        </TouchableOpacity>
        <View style={styles.sheetDivider} />
        <TouchableOpacity style={styles.sheetOption} onPress={onCopyFull}>
          <Feather name="copy" size={rs(20)} color={C.mint} />
          <Text style={styles.sheetOptionText}>Copy Full Dua (Arabic + Translation)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function DuaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const numCols = width > 768 ? 3 : 2;
  const isTablet = width > 768;

  const [fontsLoaded] = useFonts({ IndoPakQuran: require('../../assets/fonts/IndoPakQuran.ttf') });

  const [allDuas, setAllDuas] = useState<DisplayDua[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [navStack, setNavStack] = useState<ScreenState[]>([{ name: 'home' }]);
  const currentScreen = navStack[navStack.length - 1];

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [copySheetDua, setCopySheetDua] = useState<DisplayDua | null>(null);

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', icon: '' });
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── INIT ──
  useEffect(() => {
    const init = async () => {
      const processed: DisplayDua[] = (hisnData as any[]).map((item, i) => {
        const clean = item.title.replace('Chapter: ', '').trim();
        return {
          id: `dua-${i}`,
          groupId: assignCategory(clean),
          originalTitle: clean,
          arabic: item.arabic.trim(),
          translation: item.english.trim(),
          reference: item.reference.trim(),
        };
      });
      setAllDuas(processed);

      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_SAVED);
        const localSet = stored ? new Set<string>(JSON.parse(stored) as string[]) : new Set<string>();
        setSavedIds(localSet);
        const serverIds = await fetchSavedDuasFromBackend();
        const mergedSet = new Set([...localSet, ...serverIds]);
        setSavedIds(mergedSet);
        await AsyncStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify([...mergedSet]));
      } catch (_) {
        console.warn('Sync failed, utilizing local cache.');
      }
    };
    init();
  }, []);

  // ── BACK HANDLER ──
  useEffect(() => {
    const backAction = () => {
      if (navStack.length > 1) {
        popScreen();
        return true;
      }
      return false; // Let default back action happen
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navStack]);

  // ── SEARCH DEBOUNCE ──
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchInput]);

  // ── NAVIGATION ──
  const pushScreen = useCallback((screen: ScreenState) => {
    Keyboard.dismiss();
    setNavStack(prev => [...prev, screen]);
  }, []);

  const popScreen = useCallback(() => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    setNavStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);


  // ── TOAST ──
  const showToastMsg = useCallback((message: string, icon: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ visible: true, message, icon });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToast(prev => ({ ...prev, visible: false }));
    });
  }, [toastOpacity]);

  // ── SAVE TOGGLE ──
  const toggleSave = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let isNowSaved = false;
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); isNowSaved = false; }
      else { next.add(id); isNowSaved = true; }
      AsyncStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify([...next])).catch(() => {});
      return next;
    });
    showToastMsg(isNowSaved ? 'Saved to Collection' : 'Removed from Collection', isNowSaved ? 'bookmark' : 'bookmark-outline');
    try { await syncDuaToggleWithBackend(id); } catch (_) {}
  }, [showToastMsg]);

  // ── COPY ──
  const handleCopyArabic = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopySheetDua(null);
    showToastMsg('Arabic text copied', 'copy');
  }, [showToastMsg]);

  const handleCopyFull = useCallback(async (dua: DisplayDua) => {
    const full = `${dua.arabic}\n\n${dua.translation}\n— ${dua.reference}`;
    await Clipboard.setStringAsync(full);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopySheetDua(null);
    showToastMsg('Full dua copied', 'copy');
  }, [showToastMsg]);

  // ── DATA DERIVATION ──
  const displayedDuas = useMemo(() => {
    let result = allDuas;
    if (showSavedOnly) result = result.filter(d => savedIds.has(d.id));
    if (currentScreen.name === 'category') result = result.filter(d => d.groupId === currentScreen.categoryId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        d => d.originalTitle.toLowerCase().includes(q) || d.translation.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allDuas, showSavedOnly, currentScreen, searchQuery, savedIds]);
  const sortedCategories = BASE_CATEGORIES;
  // ── BREADCRUMB ──
  const getBreadcrumb = (): string | null => {
    if (currentScreen.name === 'home') return null;
    if (currentScreen.name === 'category') return `All • ${currentScreen.title}`;
    if (currentScreen.name === 'detail') {
      const cat = BASE_CATEGORIES.find(c => c.id === currentScreen.dua.groupId);
      return `${cat?.en ?? 'All'} • ${currentScreen.dua.originalTitle}`;
    }
    return null;
  };
  const pushCategory = useCallback((categoryId: string, title: string) => {
    pushScreen({ name: 'category', categoryId, title });
  }, [pushScreen]);
  // ════════════════════════════════════════════
  // DEFINITION: DUA CARD RENDERER 
  // ════════════════════════════════════════════
  const renderDuaCard = useCallback(({ item }: { item: DisplayDua }) => {
    if (!item || !item.id) {
      return null;
    }

    const categoryDuas = currentScreen.name === 'category'
      ? displayedDuas
      : allDuas.filter(d => d.groupId === item.groupId);

    return (
      <DuaCard
        item={item}
        isSaved={savedIds.has(item.id)}
        searchQuery={searchQuery}
        onPress={(dua) => {
          Haptics.selectionAsync();
          pushScreen({ name: 'detail', dua, categoryDuas });
        }}
        onToggleSave={toggleSave}
      />
    );
  }, [savedIds, searchQuery, pushScreen, toggleSave, displayedDuas, allDuas, currentScreen]);

  // ── FONT GUARD ──
  if (!fontsLoaded && allDuas.length === 0) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.mint} />
      </View>
    );
  }

  // ════════════════════════════════════════════
  // RENDER: HEADER
  // ════════════════════════════════════════════
  const renderHeader = () => {
    const isHome = currentScreen.name === 'home';
    const breadcrumb = getBreadcrumb();

    return (
      <View style={[styles.header, { paddingTop: insets.top + rs(12) }]}>
        <TouchableOpacity
          onPress={() => {
            if (isHome) {
              router.back();
            } else {
              popScreen();
            }
          }}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={rs(24)} color={C.textHigh} />
        </TouchableOpacity>

        <View style={[styles.headerCenter, isHome && { alignItems: 'flex-start' }]}>
          <Text
            style={[styles.headerTitle, isHome && { fontSize: rs(20), textAlign: 'left' }]}
            numberOfLines={1}
          >
            {isHome ? 'Qalb-E-Rooh' : currentScreen.name === 'category' ? currentScreen.title : currentScreen.dua.originalTitle}
          </Text>
          {breadcrumb ? (
            <Text style={styles.breadcrumb} numberOfLines={1}>{breadcrumb}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => { setShowSavedOnly(!showSavedOnly); Haptics.selectionAsync(); }}
          style={[styles.savedChip, showSavedOnly && styles.savedChipActive]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={showSavedOnly ? 'Show all duas' : 'Show saved only'}
        >
          <Ionicons
            name={showSavedOnly ? 'bookmark' : 'bookmark-outline'}
            size={rs(16)}
            color={showSavedOnly ? C.bg : C.textMed}
          />
          <Text style={[styles.savedChipText, showSavedOnly && styles.savedChipTextActive]}>
            {showSavedOnly ? 'Saved' : 'All'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ════════════════════════════════════════════
  // RENDER: HOME / CATEGORY LIST
  // ════════════════════════════════════════════
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="search" size={rs(40)} color={C.textLow} style={{ marginBottom: rs(16) }} />
      <Text style={styles.emptyTitle}>No duas found</Text>
      <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
    </View>
  );

  const renderHomeOrCategory = () => {
    const isSearchingOrFiltering = searchQuery.trim() !== '' || showSavedOnly || currentScreen.name === 'category';
    const ITEM_HEIGHT = rs(88);

    return (
      <View style={{ flex: 1 }}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={rs(18)} color={C.textLow} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for peace, protection, healing..."
            placeholderTextColor={C.textLow}
            value={searchInput}
            onChangeText={setSearchInput}
            selectionColor={C.mint}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchInput ? (
            <TouchableOpacity
              onPress={() => { setSearchInput(''); setSearchQuery(''); Keyboard.dismiss(); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x-circle" size={rs(18)} color={C.textLow} />
            </TouchableOpacity>
          ) : null}
        </View>

        {isSearchingOrFiltering && (
          <View style={styles.contextBanner}>
            <Text style={styles.contextText}>
              {displayedDuas.length} result{displayedDuas.length !== 1 ? 's' : ''}{' '}
              {currentScreen.name === 'category' ? `in ${currentScreen.title}` : 'in All Duas'}
              {showSavedOnly ? ' (Saved Only)' : ''}
            </Text>
          </View>
        )}

        {isSearchingOrFiltering ? (
          <FlatList
            data={displayedDuas}
            keyExtractor={d => d.id}
            renderItem={renderDuaCard}
            contentContainerStyle={[styles.scrollPad, { paddingBottom: insets.bottom + rs(40) }]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyState}
            removeClippedSubviews={true}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={5}
            getItemLayout={(_data, index) => ({
              length: ITEM_HEIGHT + rs(12),
              offset: (ITEM_HEIGHT + rs(12)) * index,
              index,
            })}
          />
        ) : (
          <FlatList
            key={`grid-${numCols}`}
            data={sortedCategories}
            numColumns={numCols}
            columnWrapperStyle={{ gap: rs(12) }}
            contentContainerStyle={[styles.scrollPad, { gap: rs(12), paddingBottom: insets.bottom + rs(40) }]}
            keyExtractor={c => c.id}
            keyboardDismissMode="on-drag"
            removeClippedSubviews={true}
            renderItem={({ item, index }) => {
                return (
                  <PressScale style={{ flex: 1 }} onPress={() => pushCategory(item.id, item.en)}>
                    <View style={[styles.gridCard]}>
                      <Text style={styles.gridEmoji}>{item.emoji}</Text>
                      <Text style={styles.gridAr}>{item.ar}</Text>
                      <Text style={styles.gridEn}>{item.en}</Text>
                    </View>
                  </PressScale>
                );
            }}
          />
        )}
      </View>
    );
  };

  // ════════════════════════════════════════════
  // RENDER: DETAIL VIEW
  // ════════════════════════════════════════════
  const renderDetail = (dua: DisplayDua, categoryDuas: DisplayDua[]) => {
    const isSaved = savedIds.has(dua.id);
    const currentIdx = categoryDuas.findIndex(d => d.id === dua.id);
    const hasPrev = currentIdx > 0;
    const hasNext = currentIdx < categoryDuas.length - 1;

    const goTo = (delta: number) => {
      const target = categoryDuas[currentIdx + delta];
      if (!target) return;
      Haptics.selectionAsync();
      setNavStack(prev => [
        ...prev.slice(0, -1),
        { name: 'detail', dua: target, categoryDuas },
      ]);
    };

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scrollPad,
            { paddingBottom: FLOATING_BAR_HEIGHT + insets.bottom + rs(40) },
          ]}
        >
          {categoryDuas.length > 1 && (
            <View style={styles.duaNavRow}>
              <TouchableOpacity
                style={[styles.duaNavBtn, !hasPrev && styles.duaNavBtnDisabled]}
                onPress={() => goTo(-1)}
                disabled={!hasPrev}
              >
                <Feather name="chevron-left" size={rs(16)} color={hasPrev ? C.mint : C.textLow} />
                <Text style={[styles.duaNavText, !hasPrev && { color: C.textLow }]}>Prev</Text>
              </TouchableOpacity>
              <Text style={styles.duaNavCount}>{currentIdx + 1} / {categoryDuas.length}</Text>
              <TouchableOpacity
                style={[styles.duaNavBtn, !hasNext && styles.duaNavBtnDisabled]}
                onPress={() => goTo(1)}
                disabled={!hasNext}
              >
                <Text style={[styles.duaNavText, !hasNext && { color: C.textLow }]}>Next</Text>
                <Feather name="chevron-right" size={rs(16)} color={hasNext ? C.mint : C.textLow} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{dua.originalTitle}</Text>
          </View>

          <View style={styles.arabicContainer}>
            {!fontsLoaded ? (
              <ArabicSkeleton />
            ) : (
              <Text style={styles.arabicText}>{dua.arabic}</Text>
            )}
          </View>

          <View style={styles.translationContainer}>
            <Text style={styles.translationText}>{dua.translation}</Text>
            <View style={styles.referenceBadge}>
              <Feather name="book-open" size={rs(12)} color={C.mint} />
              <Text style={styles.referenceText}>{dua.reference}</Text>
            </View>
          </View>
        </ScrollView>

        <LinearGradient
          colors={['transparent', `${C.bg}E0`, C.bg]}
          style={[styles.floatingActionBar, { paddingBottom: insets.bottom || rs(20) }]}
        >
          <View style={styles.actionRow}>
            <PressScale style={{ flex: 2 }} onPress={() => toggleSave(dua.id)}>
              <View style={[styles.btnPrimary, isSaved && styles.btnPrimaryActive]}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={rs(20)}
                  color={isSaved ? C.bg : C.textHigh}
                />
                <Text style={[styles.btnPrimaryText, isSaved && { color: C.bg }]}>
                  {isSaved ? 'Saved' : 'Save Dua'}
                </Text>
              </View>
            </PressScale>

            <PressScale style={{ flex: 1 }} onPress={() => setCopySheetDua(dua)}>
              <View style={styles.btnSecondary}>
                <Feather name="copy" size={rs(20)} color={C.mint} />
              </View>
            </PressScale>

            <PressScale
              style={{ flex: 1 }}
              onPress={() => Share.share({ message: `${dua.arabic}\n\n${dua.translation}\n— ${dua.reference}` })}
            >
              <View style={styles.btnSecondary}>
                <Feather name="share-2" size={rs(20)} color={C.mint} />
              </View>
            </PressScale>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // ─────────────────────────────────────────────
  // ROOT RENDER
  // ─────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {renderHeader()}

      <View style={[styles.contentContainer, isTablet && styles.contentContainerTablet]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {currentScreen.name === 'detail'
            ? renderDetail(currentScreen.dua, currentScreen.categoryDuas)
            : renderHomeOrCategory()}
        </KeyboardAvoidingView>
      </View>

      {copySheetDua && (
        <CopyActionSheet
          visible={!!copySheetDua}
          onClose={() => setCopySheetDua(null)}
          onCopyArabic={() => handleCopyArabic(copySheetDua.arabic)}
          onCopyFull={() => handleCopyFull(copySheetDua)}
        />
      )}

      {toast.visible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, top: insets.top + rs(60) }]}>
          <Ionicons name={toast.icon as any} size={rs(18)} color={C.mint} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}
// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // FIX 15: Tablet content centering
  contentContainer: { flex: 1 },
  contentContainerTablet: { maxWidth: 700, width: '100%', alignSelf: 'center' },

  scrollPad: { paddingHorizontal: rs(20), paddingTop: rs(8) },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(20),
    paddingBottom: rs(12),
    borderBottomWidth: 1,
    borderColor: C.border,
    gap: rs(10),
  },
  // FIX 16: iconBtn is at least 48x48
  iconBtn: {
    width: rs(48),
    height: rs(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: rs(17),
    fontWeight: '700',
    color: C.textHigh,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  // FIX 6: Breadcrumb
  breadcrumb: {
    fontSize: rs(11),
    color: C.textLow,
    marginTop: rs(2),
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // FIX 5: Saved chip
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(20),
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: rs(36),
  },
  savedChipActive: {
    backgroundColor: C.mint,
    borderColor: C.mint,
  },
  savedChipText: {
    fontSize: rs(13),
    fontWeight: '600',
    color: C.textMed,
  },
  savedChipTextActive: {
    color: C.bg,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    marginHorizontal: rs(20),
    marginTop: rs(16),
    marginBottom: rs(12),
    paddingHorizontal: rs(16),
    height: rs(50),
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.textHigh, fontSize: rs(15), marginLeft: rs(12) },

  // FIX 21: Context banner
  contextBanner: { paddingHorizontal: rs(24), paddingBottom: rs(10) },
  contextText: { fontSize: rs(13), color: C.textLow, fontWeight: '500' },

  // FIX 22: Grid card hierarchy
  gridCard: {
    backgroundColor: C.surface,
    padding: rs(18),
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: C.border,
    minHeight: rs(115),
    justifyContent: 'flex-end',
    gap: rs(4),
    overflow: 'hidden',
  },
  gridCardRecent: {
    borderColor: `${C.mint}40`,
    backgroundColor: C.surfaceElevated,
  },
  recentBadge: {
    position: 'absolute',
    top: rs(10),
    right: rs(10),
    backgroundColor: C.mintDim,
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderRadius: rs(8),
  },
  recentBadgeText: { fontSize: rs(10), color: C.mint, fontWeight: '700', letterSpacing: 0.3 },
  // FIX 22: Emoji large, clearly dominant
  gridEmoji: { fontSize: rs(30), marginBottom: rs(8) },
  // Arabic medium weight
  gridAr: { fontSize: rs(16), fontWeight: '700', color: C.textHigh, writingDirection: 'rtl', letterSpacing: 0.3 },
  // English small + dim
  gridEn: { fontSize: rs(12), color: C.textLow, fontWeight: '500', letterSpacing: 0.2 },

  // List Cards
  listCard: {
    backgroundColor: C.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: C.border,
    padding: rs(18),
    marginBottom: rs(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCardContent: { flex: 1, paddingRight: rs(16) },
  listCardTitle: {
    fontSize: rs(16),
    fontWeight: '700',
    color: C.textHigh,
    marginBottom: rs(6),
    lineHeight: rs(22),
  },
  listCardPreview: {
    fontSize: rs(15),
    color: C.textLow,
    fontFamily: 'IndoPakQuran',
    writingDirection: 'rtl',
  },
  // FIX 16: min 48x48
  listCardAction: {
    width: rs(48),
    height: rs(48),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.mintDim,
    borderRadius: rs(14),
  },

  // FIX 20: Highlight style
  highlight: {
    color: C.mint,
    backgroundColor: C.mintDim,
    borderRadius: rs(3),
  },

  // FIX 3: Dua navigation row
  duaNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(16),
    paddingHorizontal: rs(4),
  },
  duaNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    backgroundColor: C.surface,
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: C.border,
    minWidth: rs(80),
    justifyContent: 'center',
    minHeight: rs(40),
  },
  duaNavBtnDisabled: { opacity: 0.4 },
  duaNavText: { fontSize: rs(13), fontWeight: '600', color: C.mint },
  duaNavCount: { fontSize: rs(13), color: C.textLow, fontWeight: '500' },

  // Detail View
  detailHeader: {
    paddingVertical: rs(16),
    borderBottomWidth: 1,
    borderColor: C.divider,
    marginBottom: rs(24),
  },
  detailTitle: {
    fontSize: rs(20),
    fontWeight: '700',
    color: C.textHigh,
    lineHeight: rs(28),
  },

  arabicContainer: { marginBottom: rs(32), paddingHorizontal: rs(10) },
  // FIX 12 + FIX 13: includeFontPadding false, lineHeight rs(52)
  arabicText: {
    fontSize: rs(30),
    color: C.textHigh,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: rs(52),
    fontFamily: 'IndoPakQuran',
    includeFontPadding: false,
  },

  translationContainer: {
    backgroundColor: C.surface,
    borderRadius: rs(20),
    padding: rs(24),
    borderWidth: 1,
    borderColor: C.border,
  },
  translationText: {
    fontSize: rs(16),
    color: C.textMed,
    lineHeight: rs(26),
    marginBottom: rs(20),
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.mintDim,
    alignSelf: 'flex-start',
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(8),
  },
  referenceText: { fontSize: rs(13), color: C.mint, marginLeft: rs(6), fontWeight: '500' },

  // FIX 23: Floating bar (reduced opacity gradient)
  floatingActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: rs(40),
    paddingHorizontal: rs(20),
  },
  actionRow: { flexDirection: 'row', gap: rs(12) },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceHighlight,
    borderWidth: 1,
    borderColor: C.mint,
    borderRadius: rs(18),
    height: rs(56),
    gap: rs(8),
  },
  btnPrimaryActive: { backgroundColor: C.mint, borderColor: C.mint },
  btnPrimaryText: { fontSize: rs(16), fontWeight: '700', color: C.textHigh },
  btnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderRadius: rs(18),
    height: rs(56),
    borderWidth: 1,
    borderColor: C.border,
  },

  // Empty State
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: rs(80) },
  emptyTitle: { fontSize: rs(18), fontWeight: '700', color: C.textMed, marginBottom: rs(8) },
  emptySub: { fontSize: rs(14), color: C.textLow },

  // Toast
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.toastBg,
    paddingHorizontal: rs(18),
    paddingVertical: rs(12),
    borderRadius: rs(30),
    gap: rs(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 999,
  },
  toastText: { color: C.textHigh, fontSize: rs(14), fontWeight: '600' },

  // FIX 4: Copy Action Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: C.surfaceHighlight,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    paddingHorizontal: rs(24),
    paddingBottom: rs(40),
    paddingTop: rs(12),
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 0,
  },
  sheetHandle: {
    width: rs(36),
    height: rs(4),
    backgroundColor: C.border,
    borderRadius: rs(2),
    alignSelf: 'center',
    marginBottom: rs(20),
  },
  sheetTitle: {
    fontSize: rs(16),
    fontWeight: '700',
    color: C.textHigh,
    marginBottom: rs(20),
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
    paddingVertical: rs(16),
    minHeight: rs(56),
  },
  sheetOptionText: { fontSize: rs(16), color: C.textHigh, fontWeight: '500' },
  sheetDivider: { height: 1, backgroundColor: C.divider },
  sheetCancel: {
    marginTop: rs(12),
    alignItems: 'center',
    paddingVertical: rs(16),
    backgroundColor: C.surface,
    borderRadius: rs(16),
    minHeight: rs(56),
    justifyContent: 'center',
  },
  sheetCancelText: { fontSize: rs(16), color: C.textMed, fontWeight: '600' },
});