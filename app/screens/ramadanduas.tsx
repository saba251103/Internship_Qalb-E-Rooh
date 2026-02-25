import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Clipboard,
    Dimensions,
    FlatList,
    Platform,
    Share,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─────────────────────────────────────────
   RESPONSIVE SCALE
───────────────────────────────────────── */
const { width: W } = Dimensions.get('window');
const rs = (n: number) => Math.round((n / 390) * W);

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const C = {
  // Deep forest greens
  forest0:  '#071f1c',
  forest1:  '#0a2e2a',
  forest2:  '#0d3e39',
  forest3:  '#105047',
  emerald:  '#10b981',
  sage:     '#4a9e8a',

  // Warm beige / cream
  bg:       '#f5f1e8',
  bgCard:   '#ffffff',
  cream:    '#f0e8d5',
  beige:    '#ddd4bc',
  beigeDeep:'#c4b99e',

  // Mint accents
  mintBg:     'rgba(13,62,57,0.09)',
  mintBorder: 'rgba(13,62,57,0.14)',
  mintStrong: 'rgba(13,62,57,0.22)',

  // Text
  textDark: '#071f1c',
  textMid:  '#2d6b60',
  textSoft: '#5a9e8f',
  textDim:  '#a0bdb8',
  white:    '#ffffff',

  // Shadow
  shadow:   '#071f1c',
  divider:  'rgba(7,31,28,0.08)',
};

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
interface DuaItem { id: string; text: string }

const DUA_DATA: DuaItem[] = [
  { id: '1',  text: 'Ae Allah hamri jaban par kalmae tayybah hamesha jari rakh' },
  { id: '2',  text: 'Ae Allah hame kamil iman naseeb farma aur puri hidayat ataa farma' },
  { id: '3',  text: 'Ae Allah hame pure ramadaan neamate, anvaar va barkat se malamal farma' },
  { id: '4',  text: 'Ae Allah ham par apni rehmat najil farma, karam ki barish farma aur rizke halat ataa farma' },
  { id: '5',  text: 'Ae Allah hame deene islam ke ehkam par mukammal taur par amal karne vala bana de' },
  { id: '6',  text: 'Ae Allah tu hame apna mohataj rakh kisi gair ka mohataj na bana' },
  { id: '7',  text: 'Ae Allah hame lailatul qadr naseeb farma' },
  { id: '8',  text: 'Ae Allah haje maqbool va mabroor naseeb farma' },
  { id: '9',  text: 'Ae Allah hame joth, bughaz va keenah, buraia jagade, fasad se door rakh' },
  { id: '10', text: 'Ae Allah hamse tangdasti khauf ghabhrahat aur karj ke boj ko door farma' },
  { id: '11', text: 'Ae Allah hamare sgeerah aur kabeerah gunaaho ko maaf farma' },
  { id: '12', text: 'Ae Allah humko dajjal ke fitne shaitan aur nafs ke shar se mahfuj rakh' },
  { id: '13', text: 'Ae Allah aurton ko parde ki poori poori pabandi karne ki toufik ataa farma' },
  { id: '14', text: 'Ae Allah har choti badi bimari se hame aur kul momineen va mominaat ko mahfooj rakh' },
  { id: '15', text: 'Ae Allah hame taqwa aur paherejgari ataa farma' },
  { id: '16', text: 'Ae Allah hame huzur e aqdas ﷺ ke pyare tarike par kayam rakh' },
  { id: '17', text: 'Ae Allah hame huzur e aqram ﷺ ki sunnat par chalne ki toufik ataa farma' },
  { id: '18', text: 'Ae Allah hame kayaamat ke din huzur ﷺ ke hatho se jame kausar naseeb farma' },
  { id: '19', text: 'Ae Allah hame kayamat kee din huzur ﷺ ki shifaat naseeb farma' },
  { id: '20', text: 'Ae Allah tu apni mohabbat aur hamare aqa ﷺ mohabbat hamare dilo mein dalde' },
  { id: '21', text: 'Ae Allah hame maut ki sakhti aur kabr ke ajaab se bachaa' },
  { id: '22', text: 'Ae Allah munkar nakeer ke sawalat aasan farma' },
  { id: '23', text: 'Ae Allah hame kayamat ke roz apna deedar naseeb farma' },
  { id: '24', text: 'Ae Allah hame jannatul firdos me jagah ataa farma' },
  { id: '25', text: 'Ae Allah hame kayamat ki garmi aur jahannum ki aag se mahfuz farma' },
  { id: '26', text: 'Ae Allah hame tamaam momineen va mominaat ko hashr ki rusvayio se bacha' },
  { id: '27', text: 'Ae Allah naam aamal hamre dahine hath me naseeb farma' },
  { id: '28', text: 'Ae Allah apne arsh ke saye me jagah ataa farma' },
  { id: '29', text: 'Ae Allah pul sirrat par bijli ki tarah gujrne ki toufik ataa frama' },
  { id: '30', text: 'Ae Allah hame dono jaha me rasoole paak ﷺ ka gulam banae rakh' },
  { id: '31', text: 'Ae Allah dunya bhar ke mazloom musalmano ki madad farma aur unhe zalimo ke shar se najaat ata farma' },
  { id: '32', text: 'Ae Allah Falasteen aur dunya ke har kone mein musalmano ki hifazat farma aur unhe fatah naseeb farma' },
  { id: '33', text: 'Ae Allah be-gunah qaidiyon ki rihayi ke asbaab paida farma aur unhe sabr aur himmat ata farma' },
  { id: '34', text: 'Ae Allah dunya se zulm aur na-insafi ka khatma farma aur adl-o-insaf ka nizam qayam farma' },
  { id: '35', text: 'Ae Allah musalmano mein ittehad paida farma aur hame ek dusre ka sahara banne ki taufiq de' },
];

/* ─────────────────────────────────────────
   MOON DECORATION
───────────────────────────────────────── */
const MoonDecor: React.FC<{ size: number }> = ({ size }) => (
  <View style={{ width: size, height: size }}>
    <View style={{
      position: 'absolute', width: size, height: size,
      borderRadius: size / 2, backgroundColor: C.cream, opacity: 0.12,
    }} />
    <View style={{
      position: 'absolute',
      width: size * 0.76, height: size * 0.76,
      borderRadius: (size * 0.76) / 2,
      backgroundColor: C.forest2,
      top: size * 0.05, right: -size * 0.1,
    }} />
  </View>
);

/* ─────────────────────────────────────────
   DUA CARD
───────────────────────────────────────── */
const DuaCard = React.memo(({
  item,
  index,
}: {
  item: DuaItem;
  index: number;
}) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const [copied, setCopied] = useState(false);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 25 }).start();

  const handleCopy = useCallback(async () => {
    Clipboard.setString(item.text);
    setCopied(true);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied!', ToastAndroid.SHORT);
    }
    setTimeout(() => setCopied(false), 2000);
  }, [item.text]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${item.text}\n\n— Mahe Ramadan Dua #${index + 1}`,
      });
    } catch {}
  }, [item.text, index]);

  // Alternate card accent colors for visual rhythm
  const accentColors = [C.forest3, C.sage, C.emerald];
  const accent = accentColors[index % accentColors.length];

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: rs(12) }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={s.card}
      >
        {/* Left accent bar */}
        <View style={[s.cardAccent, { backgroundColor: accent }]} />

        <View style={s.cardInner}>
          {/* Top row: number + actions */}
          <View style={s.cardTop}>
            <View style={[s.numBadge, { borderColor: accent + '44', backgroundColor: accent + '14' }]}>
              <Text style={[s.numText, { color: accent }]}>{String(index + 1).padStart(2, '0')}</Text>
            </View>

            <View style={s.cardActions}>
              <TouchableOpacity
                style={[s.actionBtn, copied && s.actionBtnActive]}
                onPress={handleCopy}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={rs(16)}
                  color={copied ? C.white : C.textMid}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.actionBtn}
                onPress={handleShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-social-outline" size={rs(16)} color={C.textMid} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dua text */}
          <Text style={s.duaText}>{item.text}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ─────────────────────────────────────────
   HEADER COMPONENT
───────────────────────────────────────── */
const ListHeader: React.FC<{ count: number }> = ({ count }) => (
  <View style={s.listHeader}>
    <View style={s.listHeaderLeft}>
      <View style={s.listHeaderDot} />
      <Text style={s.listHeaderText}>{count} Supplications</Text>
    </View>
    <Text style={s.listHeaderSub}>Ramadan Mubarak 🌙</Text>
  </View>
);

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */
export default function RamadanDuaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>

      {/* ════ HEADER ════ */}
      <LinearGradient
        colors={[C.forest0, C.forest2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + rs(10) }]}
      >
        {/* Decorative moon — top right */}
        <View style={s.moonWrap} pointerEvents="none">
          <MoonDecor size={rs(110)} />
        </View>

        {/* Nav row */}
        <View style={s.navRow}>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={rs(22)} color={C.cream} />
          </TouchableOpacity>

          <View style={s.navCenter}>
            <Text style={s.navLabel}>Mahe Ramadan</Text>
          </View>

          {/* Moon icon on right */}
          <View style={s.navIconWrap}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={rs(20)} color={C.cream} style={{ opacity: 0.7 }} />
          </View>
        </View>

        {/* Title block */}
        <Text style={s.headerTitle}>Ramadan Duas</Text>
        <Text style={s.headerSub}>35 heartfelt supplications for the blessed month</Text>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Text style={s.statVal}>35</Text>
            <Text style={s.statLbl}>Duas</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>🌙</Text>
            <Text style={s.statLbl}>Ramadan</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>1447</Text>
            <Text style={s.statLbl}>Hijri</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ════ LIST ════ */}
      <FlatList
        data={DUA_DATA}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <DuaCard item={item} index={index} />
        )}
        ListHeaderComponent={<ListHeader count={DUA_DATA.length} />}
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: insets.bottom + rs(30) },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={8}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor:   C.shadow,
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius:  10,
  },
  android: { elevation: 3 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ─ Header ─ */
  header: {
    paddingHorizontal: rs(20),
    paddingBottom:     rs(24),
    overflow:          'hidden',
    borderBottomLeftRadius:  rs(28),
    borderBottomRightRadius: rs(28),
    ...Platform.select({
      ios: {
        shadowColor:   C.shadow,
        shadowOffset:  { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius:  18,
      },
      android: { elevation: 10 },
    }),
  },
  moonWrap: {
    position: 'absolute',
    top:      -rs(16),
    right:    -rs(14),
    opacity:  0.6,
  },

  /* Nav */
  navRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   rs(20),
  },
  navBtn: {
    width:           rs(38),
    height:          rs(38),
    borderRadius:    rs(12),
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.13)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  navCenter: { flex: 1, alignItems: 'center' },
  navLabel: {
    fontSize:      rs(12),
    fontWeight:    '700',
    color:         C.cream,
    opacity:       0.65,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  navIconWrap: {
    width:           rs(38),
    height:          rs(38),
    borderRadius:    rs(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  /* Header text */
  headerTitle: {
    fontSize:      rs(28),
    fontWeight:    '900',
    color:         C.cream,
    letterSpacing: 0.2,
    marginBottom:  rs(6),
  },
  headerSub: {
    fontSize:     rs(13),
    color:        C.cream,
    opacity:      0.5,
    fontWeight:   '500',
    lineHeight:   rs(20),
    marginBottom: rs(20),
  },

  /* Stats strip */
  statsStrip: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius:    rs(16),
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.11)',
    paddingVertical: rs(12),
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
  },
  statVal: {
    fontSize:     rs(16),
    fontWeight:   '800',
    color:        C.cream,
    marginBottom: rs(3),
  },
  statLbl: {
    fontSize:      rs(10),
    fontWeight:    '600',
    color:         C.cream,
    opacity:       0.48,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statDivider: {
    width:           1,
    height:          rs(28),
    backgroundColor: 'rgba(255,255,255,0.13)',
  },

  /* ─ List ─ */
  listContent: {
    paddingHorizontal: rs(16),
    paddingTop:        rs(6),
  },
  listHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical:   rs(14),
    paddingHorizontal: rs(2),
    marginBottom:   rs(4),
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  listHeaderDot: {
    width:           rs(8),
    height:          rs(8),
    borderRadius:    rs(4),
    backgroundColor: C.forest3,
    marginRight:     rs(8),
  },
  listHeaderText: {
    fontSize:   rs(12),
    fontWeight: '700',
    color:      C.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  listHeaderSub: {
    fontSize:   rs(12),
    color:      C.textDim,
    fontWeight: '500',
  },

  /* ─ Card ─ */
  card: {
    flexDirection:   'row',
    backgroundColor: C.bgCard,
    borderRadius:    rs(18),
    borderWidth:     1,
    borderColor:     'rgba(7,31,28,0.07)',
    overflow:        'hidden',
    ...CARD_SHADOW,
  },
  cardAccent: {
    width:                 rs(4),
    alignSelf:             'stretch',
    opacity:               0.7,
  },
  cardInner: {
    flex:    1,
    padding: rs(16),
  },
  cardTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   rs(12),
  },

  /* Number badge */
  numBadge: {
    paddingHorizontal: rs(10),
    paddingVertical:   rs(5),
    borderRadius:      rs(8),
    borderWidth:       1,
  },
  numText: {
    fontSize:      rs(12),
    fontWeight:    '800',
    letterSpacing: 0.5,
  },

  /* Action buttons */
  cardActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width:           rs(34),
    height:          rs(34),
    borderRadius:    rs(10),
    backgroundColor: C.mintBg,
    borderWidth:     1,
    borderColor:     C.mintBorder,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      rs(8),
  },
  actionBtnActive: {
    backgroundColor: C.forest3,
    borderColor:     C.forest3,
  },

  /* Dua text */
  duaText: {
    fontSize:   rs(15),
    fontWeight: '500',
    color:      C.textDark,
    lineHeight: rs(24),
  },
});