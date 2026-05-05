import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
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
import { registerUser } from './services/authService';

// ── Responsive Utilities ──────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const s  = (n: number) => (W / 375) * n;
const vs = (n: number) => (H / 812) * n;
const ms = (n: number, f = 0.45) => n + (s(n) - n) * f;
const norm = (n: number) => Math.round(PixelRatio.roundToNearestPixel(ms(n)));
const wp = (p: number) => Math.round((p * W) / 100);

// ─────────────────────────────────────────────────────

type FormData = {
  firstName:       string;
  email:           string;
  password:        string;
  confirmPassword: string;
  agreeToTerms:    boolean;
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}
const Field = ({ label, children, error }: FieldProps) => (
  <View style={fStyles.group}>
    <Text style={fStyles.label}>{label}</Text>
    {children}
    {!!error && <Text style={fStyles.err}>{error}</Text>}
  </View>
);
const fStyles = StyleSheet.create({
  group: { marginBottom: vs(14) },
  label: { fontSize: norm(11), fontWeight: '700', color: '#0A4A4A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: vs(6), opacity: 0.7 },
  err:   { color: '#DC2626', fontSize: norm(11), fontWeight: '600', marginTop: vs(4), marginLeft: s(2) },
});

// ─────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const emailRef   = useRef<TextInput>(null);
  const passRef    = useRef<TextInput>(null);
  const confRef    = useRef<TextInput>(null);
// Remove 'watch' and add 'getValues'
const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
  defaultValues: { firstName: '', email: '', password: '', confirmPassword: '', agreeToTerms: false },
});

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser(data.firstName.trim(), data.email.trim().toLowerCase(), data.password);
      Alert.alert('Welcome!', 'Your account is ready. Please sign in to begin your journey.', [
        { text: 'Go to Login', onPress: () => router.replace('/login') },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Network error. Please check your connection.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const InputWrap = ({ error, children }: { error?: boolean; children: React.ReactNode }) => (
    <View style={[styles.inputWrap, error && styles.inputWrapErr]}>{children}</View>
  );

  return (
    <LinearGradient colors={['#052E2E', '#0A4A4A', '#0D5C5C']} style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.arcTop} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + vs(16), paddingBottom: insets.bottom + vs(20) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="arrow-left" size={s(22)} color="rgba(159,240,208,0.8)" />
          </TouchableOpacity>

          <View style={styles.headBlock}>
            <View style={styles.logoRing}>
              <Text style={styles.logoGlyph}>ق</Text>
            </View>
            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.sub}>Join the Qalb-E-Rooh community</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* First Name */}
            <Field label="First Name" error={errors.firstName?.message}>
              <Controller
                control={control}
                name="firstName"
                rules={{ required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputWrap error={!!errors.firstName}>
                    <TextInput
                      style={styles.input}
                      placeholder="Saba"
                      placeholderTextColor="#9BB8B8"
                      returnKeyType="next"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </InputWrap>
                )}
              />
            </Field>

            {/* Email */}
            <Field label="Email Address" error={errors.email?.message}>
              <Controller
                control={control}
                name="email"
                rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputWrap error={!!errors.email}>
                    <TextInput
                      ref={emailRef}
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#9BB8B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      onSubmitEditing={() => passRef.current?.focus()}
                    />
                  </InputWrap>
                )}
              />
            </Field>

            {/* Password */}
{/* Password Field */}
<Field label="Password" error={errors.password?.message}>
<Controller
  control={control}
  name="password"
  rules={{
    required: 'Password is required',
    minLength: { value: 8, message: 'Minimum 8 characters' }
  }}
  render={({ field: { onChange, onBlur, value } }) => (
    <InputWrap error={!!errors.password}>
      <TextInput
        ref={passRef}
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor="#9BB8B8"
        secureTextEntry={!showPass}
        onBlur={onBlur}
        onChangeText={onChange} // This updates the form state
        value={value}
        autoCapitalize="none"
        autoCorrect={false}
        // Change textContentType to 'none' to avoid system lag
        textContentType="none" 
        returnKeyType="next"
        onSubmitEditing={() => confRef.current?.focus()}
      />
        <TouchableOpacity
          onPress={() => setShowPass(!showPass)}
          style={{ paddingLeft: s(8) }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={showPass ? 'eye-off' : 'eye'}
            size={s(19)}
            color="#6B9999"
          />
        </TouchableOpacity>
      </InputWrap>
    )}
  />
</Field>

{/* Confirm Password */}
<Field label="Confirm Password" error={errors.confirmPassword?.message}>
  <Controller
    control={control}
    name="confirmPassword"
    // UPDATE THESE RULES:
    rules={{ validate: (v) => v === getValues('password') || 'Passwords do not match' }}
    render={({ field: { onChange, onBlur, value } }) => (
      <InputWrap error={!!errors.confirmPassword}>
        <TextInput
          ref={confRef}
          style={[styles.input, { flex: 1 }]}
          placeholder="••••••••"
          placeholderTextColor="#9BB8B8"
          keyboardType="default"
          secureTextEntry={!showConfirm}
          returnKeyType="done"
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
          textContentType="none" // <-- Also set this to "none" for consistency/performance
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit(onSubmit)}
        />
        <TouchableOpacity
          onPress={() => setShowConfirm(!showConfirm)}
          style={{ paddingLeft: s(8) }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={showConfirm ? 'eye-off' : 'eye'}
            size={s(19)}
            color="#6B9999"
          />
        </TouchableOpacity>
      </InputWrap>
    )}
  />
</Field>

            {/* Terms */}
            <Controller
              control={control}
              name="agreeToTerms"
              rules={{ required: 'Please agree to the terms to continue' }}
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity style={styles.termsRow} onPress={() => onChange(!value)} activeOpacity={0.75}>
                  <View style={[styles.checkbox, value && styles.checkboxActive]}>
                    {value && <MaterialCommunityIcons name="check" size={s(14)} color="#fff" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
                    {' '}and Terms of Use
                  </Text>
                </TouchableOpacity>
              )}
            />
            {errors.agreeToTerms && <Text style={fStyles.err}>{errors.agreeToTerms.message}</Text>}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#1A7A6A', '#0A5A4A']} style={styles.ctaGradient}>
                {loading
                  ? <ActivityIndicator color="#9FF0D0" size="small" />
                  : <Text style={styles.ctaText}>Create Account</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  arcTop: {
    position: 'absolute', top: -H * 0.1, right: -W * 0.3,
    width: W * 0.9, height: W * 0.9, borderRadius: W * 0.45,
    backgroundColor: 'rgba(159,240,208,0.05)',
    pointerEvents: 'none',
  },
  scroll:    { flexGrow: 1, paddingHorizontal: wp(6) },
  backBtn:   { marginBottom: vs(8) },
  headBlock: { alignItems: 'center', marginBottom: vs(28) },
  logoRing: {
    width: s(60), height: s(60), borderRadius: s(30),
    backgroundColor: 'rgba(159,240,208,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(159,240,208,0.3)',
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(10),
  },
  logoGlyph: { fontSize: norm(26), color: '#9FF0D0' },
  heading:   { fontSize: norm(24), fontWeight: '800', color: '#fff' },
  sub:       { fontSize: norm(13), color: 'rgba(159,240,208,0.65)', marginTop: vs(4) },

  card: {
    backgroundColor: '#fff',
    borderRadius: s(28),
    padding: s(22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(10) },
    shadowOpacity: 0.18, shadowRadius: s(18), elevation: 12,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF8', borderWidth: 1.5, borderColor: '#D1F0E8',
    borderRadius: s(13), paddingHorizontal: s(14),
  },
  inputWrapErr: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  input: { flex: 1, fontSize: norm(15), color: '#0A3A3A', paddingVertical: vs(13),paddingRight: s(10) },

  termsRow:    { flexDirection: 'row', alignItems: 'center', gap: s(10), marginBottom: vs(4), marginTop: vs(4) },
  checkbox: {
    width: s(22), height: s(22), borderRadius: s(6),
    borderWidth: 2, borderColor: '#C8E0DC',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#0A4A4A', borderColor: '#0A4A4A' },
  termsText:   { flex: 1, fontSize: norm(12), color: '#4A7070', lineHeight: norm(18) },
  termsLink:   { color: '#0A4A4A', fontWeight: '700', textDecorationLine: 'underline' },

  cta:         { borderRadius: s(14), overflow: 'hidden', marginTop: vs(16) },
  ctaGradient: { paddingVertical: vs(16), alignItems: 'center' },
  ctaDisabled: { opacity: 0.6 },
  ctaText:     { fontSize: norm(16), fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: vs(16) },
  loginText: { fontSize: norm(13), color: '#6B9999' },
  loginLink: { fontSize: norm(13), fontWeight: '800', color: '#0A4A4A' },
});