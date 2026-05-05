import { Amiri_400Regular, Amiri_700Bold, useFonts } from '@expo-google-fonts/amiri';
import {
  ArefRuqaa_400Regular,
  ArefRuqaa_700Bold
} from '@expo-google-fonts/aref-ruqaa';
import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import ViewShot from 'react-native-view-shot';
import ColorPicker from 'react-native-wheel-color-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_HEIGHT < 700;

// ============================================== 
// RESPONSIVE TYPOGRAPHY
// ==============================================
const fontScale = (size: number) =>
  Platform.OS === 'android' ? moderateScale(size, 0.3) : moderateScale(size);

// ============================================== 
// 1. DATA RESOURCES
// ==============================================

const SOLID_COLORS = [
  '#0F3D3E', '#1B4B4C', '#E8DCCF', '#F5EFE7', 
  '#D4B5A0', '#8B7E74', '#4A5859', '#C9B8A8', 
  '#2C5F60', '#F0E5D8', '#A67C52', '#234E52', 
  '#E4D5C9', '#1A3B3C', '#DBC8B6', '#5A7476',
];

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

// C. GREETINGS
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


// ============================================== 
// 2. TYPES & THEME
// ==============================================

const COLORS = {
  bg: '#0A2426', 
  bgLight: '#0F3D3E', 
  cardBg: '#1B4B4C', 
  primary: '#2C5F60', 
  accent: '#D4B5A0', 
  beige: '#E8DCCF', 
  lightBeige: '#F5EFE7', 
  text: '#F5EFE7', 
  textDim: '#C9B8A8', 
  divider: '#234E52', 
  gold: '#C9A25A', 
  rose: '#D4A59A', 
};

type ScreenType = 'GREETINGS' | 'BACKGROUNDS' | 'EDITOR';
type EditorTab = 'TEXT' | 'COLOR' | 'ALIGN' | 'EFFECTS';
type BackgroundItem = { type: 'image' | 'color' | 'picker'; value: any };

const ALIGN_ICONS: Record<'left' | 'center' | 'right', keyof typeof MaterialCommunityIcons.glyphMap> = {
  left: 'format-align-left',
  center: 'format-align-center',
  right: 'format-align-right',
};

// ============================================== 
// 3. MAIN APP
// ==============================================

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('GREETINGS');
  const [selectedGreeting, setSelectedGreeting] = useState(NAMES_OF_ALLAH[0]);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundItem | null>(null);

  let [fontsLoaded] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    ArefRuqaa_400Regular,
    ArefRuqaa_700Bold,
  });

  if (!fontsLoaded) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {screen === 'GREETINGS' && (
        <GreetingsScreen
          onSelect={(item) => {
            setSelectedGreeting(item);
            setScreen('BACKGROUNDS');
          }}
        />
      )}

      {screen === 'BACKGROUNDS' && (
        <BackgroundsScreen
          onBack={() => setScreen('GREETINGS')}
          onSelect={(bgItem) => {
            setSelectedBackground(bgItem);
            setScreen('EDITOR');
          }}
        />
      )}

      {screen === 'EDITOR' && selectedBackground && (
        <EditorScreen
          greeting={selectedGreeting}
          backgroundItem={selectedBackground}
          onBack={() => setScreen('BACKGROUNDS')}
        />
      )}
    </View>
  );
}

// ============================================== 
// 4. SCREENS
// ==============================================

// --- A. GREETINGS LIST ---
const GreetingsScreen = ({ onSelect }: { onSelect: (item: typeof NAMES_OF_ALLAH[0]) => void }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [customArabic, setCustomArabic] = useState('');
  const [customEnglish, setCustomEnglish] = useState('');

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.headerGradient, { paddingTop: insets.top + verticalScale(12) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={moderateScale(24)} color={COLORS.text} />
          </TouchableOpacity>
      
          <View>
            <Text style={styles.headerTitle}>99 Names of Allah</Text>
      
          </View>
        </View>
    
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + verticalScale(40) }}>
        
        {/* Tablet Centering Wrapper */}
        <View style={styles.tabletCenterWrapper}>
          <View style={styles.greetingsSection}>
            <Text style={styles.sectionTitle}>Names of Allah S.W.T</Text>
            
            {NAMES_OF_ALLAH.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
                style={styles.greetingCard}
              >
                <View style={styles.greetingCardContent}>
                  <View style={styles.greetingTextContainer}>
                    <Text style={styles.greetingEnglish}>{item.english}</Text>
                    <Text style={styles.greetingMeaning}>{item.meaning}</Text>
                    <View style={styles.greetingArabicContainer}>
                      <Text style={styles.greetingArabic}>{item.arabic}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardShine} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// --- B. BACKGROUNDS ---
const BackgroundsScreen = ({ onSelect, onBack }: { onSelect: (item: BackgroundItem) => void; onBack: () => void; }) => {
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) onSelect({ type: 'image', value: result.assets[0].uri });
  };

  const GRID_ITEMS: BackgroundItem[] = [
    { type: 'picker', value: 'picker' },
    ...SOLID_COLORS.map((c) => ({ type: 'color', value: c } as BackgroundItem)),
    ...BACKGROUND_IMAGES.map((i) => ({ type: 'image', value: i } as BackgroundItem)),
  ];

  // Use 5 columns for tablets to utilize width better
  const columns = isTablet ? 5 : 3;

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.headerGradient, { paddingTop: insets.top + verticalScale(12) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={moderateScale(24)} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: scale(15) }}>
            <Text style={styles.headerTitle}>Choose Background</Text>
            <Text style={styles.headerSubtitle}>Select or upload an image</Text>
          </View>
        </View>
        <View style={styles.decorativeLine} />
      </View>

      <FlatList
        data={GRID_ITEMS}
        numColumns={columns}
        key={columns} // Force re-render if switching
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: scale(8), paddingBottom: insets.bottom + verticalScale(20) }}
        renderItem={({ item }) => {
          if (item.type === 'picker') {
            return (
              <TouchableOpacity onPress={pickImage} style={[styles.gridItemWrapper, { flex: 1 / columns }]}>
                <View style={[styles.gridItem, styles.pickerItem]}>
                  <View style={styles.pickerIconContainer}>
                    <MaterialCommunityIcons name="image-plus" size={moderateScale(32)} color={COLORS.gold} />
                  </View>
                  <Text style={styles.pickerText}>Your Photo</Text>
                </View>
              </TouchableOpacity>
            );
          }
          if (item.type === 'color') {
            return (
              <TouchableOpacity onPress={() => onSelect(item)} style={[styles.gridItemWrapper, { flex: 1 / columns }]}>
                <View style={[styles.gridItem, { backgroundColor: item.value }]}>
                  <View style={styles.colorOverlay} />
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity onPress={() => onSelect(item)} style={[styles.gridItemWrapper, { flex: 1 / columns }]}>
              <View style={styles.gridItem}>
                <Image source={item.value} style={styles.gridImage} />
                <View style={styles.imageOverlay} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

// --- C. EDITOR ---
const EditorScreen = ({ greeting, backgroundItem, onBack }: { greeting: typeof NAMES_OF_ALLAH[0]; backgroundItem: BackgroundItem; onBack: () => void; }) => {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);

  const [mainText, setMainText] = useState(greeting.arabic);
  const [subText, setSubText] = useState(greeting.english);
  const [isEditing, setIsEditing] = useState(false);

  const [activeTab, setActiveTab] = useState<EditorTab>('TEXT');
  const [fontSize, setFontSize] = useState(moderateScale(isTablet ? 60 : 50)); 
  const [fontFamily, setFontFamily] = useState('Amiri_700Bold');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [opacity, setOpacity] = useState(1);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [shadowOpacity, setShadowOpacity] = useState(0.9);

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // @ts-ignore
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => pan.flattenOffset(),
    })
  ).current;

  const handleShare = async () => {
    if (viewShotRef.current?.capture) {
      try {
        const uri = await viewShotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Error', 'Sharing not available');
        }
      } catch (e) {
        Alert.alert('Error', 'Could not save image');
      }
    }
  };

  const renderBackground = () => {
    const content = (
      <>
        {backgroundItem.type === 'image' && blurIntensity > 0 && (
          <BlurView intensity={blurIntensity} style={StyleSheet.absoluteFill} />
        )}
        <Animated.View
          style={[styles.textWrapper, { transform: [...pan.getTranslateTransform()], alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center' }]}
          {...panResponder.panHandlers}
        >
          <Text style={[styles.mainText, { fontSize, fontFamily, color: textColor, opacity, textAlign, textShadowColor: 'rgba(0,0,0,' + shadowOpacity + ')', textShadowOffset: { width: 0, height: verticalScale(3) }, textShadowRadius: moderateScale(12), lineHeight: fontSize * 1.5, letterSpacing: 1.2 }]}>
            {mainText}
          </Text>
          {subText ? (
            <Text style={[styles.subText, { fontSize: fontSize * 0.38, fontFamily: 'PlayfairDisplay_400Regular', color: textColor, opacity: opacity * 0.85, textAlign, textShadowColor: 'rgba(0,0,0,' + shadowOpacity * 0.8 + ')', textShadowOffset: { width: 0, height: verticalScale(2) }, textShadowRadius: moderateScale(6), lineHeight: fontSize * 0.58, letterSpacing: 0.8, fontStyle: 'italic', paddingHorizontal: scale(10) }]}>
              {subText}
            </Text>
          ) : null}
        </Animated.View>
        <View style={styles.watermark}>
          <MaterialCommunityIcons name="star-crescent" size={moderateScale(12)} color={COLORS.gold + 'DD'} />
          <Text style={styles.watermarkText}>Qalb E Rooh</Text>
        </View>
      </>
    );

    if (backgroundItem.type === 'color') {
      return <View style={[styles.canvasFrame, { backgroundColor: backgroundItem.value }]}>{content}</View>;
    }
    return (
      <ImageBackground source={typeof backgroundItem.value === 'string' ? { uri: backgroundItem.value } : backgroundItem.value} style={styles.canvasFrame} imageStyle={{ resizeMode: 'cover' }}>
        {content}
      </ImageBackground>
    );
  };

  const renderControls = () => {
    switch (activeTab) {
      case 'TEXT':
        return (
          <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.tabletControlWrapper}>
              <View style={styles.controlGroup}>
                <Text style={styles.controlGroupTitle}>Text Size</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderValue}>{fontSize.toFixed(0)}</Text>
                  <Slider style={styles.slider} minimumValue={moderateScale(24)} maximumValue={moderateScale(120)} value={fontSize} onValueChange={setFontSize} minimumTrackTintColor={COLORS.gold} maximumTrackTintColor={COLORS.divider} thumbTintColor={COLORS.accent} />
                </View>
              </View>
              <View style={styles.controlGroup}>
                <View style={styles.controlGroupHeader}>
                  <Text style={styles.controlGroupTitle}>Edit Content</Text>
                  <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIconBtn}>
                    <MaterialCommunityIcons name="pencil" size={moderateScale(16)} color={COLORS.gold} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.controlGroup}>
                <Text style={styles.controlGroupTitle}>Font Style</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontScroll}>
                  {[
                    { name: 'Amiri', font: 'Amiri_400Regular' },
                    { name: 'Amiri Bold', font: 'Amiri_700Bold' },
                    { name: 'Playfair', font: 'PlayfairDisplay_400Regular' },
                    { name: 'Playfair Bold', font: 'PlayfairDisplay_700Bold' },
                  ].map((f) => (
                    <TouchableOpacity key={f.font} onPress={() => setFontFamily(f.font)} style={[styles.fontChip, fontFamily === f.font && styles.fontChipActive]}>
                      <Text style={[styles.fontChipText, { fontFamily: f.font }]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        );

      case 'COLOR':
        return (
          <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.tabletControlWrapper}>
              <View style={styles.controlGroup}>
                <Text style={styles.controlGroupTitle}>Presets</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: verticalScale(15) }}>
                  {['#FFFFFF', '#C9A25A', '#E8DCCF', '#D4A59A', '#0A2426', '#1B4B4C'].map((c) => (
                    <TouchableOpacity key={c} onPress={() => setTextColor(c)} style={[styles.presetCircle, { backgroundColor: c, borderWidth: textColor === c ? 2 : 0, borderColor: COLORS.gold }]} />
                  ))}
                </ScrollView>
                <View style={styles.colorPickerWrapper}>
                  <ColorPicker color={textColor} onColorChange={setTextColor} thumbSize={moderateScale(25)} sliderSize={moderateScale(25)} noSnap={true} row={false} swatches={false} />
                </View>
                <View style={styles.selectedColorDisplay}>
                  <View style={[styles.selectedColorBox, { backgroundColor: textColor }]} />
                  <TextInput style={styles.selectedColorText} value={textColor.toUpperCase()} onChangeText={setTextColor} maxLength={7} />
                  <MaterialCommunityIcons name="eyedropper" size={moderateScale(16)} color={COLORS.gold} />
                </View>
              </View>
              <View style={styles.controlGroup}>
                <Text style={styles.controlGroupTitle}>Opacity</Text>
                <View style={styles.sliderRow}>
                  <Slider style={styles.slider} minimumValue={0.2} maximumValue={1} value={opacity} onValueChange={setOpacity} minimumTrackTintColor={COLORS.gold} maximumTrackTintColor={COLORS.divider} thumbTintColor={COLORS.accent} />
                  <Text style={styles.sliderValue}>{(opacity * 100).toFixed(0)}%</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );

      case 'ALIGN':
        return (
          <View style={styles.controlsCenter}>
            <View style={[styles.alignmentCard, styles.tabletControlWrapper]}>
              <Text style={[styles.controlGroupTitle, { textAlign: 'center', marginBottom: verticalScale(20) }]}>Positioning</Text>
              <View style={styles.segmentedControl}>
                {(['left', 'center', 'right'] as const).map((align) => (
                  <TouchableOpacity key={align} onPress={() => setTextAlign(align)} style={[styles.segmentBtn, textAlign === align && styles.segmentBtnActive]}>
                    <MaterialCommunityIcons name={ALIGN_ICONS[align]} size={moderateScale(24)} color={textAlign === align ? COLORS.bg : COLORS.textDim} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.alignHint}>Aligning text {textAlign}</Text>
            </View>
          </View>
        );

      case 'EFFECTS':
        return (
          <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.tabletControlWrapper}>
              <View style={styles.controlGroup}>
                <Text style={styles.controlGroupTitle}>Background Blur</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderValue}>{blurIntensity.toFixed(0)}</Text>
                  <Slider style={styles.slider} minimumValue={0} maximumValue={100} value={blurIntensity} onValueChange={setBlurIntensity} minimumTrackTintColor={COLORS.gold} maximumTrackTintColor={COLORS.divider} thumbTintColor={COLORS.accent} />
                </View>
              </View>
              <View style={styles.controlGroup}>
                <Text style={styles.controlGroupTitle}>Text Shadow</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderValue}>{(shadowOpacity * 100).toFixed(0)}%</Text>
                  <Slider style={styles.slider} minimumValue={0} maximumValue={1} value={shadowOpacity} onValueChange={setShadowOpacity} minimumTrackTintColor={COLORS.gold} maximumTrackTintColor={COLORS.divider} thumbTintColor={COLORS.accent} />
                </View>
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.editorHeader, { paddingTop: insets.top + verticalScale(12) }]}>
        <TouchableOpacity onPress={onBack} style={styles.editorBackBtn}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.editorTitle}>Customize</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={moderateScale(20)} color={COLORS.bg} />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.canvasContainer]}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          {renderBackground()}
        </ViewShot>
      </View>

      <Text style={styles.hintText}>
        <MaterialCommunityIcons name="gesture-tap-hold" size={moderateScale(14)} color={COLORS.textDim} /> Drag text to reposition
      </Text>

      <View style={styles.controlsContainer}>{renderControls()}</View>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom + verticalScale(10) }]}>
        <EditorTabButton icon="format-text" label="Text" isActive={activeTab === 'TEXT'} onPress={() => setActiveTab('TEXT')} />
        <EditorTabButton icon="palette" label="Color" isActive={activeTab === 'COLOR'} onPress={() => setActiveTab('COLOR')} />
        <EditorTabButton icon="format-align-center" label="Align" isActive={activeTab === 'ALIGN'} onPress={() => setActiveTab('ALIGN')} />
        <EditorTabButton icon="auto-fix" label="Effects" isActive={activeTab === 'EFFECTS'} onPress={() => setActiveTab('EFFECTS')} />
      </View>

      <Modal visible={isEditing} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsEditing(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Message</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={moderateScale(28)} color={COLORS.textDim} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Main Text (Arabic/Large)</Text>
            <TextInput value={mainText} onChangeText={setMainText} multiline style={[styles.modalInput, { fontFamily: 'Amiri_700Bold', textAlign: 'right', fontSize: fontScale(18) }]} placeholderTextColor={COLORS.textDim + '60'} />
            <Text style={styles.modalLabel}>Sub Text (English/Small)</Text>
            <TextInput value={subText} onChangeText={setSubText} multiline style={[styles.modalInput, { fontFamily: 'PlayfairDisplay_400Regular', fontSize: fontScale(16) }]} placeholderTextColor={COLORS.textDim + '60'} />
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.modalDoneBtn}>
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ============================================== 
// 5. COMPONENTS
// ==============================================

const EditorTabButton = ({ icon, label, isActive, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.tabButton}>
    <View style={[styles.tabIconContainer, isActive && styles.tabIconContainerActive]}>
      <MaterialCommunityIcons name={icon} size={moderateScale(22)} color={isActive ? COLORS.bg : COLORS.textDim} />
    </View>
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

// ============================================== 
// 6. STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ================= HEADER =================
  headerGradient: {
    backgroundColor: COLORS.bgLight,
    paddingBottom: verticalScale(18),
    paddingHorizontal: wp('5%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: fontScale(isTablet ? 30 : 24),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  headerSubtitle: {
    fontSize: fontScale(14),
    color: COLORS.textDim,
    marginTop: verticalScale(4),
    fontFamily: 'PlayfairDisplay_400Regular',
  },

  decorativeLine: {
    height: verticalScale(2),
    backgroundColor: COLORS.gold + '40',
    marginTop: verticalScale(12),
    width: scale(60),
    borderRadius: 2,
  },

  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },

  // ================= GREETINGS =================
  tabletCenterWrapper: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 650, // This is the magic number that fixes tablet stretching
  },

  greetingsSection: {
    paddingHorizontal: wp('5%'),
  },

  sectionTitle: {
    fontSize: fontScale(18),
    color: COLORS.text,
    marginBottom: verticalScale(12),
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  greetingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: moderateScale(16),
  },

  greetingCardContent: {
    flexDirection: 'row',
  },

  greetingTextContainer: {
    flex: 1,
  },

  greetingEnglish: {
    fontSize: fontScale(16),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  greetingMeaning: {
    fontSize: fontScale(13),
    color: COLORS.textDim,
    marginTop: verticalScale(4),
    fontFamily: 'PlayfairDisplay_400Regular',
  },

  greetingArabicContainer: {
    marginTop: verticalScale(8),
    backgroundColor: COLORS.bgLight,
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
  },

  greetingArabic: {
    fontSize: fontScale(isTablet ? 26 : 20),
    color: COLORS.gold,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'right',
  },

  // ================= BACKGROUND GRID =================
  gridItemWrapper: {
    padding: scale(6),
  },

  gridItem: {
    aspectRatio: 1,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },

  gridImage: {
    width: '100%',
    height: '100%',
  },

  pickerItem: {
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pickerText: {
    fontSize: fontScale(12),
    color: COLORS.textDim,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  // ================= EDITOR =================
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingBottom: verticalScale(12),
    backgroundColor: COLORS.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  editorBackBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  editorTitle: {
    fontSize: fontScale(18),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
  },

  shareBtnText: {
    color: COLORS.bg,
    fontSize: fontScale(14),
    marginLeft: scale(6),
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  // ================= CANVAS =================
  canvasContainer: {
    flex: 1.5,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: verticalScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },

  canvasFrame: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: isTablet ? 450 : wp('95%'), // Strict hard cap on tablet canvas width
    maxHeight: isTablet ? 450 : undefined, // Strict hard cap on tablet canvas height
    alignSelf: 'center',
    borderRadius: moderateScale(18),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold + '20',
  },

  textWrapper: {
    padding: moderateScale(isTablet ? 40 : 25),
    width: '100%',
  },

  mainText: {
    marginBottom: verticalScale(10),
  },

  subText: {
    marginTop: verticalScale(6),
  },

  watermark: {
    position: 'absolute',
    bottom: verticalScale(12),
    right: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(10),
  },

  watermarkText: {
    color: COLORS.beige,
    fontSize: fontScale(10),
    marginLeft: scale(4),
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  hintText: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: fontScale(12),
    paddingVertical: verticalScale(8),
    fontFamily: 'PlayfairDisplay_400Regular',
  },

  // ================= CONTROLS =================
  controlsContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    borderTopWidth: 1,
    borderColor: COLORS.divider,
    flex: 0.8,
  },
  
  controlsScroll: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: verticalScale(12),
  },

  tabletControlWrapper: {
    width: '100%',
    maxWidth: 550, // Prevents sliders from stretching 100% of iPad width
    alignSelf: 'center',
  },

  controlGroup: {
    marginBottom: verticalScale(16),
  },

  controlGroupTitle: {
    fontSize: fontScale(14),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: verticalScale(8),
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sliderValue: {
    width: scale(50),
    fontSize: fontScale(13),
    color: COLORS.gold,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  slider: {
    flex: 1,
  },

  fontChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
    backgroundColor: COLORS.bgLight,
    marginRight: scale(8),
  },

  fontChipActive: {
    borderWidth: 1,
    borderColor: COLORS.gold,
  },

  fontChipText: {
    color: COLORS.text,
    fontSize: fontScale(13),
  },

  // ================= TAB BAR =================
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
  },

  tabIconContainer: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabIconContainerActive: {
    backgroundColor: COLORS.accent,
  },

  tabLabel: {
    fontSize: fontScale(10),
    color: COLORS.textDim,
    marginTop: verticalScale(4),
  },

  tabLabelActive: {
    color: COLORS.text,
  },

  // ================= MODAL =================
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: wp('5%'),
    paddingTop: verticalScale(18),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(24),
    maxHeight: hp('80%'),
  },

  modalTitle: {
    fontSize: fontScale(20),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  modalLabel: {
    fontSize: fontScale(14),
    color: COLORS.textDim,
    marginTop: verticalScale(12),
    marginBottom: verticalScale(6),
  },

  modalInput: {
    backgroundColor: COLORS.bgLight,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: fontScale(15),
    color: COLORS.text,
    minHeight: verticalScale(60),
  },

  modalDoneBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    marginTop: verticalScale(16),
  },

  modalDoneBtnText: {
    color: COLORS.bg,
    fontSize: fontScale(15),
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  // ================= CUSTOM MESSAGE CARD =================
  customCard: {
    margin: wp('5%'),
    padding: moderateScale(18),
    backgroundColor: COLORS.cardBg,
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: COLORS.divider,
  },

  customCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },

  customCardTitle: {
    fontSize: fontScale(16),
    color: COLORS.text,
    marginLeft: scale(8),
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  inputContainer: {
    marginBottom: verticalScale(12),
  },

  inputLabel: {
    fontSize: fontScale(13),
    color: COLORS.textDim,
    marginBottom: verticalScale(6),
  },

  customInput: {
    backgroundColor: COLORS.bgLight,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: fontScale(15),
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },

  customButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(6),
  },

  customButtonText: {
    color: COLORS.bg,
    fontSize: fontScale(15),
    marginRight: scale(6),
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.gold + '30',
  },

  // ================= GRID EXTRAS =================
  pickerIconContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },

  colorOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  // ================= CONTROL HEADER =================
  controlGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  editIconBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fontScroll: {
    marginTop: verticalScale(8),
  },

  presetCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    marginRight: scale(10),
  },

  colorPickerWrapper: {
    height: verticalScale(150),
  },

  selectedColorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    padding: moderateScale(10),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(10),
  },

  selectedColorBox: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(6),
    marginRight: scale(10),
  },

  selectedColorText: {
    color: COLORS.text,
    fontSize: fontScale(13),
    flex: 1,
  },

  // ================= ALIGNMENT =================
  controlsCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },

  alignmentCard: {
    width: '100%',
    backgroundColor: COLORS.bgLight,
    padding: moderateScale(8),
    borderRadius: moderateScale(16),
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
  },

  segmentBtn: {
    flex: 1,
    height: moderateScale(44),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },

  segmentBtnActive: {
    backgroundColor: COLORS.accent,
  },

  alignHint: {
    textAlign: 'center',
    marginTop: verticalScale(12),
    fontSize: fontScale(12),
    color: COLORS.textDim,
  },

  // ================= MODAL HEADER =================
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
});