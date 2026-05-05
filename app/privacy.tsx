import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  PixelRatio,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Responsive Utilities ──────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const s  = (n: number) => (W / 375) * n;
const vs = (n: number) => (H / 812) * n;
const ms = (n: number, f = 0.45) => n + (s(n) - n) * f;
const norm = (n: number) => Math.round(PixelRatio.roundToNearestPixel(ms(n)));
const wp = (p: number) => Math.round((p * W) / 100);

// ─────────────────────────────────────────────────────

interface Section {
  icon: string;
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    icon: 'database-lock-outline',
    title: 'What We Collect',
    body: 'We collect only what is necessary: your first name, email address, and encrypted password to create and maintain your account. We do not collect usage analytics, location data, or any personally identifiable information beyond what is needed to operate the service.',
  },
  {
    icon: 'shield-lock-outline',
    title: 'How We Protect It',
    body: 'Your password is hashed using bcrypt with a secure salt before being stored. All data is hosted on AWS RDS in encrypted storage. We use HTTPS/TLS for all data in transit. We do not store plaintext passwords at any point.',
  },
  {
    icon: 'account-off-outline',
    title: 'Third-Party Sharing',
    body: 'We do not sell, rent, or share your personal data with any third party for advertising or commercial purposes. We use no tracking SDKs, analytics platforms, or social sign-in providers that harvest your data.',
  },
  {
    icon: 'quran',
    title: 'Quran Audio & Content',
    body: 'All Quran text and audio is fetched from public APIs (alquran.cloud, cdn.islamic.network). No personal data is sent to these services — they return content based only on surah and ayah numbers.',
  },
  {
    icon: 'account-edit-outline',
    title: 'Your Rights',
    body: 'You have the right to access, correct, or permanently delete your account and all associated data at any time. Navigate to Profile → Delete Account to erase everything. Deletion is irreversible and takes effect immediately.',
  },
  {
    icon: 'email-outline',
    title: 'Contact Us',
    body: 'For any privacy-related questions or concerns, please reach us at privacy@qalb-e-rooh.app. We aim to respond within 48 hours.',
  },
];

// ─────────────────────────────────────────────────────
export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={['#052E2E', '#0A4A4A']}
        style={[styles.header, { paddingTop: insets.top + vs(10) }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={s(22)} color="rgba(159,240,208,0.85)" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconRing}>
            <MaterialCommunityIcons name="shield-check" size={s(22)} color="#9FF0D0" />
          </View>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSub}>Last updated: April 2025</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, vs(32)) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            At <Text style={styles.introHighlight}>Qalb-E-Rooh</Text>, your trust is sacred to us — just like the content we serve. This policy explains clearly what data we hold, why we hold it, and how it is protected.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((sec, idx) => (
          <View key={idx} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <MaterialCommunityIcons name={sec.icon as any} size={s(19)} color="#0A4A4A" />
              </View>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        {/* Footer chip */}
        <View style={styles.footerChip}>
          <MaterialCommunityIcons name="heart-outline" size={s(14)} color="#5ABFA0" />
          <Text style={styles.footerChipText}>Made with care for the Muslim community</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F0FDF8' },

  header: {
    paddingHorizontal: wp(5),
    paddingBottom: vs(28),
  },
  backBtn: { marginBottom: vs(12) },
  headerCenter: { alignItems: 'center' },
  headerIconRing: {
    width: s(52), height: s(52), borderRadius: s(26),
    backgroundColor: 'rgba(159,240,208,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(159,240,208,0.3)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(10),
  },
  headerTitle: { fontSize: norm(22), fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: norm(12), color: 'rgba(159,240,208,0.6)', marginTop: vs(4) },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: wp(5), paddingTop: vs(20), gap: vs(12) },

  introCard: {
    backgroundColor: '#fff',
    borderRadius: s(18),
    padding: s(18),
    borderLeftWidth: 4, borderLeftColor: '#0A4A4A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.07, shadowRadius: s(8), elevation: 3,
  },
  introText: { fontSize: norm(14), color: '#2F4F4F', lineHeight: norm(22) },
  introHighlight: { fontWeight: '800', color: '#0A4A4A' },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: s(18),
    padding: s(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.06, shadowRadius: s(6), elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginBottom: vs(10) },
  sectionIconWrap: {
    width: s(36), height: s(36), borderRadius: s(10),
    backgroundColor: '#E8F5F0',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: norm(14), fontWeight: '800', color: '#0A3A3A', flex: 1 },
  sectionBody:  { fontSize: norm(13), color: '#4A6868', lineHeight: norm(21) },

  footerChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: s(6), marginTop: vs(8), marginBottom: vs(4),
  },
  footerChipText: { fontSize: norm(12), color: '#5ABFA0', fontWeight: '600' },
});