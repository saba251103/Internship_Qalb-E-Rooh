import { Amiri_400Regular, Amiri_700Bold, useFonts } from '@expo-google-fonts/amiri';
import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Gestures
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  Layout,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
// Safe Area
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import ColorPicker from 'react-native-wheel-color-picker';

// ==============================================
// 1. UTILS
// ==============================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Aliases
const ms = moderateScale;
const vs = verticalScale;
const s = scale;

const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_HEIGHT < 700;

// ==============================================
// 2. DATA
// ==============================================
// A. SOLID COLORS - Enhanced with aesthetic palette
const SOLID_COLORS = [
  '#0F3D3E', // Deep Teal
  '#1B4B4C', // Dark Teal
  '#E8DCCF', // Warm Beige
  '#F5EFE7', // Light Cream
  '#D4B5A0', // Dusty Rose Beige
  '#8B7E74', // Warm Gray
  '#4A5859', // Slate Teal
  '#C9B8A8', // Sand
  '#2C5F60', // Ocean Teal
  '#F0E5D8', // Ivory
  '#A67C52', // Bronze
  '#234E52', // Deep Sea
  '#E4D5C9', // Soft Beige
  '#1A3B3C', // Midnight Teal
  '#DBC8B6', // Latte
  '#5A7476', // Misty Teal
];

// B. BACKGROUND IMAGES
const BACKGROUND_IMAGES = [
  require('../../assets/backgrounds/img1.png'),
  require('../../assets/backgrounds/img2.png'),
  require('../../assets/backgrounds/img3.png'),
  require('../../assets/backgrounds/img4.png'),
  require('../../assets/backgrounds/img5.png'),
  require('../../assets/backgrounds/img6.png'),
  require('../../assets/backgrounds/img7.png'),
  require('../../assets/backgrounds/img8.png'),
  require('../../assets/backgrounds/img9.png'),
  require('../../assets/backgrounds/img10.png'),
  require('../../assets/backgrounds/img11.png'),
  require('../../assets/backgrounds/img12.png'),
];

// C. Names of Allah (Asma ul Husna)
const NAMES_OF_ALLAH = [
  { id: '1', arabic: 'الرَّحْمٰن', english: 'Ar-Rahman', meaning: 'The Most Merciful' },
  { id: '2', arabic: 'الرَّحِيم', english: 'Ar-Raheem', meaning: 'The Most Compassionate' },
  { id: '3', arabic: 'الْمَلِك', english: 'Al-Malik', meaning: 'The King' },
  { id: '4', arabic: 'الْقُدُّوس', english: 'Al-Quddus', meaning: 'The Most Holy' },
  { id: '5', arabic: 'السَّلَام', english: 'As-Salam', meaning: 'The Source of Peace' },
  { id: '6', arabic: 'الْمُؤْمِن', english: 'Al-Mu’min', meaning: 'The Giver of Faith' },
  { id: '7', arabic: 'الْمُهَيْمِن', english: 'Al-Muhaymin', meaning: 'The Guardian' },
  { id: '8', arabic: 'الْعَزِيز', english: 'Al-Aziz', meaning: 'The Almighty' },
  { id: '9', arabic: 'الْجَبَّار', english: 'Al-Jabbar', meaning: 'The Compeller' },
  { id: '10', arabic: 'الْمُتَكَبِّر', english: 'Al-Mutakabbir', meaning: 'The Supreme' },
  { id: '11', arabic: 'الْخَالِق', english: 'Al-Khaliq', meaning: 'The Creator' },
  { id: '12', arabic: 'الْبَارِئ', english: 'Al-Bari’', meaning: 'The Originator' },
  { id: '13', arabic: 'الْمُصَوِّر', english: 'Al-Musawwir', meaning: 'The Fashioner' },
  { id: '14', arabic: 'الْغَفَّار', english: 'Al-Ghaffar', meaning: 'The Constant Forgiver' },
  { id: '15', arabic: 'الْقَهَّار', english: 'Al-Qahhar', meaning: 'The All-Subduer' },
  { id: '16', arabic: 'الْوَهَّاب', english: 'Al-Wahhab', meaning: 'The Supreme Bestower' },
  { id: '17', arabic: 'الرَّزَّاق', english: 'Ar-Razzaq', meaning: 'The Provider' },
  { id: '18', arabic: 'الْفَتَّاح', english: 'Al-Fattah', meaning: 'The Opener' },
  { id: '19', arabic: 'الْعَلِيم', english: 'Al-‘Aleem', meaning: 'The All-Knowing' },
  { id: '20', arabic: 'الْقَابِض', english: 'Al-Qabid', meaning: 'The Withholder' },
  { id: '21', arabic: 'الْبَاسِط', english: 'Al-Basit', meaning: 'The Expander' },
  { id: '22', arabic: 'الْخَافِض', english: 'Al-Khafid', meaning: 'The Abaser' },
  { id: '23', arabic: 'الرَّافِع', english: 'Ar-Rafi’', meaning: 'The Exalter' },
  { id: '24', arabic: 'الْمُعِزّ', english: 'Al-Mu’izz', meaning: 'The Honourer' },
  { id: '25', arabic: 'الْمُذِلّ', english: 'Al-Mudhill', meaning: 'The Dishonourer' },
  { id: '26', arabic: 'السَّمِيع', english: 'As-Sami’', meaning: 'The All-Hearing' },
  { id: '27', arabic: 'الْبَصِير', english: 'Al-Baseer', meaning: 'The All-Seeing' },
  { id: '28', arabic: 'الْحَكَم', english: 'Al-Hakam', meaning: 'The Judge' },
  { id: '29', arabic: 'الْعَدْل', english: 'Al-‘Adl', meaning: 'The Just' },
  { id: '30', arabic: 'اللَّطِيف', english: 'Al-Lateef', meaning: 'The Most Gentle' },
  { id: '31', arabic: 'الْخَبِير', english: 'Al-Khabeer', meaning: 'The All-Aware' },
  { id: '32', arabic: 'الْحَلِيم', english: 'Al-Haleem', meaning: 'The Most Forbearing' },
  { id: '33', arabic: 'الْعَظِيم', english: 'Al-Azeem', meaning: 'The Magnificent' },
  { id: '34', arabic: 'الْغَفُور', english: 'Al-Ghafoor', meaning: 'The All-Forgiving' },
  { id: '35', arabic: 'الشَّكُور', english: 'Ash-Shakoor', meaning: 'The Most Appreciative' },
  { id: '36', arabic: 'الْعَلِيّ', english: 'Al-‘Aliyy', meaning: 'The Most High' },
  { id: '37', arabic: 'الْكَبِير', english: 'Al-Kabeer', meaning: 'The Greatest' },
  { id: '38', arabic: 'الْحَفِيظ', english: 'Al-Hafeez', meaning: 'The Preserver' },
  { id: '39', arabic: 'الْمُقِيت', english: 'Al-Muqeet', meaning: 'The Sustainer' },
  { id: '40', arabic: 'الْحسِيب', english: 'Al-Haseeb', meaning: 'The Reckoner' },
  { id: '41', arabic: 'الْجَلِيل', english: 'Al-Jaleel', meaning: 'The Majestic' },
  { id: '42', arabic: 'الْكَرِيم', english: 'Al-Kareem', meaning: 'The Most Generous' },
  { id: '43', arabic: 'الرَّقِيب', english: 'Ar-Raqeeb', meaning: 'The Watchful' },
  { id: '44', arabic: 'الْمُجِيب', english: 'Al-Mujeeb', meaning: 'The Responsive One' },
  { id: '45', arabic: 'الْوَاسِع', english: 'Al-Wasi’', meaning: 'The All-Encompassing' },
  { id: '46', arabic: 'الْحَكِيم', english: 'Al-Hakeem', meaning: 'The Most Wise' },
  { id: '47', arabic: 'الْوَدُود', english: 'Al-Wadud', meaning: 'The Most Loving' },
  { id: '48', arabic: 'الْمَجِيد', english: 'Al-Majeed', meaning: 'The Glorious' },
  { id: '49', arabic: 'الْبَاعِث', english: 'Al-Ba’ith', meaning: 'The Resurrector' },
  { id: '50', arabic: 'الشَّهِيد', english: 'Ash-Shaheed', meaning: 'The Witness' },
  { id: '51', arabic: 'الْحَقّ', english: 'Al-Haqq', meaning: 'The Truth' },
  { id: '52', arabic: 'الْوَكِيل', english: 'Al-Wakeel', meaning: 'The Trustee' },
  { id: '53', arabic: 'الْقَوِيّ', english: 'Al-Qawiyy', meaning: 'The Most Strong' },
  { id: '54', arabic: 'الْمَتِين', english: 'Al-Mateen', meaning: 'The Firm One' },
  { id: '55', arabic: 'الْوَلِيّ', english: 'Al-Waliyy', meaning: 'The Protecting Friend' },
  { id: '56', arabic: 'الْحَمِيد', english: 'Al-Hameed', meaning: 'The Praiseworthy' },
  { id: '57', arabic: 'الْمُحْصِي', english: 'Al-Muhsi', meaning: 'The Accounter' },
  { id: '58', arabic: 'الْمُبْدِئ', english: 'Al-Mubdi’', meaning: 'The Originator' },
  { id: '59', arabic: 'الْمُعِيد', english: 'Al-Mu’eed', meaning: 'The Restorer' },
  { id: '60', arabic: 'الْمُحْيِي', english: 'Al-Muhyi', meaning: 'The Giver of Life' },
  { id: '61', arabic: 'الْمُمِيت', english: 'Al-Mumeet', meaning: 'The Creator of Death' },
  { id: '62', arabic: 'الْحَيّ', english: 'Al-Hayy', meaning: 'The Ever-Living' },
  { id: '63', arabic: 'الْقَيُّوم', english: 'Al-Qayyum', meaning: 'The Self-Subsisting' },
  { id: '64', arabic: 'الْوَاجِد', english: 'Al-Wajid', meaning: 'The Perceiver' },
  { id: '65', arabic: 'الْمَاجِد', english: 'Al-Majid', meaning: 'The Illustrious' },
  { id: '66', arabic: 'الْوَاحِد', english: 'Al-Wahid', meaning: 'The One' },
  { id: '67', arabic: 'الأَحَد', english: 'Al-Ahad', meaning: 'The Unique' },
  { id: '68', arabic: 'الصَّمَد', english: 'As-Samad', meaning: 'The Eternal Refuge' },
  { id: '69', arabic: 'الْقَادِر', english: 'Al-Qadir', meaning: 'The All-Powerful' },
  { id: '70', arabic: 'الْمُقْتَدِر', english: 'Al-Muqtadir', meaning: 'The Creator of All Power' },
  { id: '71', arabic: 'الْمُقَدِّم', english: 'Al-Muqaddim', meaning: 'The Expediter' },
  { id: '72', arabic: 'الْمُؤَخِّر', english: 'Al-Mu’akhkhir', meaning: 'The Delayer' },
  { id: '73', arabic: 'الأَوَّل', english: 'Al-Awwal', meaning: 'The First' },
  { id: '74', arabic: 'الآخِر', english: 'Al-Akhir', meaning: 'The Last' },
  { id: '75', arabic: 'الظَّاهِر', english: 'Az-Zahir', meaning: 'The Manifest' },
  { id: '76', arabic: 'الْبَاطِن', english: 'Al-Batin', meaning: 'The Hidden' },
  { id: '77', arabic: 'الْوَالِي', english: 'Al-Wali', meaning: 'The Sole Governor' },
  { id: '78', arabic: 'الْمُتَعَالِي', english: 'Al-Muta’ali', meaning: 'The Most Exalted' },
  { id: '79', arabic: 'الْبَرّ', english: 'Al-Barr', meaning: 'The Most Kind' },
  { id: '80', arabic: 'التَّوَّاب', english: 'At-Tawwab', meaning: 'The Acceptor of Repentance' },
  { id: '81', arabic: 'الْمُنْتَقِم', english: 'Al-Muntaqim', meaning: 'The Avenger' },
  { id: '82', arabic: 'العَفُوّ', english: 'Al-‘Afuww', meaning: 'The Pardoner' },
  { id: '83', arabic: 'الرَّؤُوف', english: 'Ar-Ra’oof', meaning: 'The Most Kind' },
  { id: '84', arabic: 'مَالِكُ الْمُلْك', english: 'Malik-ul-Mulk', meaning: 'Master of the Kingdom' },
  { id: '85', arabic: 'ذُوالْجَلَالِ وَالإِكْرَام', english: 'Dhul-Jalali wal-Ikram', meaning: 'Lord of Majesty and Honour' },
  { id: '86', arabic: 'الْمُقْسِط', english: 'Al-Muqsit', meaning: 'The Just One' },
  { id: '87', arabic: 'الْجَامِع', english: 'Al-Jami’', meaning: 'The Gatherer' },
  { id: '88', arabic: 'الْغَنِيّ', english: 'Al-Ghaniyy', meaning: 'The Self-Sufficient' },
  { id: '89', arabic: 'الْمُغْنِي', english: 'Al-Mughni', meaning: 'The Enricher' },
  { id: '90', arabic: 'الْمَانِع', english: 'Al-Mani’', meaning: 'The Preventer' },
  { id: '91', arabic: 'الضَّارّ', english: 'Ad-Darr', meaning: 'The Creator of Harm' },
  { id: '92', arabic: 'النَّافِع', english: 'An-Nafi’', meaning: 'The Creator of Good' },
  { id: '93', arabic: 'النُّور', english: 'An-Noor', meaning: 'The Light' },
  { id: '94', arabic: 'الْهَادِي', english: 'Al-Hadi', meaning: 'The Guide' },
  { id: '95', arabic: 'الْبَدِيع', english: 'Al-Badi’', meaning: 'The Originator' },
  { id: '96', arabic: 'الْبَاقِي', english: 'Al-Baqi', meaning: 'The Everlasting' },
  { id: '97', arabic: 'الْوَارِث', english: 'Al-Warith', meaning: 'The Inheritor' },
  { id: '98', arabic: 'الرَّشِيد', english: 'Ar-Rasheed', meaning: 'The Guide to the Right Path' },
  { id: '99', arabic: 'الصَّبُور', english: 'As-Sabur', meaning: 'The Most Patient' },
];


type NameItem = typeof NAMES_OF_ALLAH[0];
type ScreenType = 'GREETINGS' | 'BACKGROUNDS' | 'EDITOR';
type EditorTab = 'TEXT' | 'COLOR' | 'ALIGN' | 'EFFECTS';
type BackgroundItem = { type: 'image' | 'color' | 'picker'; value: any };

const COLORS = {
  bg: '#0A2426', bgLight: '#0F3D3E', cardBg: '#1B4B4C', primary: '#2C5F60', accent: '#D4B5A0',
  beige: '#E8DCCF', text: '#F5EFE7', textDim: '#C9B8A8', divider: '#234E52', gold: '#C9A25A',
} as const;

const ALIGN_ICONS: Record<'left'|'center'|'right', keyof typeof MaterialCommunityIcons.glyphMap> = {
  left: 'format-align-left', center: 'format-align-center', right: 'format-align-right',
};

async function pickImageWithPermission(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0].uri;
  } catch (e) { return null; }
}

// ==============================================
// 3. MAIN COMPONENT
// ==============================================

export default function NamesApp() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenType>('GREETINGS');
  const [selectedName, setSelectedName] = useState<NameItem>(NAMES_OF_ALLAH[0]);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundItem | null>(null);

  const [fontsLoaded] = useFonts({
    Amiri_400Regular, Amiri_700Bold,
    PlayfairDisplay_400Regular, PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) return <View style={styles.container}><ActivityIndicator color={COLORS.gold} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgLight} translucent={false} />

      {screen === 'GREETINGS' && (
        <NamesListScreen
          onBack={() => router.back()}
          onSelect={(item) => { setSelectedName(item); setScreen('BACKGROUNDS'); }}
        />
      )}

      {screen === 'BACKGROUNDS' && (
        <BackgroundsScreen
          onBack={() => setScreen('GREETINGS')}
          onSelect={(bg) => { setSelectedBackground(bg); setScreen('EDITOR'); }}
        />
      )}

      {screen === 'EDITOR' && selectedBackground && (
        <EditorScreen
          nameItem={selectedName}
          backgroundItem={selectedBackground}
          onBack={() => setScreen('BACKGROUNDS')}
        />
      )}
    </SafeAreaView>
  );
}

// ==============================================
// 4. LIST SCREEN
// ==============================================
const NamesListScreen = memo(({ onBack, onSelect }: { onBack: () => void; onSelect: (item: NameItem) => void }) => {
  const insets = useSafeAreaInsets();
  
  const renderItem = useCallback(({ item, index }: { item: NameItem; index: number }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).springify()} layout={Layout.springify()}>
      <TouchableOpacity onPress={() => onSelect(item)} style={styles.greetingCard} activeOpacity={0.7}>
        <View style={styles.cardShine} />
        <View style={styles.greetingCardContent}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingEnglish}>{item.english}</Text>
            <Text style={styles.greetingMeaning}>{item.meaning}</Text>
          </View>
        </View>
        <View style={styles.greetingArabicContainer}>
          <Text style={styles.greetingArabic}>{item.arabic}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [onSelect]);

  return (
    <View style={styles.screenContainer}>
      <ScreenHeader title="99 Names of Allah" subtitle="Select a name to design" onBack={onBack} />
      <FlatList
        data={NAMES_OF_ALLAH}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.greetingsList, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

// ==============================================
// 5. BACKGROUND SCREEN
// ==============================================
const BackgroundsScreen = memo(({ onSelect, onBack }: { onSelect: (item: BackgroundItem) => void; onBack: () => void }) => {
  const insets = useSafeAreaInsets();
  
  const handlePick = async () => {
    const uri = await pickImageWithPermission();
    if (uri) onSelect({ type: 'image', value: uri });
  };

  const GRID = useMemo(() => [
    { type: 'picker', value: 'picker' },
    ...SOLID_COLORS.map(c => ({ type: 'color', value: c })),
    ...BACKGROUND_IMAGES.map(i => ({ type: 'image', value: i })),
  ], []) as BackgroundItem[];

  const renderItem = ({ item }: { item: BackgroundItem }) => {
    if (item.type === 'picker') return (
      <TouchableOpacity onPress={handlePick} style={styles.gridItemWrapper}>
        <View style={[styles.gridItem, styles.pickerItem]}>
          <View style={styles.pickerIconContainer}><MaterialCommunityIcons name="image-plus" size={28} color={COLORS.gold}/></View>
          <Text style={styles.pickerText}>Gallery</Text>
        </View>
      </TouchableOpacity>
    );
    const isColor = item.type === 'color';
    return (
      <TouchableOpacity onPress={() => onSelect(item)} style={styles.gridItemWrapper}>
        <View style={[styles.gridItem, isColor && { backgroundColor: item.value }]}>
          {!isColor && <Image source={item.value} style={styles.gridImage} resizeMode="cover" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <ScreenHeader title="Choose Background" subtitle="Select or upload" onBack={onBack} />
      <FlatList
        data={GRID}
        numColumns={isTablet ? 4 : 3}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 6, paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
});

// ==============================================
// 6. EDITOR SCREEN (FIXED)
// ==============================================
const EditorScreen = memo(({ nameItem, backgroundItem, onBack }: { nameItem: NameItem; backgroundItem: BackgroundItem; onBack: () => void }) => {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);

  // Text State
  const [mainText, setMainText] = useState(nameItem.arabic);
  const [subText, setSubText] = useState(`${nameItem.english} - ${nameItem.meaning}`);
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('TEXT');

  // Style State
  const [fontSize, setFontSize] = useState(42);
  const [fontFamily, setFontFamily] = useState('Amiri_700Bold');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [opacity, setOpacity] = useState(1);
  const [textAlign, setTextAlign] = useState<'left'|'center'|'right'>('center');
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [shadowOpacity, setShadowOpacity] = useState(0.9);

  // Gestures
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => { startX.value = translateX.value; startY.value = translateY.value; })
    .onUpdate((e) => { translateX.value = startX.value + e.translationX; translateY.value = startY.value + e.translationY; });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  // --- THE FIX: TypeScript Safe Capture Call ---
  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      // 1. Check if ref and capture exist
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        if (uri && await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png' });
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not share image.');
    } finally {
      setIsSharing(false);
    }
  };

  const canvasContent = (
    <>
      {backgroundItem.type === 'image' && blurIntensity > 0 && <BlurView intensity={blurIntensity} style={StyleSheet.absoluteFill} />}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.textWrapper, animatedStyle, { alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center' }]}>
          <Text style={{ fontFamily, fontSize, color: textColor, opacity, textAlign, marginBottom: 10, textShadowColor: `rgba(0,0,0,${shadowOpacity})`, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 12 }}>{mainText}</Text>
          {!!subText && <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: fontSize * 0.35, color: textColor, opacity: opacity * 0.85, textAlign, textShadowColor: `rgba(0,0,0,${shadowOpacity})`, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{subText}</Text>}
        </Animated.View>
      </GestureDetector>
      <View style={styles.watermark}>
        <MaterialCommunityIcons name="star-crescent" size={12} color={COLORS.gold + 'DD'} />
        <Text style={styles.watermarkText}>Qalb E Rooh</Text>
      </View>
    </>
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={onBack} style={styles.editorBackBtn}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.editorTitle}>Customize</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          {isSharing ? <ActivityIndicator size="small" color={COLORS.bg}/> : <Text style={styles.shareBtnText}>Share</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.canvasContainer}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View style={[styles.canvasFrame, backgroundItem.type === 'color' && { backgroundColor: backgroundItem.value }]}>
            {backgroundItem.type === 'image' && <ImageBackground source={typeof backgroundItem.value === 'string' ? { uri: backgroundItem.value } : backgroundItem.value} style={StyleSheet.absoluteFill} resizeMode="cover">{canvasContent}</ImageBackground>}
            {backgroundItem.type === 'color' && canvasContent}
          </View>
        </ViewShot>
      </View>

      <View style={styles.controlsContainer}>
        <EditorControls 
          activeTab={activeTab} fontSize={fontSize} setFontSize={setFontSize} fontFamily={fontFamily} setFontFamily={setFontFamily}
          textColor={textColor} setTextColor={setTextColor} opacity={opacity} setOpacity={setOpacity} textAlign={textAlign} setTextAlign={setTextAlign}
          blurIntensity={blurIntensity} setBlurIntensity={setBlurIntensity} shadowOpacity={shadowOpacity} setShadowOpacity={setShadowOpacity}
          onOpenEdit={() => setIsEditing(true)}
        />
      </View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <EditorTabButton icon="format-text" label="Text" isActive={activeTab === 'TEXT'} onPress={() => setActiveTab('TEXT')} />
        <EditorTabButton icon="palette" label="Color" isActive={activeTab === 'COLOR'} onPress={() => setActiveTab('COLOR')} />
        <EditorTabButton icon="format-align-center" label="Align" isActive={activeTab === 'ALIGN'} onPress={() => setActiveTab('ALIGN')} />
        <EditorTabButton icon="auto-fix" label="Effects" isActive={activeTab === 'EFFECTS'} onPress={() => setActiveTab('EFFECTS')} />
      </View>

      <EditModal visible={isEditing} mainText={mainText} subText={subText} setMainText={setMainText} setSubText={setSubText} onClose={() => setIsEditing(false)} bottomInset={insets.bottom} />
    </View>
  );
});

// ==============================================
// 7. HELPERS
// ==============================================
const ScreenHeader = ({ title, subtitle, onBack }: { title: string, subtitle: string, onBack: () => void }) => (
  <View style={styles.headerGradient}>
    <View style={styles.headerContent}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
      <View><Text style={styles.headerTitle}>{title}</Text><Text style={styles.headerSubtitle}>{subtitle}</Text></View>
    </View>
    <View style={styles.decorativeLine} />
  </View>
);

const EditorTabButton = ({ icon, label, isActive, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.tabButton}>
    <View style={[styles.tabIconContainer, isActive && styles.tabIconContainerActive]}><MaterialCommunityIcons name={icon} size={22} color={isActive ? COLORS.bg : COLORS.textDim} /></View>
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const EditorControls = ({ activeTab, fontSize, setFontSize, fontFamily, setFontFamily, textColor, setTextColor, opacity, setOpacity, textAlign, setTextAlign, blurIntensity, setBlurIntensity, shadowOpacity, setShadowOpacity, onOpenEdit }: any) => {
  const FONTS = [{ name: 'Amiri', font: 'Amiri_400Regular' }, { name: 'Amiri Bold', font: 'Amiri_700Bold' }, { name: 'Playfair', font: 'PlayfairDisplay_400Regular' }, { name: 'Playfair Bold', font: 'PlayfairDisplay_700Bold' }];
  const COLOR_PRESETS = ['#FFFFFF', '#C9A25A', '#E8DCCF', '#D4A59A', '#0A2426', '#1B4B4C'];

  if (activeTab === 'TEXT') {
    return (
      <View style={styles.controlsScroll}>
         <View style={styles.controlGroup}><Text style={styles.controlGroupTitle}>Size: {fontSize.toFixed(0)}</Text><Slider minimumValue={24} maximumValue={90} value={fontSize} onValueChange={setFontSize} minimumTrackTintColor={COLORS.gold} thumbTintColor={COLORS.accent} /></View>
         <View style={[styles.controlGroup, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
             <Text style={styles.controlGroupTitle}>Content</Text>
             <TouchableOpacity onPress={onOpenEdit} style={styles.editIconBtn}><MaterialCommunityIcons name="pencil" size={16} color={COLORS.gold} /></TouchableOpacity>
         </View>
         <View style={styles.controlGroup}><FlatList horizontal data={FONTS} keyExtractor={f => f.font} renderItem={({item}) => (
             <TouchableOpacity onPress={() => setFontFamily(item.font)} style={[styles.fontChip, fontFamily === item.font && styles.fontChipActive]}><Text style={{fontFamily: item.font, color: COLORS.text}}>{item.name}</Text></TouchableOpacity>
         )} /></View>
      </View>
    );
  }
  if (activeTab === 'COLOR') {
      return (
          <View style={styles.controlsScroll}>
              <FlatList horizontal data={COLOR_PRESETS} style={{marginBottom: 10}} renderItem={({item}) => (
                  <TouchableOpacity onPress={() => setTextColor(item)} style={[styles.presetCircle, {backgroundColor: item, borderWidth: textColor === item ? 2 : 0, borderColor: COLORS.gold}]} />
              )}/>
              <View style={{height: 120}}><ColorPicker color={textColor} onColorChange={setTextColor} thumbSize={20} noSnap/></View>
          </View>
      );
  }
  if (activeTab === 'ALIGN') {
      return (
          <View style={styles.controlsCenter}>
              <View style={styles.alignmentCard}>
                  <Text style={{color: COLORS.text, textAlign: 'center', marginBottom: 10}}>Alignment</Text>
                  <View style={styles.segmentedControl}>
                      {(['left', 'center', 'right'] as const).map(a => (
                          <TouchableOpacity key={a} onPress={() => setTextAlign(a)} style={[styles.segmentBtn, textAlign === a && styles.segmentBtnActive]}>
                              <MaterialCommunityIcons name={ALIGN_ICONS[a]} size={24} color={textAlign === a ? COLORS.bg : COLORS.textDim} />
                          </TouchableOpacity>
                      ))}
                  </View>
              </View>
          </View>
      );
  }
  return (
      <View style={styles.controlsScroll}>
          <View style={styles.controlGroup}><Text style={styles.controlGroupTitle}>Blur: {blurIntensity.toFixed(0)}</Text><Slider minimumValue={0} maximumValue={100} value={blurIntensity} onValueChange={setBlurIntensity} minimumTrackTintColor={COLORS.gold} thumbTintColor={COLORS.accent} /></View>
          <View style={styles.controlGroup}><Text style={styles.controlGroupTitle}>Shadow: {(shadowOpacity * 100).toFixed(0)}%</Text><Slider minimumValue={0} maximumValue={1} value={shadowOpacity} onValueChange={setShadowOpacity} minimumTrackTintColor={COLORS.gold} thumbTintColor={COLORS.accent} /></View>
      </View>
  );
};

const EditModal = ({ visible, mainText, subText, setMainText, setSubText, onClose, bottomInset }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalContent, { paddingBottom: bottomInset + 20 }]}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Edit Message</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color={COLORS.textDim} /></TouchableOpacity></View>
        <TextInput value={mainText} onChangeText={setMainText} multiline style={[styles.modalInput, { fontFamily: 'Amiri_700Bold', textAlign: 'right', fontSize: 18 }]} placeholder="Main Text" placeholderTextColor={COLORS.textDim}/>
        <TextInput value={subText} onChangeText={setSubText} multiline style={[styles.modalInput, { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 16, marginTop: 10 }]} placeholder="Sub Text" placeholderTextColor={COLORS.textDim}/>
        <TouchableOpacity onPress={onClose} style={styles.modalDoneBtn}><Text style={styles.modalDoneBtnText}>Done</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

// ==============================================
// 8. STYLES
// ==============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screenContainer: { flex: 1, backgroundColor: COLORS.bg },
  headerGradient: { backgroundColor: COLORS.bgLight, paddingTop: vs(14), paddingBottom: vs(16), paddingHorizontal: ms(20), borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: ms(22), color: COLORS.text, fontFamily: 'PlayfairDisplay_700Bold' },
  headerSubtitle: { fontSize: ms(13), color: COLORS.textDim, marginTop: 3 },
  decorativeLine: { height: 2, backgroundColor: COLORS.gold + '40', marginTop: vs(10), width: ms(60), borderRadius: 2 },
  backButton: { width: ms(40), height: ms(40), borderRadius: ms(20), backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', marginRight: ms(14) },
  greetingsList: { paddingHorizontal: ms(20), paddingBottom: vs(30) },
  sectionTitle: { fontSize: ms(18), color: COLORS.text, marginBottom: vs(10), fontFamily: 'PlayfairDisplay_700Bold', marginTop: 20 },
  greetingCard: { backgroundColor: COLORS.cardBg, borderRadius: ms(16), marginBottom: vs(10), borderWidth: 1, borderColor: COLORS.divider, padding: ms(16), minHeight: vs(118), justifyContent: 'center' },
  greetingCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingTextContainer: { flex: 1, paddingRight: 10 },
  cardShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: COLORS.gold + '30' },
  greetingEnglish: { fontSize: ms(15), color: COLORS.text, fontFamily: 'PlayfairDisplay_700Bold' },
  greetingMeaning: { fontSize: ms(12), color: COLORS.textDim, marginTop: 3 },
  greetingArabicContainer: { marginTop: vs(8), backgroundColor: COLORS.bgLight, padding: ms(10), borderRadius: 10 },
  greetingArabic: { fontSize: ms(24), color: COLORS.gold, fontFamily: 'Amiri_700Bold', textAlign: 'right' },
  customCard: { marginBottom: vs(16), padding: ms(18), backgroundColor: COLORS.cardBg, borderRadius: ms(18), borderWidth: 1, borderColor: COLORS.divider },
  customCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(12) },
  customCardTitle: { fontSize: ms(15), color: COLORS.text, marginLeft: 8, fontFamily: 'PlayfairDisplay_700Bold' },
  inputContainer: { marginBottom: vs(12) },
  inputLabel: { fontSize: ms(12), color: COLORS.textDim, marginBottom: 6 },
  customInput: { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: ms(13), fontSize: ms(15), color: COLORS.text, borderWidth: 1, borderColor: COLORS.divider },
  customButton: { backgroundColor: COLORS.accent, paddingVertical: vs(12), borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: vs(4) },
  customButtonText: { color: COLORS.bg, fontSize: ms(15), marginRight: 6, fontFamily: 'PlayfairDisplay_700Bold' },
  gridItemWrapper: { flex: 1 / (isTablet ? 4 : 3), padding: 5 },
  gridItem: { aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider },
  gridImage: { width: '100%', height: '100%' },
  pickerItem: { backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center' },
  pickerText: { fontSize: ms(10), color: COLORS.textDim, fontFamily: 'PlayfairDisplay_700Bold', marginTop: 4 },
  pickerIconContainer: { width: ms(46), height: ms(46), borderRadius: ms(23), backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: ms(20), paddingVertical: vs(10), backgroundColor: COLORS.bgLight, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  editorBackBtn: { width: ms(40), height: ms(40), borderRadius: ms(20), backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center' },
  editorTitle: { fontSize: ms(18), color: COLORS.text, fontFamily: 'PlayfairDisplay_700Bold' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: ms(14), paddingVertical: ms(8), borderRadius: 20 },
  shareBtnText: { color: COLORS.bg, fontSize: ms(14), marginLeft: 6, fontFamily: 'PlayfairDisplay_700Bold' },
  canvasContainer: { flex: 1, paddingHorizontal: ms(16), paddingVertical: vs(12), justifyContent: 'center', alignItems: 'center' },
  canvasFrame: { width: '100%', aspectRatio: 1, maxWidth: isTablet ? 550 : 420, alignSelf: 'center', borderRadius: ms(18), overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.gold + '20' },
  textWrapper: { padding: ms(30), width: '100%' },
  watermark: { position: 'absolute', bottom: ms(12), right: ms(12), flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  watermarkText: { color: COLORS.beige, fontSize: ms(10), marginLeft: 4, fontFamily: 'PlayfairDisplay_700Bold' },
  hintText: { textAlign: 'center', color: COLORS.textDim, fontSize: ms(11), paddingVertical: vs(5) },
  controlsContainer: { height: isSmallDevice ? vs(130) : vs(155), backgroundColor: COLORS.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: COLORS.divider, overflow: 'hidden' },
  controlGroup: { marginBottom: vs(13) },
  controlGroupTitle: { fontSize: ms(13), color: COLORS.text, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: vs(5) },
  controlsScroll: { paddingHorizontal: 20, paddingTop: 10 },
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  sliderValue: { width: 46, fontSize: ms(12), color: COLORS.gold, fontFamily: 'PlayfairDisplay_700Bold' },
  slider: { flex: 1 },
  fontChip: { paddingHorizontal: ms(14), paddingVertical: ms(8), borderRadius: 14, backgroundColor: COLORS.bgLight, marginRight: 8 },
  fontChipActive: { borderWidth: 1, borderColor: COLORS.gold },
  editIconBtn: { width: ms(32), height: ms(32), borderRadius: ms(16), backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  presetCircle: { width: ms(32), height: ms(32), borderRadius: ms(16), marginRight: 10 },
  controlsCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: ms(20) },
  alignmentCard: { width: '100%', backgroundColor: COLORS.bgLight, padding: ms(12), borderRadius: 16 },
  segmentedControl: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, height: ms(44), justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: COLORS.accent },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.cardBg, paddingTop: vs(8), borderTopWidth: 1, borderTopColor: COLORS.divider },
  tabButton: { flex: 1, alignItems: 'center' },
  tabIconContainer: { width: ms(42), height: ms(42), borderRadius: ms(21), backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  tabIconContainerActive: { backgroundColor: COLORS.accent },
  tabLabel: { fontSize: ms(10), color: COLORS.textDim, marginTop: 3 },
  tabLabelActive: { color: COLORS.text },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: ms(20), paddingTop: vs(18), maxHeight: SCREEN_HEIGHT * 0.82 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(14) },
  modalTitle: { fontSize: ms(20), color: COLORS.text, fontFamily: 'PlayfairDisplay_700Bold' },
  modalInput: { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: ms(14), fontSize: ms(15), color: COLORS.text, minHeight: vs(58) },
  modalDoneBtn: { backgroundColor: COLORS.accent, paddingVertical: vs(14), borderRadius: 14, alignItems: 'center', marginTop: vs(14) },
  modalDoneBtnText: { color: COLORS.bg, fontSize: ms(15), fontFamily: 'PlayfairDisplay_700Bold' },
});