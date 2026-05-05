import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PixelRatio,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// ==========================================
// RESPONSIVE UTILITIES
// ==========================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375; // iPhone X standard
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const normalize = (size: number) => Math.round(PixelRatio.roundToNearestPixel(moderateScale(size)));
const wp = (percentage: number) => Math.round((percentage * SCREEN_WIDTH) / 100);

// ==========================================
// TYPES
// ==========================================
type EmotionKey = 
  | 'sad' | 'guilty' | 'anxious' | 'alone' | 'angry' 
  | 'lost' | 'grateful' | 'hopeful' | 'overwhelmed' 
  | 'heartbroken' | 'unmotivated' | 'insecure' | 'doubtful'
  | 'impatient' | 'weak' | 'scared' | 'jealous' | 'confused'
  | 'ashamed' | 'exhausted' | 'betrayed' | 'unloved' | 'numb'
  | 'desperate' | 'apathetic' | 'arrogant' | 'peaceful';

interface EmotionData {
  key: EmotionKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

interface ReflectionContent {
  comfortText: string;
  allahName: { name: string; arabic: string; meaning: string };
  quran: { verse: string; text: string };
  hadith: { source: string; text: string };
  color: string;
}

// ==========================================
// DATA: 27 EMOTIONAL STATES
// ==========================================
const EMOTIONS: EmotionData[] = [
  { key: 'sad', label: 'Sad', icon: 'cloud-rain' },
  { key: 'guilty', label: 'Guilty', icon: 'corner-down-left' },
  { key: 'anxious', label: 'Anxious', icon: 'wind' },
  { key: 'alone', label: 'Alone', icon: 'user' },
  { key: 'angry', label: 'Angry', icon: 'zap' },
  { key: 'lost', label: 'Lost', icon: 'map' },
  { key: 'grateful', label: 'Grateful', icon: 'sun' },
  { key: 'hopeful', label: 'Hopeful', icon: 'star' },
  { key: 'overwhelmed', label: 'Overwhelmed', icon: 'layers' },
  { key: 'heartbroken', label: 'Heartbroken', icon: 'frown' },
  { key: 'unmotivated', label: 'Unmotivated', icon: 'pause-circle' },
  { key: 'insecure', label: 'Insecure', icon: 'eye-off' },
  { key: 'doubtful', label: 'Doubtful', icon: 'help-circle' },
  { key: 'impatient', label: 'Impatient', icon: 'clock' },
  { key: 'weak', label: 'Weak', icon: 'feather' },
  { key: 'scared', label: 'Scared', icon: 'alert-triangle' },
  { key: 'jealous', label: 'Jealous', icon: 'eye' },
  { key: 'confused', label: 'Confused', icon: 'shuffle' },
  { key: 'ashamed', label: 'Ashamed', icon: 'shield-off' },
  { key: 'exhausted', label: 'Exhausted', icon: 'battery' },
  { key: 'betrayed', label: 'Betrayed', icon: 'scissors' },
  { key: 'unloved', label: 'Unloved', icon: 'cloud' },
  { key: 'numb', label: 'Numb', icon: 'minus-circle' },
  { key: 'desperate', label: 'Desperate', icon: 'anchor' },
  { key: 'apathetic', label: 'Apathetic', icon: 'meh' },
  { key: 'arrogant', label: 'Proud/Arrogant', icon: 'arrow-up-circle' },
  { key: 'peaceful', label: 'Peaceful', icon: 'smile' },
];

const REFLECTION_DATA: Record<EmotionKey, ReflectionContent> = {
  sad: { 
    comfortText: "It is okay to feel heavy right now. Tears are a mercy, and your Lord sees every single one.",
    allahName: { name: 'Ar-Rahman', arabic: 'الرَّحْمَٰن', meaning: "The Most Merciful. His mercy encompasses your pain." },
    quran: { verse: "Ad-Duha 93:3", text: "Your Lord has not taken leave of you, nor has He detested [you]." },
    hadith: { source: "Sahih al-Bukhari", text: "No sadness or hurt befalls a Muslim... but that Allah expiates some of his sins for that." },
    color: '#1A5F5F' 
  },
  guilty: { 
    comfortText: "Shame tells you to hide, but your Lord invites you to return. No sin is greater than His capacity to forgive.",
    allahName: { name: 'Al-Ghafoor', arabic: 'الْغَفُور', meaning: 'The Much-Forgiving. Your sins are finite, His forgiveness is infinite.' },
    quran: { verse: "Az-Zumar 39:53", text: "Do not despair of the mercy of Allah. Indeed, Allah forgives all sins." },
    hadith: { source: "Sahih Muslim", text: "If you did not sin, Allah would replace you with people who would sin and seek forgiveness." },
    color: '#155555' 
  },
  anxious: { 
    comfortText: "Take a deep breath. The future you are worrying about is in the hands of the One who controls all outcomes.",
    allahName: { name: 'Al-Wakeel', arabic: 'الْوَكِيل', meaning: 'The Disposer of Affairs. He is handling what you cannot.' },
    quran: { verse: "At-Tawbah 9:40", text: "Do not grieve; indeed Allah is with us." },
    hadith: { source: "Sunan At-Tirmidhi", text: "Tie your camel and place your trust in Allah." },
    color: '#0E6B6B' 
  },
  alone: { 
    comfortText: "Even when the world feels empty, you are accompanied by the One who created you.",
    allahName: { name: 'Al-Wali', arabic: 'الْوَلِيّ', meaning: 'The Protecting Friend. You are never walking through life alone.' },
    quran: { verse: "Qaf 50:16", text: "We are closer to him than [his] jugular vein." },
    hadith: { source: "Sahih al-Bukhari", text: "I am with My slave when he remembers Me." },
    color: '#156565' 
  },
  angry: { 
    comfortText: "Your feelings are valid, but let them pass like a storm. Find your calm in His remembrance.",
    allahName: { name: 'Al-Haleem', arabic: 'الْحَلِيم', meaning: 'The Forbearing. He gives respite and does not hasten to punish.' },
    quran: { verse: "Aal-E-Imran 3:134", text: "Those who restrain anger and pardon people - Allah loves the doers of good." },
    hadith: { source: "Sahih al-Bukhari", text: "The strong is the one who controls himself while in anger." },
    color: '#0A5555' 
  },
  lost: { 
    comfortText: "Wandering is part of the journey. You are not forsaken; you are simply being redirected.",
    allahName: { name: 'An-Noor', arabic: 'النُّور', meaning: 'The Light. He guides hearts through the deepest darkness.' },
    quran: { verse: "Ad-Duha 93:7", text: "And He found you lost and guided [you]." },
    hadith: { source: "Sahih Muslim", text: "O Allah, place light in my heart, and on my tongue light..." },
    color: '#1D7070' 
  },
  grateful: { 
    comfortText: "Alhamdulillah. Acknowledging the good multiplies the blessings in your life.",
    allahName: { name: 'Ash-Shakoor', arabic: 'الشَّكُور', meaning: 'The Appreciative. He rewards even the smallest amount of good.' },
    quran: { verse: "Ibrahim 14:7", text: "If you are grateful, I will surely increase you [in favor]." },
    hadith: { source: "Sunan Abu Dawud", text: "He who does not thank the people is not thankful to Allah." },
    color: '#0F5050' 
  },
  hopeful: { 
    comfortText: "Hold onto that light. Good expectations of Allah bring about beautiful realities.",
    allahName: { name: 'Al-Fattah', arabic: 'الْفَتَّاح', meaning: 'The Opener. He opens doors when you see only solid walls.' },
    quran: { verse: "Ash-Sharh 94:5-6", text: "Indeed, with hardship [will be] ease." },
    hadith: { source: "Musnad Ahmad", text: "Victory comes with patience, relief with affliction, and ease with hardship." },
    color: '#196969' 
  },
  overwhelmed: {
    comfortText: "You do not have to figure it all out today. Take it one step at a time, He is with you.",
    allahName: { name: 'Al-Muqeet', arabic: 'الْمُقِيت', meaning: 'The Sustainer. He provides exact nourishment for what you face.' },
    quran: { verse: "Al-Baqarah 2:286", text: "Allah does not charge a soul except [with that within] its capacity." },
    hadith: { source: "Sahih al-Bukhari", text: "Make things easy for the people, and do not make it difficult." },
    color: '#125454'
  },
  heartbroken: {
    comfortText: "Hearts shatter so they can be rebuilt stronger, filled entirely with His light.",
    allahName: { name: 'Al-Jabbar', arabic: 'الْجَبَّار', meaning: 'The Mender. He fixes what is broken and binds the wounds of the heart.' },
    quran: { verse: "Al-Anbiya 21:83", text: "Indeed, adversity has touched me, and you are the Most Merciful of the merciful." },
    hadith: { source: "Sunan Ibn Majah", text: "O Allah, forgive me, have mercy on me, guide me, heal me, and provide for me." },
    color: '#1E6666'
  },
  unmotivated: {
    comfortText: "Rest if you must, but do not quit. Even the smallest sincere effort is seen and rewarded.",
    allahName: { name: 'Al-Qawiyy', arabic: 'الْقَوِيّ', meaning: 'The Possessor of All Strength. All energy flows from Him.' },
    quran: { verse: "Al-Kahf 18:39", text: "There is no power except in Allah." },
    hadith: { source: "Sahih Muslim", text: "Seek help from Allah and do not lose heart." },
    color: '#165E5E'
  },
  insecure: {
    comfortText: "You were crafted with intention. Your worth is determined by your Creator, not creation.",
    allahName: { name: 'Al-Musawwir', arabic: 'الْمُصَوِّر', meaning: 'The Fashioner. He designed you intentionally and perfectly.' },
    quran: { verse: "At-Tin 95:4", text: "We have certainly created man in the best of stature." },
    hadith: { source: "Sahih Muslim", text: "Allah does not look at your appearance... He looks at your hearts." },
    color: '#0D5959'
  },
  doubtful: {
    comfortText: "Questions are often the seeds of deeper faith. Seek the truth gently, and He will guide your heart.",
    allahName: { name: 'Al-Haqq', arabic: 'الْحَقّ', meaning: 'The Absolute Truth. He is the anchor when reality feels uncertain.' },
    quran: { verse: "Yunus 10:32", text: "For that is Allah, your Lord, the Truth. And what can be beyond truth except error?" },
    hadith: { source: "Sahih Muslim", text: "Leave that which makes you doubt for that which does not make you doubt." },
    color: '#1A6B61'
  },
  impatient: {
    comfortText: "Beautiful things take time. Trust His timing, for it is always better than your own.",
    allahName: { name: 'As-Sabur', arabic: 'الصَّبُور', meaning: 'The Patient One. He delays things for their perfect appointed time.' },
    quran: { verse: "Al-Baqarah 2:153", text: "Indeed, Allah is with the patient." },
    hadith: { source: "Sahih al-Bukhari", text: "Whoever tries to be patient, Allah will make him patient." },
    color: '#145A5A'
  },
  weak: {
    comfortText: "In your weakness lies the perfect opportunity to rely completely on His ultimate strength.",
    allahName: { name: 'Al-Mateen', arabic: 'الْمَتِين', meaning: 'The Firm. You can lean on His unbreakable strength.' },
    quran: { verse: "Ar-Rum 30:54", text: "Allah is the one who created you from weakness, then made after weakness strength." },
    hadith: { source: "Sahih al-Bukhari", text: "There is no might and no power except with Allah." },
    color: '#114F4F'
  },
  scared: {
    comfortText: "Fear is a human reaction, but courage is trusting that Allah's protection is greater than any threat.",
    allahName: { name: 'Al-Hafiz', arabic: 'الْحَفِيظ', meaning: 'The Protector. Nothing can harm you without His permission.' },
    quran: { verse: "Ghafir 40:44", text: "And I entrust my affair to Allah. Indeed, Allah is Seeing of [His] servants." },
    hadith: { source: "Sunan At-Tirmidhi", text: "Be mindful of Allah, and you will find Him in front of you." },
    color: '#0F6060'
  },
  jealous: {
    comfortText: "Count your own blessings. What is meant for you will never miss you.",
    allahName: { name: 'Al-Ghani', arabic: 'الْغَنِيّ', meaning: 'The Self-Sufficient. He provides endlessly from His limitless treasures.' },
    quran: { verse: "An-Nisa 4:32", text: "And do not wish for that by which Allah has made some of you exceed others." },
    hadith: { source: "Sunan Abu Dawud", text: "Beware of jealousy, for jealousy consumes good deeds just as fire consumes wood." },
    color: '#0B5151'
  },
  confused: {
    comfortText: "When the path is blurry, trust the Guide. Clarity will come when the time is right.",
    allahName: { name: 'Al-Aleem', arabic: 'الْعَلِيم', meaning: 'The All-Knowing. He sees the entire puzzle while you only hold one piece.' },
    quran: { verse: "Al-Baqarah 2:216", text: "But perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you." },
    hadith: { source: "Sahih al-Bukhari", text: "(Istikhara Dua) O Allah, I seek Your guidance by virtue of Your knowledge..." },
    color: '#1C6969'
  },
  ashamed: {
    comfortText: "Your past does not define you. A sincere return wipes the slate completely clean.",
    allahName: { name: 'Al-Ghaffar', arabic: 'الْغَفَّار', meaning: 'The Repeatedly Forgiving. He covers your flaws and forgives continuously.' },
    quran: { verse: "Ta-Ha 20:82", text: "But indeed, I am the Perpetual Forgiver of whoever repents and believes." },
    hadith: { source: "Sahih Muslim", text: "A slave committed a sin and said: 'O Allah, forgive me my sin.' Allah said: 'My slave knows he has a Lord... I have forgiven him.'" },
    color: '#165757'
  },
  exhausted: {
    comfortText: "Close your eyes and seek rest. He sustains the universe, and He will sustain you.",
    allahName: { name: 'Al-Hayy', arabic: 'الْحَيّ', meaning: 'The Ever-Living. He never tires and sustains your life every second.' },
    quran: { verse: "Al-Baqarah 2:255", text: "Neither drowsiness overtakes Him nor sleep." },
    hadith: { source: "Sahih al-Bukhari", text: "O Ever-Living, O Sustainer, in Your Mercy I seek relief." },
    color: '#0D4D4D'
  },
  betrayed: {
    comfortText: "People may break their promises, but the promises of your Lord are forever true.",
    allahName: { name: 'Al-Baseer', arabic: 'الْبَصِير', meaning: 'The All-Seeing. He witnesses the injustices done to you.' },
    quran: { verse: "Al-Anfal 8:30", text: "But they plan, and Allah plans. And Allah is the best of planners." },
    hadith: { source: "Sahih Muslim", text: "Beware of the supplication of the oppressed, for there is no barrier between it and Allah." },
    color: '#1B6363'
  },
  unloved: {
    comfortText: "You are deeply, profoundly loved by the One who breathed life into your soul.",
    allahName: { name: 'Al-Wadud', arabic: 'الْوَدُود', meaning: 'The Most Loving. His love for you is purer than a mother\'s love.' },
    quran: { verse: "Hud 11:90", text: "Indeed, my Lord is Merciful and Affectionate." },
    hadith: { source: "Sahih al-Bukhari", text: "When Allah loves a servant, He calls Gabriel and says: 'I love so-and-so, so love him.'" },
    color: '#216F6F'
  },
  numb: {
    comfortText: "When you can't feel anything, just whisper His name. The thaw will come slowly.",
    allahName: { name: 'Al-Muhyi', arabic: 'الْمُحْيِي', meaning: 'The Giver of Life. He brings dead earth to life, and can revive a dead heart.' },
    quran: { verse: "Al-Hadid 57:17", text: "Know that Allah gives life to the earth after its lifelessness." },
    hadith: { source: "Sahih Muslim", text: "O Allah, Turner of the hearts, keep my heart firm upon Your religion." },
    color: '#135858'
  },
  desperate: {
    comfortText: "When all doors seem closed, remember He is the ultimate Opener of ways.",
    allahName: { name: 'Al-Mujeeb', arabic: 'الْمُجِيب', meaning: 'The Responsive. He is listening closely and waiting for your call.' },
    quran: { verse: "Ghafir 40:60", text: "Call upon Me; I will respond to you." },
    hadith: { source: "Sunan At-Tirmidhi", text: "Your Lord is Munificent and Generous, and is ashamed to turn away empty the hands of His servant." },
    color: '#0F6565'
  },
  apathetic: {
    comfortText: "It's okay to feel disconnected sometimes. A single sincere prayer can spark the flame again.",
    allahName: { name: 'Al-Ba\'ith', arabic: 'الْبَاعِث', meaning: 'The Resurrector. He awakens the soul from its slumber.' },
    quran: { verse: "Al-Anfal 8:24", text: "Respond to Allah and to the Messenger when he calls you to that which gives you life." },
    hadith: { source: "Sahih Muslim", text: "The difference between the one who remembers his Lord and the one who does not is like the living and the dead." },
    color: '#165C5C'
  },
  arrogant: {
    comfortText: "Humility brings us closer to the earth we were made from, and closer to the Heavens.",
    allahName: { name: 'Al-Kabeer', arabic: 'الْكَبِير', meaning: 'The Greatest. Remembering His greatness brings the ego back to reality.' },
    quran: { verse: "Luqman 31:18", text: "And do not turn your cheek [in contempt] toward people and do not walk through the earth exultantly." },
    hadith: { source: "Sahih Muslim", text: "He who has in his heart the weight of a mustard seed of pride shall not enter Paradise." },
    color: '#0E5252'
  },
  peaceful: {
    comfortText: "Breathe in this tranquility. It is a glimpse of the ultimate peace He promises.",
    allahName: { name: 'As-Salam', arabic: 'السَّلَام', meaning: 'The Source of Peace. True tranquility is only found in Him.' },
    quran: { verse: "Ar-Ra'd 13:28", text: "Unquestionably, by the remembrance of Allah hearts are assured." },
    hadith: { source: "Sahih Muslim", text: "O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of majesty and honor." },
    color: '#186868'
  }
};

// ==========================================
// MEMOIZED COMPONENTS (Performance Optimization)
// ==========================================
const EmotionChip = memo(({ 
  emotion, 
  isSelected, 
  onSelect 
}: { 
  emotion: EmotionData; 
  isSelected: boolean; 
  onSelect: (key: EmotionKey) => void 
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityState={{ selected: isSelected }}
    accessibilityLabel={`Select emotion: ${emotion.label}`}
    style={[styles.emotionChip, isSelected && styles.emotionChipSelected]}
    onPress={() => onSelect(emotion.key)}
    activeOpacity={0.7}
  >
    <Feather 
      name={emotion.icon} 
      size={normalize(15)} 
      color={isSelected ? '#0A4A4A' : '#9BB8B8'} 
    />
    <Text style={[styles.emotionLabel, isSelected && styles.emotionLabelSelected]}>
      {emotion.label}
    </Text>
  </TouchableOpacity>
));

// ==========================================
// ROOT WRAPPER
// ==========================================
export default function AppWrapper() {
  return (
    <SafeAreaProvider>
      <QalbReflection />
    </SafeAreaProvider>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
function QalbReflection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentView, setCurrentView] = useState<'home' | 'reflect'>('home');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [currentView]);

  useEffect(() => {
    if (selectedEmotion) {
      contentFade.setValue(0);
      Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      
      // Auto-scroll slightly to show content when an emotion is clicked
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: verticalScale(200), animated: true });
      }, 100);
    }
  }, [selectedEmotion]);

  const handleSelectEmotion = (key: EmotionKey) => {
    setSelectedEmotion(key);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedEmotion(null);
  };

  // --- RENDER FUNCTIONS ---
  const renderHome = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(16) }]}>
        <View style={styles.headerPattern} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.headerBackButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="chevron-back" size={normalize(24)} color={'#FFFFFF'} />
          </TouchableOpacity>
          <View style={styles.crescentContainer}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={normalize(32)} color="#9FF0D0" />
          </View>
        </View>
        <Text style={styles.headerTitle}>Qalb Reflection</Text>
        <Text style={styles.headerSubtitle}>Find peace in His words</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.quoteSection}>
          <View style={styles.ornamentLeft} />
          <Text style={styles.quote}>"Verily, in the remembrance of Allah do hearts find rest"</Text>
          <Text style={styles.quoteRef}>— Ar-Ra'd 13:28</Text>
          <View style={styles.ornamentRight} />
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.primaryCard]} 
            onPress={() => setCurrentView('reflect')} 
            activeOpacity={0.88}
          >
            <View style={styles.cardIcon}>
              <Feather name="compass" size={normalize(26)} color="#0A4A4A" />
            </View>
            <Text style={styles.cardTitle}>Begin Reflection</Text>
            <Text style={styles.cardSubtitle}>How is your heart feeling today?</Text>
            <View style={styles.cardAccent} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderReflect = () => {
    const activeData = selectedEmotion ? REFLECTION_DATA[selectedEmotion] : null;

    return (
      <View style={styles.container}>
        <View style={[styles.entryHeader, { paddingTop: insets.top + verticalScale(12) }]}>
          <TouchableOpacity 
            onPress={handleBackToHome} 
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Feather name="arrow-left" size={normalize(24)} color="#9FF0D0" />
          </TouchableOpacity>
          <Text style={styles.entryHeaderTitle}>My Heart Right Now</Text>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select what you are feeling ({EMOTIONS.length}):</Text>
            <View style={styles.emotionGrid}>
              {EMOTIONS.map((emotion) => (
                <EmotionChip 
                  key={emotion.key} 
                  emotion={emotion} 
                  isSelected={selectedEmotion === emotion.key}
                  onSelect={handleSelectEmotion}
                />
              ))}
            </View>
          </View>

          {activeData && (
            <Animated.View style={{ opacity: contentFade, paddingHorizontal: wp(5), marginTop: verticalScale(24) }}>
              
              {/* NEW: COMFORT MESSAGE CARD */}
              <View style={styles.comfortCard}>
                <MaterialCommunityIcons name="heart-pulse" size={normalize(20)} color="#9FF0D0" style={styles.comfortIcon} />
                <Text style={styles.comfortText}>"{activeData.comfortText}"</Text>
              </View>

              {/* ALLAH'S NAME CARD */}
              <View style={[styles.contentCard, { backgroundColor: activeData.color }]}>
                <View style={styles.cardOrnamentTop} />
                <Text style={styles.cardSectionLabel}>ATTRIBUTES OF ALLAH</Text>
                <Text style={styles.arabicText}>{activeData.allahName.arabic}</Text>
                <Text style={styles.englishTitle}>{activeData.allahName.name}</Text>
                <View style={styles.divider} />
                <Text style={styles.meaningText}>{activeData.allahName.meaning}</Text>
              </View>

              {/* QURAN VERSE CARD */}
              <View style={[styles.contentCard, styles.quranCard]}>
                <View style={styles.iconRow}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={normalize(18)} color="#9FF0D0" />
                  <Text style={styles.cardSectionLabel}>FROM THE QURAN</Text>
                </View>
                <Text style={styles.mainContentText}>"{activeData.quran.text}"</Text>
                <Text style={styles.sourceText}>— {activeData.quran.verse}</Text>
              </View>

              {/* HADITH CARD */}
              <View style={[styles.contentCard, styles.hadithCard]}>
                <View style={styles.iconRow}>
                  <MaterialCommunityIcons name="comment-quote-outline" size={normalize(18)} color="#9FF0D0" />
                  <Text style={styles.cardSectionLabel}>FROM THE SUNNAH</Text>
                </View>
                <Text style={styles.mainContentText}>"{activeData.hadith.text}"</Text>
                <Text style={styles.sourceText}>— {activeData.hadith.source}</Text>
              </View>

            </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {currentView === 'home' && renderHome()}
      {currentView === 'reflect' && renderReflect()}
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#052E2E' },
  container: { flex: 1, backgroundColor: '#052E2E' },
  scrollContent: { paddingBottom: 40 },

  // HOME HEADER
  header: {
    paddingBottom: verticalScale(24),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(159, 240, 208, 0.1)',
    backgroundColor: '#052E2E',
    zIndex: 10,
  },
  headerPattern: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
    backgroundColor: 'rgba(10, 74, 74, 0.5)',
    borderBottomLeftRadius: scale(60), borderBottomRightRadius: scale(60),
  },
  headerTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', marginBottom: verticalScale(12), paddingHorizontal: wp(5),
  },
  headerBackButton: { position: 'absolute', left: wp(5), zIndex: 10 },
  crescentContainer: { opacity: 0.9 },
  headerTitle: { fontSize: normalize(28), fontWeight: '800', color: '#fff', letterSpacing: 1 },
  headerSubtitle: { fontSize: normalize(14), color: 'rgba(159,240,208,0.65)', marginTop: verticalScale(4), fontStyle: 'italic' },

  // QUOTE & CARDS
  quoteSection: {
    marginTop: verticalScale(32), marginHorizontal: wp(6), paddingVertical: verticalScale(24),
    paddingHorizontal: wp(5), backgroundColor: 'rgba(10, 74, 74, 0.3)', borderRadius: scale(16),
    borderWidth: 1, borderColor: 'rgba(159, 240, 208, 0.15)',
  },
  ornamentLeft: { position: 'absolute', top: 12, left: 12, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#9FF0D0', opacity: 0.4 },
  ornamentRight: { position: 'absolute', bottom: 12, right: 12, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#9FF0D0', opacity: 0.4 },
  quote: { fontSize: normalize(15), color: '#fff', textAlign: 'center', lineHeight: normalize(24), fontStyle: 'italic' },
  quoteRef: { fontSize: normalize(12), color: '#9BB8B8', textAlign: 'center', marginTop: verticalScale(12) },
  
  cardContainer: { marginTop: verticalScale(32), paddingHorizontal: wp(5) },
  actionCard: { padding: scale(24), borderRadius: scale(20), marginBottom: verticalScale(16), position: 'relative', overflow: 'hidden' },
  primaryCard: { backgroundColor: '#F0FDF8', borderWidth: 1, borderColor: '#D1F0E8' },
  cardIcon: { marginBottom: verticalScale(12) },
  cardTitle: { fontSize: normalize(22), fontWeight: '800', color: '#0A4A4A', marginBottom: 4 },
  cardSubtitle: { fontSize: normalize(13), color: '#4A7070' },
  cardAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: '#1A7A6A' },

  // REFLECT SCREEN
  entryHeader: {
    paddingBottom: verticalScale(16), paddingHorizontal: wp(5),
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(159, 240, 208, 0.1)',
    backgroundColor: '#052E2E',
    zIndex: 10,
  },
  backButton: { marginRight: wp(4) },
  entryHeaderTitle: { fontSize: normalize(20), fontWeight: '700', color: '#fff', flex: 1 },
  
  section: { marginTop: verticalScale(20), paddingHorizontal: wp(5) },
  sectionTitle: { fontSize: normalize(12), fontWeight: '700', color: '#9BB8B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: verticalScale(16) },
  
  emotionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  emotionChip: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: verticalScale(10), paddingHorizontal: scale(14), 
    backgroundColor: 'rgba(10, 74, 74, 0.4)', 
    borderRadius: scale(14), gap: scale(6),
    borderWidth: 1, borderColor: 'rgba(159, 240, 208, 0.1)'
  },
  emotionChipSelected: { backgroundColor: '#9FF0D0', borderColor: '#9FF0D0' },
  emotionLabel: { fontSize: normalize(13), fontWeight: '600', color: '#C8E0DC' },
  emotionLabelSelected: { color: '#0A4A4A' },

  // CONTENT CARDS
  comfortCard: {
    backgroundColor: 'rgba(159, 240, 208, 0.1)',
    padding: scale(18),
    borderRadius: scale(16),
    marginBottom: verticalScale(16),
    borderLeftWidth: 4,
    borderLeftColor: '#9FF0D0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12)
  },
  comfortIcon: { marginTop: 2 },
  comfortText: { flex: 1, fontSize: normalize(15), color: '#C8E0DC', fontStyle: 'italic', lineHeight: normalize(22) },

  contentCard: {
    marginBottom: verticalScale(16), padding: scale(22),
    borderRadius: scale(20), borderWidth: 1, borderColor: 'rgba(159,240,208,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  quranCard: { backgroundColor: '#0A4A4A' },
  hadithCard: { backgroundColor: '#073B3B' },
  
  cardOrnamentTop: { position: 'absolute', top: 0, left: '50%', transform: [{ translateX: -30 }], width: 60, height: 4, backgroundColor: '#9FF0D0', opacity: 0.8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: verticalScale(16) },
  cardSectionLabel: { fontSize: normalize(11), fontWeight: '700', color: '#9BB8B8', textTransform: 'uppercase', letterSpacing: 1.2 },
  
  arabicText: { fontSize: normalize(36), fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: verticalScale(12), marginBottom: verticalScale(8) },
  englishTitle: { fontSize: normalize(18), fontWeight: '800', color: '#9FF0D0', textAlign: 'center', marginBottom: verticalScale(16) },
  divider: { alignSelf: 'center', width: scale(40), height: 2, backgroundColor: '#9FF0D0', opacity: 0.3, marginBottom: verticalScale(16) },
  meaningText: { fontSize: normalize(14), color: '#C8E0DC', textAlign: 'center', lineHeight: normalize(22) },

  mainContentText: { fontSize: normalize(16), color: '#fff', lineHeight: normalize(24), fontStyle: 'italic', marginBottom: verticalScale(16) },
  sourceText: { fontSize: normalize(13), color: '#9FF0D0', fontWeight: '600', textAlign: 'right' }
});