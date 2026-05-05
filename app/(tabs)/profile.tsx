import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteAccount, logoutUser } from '../services/authService';

// ── Responsive Utilities ──────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const s  = (n: number) => (W / 375) * n;
const vs = (n: number) => (H / 812) * n;
const ms = (n: number, f = 0.45) => n + (s(n) - n) * f;
const norm = (n: number) => Math.round(PixelRatio.roundToNearestPixel(ms(n)));
const wp = (p: number) => Math.round((p * W) / 100);

// ─────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          setTimeout(() => router.replace('/screens/splash'), 300);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile and all saved progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Final Confirmation',
              'All your data will be permanently erased from our servers. Proceed?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, Delete', style: 'destructive', onPress: executeDeletion },
              ]
            ),
        },
      ]
    );
  };

  const executeDeletion = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      Alert.alert('Account Deleted', 'Your data has been permanently removed.');
      router.replace('/screens/splash');
    } catch {
      Alert.alert('Error', 'Could not delete account. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <LinearGradient colors={['#F0FDF8', '#E6F9F2', '#D6F5EA']} style={styles.root}>
      {/* Top accent strip */}
      <LinearGradient
        colors={['#052E2E', '#0A4A4A']}
        style={[styles.topStrip, { paddingTop: insets.top }]}
      >
        <View style={styles.stripContent}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="arrow-left" size={s(22)} color="rgba(159,240,208,0.85)" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>My Profile</Text>
          <View style={{ width: s(22) }} />
        </View>
      </LinearGradient>

      {/* Avatar — overlaps top strip */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarRing}>
          <LinearGradient colors={['#9FF0D0', '#5ABFA0']} style={styles.avatarGrad}>
            <MaterialCommunityIcons name="account" size={s(52)} color="#0A4A4A" />
          </LinearGradient>
        </View>
        <Text style={styles.userName}>My Account</Text>
        <Text style={styles.userSub}>Manage your Qalb-E-Rooh profile</Text>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, vs(24)) }]}>

 

        {/* Actions */}
        <View style={styles.actionsCard}>
          {/* Privacy */}
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/privacy')} activeOpacity={0.75}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#E8F5F0' }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={s(20)} color="#0A4A4A" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Privacy Policy</Text>
              <Text style={styles.actionSub}>How we protect your data</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={s(20)} color="#B0CCCC" />
          </TouchableOpacity>

          <View style={styles.actionSep} />

          {/* Logout */}
          <TouchableOpacity style={styles.actionRow} onPress={handleLogout} activeOpacity={0.75}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#FFF4E8' }]}>
              <MaterialCommunityIcons name="logout" size={s(20)} color="#D97706" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: '#D97706' }]}>Log Out</Text>
              <Text style={styles.actionSub}>Sign out of your account</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={s(20)} color="#B0CCCC" />
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <MaterialCommunityIcons name="alert-circle-outline" size={s(15)} color="#9B1C1C" />
            <Text style={styles.dangerLabel}>Danger Zone</Text>
          </View>

          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.82}
          >
            {isDeleting ? (
              <ActivityIndicator color="#DC2626" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="account-remove-outline" size={s(19)} color="#DC2626" />
                <Text style={styles.deleteBtnText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.dangerNote}>
            This permanently removes all your data and cannot be undone.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topStrip: {
    paddingBottom: vs(52),
    paddingHorizontal: wp(5),
  },
  stripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(14),
  },
  pageTitle: { fontSize: norm(17), fontWeight: '800', color: '#fff' },

  avatarWrapper: {
    alignItems: 'center',
    marginTop: -vs(40),
    marginBottom: vs(20),
    paddingHorizontal: wp(6),
  },
  avatarRing: {
    width: s(88), height: s(88), borderRadius: s(44),
    backgroundColor: '#fff',
    padding: s(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(6) },
    shadowOpacity: 0.15, shadowRadius: s(12), elevation: 8,
    marginBottom: vs(10),
  },
  avatarGrad: {
    flex: 1, borderRadius: s(40),
    justifyContent: 'center', alignItems: 'center',
  },
  userName: { fontSize: norm(20), fontWeight: '800', color: '#0A3A3A' },
  userSub:  { fontSize: norm(12), color: '#5A8888', marginTop: vs(3) },

  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    gap: vs(14),
  },

  tileRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: s(20),
    paddingVertical: vs(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.07, shadowRadius: s(8), elevation: 4,
  },
  tile: { flex: 1, alignItems: 'center', gap: vs(4) },
  tileValue: { fontSize: norm(22) },
  tileLabel: { fontSize: norm(11), color: '#5A8888', textAlign: 'center', lineHeight: norm(16), fontWeight: '600' },
  tileDivider: { width: 1, backgroundColor: '#E8F0EE', marginVertical: vs(4) },

  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: s(20),
    paddingHorizontal: s(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.07, shadowRadius: s(8), elevation: 4,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(14), gap: s(12) },
  actionIconWrap: { width: s(38), height: s(38), borderRadius: s(12), justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: norm(14), fontWeight: '700', color: '#0A3A3A' },
  actionSub:   { fontSize: norm(11), color: '#9BB8B8', marginTop: vs(2) },
  actionSep:   { height: 1, backgroundColor: '#F0F8F4', marginLeft: s(50) },

  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: s(20),
    padding: s(18),
    borderWidth: 1, borderColor: '#FEE2E2',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.06, shadowRadius: s(8), elevation: 3,
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: vs(12) },
  dangerLabel: { fontSize: norm(10), fontWeight: '800', color: '#9B1C1C', textTransform: 'uppercase', letterSpacing: 1 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8),
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5, borderColor: '#FECACA',
    borderRadius: s(14), paddingVertical: vs(14),
  },
  deleteBtnDisabled: { opacity: 0.55 },
  deleteBtnText: { fontSize: norm(14), fontWeight: '700', color: '#DC2626' },
  dangerNote: { fontSize: norm(11), color: '#9B9B9B', textAlign: 'center', marginTop: vs(10), lineHeight: norm(16) },
});