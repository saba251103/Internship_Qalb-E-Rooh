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
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import ColorPicker from 'react-native-wheel-color-picker';
import responsive from '../../utils/responsive';

const { vs, hs, moderateScale, screenWidth, screenHeight } = responsive;
const isTablet = screenWidth >= 768;
const isSmallDevice = screenHeight < 700;


// ============================================== 
// 1. DATA RESOURCES
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

// C. GREETINGS
const GREETINGS_DATA = [
  { id: '1', arabic: 'السلام عليكم', english: 'As-salamu alaykum', meaning: 'Peace be upon you' },
  { id: '2', arabic: 'وعليكم السلام', english: 'Wa alaykum as-salam', meaning: 'And peace be upon you' },
  { id: '3', arabic: 'السلام عليكم ورحمة الله', english: 'As-salamu alaykum wa rahmatullah', meaning: 'Peace and mercy of Allah be upon you' },
  { id: '4', arabic: 'السلام عليكم ورحمة الله وبركاته', english: 'As-salamu alaykum wa rahmatullahi wa barakatuh', meaning: 'Peace, mercy, and blessings of Allah be upon you' },
  { id: '5', arabic: 'مرحبا', english: 'Marhaban', meaning: 'Welcome' },
  { id: '6', arabic: 'أهلاً وسهلاً', english: 'Ahlan wa sahlan', meaning: 'Welcome (pleasant and easy arrival)' },
  { id: '7', arabic: 'حياك الله', english: 'Hayyak Allah', meaning: 'May Allah grant you life / Welcome warmly' },
  { id: '8', arabic: 'صبحك الله بالخير', english: 'Sabbahak Allah bil-khayr', meaning: 'May Allah bless your morning with goodness' },
  { id: '9', arabic: 'مساء الخير', english: 'Masa al-khayr', meaning: 'Good evening' },
  { id: '10', arabic: 'جمعة مباركة', english: "Jumu'ah Mubarak", meaning: 'Blessed Friday' },
  { id: '11', arabic: 'رمضان مبارك', english: 'Ramadan Mubarak', meaning: 'Blessed Ramadan' },
  { id: '12', arabic: 'رمضان كريم', english: 'Ramadan Kareem', meaning: 'Generous Ramadan' },
  { id: '13', arabic: 'تقبل الله منا ومنكم', english: 'Taqabbal Allahu minna wa minkum', meaning: 'May Allah accept from us and you' },
  { id: '14', arabic: 'صوماً مقبولاً', english: 'Sawman Maqbulan', meaning: 'May your fast be accepted' },
  { id: '15', arabic: 'إفطاراً شهياً', english: 'Iftaran Shahiyyan', meaning: 'Have a pleasant iftar' },
  { id: '16', arabic: 'عيد مبارك', english: 'Eid Mubarak', meaning: 'Blessed Eid' },
  { id: '17', arabic: 'كل عام وأنتم بخير', english: "Kul 'am wa antum bi khayr", meaning: 'May you be well every year' },
  { id: '18', arabic: 'عيدكم مبارك', english: 'Eidukum Mubarak', meaning: 'May your Eid be blessed' },
  { id: '19', arabic: 'حج مبرور وسعي مشكور', english: "Hajj Mabroor wa Sa'i Mashkoor", meaning: 'May your Hajj be accepted and your efforts rewarded' },
  { id: '20', arabic: 'تقبل الله حجكم', english: 'Taqabbal Allahu Hajjkum', meaning: 'May Allah accept your Hajj' },
  { id: '21', arabic: 'عام هجري سعيد', english: 'Happy Hijri New Year', meaning: 'Blessed Islamic New Year' },
  { id: '22', arabic: 'مبارك عليكم الشهر', english: "Mubarak 'alaykum ash-shahr", meaning: 'Blessed month upon you (Ramadan greeting)' },
  { id: '23', arabic: 'بارك الله فيك', english: 'Barakallahu feek', meaning: 'May Allah bless you' },
  { id: '24', arabic: 'جزاك الله خيراً', english: 'JazakAllahu Khayran', meaning: 'May Allah reward you with goodness' },
  { id: '25', arabic: 'في أمان الله', english: 'Fi Amanillah', meaning: "May you be in Allah's protection" },
  { id: '26', arabic: 'الله يحفظك', english: 'Allah yahfazuk', meaning: 'May Allah protect you' },
  { id: '27', arabic: 'ما شاء الله', english: 'MashaAllah', meaning: 'What Allah has willed' },
  { id: '28', arabic: 'الحمد لله', english: 'Alhamdulillah', meaning: 'All praise is due to Allah' },
  { id: '29', arabic: 'إن شاء الله', english: 'InshaAllah', meaning: 'If Allah wills' },
  { id: '30', arabic: 'استودعك الله', english: "Astawdi'uk Allah", meaning: 'I entrust you to Allah' },
  { id: '31', arabic: 'رزقك الله الفردوس الأعلى', english: "Razaqak Allah al-Firdaws al-A'la", meaning: 'May Allah grant you the highest Paradise' },
  { id: '32', arabic: 'شفاك الله', english: 'Shafak Allah', meaning: 'May Allah grant you healing' },
  { id: '33', arabic: 'طهور إن شاء الله', english: 'Tahoor InshaAllah', meaning: 'May it be purification (when sick)' },
  { id: '34', arabic: 'ثبتك الله', english: 'Thabbatak Allah', meaning: 'May Allah keep you steadfast' },
  { id: '35', arabic: 'زادك الله علماً', english: "Zadak Allah 'Ilman", meaning: 'May Allah increase you in knowledge' },
  { id: '36', arabic: 'نفع الله بك', english: "Nafa'a Allahu bik", meaning: 'May Allah benefit others through you' },
  { id: '37', arabic: 'بارك الله لك', english: 'BarakAllahu lak', meaning: 'May Allah bless for you' },
  { id: '38', arabic: 'رزقك الله السعادة', english: "Razaqak Allah as-Sa'adah", meaning: 'May Allah grant you happiness' },
  { id: '39', arabic: 'رزقك الله التوفيق', english: 'Razaqak Allah at-Tawfiq', meaning: 'May Allah grant you success' },
  { id: '40', arabic: 'اللهم بلغنا رمضان', english: 'Allahumma ballighna Ramadan', meaning: 'O Allah, allow us to reach Ramadan' },
  { id: '41', arabic: 'مبارك الزواج', english: 'Mubarak az-Zawaj', meaning: 'Blessed marriage' },
  { id: '43', arabic: 'رزقكم الله الذرية الصالحة', english: "Razaqakum Allah adh-Dhurriyah as-Salihah", meaning: 'May Allah grant you righteous offspring' },
  { id: '44', arabic: 'مبروك المولود', english: 'Mabrook al-Mawlood', meaning: 'Congratulations on the newborn' },
  { id: '45', arabic: 'عقيقة مباركة', english: 'Aqiqah Mubarak', meaning: 'Blessed Aqiqah celebration' },
  { id: '46', arabic: 'تقبل الله طاعاتكم', english: "Taqabbal Allah ta'atakum", meaning: 'May Allah accept your عبادات' },
  { id: '47', arabic: 'غفر الله لنا ولكم', english: 'Ghafar Allah lana wa lakum', meaning: 'May Allah forgive us and you' },
  { id: '48', arabic: 'يوم عرفة مبارك', english: "Yawm 'Arafah Mubarak", meaning: 'Blessed Day of Arafah' },
  { id: '49', arabic: 'ليلة القدر مباركة', english: 'Laylat al-Qadr Mubarakah', meaning: 'Blessed Night of Decree' },
  { id: '50', arabic: 'صلاة مقبولة', english: 'Salat Maqbulah', meaning: 'May your prayer be accepted' },
];

// ============================================== 
// 2. TYPES & THEME
// ==============================================

// Enhanced aesthetic color palette
const COLORS = {
  bg: '#0A2426', // Deep teal black
  bgLight: '#0F3D3E', // Dark teal
  cardBg: '#1B4B4C', // Rich teal
  primary: '#2C5F60', // Ocean teal
  accent: '#D4B5A0', // Dusty rose beige
  beige: '#E8DCCF', // Warm beige
  lightBeige: '#F5EFE7', // Light cream
  text: '#F5EFE7', // Cream white
  textDim: '#C9B8A8', // Sand
  divider: '#234E52', // Deep sea
  gold: '#C9A25A', // Soft gold accent
  rose: '#D4A59A', // Dusty rose
  a:'#000000', 
  b:'#1a1a1a', 
  c:'#ffffff', 
  d:'#2E3192', 
  e:'#1BFFFF', // Blue/Cyan
  f:'#D4145A', 
  g:'#FBB03B', // Warm 
  h:'#12c2e9', 
  i:'#c471ed', 
  j:'#f64f59' // Gradient-like base
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
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenType>('GREETINGS');
  const [selectedGreeting, setSelectedGreeting] = useState(GREETINGS_DATA[0]);
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
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
    </SafeAreaView>
  );
}

// ============================================== 
// 4. SCREENS
// ==============================================

// --- A. GREETINGS LIST ---
const GreetingsScreen = ({ onSelect }: { onSelect: (item: typeof GREETINGS_DATA[0]) => void }) => {
  const router = useRouter();
  const [customArabic, setCustomArabic] = useState('');
  const [customEnglish, setCustomEnglish] = useState('');

  return (
    <View style={styles.screenContainer}>
      {/* Elegant Header */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
      
          <View>
            <Text style={styles.headerTitle}>Islamic Greetings</Text>
            <Text style={styles.headerSubtitle}>Select a beautiful message</Text>
          </View>
        </View>

        <View style={styles.decorativeLine} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Custom Message Card */}
        <View style={styles.customCard}>
          <View style={styles.customCardHeader}>
            <MaterialCommunityIcons name="pencil" size={20} color={COLORS.gold} />
            <Text style={styles.customCardTitle}>Create Your Message</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Arabic Text</Text>
            <TextInput
              value={customArabic}
              onChangeText={setCustomArabic}
              placeholder="أدخل النص العربي"
              placeholderTextColor={COLORS.textDim + '60'}
              style={[styles.customInput, { fontFamily: 'Amiri_400Regular', textAlign: 'right' }]}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>English Translation (Optional)</Text>
            <TextInput
              value={customEnglish}
              onChangeText={setCustomEnglish}
              placeholder="Enter English text"
              placeholderTextColor={COLORS.textDim + '60'}
              style={styles.customInput}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!customArabic.trim()) {
                Alert.alert('Required', 'Please enter Arabic text first');
                return;
              }
              onSelect({
                id: 'custom',
                arabic: customArabic,
                english: customEnglish || '',
                meaning: 'Custom Message',
              });
              setCustomArabic('');
              setCustomEnglish('');
            }}
            style={styles.customButton}
            activeOpacity={0.8}
          >
            <Text style={styles.customButtonText}>Create Message</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.bg} />
          </TouchableOpacity>
        </View>

        {/* Greetings List */}
        <View style={styles.greetingsSection}>
          <Text style={styles.sectionTitle}>Popular Greetings</Text>
          
          {GREETINGS_DATA.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
              style={[
                styles.greetingCard,
                { animationDelay: `${index * 50}ms` }
              ]}
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// --- B. BACKGROUNDS (Mixed: Picker, Colors, Images) ---
const BackgroundsScreen = ({
  onSelect,
  onBack,
}: {
  onSelect: (item: BackgroundItem) => void;
  onBack: () => void;
}) => {
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      onSelect({ type: 'image', value: result.assets[0].uri });
    }
  };

  const GRID_ITEMS: BackgroundItem[] = [
    { type: 'picker', value: 'picker' },
    ...SOLID_COLORS.map((c) => ({ type: 'color', value: c } as BackgroundItem)),
    ...BACKGROUND_IMAGES.map((i) => ({ type: 'image', value: i } as BackgroundItem)),
  ];

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.headerTitle}>Choose Background</Text>
            <Text style={styles.headerSubtitle}>Select or upload an image</Text>
          </View>
        </View>
        <View style={styles.decorativeLine} />
      </View>

      <FlatList
        data={GRID_ITEMS}
        numColumns={3}
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => {
          if (item.type === 'picker') {
            return (
              <TouchableOpacity onPress={pickImage} style={styles.gridItemWrapper}>
                <View style={[styles.gridItem, styles.pickerItem]}>
                  <View style={styles.pickerIconContainer}>
                    <MaterialCommunityIcons name="image-plus" size={32} color={COLORS.gold} />
                  </View>
                  <Text style={styles.pickerText}>Your Photo</Text>
                </View>
              </TouchableOpacity>
            );
          }

          if (item.type === 'color') {
            return (
              <TouchableOpacity onPress={() => onSelect(item)} style={styles.gridItemWrapper}>
                <View style={[styles.gridItem, { backgroundColor: item.value }]}>
                  <View style={styles.colorOverlay} />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity onPress={() => onSelect(item)} style={styles.gridItemWrapper}>
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
const EditorScreen = ({
  greeting,
  backgroundItem,
  onBack,
}: {
  greeting: typeof GREETINGS_DATA[0];
  backgroundItem: BackgroundItem;
  onBack: () => void;
}) => {
  const viewShotRef = useRef<ViewShot>(null);

  // Custom Text State
  const [mainText, setMainText] = useState(greeting.arabic);
  const [subText, setSubText] = useState(greeting.english);
  const [isEditing, setIsEditing] = useState(false);

  // Style State
  const [activeTab, setActiveTab] = useState<EditorTab>('TEXT');
  const [fontSize, setFontSize] = useState(42);
  const [fontFamily, setFontFamily] = useState('Amiri_700Bold');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [opacity, setOpacity] = useState(1);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [shadowOpacity, setShadowOpacity] = useState(0.9);

  // Dragging
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // @ts-ignore
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => pan.flattenOffset(),
    })
  ).current;

  // Share
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

  // Render Background Logic
  const renderBackground = () => {
    const content = (
      <>
        {backgroundItem.type === 'image' && blurIntensity > 0 && (
          <BlurView intensity={blurIntensity} style={StyleSheet.absoluteFill} />
        )}

        <Animated.View
          style={[
            styles.textWrapper,
            {
              transform: [...pan.getTranslateTransform()],
              alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Text
            style={[
              styles.mainText,
              {
                fontSize,
                fontFamily,
                color: textColor,
                opacity,
                textAlign,
                textShadowColor: 'rgba(0,0,0,' + shadowOpacity + ')',
                textShadowOffset: { width: 0, height: 3 },
                textShadowRadius: 12,
                lineHeight: fontSize * 1.5,
                letterSpacing: 1.2,
              },
            ]}
          >
            {mainText}
          </Text>
          {subText ? (
            <Text
              style={[
                styles.subText,
                {
                  fontSize: fontSize * 0.38,
                  fontFamily: 'PlayfairDisplay_400Regular',
                  color: textColor,
                  opacity: opacity * 0.85,
                  textAlign,
                  textShadowColor: 'rgba(0,0,0,' + shadowOpacity * 0.8 + ')',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 6,
                  lineHeight: fontSize * 0.58,
                  letterSpacing: 0.8,
                  fontStyle: 'italic',
                  paddingHorizontal: 10,
                },
              ]}
            >
              {subText}
            </Text>
          ) : null}
        </Animated.View>

        {/* Elegant Watermark */}
        <View style={styles.watermark}>
          <MaterialCommunityIcons name="star-crescent" size={12} color={COLORS.gold + 'DD'} />
          <Text style={styles.watermarkText}>Qalb E Rooh</Text>
        </View>
      </>
    );

    if (backgroundItem.type === 'color') {
      return (
        <View style={[styles.canvasFrame, { backgroundColor: backgroundItem.value }]}>
          {content}
        </View>
      );
    }

    return (
      <ImageBackground
        source={
          typeof backgroundItem.value === 'string'
            ? { uri: backgroundItem.value }
            : backgroundItem.value
        }
        style={styles.canvasFrame}
        imageStyle={{ resizeMode: 'cover' }}
      >
        {content}
      </ImageBackground>
    );
  };

  const renderControls = () => {
    switch (activeTab) {
      case 'TEXT':
        return (
          <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlGroupTitle}>Text Size</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderValue}>{fontSize.toFixed(0)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={24}
                  maximumValue={90}
                  value={fontSize}
                  onValueChange={setFontSize}
                  minimumTrackTintColor={COLORS.gold}
                  maximumTrackTintColor={COLORS.divider}
                  thumbTintColor={COLORS.accent}
                />
              </View>
            </View>

            <View style={styles.controlGroup}>
              <View style={styles.controlGroupHeader}>
                <Text style={styles.controlGroupTitle}>Edit Content</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIconBtn}>
                  <MaterialCommunityIcons name="pencil" size={16} color={COLORS.gold} />
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
                  <TouchableOpacity
                    key={f.font}
                    onPress={() => setFontFamily(f.font)}
                    style={[styles.fontChip, fontFamily === f.font && styles.fontChipActive]}
                  >
                    <Text style={[styles.fontChipText, { fontFamily: f.font }]}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        );

        case 'COLOR':
            return (
              <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>Presets</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {['#FFFFFF', '#C9A25A', '#E8DCCF', '#D4A59A', '#0A2426', '#1B4B4C'].map((c) => (
                      <TouchableOpacity 
                        key={c} 
                        onPress={() => setTextColor(c)}
                        style={[styles.presetCircle, { backgroundColor: c, borderWidth: textColor === c ? 2 : 0, borderColor: COLORS.gold }]} 
                      />
                    ))}
                  </ScrollView>
          
                  <View style={styles.colorPickerWrapper}>
                    <ColorPicker
                      color={textColor}
                      onColorChange={setTextColor}
                      thumbSize={25}
                      sliderSize={25}
                      noSnap={true}
                      row={false}
                      swatches={false}
                    />
                  </View>
                  
                  <View style={styles.selectedColorDisplay}>
                    <View style={[styles.selectedColorBox, { backgroundColor: textColor }]} />
                    <TextInput 
                      style={styles.selectedColorText}
                      value={textColor.toUpperCase()}
                      onChangeText={setTextColor}
                      maxLength={7}
                    />
                    <MaterialCommunityIcons name="eyedropper" size={16} color={COLORS.gold} />
                  </View>
                </View>
          
                <View style={styles.controlGroup}>
                  <Text style={styles.controlGroupTitle}>Opacity</Text>
                  <View style={styles.sliderRow}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0.2}
                      maximumValue={1}
                      value={opacity}
                      onValueChange={setOpacity}
                      minimumTrackTintColor={COLORS.gold}
                      maximumTrackTintColor={COLORS.divider}
                      thumbTintColor={COLORS.accent}
                    />
                    <Text style={styles.sliderValue}>{(opacity * 100).toFixed(0)}%</Text>
                  </View>
                </View>
              </ScrollView>
            );
            case 'ALIGN':
                return (
                  <View style={styles.controlsCenter}>
                    <View style={styles.alignmentCard}>
                      <Text style={[styles.controlGroupTitle, { textAlign: 'center', marginBottom: 20 }]}>
                        Positioning
                      </Text>
                      <View style={styles.segmentedControl}>
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <TouchableOpacity
                            key={align}
                            onPress={() => setTextAlign(align)}
                            style={[
                              styles.segmentBtn, 
                              textAlign === align && styles.segmentBtnActive
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={ALIGN_ICONS[align]}
                              size={24}
                              color={textAlign === align ? COLORS.bg : COLORS.textDim}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.alignHint}>
                        Aligning text {textAlign}
                      </Text>
                    </View>
                  </View>
                );
      case 'EFFECTS':
        return (
          <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlGroupTitle}>Background Blur</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderValue}>{blurIntensity.toFixed(0)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={blurIntensity}
                  onValueChange={setBlurIntensity}
                  minimumTrackTintColor={COLORS.gold}
                  maximumTrackTintColor={COLORS.divider}
                  thumbTintColor={COLORS.accent}
                />
              </View>
            </View>

            <View style={styles.controlGroup}>
              <Text style={styles.controlGroupTitle}>Text Shadow</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderValue}>{(shadowOpacity * 100).toFixed(0)}%</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={shadowOpacity}
                  onValueChange={setShadowOpacity}
                  minimumTrackTintColor={COLORS.gold}
                  maximumTrackTintColor={COLORS.divider}
                  thumbTintColor={COLORS.accent}
                />
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={onBack} style={styles.editorBackBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.editorTitle}>Customize</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={20} color={COLORS.bg} />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={[styles.canvasContainer, { flex: 1 }]}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          {renderBackground()}
        </ViewShot>
      </View>

      <Text style={styles.hintText}>
        <MaterialCommunityIcons name="gesture-tap-hold" size={14} color={COLORS.textDim} /> Drag
        text to reposition
      </Text>

      {/* Controls */}
      <View style={styles.controlsContainer}>{renderControls()}</View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <EditorTabButton
          icon="format-text"
          label="Text"
          isActive={activeTab === 'TEXT'}
          onPress={() => setActiveTab('TEXT')}
        />
        <EditorTabButton
          icon="palette"
          label="Color"
          isActive={activeTab === 'COLOR'}
          onPress={() => setActiveTab('COLOR')}
        />
        <EditorTabButton
          icon="format-align-center"
          label="Align"
          isActive={activeTab === 'ALIGN'}
          onPress={() => setActiveTab('ALIGN')}
        />
        <EditorTabButton
          icon="auto-fix"
          label="Effects"
          isActive={activeTab === 'EFFECTS'}
          onPress={() => setActiveTab('EFFECTS')}
        />
      </View>

      {/* Edit Modal */}
      <Modal visible={isEditing} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsEditing(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Message</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={28} color={COLORS.textDim} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Main Text (Arabic/Large)</Text>
            <TextInput
              value={mainText}
              onChangeText={setMainText}
              multiline
              style={[styles.modalInput, { fontFamily: 'Amiri_700Bold', textAlign: 'right', fontSize: 18 }]}
              placeholderTextColor={COLORS.textDim + '60'}
            />

            <Text style={styles.modalLabel}>Sub Text (English/Small)</Text>
            <TextInput
              value={subText}
              onChangeText={setSubText}
              multiline
              style={[styles.modalInput, { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 16 }]}
              placeholderTextColor={COLORS.textDim + '60'}
            />

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
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={isActive ? COLORS.bg : COLORS.textDim}
      />
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
    paddingTop: vs(Platform.OS === 'android' ? 20 : 12),
    paddingBottom: vs(18),
    paddingHorizontal: hs(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hs(15),
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  },

  headerTitle: {
    fontSize: moderateScale(isTablet ? 30 : 24),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  headerSubtitle: {
    fontSize: moderateScale(14),
    color: COLORS.textDim,
    marginTop: 4,
    fontFamily: 'PlayfairDisplay_400Regular',
  },

  decorativeLine: {
    height: 2,
    backgroundColor: COLORS.gold + '40',
    marginTop: vs(12),
    width: hs(60),
    borderRadius: 2,
  },

  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hs(15),
  },

  // ================= GREETINGS =================
  greetingsSection: {
    paddingHorizontal: hs(20),
  },

  sectionTitle: {
    fontSize: moderateScale(18),
    color: COLORS.text,
    marginBottom: vs(12),
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  greetingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: moderateScale(16),
    marginBottom: vs(12),
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
    fontSize: moderateScale(16),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  greetingMeaning: {
    fontSize: moderateScale(13),
    color: COLORS.textDim,
    marginTop: 4,
    fontFamily: 'PlayfairDisplay_400Regular',
  },

  greetingArabicContainer: {
    marginTop: vs(8),
    backgroundColor: COLORS.bgLight,
    padding: moderateScale(10),
    borderRadius: 10,
  },

  greetingArabic: {
    fontSize: moderateScale(isTablet ? 26 : 20),
    color: COLORS.gold,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'right',
  },

  // ================= BACKGROUND GRID =================
  gridItemWrapper: {
    flex: 1 / (isTablet ? 4 : 3),
    padding: 6,
  },

  gridItem: {
    aspectRatio: 1,
    borderRadius: 12,
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
    fontSize: moderateScale(12),
    color: COLORS.textDim,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  // ================= EDITOR =================
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hs(20),
    paddingVertical: vs(12),
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
    fontSize: moderateScale(18),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: 20,
  },

  shareBtnText: {
    color: COLORS.bg,
    fontSize: moderateScale(14),
    marginLeft: 6,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  // ================= CANVAS =================
  canvasContainer: {
    flex: 1,
    paddingHorizontal: hs(20),
    paddingVertical: vs(15),
    justifyContent: 'center',
  },

  canvasFrame: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: isTablet ? 550 : 420,
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
    marginBottom: vs(10),
  },

  subText: {
    marginTop: vs(6),
  },

  watermark: {
    position: 'absolute',
    bottom: moderateScale(12),
    right: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  watermarkText: {
    color: COLORS.beige,
    fontSize: moderateScale(10),
    marginLeft: 4,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  hintText: {
    textAlign: 'center',
    color: COLORS.textDim,
    fontSize: moderateScale(12),
    paddingVertical: vs(8),
    fontFamily: 'PlayfairDisplay_400Regular',
  },

  // ================= CONTROLS =================
  controlsContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.divider,
    flex: 0.5,
  },
  

  controlsScroll: {
    flex: 1,
    paddingHorizontal: hs(20),
    paddingTop: vs(12),
  },

  controlGroup: {
    marginBottom: vs(16),
  },

  controlGroupTitle: {
    fontSize: moderateScale(14),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: vs(8),
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sliderValue: {
    width: 50,
    fontSize: moderateScale(13),
    color: COLORS.gold,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  slider: {
    flex: 1,
  },

  fontChip: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: 14,
    backgroundColor: COLORS.bgLight,
    marginRight: 8,
  },

  fontChipActive: {
    borderWidth: 1,
    borderColor: COLORS.gold,
  },

  fontChipText: {
    color: COLORS.text,
    fontSize: moderateScale(13),
  },

  // ================= TAB BAR =================
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    paddingTop: vs(8),
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
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
    fontSize: moderateScale(10),
    color: COLORS.textDim,
    marginTop: 4,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: hs(20),
    paddingTop: vs(18),
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: screenHeight * 0.8,
  },

  modalTitle: {
    fontSize: moderateScale(20),
    color: COLORS.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },

  modalLabel: {
    fontSize: moderateScale(14),
    color: COLORS.textDim,
    marginTop: vs(12),
    marginBottom: vs(6),
  },

  modalInput: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: moderateScale(14),
    fontSize: moderateScale(15),
    color: COLORS.text,
    minHeight: vs(60),
  },

  modalDoneBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: vs(14),
    borderRadius: 14,
    alignItems: 'center',
    marginTop: vs(16),
  },

  modalDoneBtnText: {
    color: COLORS.bg,
    fontSize: moderateScale(15),
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  // ================= CUSTOM MESSAGE CARD =================
customCard: {
  margin: hs(20),
  padding: moderateScale(18),
  backgroundColor: COLORS.cardBg,
  borderRadius: moderateScale(18),
  borderWidth: 1,
  borderColor: COLORS.divider,
},

customCardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: vs(12),
},

customCardTitle: {
  fontSize: moderateScale(16),
  color: COLORS.text,
  marginLeft: 8,
  fontFamily: 'PlayfairDisplay_700Bold',
},

inputContainer: {
  marginBottom: vs(12),
},

inputLabel: {
  fontSize: moderateScale(13),
  color: COLORS.textDim,
  marginBottom: 6,
},

customInput: {
  backgroundColor: COLORS.bgLight,
  borderRadius: 12,
  padding: moderateScale(14),
  fontSize: moderateScale(15),
  color: COLORS.text,
  borderWidth: 1,
  borderColor: COLORS.divider,
},

customButton: {
  backgroundColor: COLORS.accent,
  paddingVertical: vs(12),
  borderRadius: 14,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: vs(6),
},

customButtonText: {
  color: COLORS.bg,
  fontSize: moderateScale(15),
  marginRight: 6,
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
  marginBottom: 6,
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
  marginTop: vs(8),
},

presetCircle: {
  width: moderateScale(32),
  height: moderateScale(32),
  borderRadius: moderateScale(16),
  marginRight: 10,
},

colorPickerWrapper: {
  height: isSmallDevice ? 150 : 180,
},

selectedColorDisplay: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.bgLight,
  padding: moderateScale(10),
  borderRadius: 12,
  marginTop: vs(10),
},

selectedColorBox: {
  width: moderateScale(26),
  height: moderateScale(26),
  borderRadius: 6,
  marginRight: 10,
},

selectedColorText: {
  color: COLORS.text,
  fontSize: moderateScale(13),
  flex: 1,
},

// ================= ALIGNMENT =================
controlsCenter: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: hs(20),
},

alignmentCard: {
  width: '100%',
  backgroundColor: COLORS.bgLight,
  padding: moderateScale(8),
  borderRadius: 16,
},

segmentedControl: {
  flexDirection: 'row',
  backgroundColor: COLORS.cardBg,
  borderRadius: 12,
  padding: 4,
},

segmentBtn: {
  flex: 1,
  height: moderateScale(44),
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 10,
},

segmentBtnActive: {
  backgroundColor: COLORS.accent,
},

alignHint: {
  textAlign: 'center',
  marginTop: vs(12),
  fontSize: moderateScale(12),
  color: COLORS.textDim,
},

// ================= MODAL HEADER =================
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: vs(16),
},

});