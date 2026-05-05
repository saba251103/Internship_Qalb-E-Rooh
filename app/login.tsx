import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  PixelRatio,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loginUser } from './services/authService';

// ── Responsive Utilities ──────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const s  = (n: number) => (W / 375) * n;
const vs = (n: number) => (H / 812) * n;
const ms = (n: number, f = 0.45) => n + (s(n) - n) * f;
const norm = (n: number) => Math.round(PixelRatio.roundToNearestPixel(ms(n)));
const wp = (p: number) => Math.round((p * W) / 100);

// ─────────────────────────────────────────────────────
export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const passRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginUser(cleanEmail, password);
      router.replace('/(tabs)');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#052E2E', '#0A4A4A', '#0D5C5C']} style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Decorative arcs */}
      <View style={styles.arcTop} />
      <View style={styles.arcBottom} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + vs(20), paddingBottom: insets.bottom + vs(20) }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandBlock}>
            <View style={styles.logoRing}>
              <Text style={styles.logoGlyph}>ق</Text>
            </View>
            <Text style={styles.appName}>Qalb-E-Rooh</Text>
            <Text style={styles.tagline}>Return to what your heart knows.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to continue your journey</Text>

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorMsg}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={[styles.inputWrap, error && !email && styles.inputWrapErr]}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9BB8B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  onSubmitEditing={() => passRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrap, error && !password && styles.inputWrapErr]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={passRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9BB8B8"
                  secureTextEntry={!showPass}
                  autoComplete="password"
                  returnKeyType="done"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.inputIcon}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#1A7A6A', '#0A5A4A']} style={styles.ctaGradient}>
                {loading
                  ? <ActivityIndicator color="#9FF0D0" size="small" />
                  : <Text style={styles.ctaText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or</Text>
              <View style={styles.divLine} />
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerBtnText}>Create an Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legalNote}>
            By signing in, you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const CARD_RADIUS = s(28);

const styles = StyleSheet.create({
  root: { flex: 1 },

  arcTop: {
    position: 'absolute', top: -H * 0.12, right: -W * 0.3,
    width: W * 0.9, height: W * 0.9,
    borderRadius: W * 0.45,
    backgroundColor: 'rgba(159,240,208,0.06)',
    pointerEvents: 'none',
  },
  arcBottom: {
    position: 'absolute', bottom: -H * 0.1, left: -W * 0.4,
    width: W * 1.1, height: W * 1.1,
    borderRadius: W * 0.55,
    backgroundColor: 'rgba(159,240,208,0.04)',
    pointerEvents: 'none',
  },

  scroll: { flexGrow: 1, paddingHorizontal: wp(6), justifyContent: 'center' },

  // Brand
  brandBlock: { alignItems: 'center', marginBottom: vs(36) },
  logoRing: {
    width: s(72), height: s(72), borderRadius: s(36),
    backgroundColor: 'rgba(159,240,208,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(159,240,208,0.35)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(12),
  },
  logoGlyph: { fontSize: norm(32), color: '#9FF0D0' },
  appName:  { fontSize: norm(26), fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline:  { fontSize: norm(13), color: 'rgba(159,240,208,0.7)', marginTop: vs(4) },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: s(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(12) },
    shadowOpacity: 0.18,
    shadowRadius: s(20),
    elevation: 12,
  },
  cardHeading: { fontSize: norm(22), fontWeight: '800', color: '#0A3A3A', marginBottom: vs(4) },
  cardSub:     { fontSize: norm(13), color: '#6B9999', marginBottom: vs(20) },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
    borderRadius: s(12),
    padding: s(12),
    marginBottom: vs(16),
  },
  errorIcon: { fontSize: norm(14) },
  errorMsg:  { flex: 1, color: '#DC2626', fontSize: norm(13), fontWeight: '600' },

  // Fields
  fieldGroup:  { marginBottom: vs(16) },
  fieldLabel:  { fontSize: norm(11), fontWeight: '700', color: '#0A4A4A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: vs(7), opacity: 0.75 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: s(8),
    backgroundColor: '#F0FDF8',
    borderWidth: 1.5, borderColor: '#D1F0E8',
    borderRadius: s(14), paddingHorizontal: s(14), paddingVertical: vs(2),
  },
  inputWrapErr: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  inputIcon: { fontSize: norm(14), opacity: 0.6 },
  input: {
    flex: 1, fontSize: norm(15), color: '#0A3A3A',
    paddingVertical: vs(13),
  },

  // CTA
  cta: { borderRadius: s(14), overflow: 'hidden', marginTop: vs(4) },
  ctaGradient: { paddingVertical: vs(16), alignItems: 'center' },
  ctaDisabled: { opacity: 0.65 },
  ctaText: { fontSize: norm(16), fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginVertical: vs(16) },
  divLine: { flex: 1, height: 1, backgroundColor: '#E8F0EE' },
  divText: { fontSize: norm(12), color: '#9BB8B8', fontWeight: '600' },

  // Register
  registerBtn: {
    borderWidth: 1.5, borderColor: '#C8E8E0',
    borderRadius: s(14), paddingVertical: vs(14),
    alignItems: 'center',
  },
  registerBtnText: { fontSize: norm(15), fontWeight: '700', color: '#0A4A4A' },

  legalNote: { textAlign: 'center', marginTop: vs(20), fontSize: norm(11), color: 'rgba(159,240,208,0.55)' },
  legalLink: { color: '#9FF0D0', fontWeight: '700', textDecorationLine: 'underline' },
});