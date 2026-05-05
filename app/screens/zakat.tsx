import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale as ms, verticalScale as vs } from 'react-native-size-matters';

// Placeholder imports for your backend logic
import { deleteZakatRecordFromServer, fetchZakatHistory, syncZakatRecord } from '../services/zakatService';

/* ─────────────────────────────────────────
   ANDROID LAYOUT ANIMATION ENABLE
───────────────────────────────────────── */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const C = {
  bg0: '#072020',
  bg1: '#092828',
  bg2: '#0c3333',
  bg3: '#0f3e3c',
  bg4: '#144a47',
  mint:      '#5bbfb0',
  mintLight: '#7dd4c7',
  mintBg:    'rgba(91,191,176,0.12)',
  mintBorder:'rgba(91,191,176,0.22)',
  cream:  '#f0e8d5',
  beige:  '#cec5ad',
  muted:  '#7aada8',
  dimmed: '#3d706b',
  amber:       '#e8c882',
  amberBg:     'rgba(232,200,130,0.12)',
  amberBorder: 'rgba(232,200,130,0.25)',
  success: '#5ec97a',
  warning: '#e8a87c',
  error:   '#e87c7c',
  border:  'rgba(255,255,255,0.065)',
  shadow:  '#000',
};

/* ─────────────────────────────────────────
   CONSTANTS & TYPES
───────────────────────────────────────── */
const STORAGE_KEY     = '@zakat_calculations_v2';
const TOLA_TO_GRAM    = 11.66;
const GOLD_NISAB_TOLAS   = 7.5;
const SILVER_NISAB_TOLAS = 52.5;

interface CalculationRecord {
  id: string;
  name: string;
  date: number;
  values: Record<string, string>;
  totalAssets: number;
  zakatDue: number;
}

interface CategoryDef {
  rate: number;
  icon: string;
  color: string;
  info: string;
  inputs: { id: string; label: string }[];
}

const CATEGORY_DATA: Record<string, CategoryDef> = {
  Money:       { rate: 0.025, icon: 'cash-multiple',      color: C.mint,   info: '2.5% on cash & bank balances.',              inputs: [{ id: 'cash_hand', label: 'Cash in hand' }, { id: 'cash_bank', label: 'Bank balance' }] },
  Gold:        { rate: 0.025, icon: 'gold',               color: C.amber,  info: '2.5% on current market value of gold.',      inputs: [{ id: 'gold_value', label: 'Gold value (₹)' }] },
  Silver:      { rate: 0.025, icon: 'circle-outline',     color: C.beige,  info: '2.5% on current value of silver items.',     inputs: [{ id: 'silver_value', label: 'Silver value (₹)' }] },
  Investments: { rate: 0.025, icon: 'chart-line',         color: C.mintLight, info: 'Shares, stocks, and firm capital.',       inputs: [{ id: 'inv_shares', label: 'Shares value' }, { id: 'inv_firm', label: 'Firm capital' }] },
  Properties:  { rate: 0.025, icon: 'home-city',          color: '#9fd4b0', info: 'Investment properties only (not personal).',inputs: [{ id: 'prop_rental', label: 'Net rental income' }, { id: 'prop_inv', label: 'Plot / flat value' }] },
  Business:    { rate: 0.025, icon: 'briefcase-outline',  color: C.cream,  info: 'Stock-in-trade and trade receivables.',      inputs: [{ id: 'bus_stock', label: 'Stock value' }, { id: 'bus_recv', label: 'Receivables' }] },
  Others:      { rate: 0.025, icon: 'dots-horizontal',    color: C.muted,  info: 'Loans given to others that are recoverable.',inputs: [{ id: 'other_loans', label: 'Loans given' }] },
};

/* ─────────────────────────────────────────
   REUSABLE: PRESS SCALE
───────────────────────────────────────── */
const PressScale: React.FC<{
  onPress: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: object;
  to?: number;
  disabled?: boolean;
}> = ({ onPress, onLongPress, children, style, to = 0.97, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg = { useNativeDriver: true, speed: 40, bounciness: 0 };
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => Animated.spring(scale, { toValue: to, ...cfg }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, ...cfg }).start()}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────── */
const Dashboard: React.FC<{
  history: CalculationRecord[];
  onNew: () => void;
  onEdit: (r: CalculationRecord) => void;
  onDelete: (id: string) => void;
}> = ({ history, onNew, onEdit, onDelete }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalZakat = history.reduce((s, r) => s + r.zakatDue, 0);

  return (
    <View style={s.flex}>
      {/* ── Header ── */}
      <View style={[s.dashHeader, { paddingTop: insets.top + ms(10) }]}>
        <View style={s.dashHeaderRow}>
          <PressScale onPress={() => router.back()}>
            <View style={s.iconBtn}>
              <MaterialCommunityIcons name="arrow-left" size={ms(22)} color={C.cream} />
            </View>
          </PressScale>

          <View style={s.dashHeaderMid}>
            <Text style={s.dashGreeting}>Assalamu Alaikum</Text>
            <Text style={s.dashTitle}>Zakat Calculator</Text>
          </View>

          <View style={s.iconBtn}>
            <MaterialCommunityIcons name="star-crescent" size={ms(22)} color={C.amber} />
          </View>
        </View>

        {history.length > 0 && (
          <View style={s.statRow}>
            <View style={s.statCard}>
              <MaterialCommunityIcons name="calculator" size={ms(18)} color={C.mint} />
              <Text style={s.statNum}>{history.length}</Text>
              <Text style={s.statLbl}>Records</Text>
            </View>
            <View style={[s.statCard, s.statCardMid]}>
              <MaterialCommunityIcons name="hand-coin" size={ms(18)} color={C.amber} />
              <Text style={s.statNum}>
                ₹{history[0]?.zakatDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={s.statLbl}>Latest Zakat</Text>
            </View>
            <View style={s.statCard}>
              <MaterialCommunityIcons name="sigma" size={ms(18)} color={C.mintLight} />
              <Text style={s.statNum}>₹{totalZakat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              <Text style={s.statLbl}>Total Paid</Text>
            </View>
          </View>
        )}

        <PressScale onPress={onNew} style={s.newBtnWrap} to={0.96}>
          <View style={s.newBtn}>
            <MaterialCommunityIcons name="plus-circle-outline" size={ms(20)} color={C.bg0} />
            <Text style={s.newBtnText}>New Calculation</Text>
          </View>
        </PressScale>
      </View>

      {/* ── History List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.dashScroll,
          { paddingBottom: insets.bottom + vs(30) },
        ]}
      >
        {history.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyCircle}>
              <MaterialCommunityIcons name="calculator-variant-outline" size={ms(52)} color={C.dimmed} />
            </View>
            <Text style={s.emptyTitle}>No Calculations Yet</Text>
            <Text style={s.emptySub}>Tap "New Calculation" to get started</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionTitle}>History</Text>
            {history.map((item) => (
              <PressScale
                key={item.id}
                onPress={() => onEdit(item)}
                onLongPress={() => Alert.alert("Delete Record", `Remove "${item.name}"?`, [
                  { text: "Cancel", style: 'cancel' },
                  { text: "Delete", onPress: () => onDelete(item.id), style: 'destructive' }
                ])}
                style={{ marginBottom: ms(10) }}
                to={0.975}
              >
                <View style={s.histCard}>
                  <View style={s.histAccent} />
                  <View style={s.histLeft}>
                    <View style={s.histIconWrap}>
                      <MaterialCommunityIcons name="file-document-outline" size={ms(22)} color={C.mint} />
                    </View>
                    <View style={s.histInfo}>
                      <Text style={s.histName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.histDate}>
                        {new Date(item.date).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <View style={s.histRight}>
                    <Text style={s.histAmount}>
                      ₹{item.zakatDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={s.histLabel}>Zakat Due</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={ms(18)} color={C.dimmed} />
                </View>
              </PressScale>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

/* ─────────────────────────────────────────
   CALCULATOR
───────────────────────────────────────── */
const Calculator: React.FC<{
  initialData: CalculationRecord | null;
  onSave: (r: CalculationRecord) => void;
  onCancel: () => void;
}> = ({ initialData, onSave, onCancel }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [prices] = useState({ gold: 15961, silver: 290 });
  const [values, setValues] = useState<Record<string, string>>(initialData?.values ?? {});
  const [payables, setPayables] = useState(initialData?.values?.payables ?? '');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);

  useEffect(() => {
    const checkDisclaimer = async () => {
      if (initialData) return;
      try {
        const seen = await AsyncStorage.getItem('@has_seen_disclaimer');
        if (!seen) setDisclaimerVisible(true);
      } catch (e) {}
    };
    checkDisclaimer();

    const kShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const kHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    const t = setTimeout(() => setLoading(false), 400);
    return () => { kShow.remove(); kHide.remove(); clearTimeout(t); };
  }, []);

  const handleDismissDisclaimer = async () => {
    setDisclaimerVisible(false);
    try {
      await AsyncStorage.setItem('@has_seen_disclaimer', 'true');
    } catch (e) {}
  };

  const { totalAssets, zakatDue, isEligible } = (() => {
    let zakatable = 0, due = 0;
    Object.values(CATEGORY_DATA).forEach(cat =>
      cat.inputs.forEach(inp => {
        const v = parseFloat(values[inp.id]) || 0;
        zakatable += v;
        due += v * cat.rate;
      }),
    );
    const liabilities = parseFloat(payables) || 0;
    const net = Math.max(0, zakatable - liabilities);
    const nisab = Math.max(
      GOLD_NISAB_TOLAS * TOLA_TO_GRAM * prices.gold,
      SILVER_NISAB_TOLAS * TOLA_TO_GRAM * prices.silver,
    );
    return {
      totalAssets: net,
      zakatDue: net >= nisab ? Math.max(0, due - liabilities * 0.025) : 0,
      isEligible: net >= nisab,
    };
  })();

  const handleSave = useCallback(() => {
    const defaultName = `Calc — ${new Date().toLocaleDateString('en-IN')}`;
    const doSave = (name: string) =>
      onSave({
        id: initialData?.id ?? Date.now().toString(),
        name: name || defaultName,
        date: Date.now(),
        values: { ...values, payables },
        totalAssets,
        zakatDue,
      });

    if (Platform.OS === 'ios') {
      Alert.prompt('Save Record', 'Give this calculation a name:', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: (n?: string) => doSave(n ?? defaultName) },
      ], 'plain-text', initialData?.name ?? '');
    } else {
      Alert.alert('Save Record', `Save "${defaultName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => doSave(defaultName) },
      ]);
    }
  }, [values, payables, totalAssets, zakatDue, initialData, onSave]);

  const toggleSection = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(p => ({ ...p, [key]: !p[key] }));
  }, []);

  const updateValue = useCallback((id: string, val: string) => {
    setValues(p => ({ ...p, [id]: val }));
  }, []);

  if (loading) {
    return (
      <View style={[s.flex, s.center]}>
        <ActivityIndicator color={C.mint} size="large" />
      </View>
    );
  }

  return (
    <View style={s.flex}>
      {/* ── Navbar ── */}
      <View style={[s.calcNav, { paddingTop: insets.top + ms(10) }]}>
        <PressScale onPress={onCancel}>
          <View style={s.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={ms(22)} color={C.cream} />
          </View>
        </PressScale>
        <Text style={s.navTitle}>{initialData ? 'Edit Calculation' : 'New Calculation'}</Text>
        <PressScale onPress={handleSave} to={0.93}>
          <View style={s.saveBtn}>
            <Text style={s.saveBtnText}>Save</Text>
          </View>
        </PressScale>
      </View>

      {/* ── Nisab info strip ── */}
      <View style={s.nisabStrip}>
        <MaterialCommunityIcons name="information-outline" size={ms(14)} color={C.muted} />
        <Text style={s.nisabStripText}>
          Nisab: Gold ≈ ₹{(GOLD_NISAB_TOLAS * TOLA_TO_GRAM * prices.gold).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Text>
      </View>

      {/* ── Inputs ── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={ms(10)}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.calcScroll,
            { paddingBottom: insets.bottom + vs(160) },
          ]}
        >
          {Object.entries(CATEGORY_DATA).map(([key, cat]) => {
            const isOpen = !!expanded[key];
            const catTotal = cat.inputs.reduce((sum, inp) => sum + (parseFloat(values[inp.id]) || 0), 0);
            return (
              <View key={key} style={s.catCard}>
                <TouchableOpacity
                  style={s.catHeader}
                  onPress={() => toggleSection(key)}
                  activeOpacity={0.75}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${key} section. Current value: ${catTotal} rupees. ${isOpen ? 'Expanded' : 'Collapsed'}`}
                  accessibilityHint="Double tap to expand or collapse this category"
                >
                  <View style={s.catLeft}>
                    <View style={[s.catIconWrap, { backgroundColor: cat.color + '1a' }]}>
                      <MaterialCommunityIcons name={cat.icon as any} size={ms(22)} color={cat.color} />
                    </View>
                    <View style={s.catTitleBlock}>
                      <Text style={s.catTitle}>{key}</Text>
                      <Text style={s.catInfo} numberOfLines={1}>{cat.info}</Text>
                    </View>
                  </View>
                  <View style={s.catRight}>
                    {catTotal > 0 && (
                      <Text style={[s.catTotal, { color: cat.color }]}>
                        ₹{catTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                    )}
                    <MaterialCommunityIcons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={ms(20)}
                      color={C.dimmed}
                    />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={s.inputsWrap}>
                    {cat.inputs.map(inp => (
                      <View key={inp.id} style={s.inputRow}>
                        <Text style={s.inputLabel}>{inp.label}</Text>
                        <View style={s.inputBox}>
                          <Text style={s.inputPrefix}>₹</Text>
                          <TextInput
                            style={s.inputField}
                            placeholder="0"
                            placeholderTextColor={C.dimmed}
                            keyboardType="numeric"
                            returnKeyType="done"
                            value={values[inp.id]}
                            onChangeText={v => updateValue(inp.id, v)}
                            underlineColorAndroid="transparent"
                            selectionColor={C.mint}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {/* ── Liabilities ── */}
          <View style={s.liabCard}>
            <View style={s.liabHeader}>
              <View style={[s.catIconWrap, { backgroundColor: C.error + '1a' }]}>
                <MaterialCommunityIcons name="minus-circle-outline" size={ms(22)} color={C.error} />
              </View>
              <View>
                <Text style={s.catTitle}>Liabilities</Text>
                <Text style={s.catInfo}>Debts / payables subtracted from assets</Text>
              </View>
            </View>
            <View style={[s.inputRow, { marginTop: ms(12) }]}>
              <Text style={s.inputLabel}>Total Debts</Text>
              <View style={s.inputBox}>
                <Text style={[s.inputPrefix, { color: C.error }]}>₹</Text>
                <TextInput
                  style={s.inputField}
                  placeholder="0"
                  placeholderTextColor={C.dimmed}
                  keyboardType="numeric"
                  returnKeyType="done"
                  value={payables}
                  onChangeText={setPayables}
                  underlineColorAndroid="transparent"
                  selectionColor={C.mint}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Footer Summary ── */}
      {!keyboardUp && (
        <View style={[s.footer, { paddingBottom: insets.bottom + ms(12) }]}>
          <View style={s.footerRow}>
            <View style={s.footerItem}>
              <Text style={s.footerLabel}>Net Assets</Text>
              <Text style={s.footerVal}>₹{totalAssets.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </View>
            <View style={s.footerDivider} />
            <View style={s.footerItem}>
              <Text style={s.footerLabel}>Zakat Due</Text>
              <Text style={[s.footerVal, { color: C.amber }]}>
                ₹{zakatDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          <View style={[s.eligibilityBadge, {
            backgroundColor: isEligible ? C.success + '1a' : C.warning + '1a',
            borderColor: isEligible ? C.success + '40' : C.warning + '40',
          }]}>
            <MaterialCommunityIcons
              name={isEligible ? 'check-circle-outline' : 'alert-circle-outline'}
              size={ms(15)}
              color={isEligible ? C.success : C.warning}
            />
            <Text style={[s.eligibilityText, { color: isEligible ? C.success : C.warning }]}>
              {isEligible ? 'Zakat is obligatory on you' : 'Below nisab — no zakat required'}
            </Text>
          </View>
        </View>
      )}

      {/* ── Disclaimer Modal ── */}
      <Modal transparent visible={disclaimerVisible} animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}>
              <MaterialCommunityIcons name="information" size={ms(30)} color={C.amber} />
            </View>
            <Text style={s.modalTitle}>Important Notice</Text>
            <Text style={s.modalBody}>
              This calculator is an estimator only. Please consult a qualified Islamic scholar for
              your specific Zakat ruling (Hanafi, Shafi'i, etc.).
            </Text>
            <PressScale onPress={handleDismissDisclaimer} to={0.94} style={s.modalBtnWrap}>
              <View style={s.modalBtn}>
                <Text style={s.modalBtnText}>Understood</Text>
              </View>
            </PressScale>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
export default function ZakatWrapper() {
  return (
    <SafeAreaProvider>
      <ZakatRoot />
    </SafeAreaProvider>
  );
}

function ZakatRoot() {
  const [view, setView]     = useState<'dashboard' | 'calculator'>('dashboard');
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [current, setCurrent] = useState<CalculationRecord | null>(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setHistory(JSON.parse(json));
    } catch (e) {}

    try {
      const serverHistory = await fetchZakatHistory();
      setHistory(serverHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverHistory));
    } catch (e) {
      console.log("Offline mode: Using cached Zakat records.");
    }
  };

  const saveRecord = async (record: CalculationRecord) => {
    const next = [record, ...history.filter(h => h.id !== record.id)]
      .sort((a, b) => b.date - a.date);

    setHistory(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}

    try {
      await syncZakatRecord(record);
    } catch (e) {
      console.log("Sync failed — will retry later");
    }

    setView('dashboard');
  };

  const deleteRecord = async (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    try {
      await deleteZakatRecordFromServer(id);
    } catch (e) {
      console.log("Delete sync failed — will retry later");
    }
  };

  const rootStyle = { flex: 1, backgroundColor: C.bg0 };

  if (view === 'dashboard') {
    return (
      <View style={rootStyle}>
        <Dashboard
          history={history}
          onNew={() => { setCurrent(null); setView('calculator'); }}
          onEdit={r  => { setCurrent(r);    setView('calculator'); }}
          onDelete={deleteRecord} 
        />
      </View>
    );
  }

  return (
    <View style={rootStyle}>
      <Calculator
        initialData={current}
        onSave={saveRecord}
        onCancel={() => setView('dashboard')}
      />
    </View>
  );
}

/* ─────────────────────────────────────────
   STYLES (Using Size Matters & Responsive Screen)
───────────────────────────────────────── */
const CARD_SHADOW = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 7 },
  android: { elevation: 4 },
});

const s = StyleSheet.create({
  flex:   { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  iconBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: C.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  /* ══════════════ DASHBOARD ══════════════ */
  dashHeader: {
    paddingHorizontal: ms(20),
    paddingBottom: ms(20),
    backgroundColor: C.bg2,
    borderBottomLeftRadius: ms(24),
    borderBottomRightRadius: ms(24),
    ...CARD_SHADOW,
  },
  dashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(18),
  },
  dashHeaderMid: {
    flex: 1,
    alignItems: 'center',
  },
  dashGreeting: {
    fontSize: ms(11),
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ms(2),
  },
  dashTitle: {
    fontSize: ms(20),
    fontWeight: '800',
    color: C.cream,
    letterSpacing: 0.2,
  },

  statRow: {
    flexDirection: 'row',
    marginBottom: ms(16),
  },
  statCard: {
    flex: 1,
    backgroundColor: C.bg0,
    borderRadius: ms(14),
    paddingVertical: ms(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statCardMid: {
    marginHorizontal: ms(10),
  },
  statNum: {
    fontSize: ms(15),
    fontWeight: '800',
    color: C.cream,
    marginTop: ms(5),
    marginBottom: ms(2),
  },
  statLbl: {
    fontSize: ms(10),
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  newBtnWrap: {},
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.mint,
    borderRadius: ms(16),
    paddingVertical: ms(15),
  },
  newBtnText: {
    fontSize: ms(15),
    fontWeight: '800',
    color: C.bg0,
    marginLeft: ms(8),
    letterSpacing: 0.3,
  },

  dashScroll: {
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: hp('10%'),
    paddingHorizontal: ms(40),
  },
  emptyCircle: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: C.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    marginBottom: ms(20),
  },
  emptyTitle: {
    fontSize: ms(18),
    fontWeight: '800',
    color: C.muted,
    marginBottom: ms(8),
  },
  emptySub: {
    fontSize: ms(13),
    color: C.dimmed,
    textAlign: 'center',
    lineHeight: ms(20),
  },

  sectionTitle: {
    fontSize: ms(13),
    fontWeight: '700',
    color: C.dimmed,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ms(12),
  },

  histCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg2,
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    paddingRight: ms(14),
    ...CARD_SHADOW,
  },
  histAccent: {
    width: ms(4),
    alignSelf: 'stretch',
    backgroundColor: C.mint,
    opacity: 0.6,
  },
  histLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(14),
  },
  histIconWrap: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(12),
    backgroundColor: C.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
    borderWidth: 1,
    borderColor: C.mintBorder,
  },
  histInfo: { flex: 1 },
  histName: {
    fontSize: ms(14),
    fontWeight: '700',
    color: C.cream,
    marginBottom: ms(3),
  },
  histDate: {
    fontSize: ms(11),
    color: C.muted,
    fontWeight: '500',
  },
  histRight: {
    alignItems: 'flex-end',
    marginRight: ms(10),
  },
  histAmount: {
    fontSize: ms(15),
    fontWeight: '800',
    color: C.amber,
  },
  histLabel: {
    fontSize: ms(10),
    color: C.dimmed,
    fontWeight: '600',
    marginTop: ms(2),
  },

  /* ══════════════ CALCULATOR ══════════════ */
  calcNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(16),
    paddingBottom: ms(14),
    backgroundColor: C.bg2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  navTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: C.cream,
  },
  saveBtn: {
    backgroundColor: C.amber,
    paddingHorizontal: ms(18),
    paddingVertical: ms(9),
    borderRadius: ms(12),
  },
  saveBtnText: {
    fontSize: ms(13),
    fontWeight: '800',
    color: C.bg0,
    letterSpacing: 0.2,
  },

  nisabStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    paddingVertical: ms(8),
    backgroundColor: C.bg1,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  nisabStripText: {
    fontSize: ms(11),
    color: C.muted,
    marginLeft: ms(6),
    fontWeight: '500',
  },

  calcScroll: {
    paddingHorizontal: ms(16),
    paddingTop: ms(14),
  },

  catCard: {
    backgroundColor: C.bg2,
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: ms(10),
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ms(14),
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  catIconWrap: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  catTitleBlock: { flex: 1 },
  catTitle: {
    fontSize: ms(15),
    fontWeight: '700',
    color: C.cream,
    marginBottom: ms(2),
  },
  catInfo: {
    fontSize: ms(11),
    color: C.muted,
    fontWeight: '500',
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catTotal: {
    fontSize: ms(13),
    fontWeight: '700',
    marginRight: ms(8),
  },

  inputsWrap: {
    backgroundColor: C.bg3,
    paddingHorizontal: ms(14),
    paddingBottom: ms(14),
    paddingTop: ms(4),
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ms(10),
  },
  inputLabel: {
    fontSize: ms(13),
    color: C.beige,
    fontWeight: '600',
    flex: 1,
    marginRight: ms(10),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg2,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: ms(12),
    width: wp('35%'), // Utilizing responsive-screen here for fluid input widths
    maxWidth: ms(140),
    height: ms(42),
  },
  inputPrefix: {
    fontSize: ms(14),
    color: C.muted,
    fontWeight: '700',
    marginRight: ms(4),
  },
  inputField: {
    flex: 1,
    color: C.cream,
    fontSize: ms(14),
    fontWeight: '700',
    textAlign: 'right',
    paddingVertical: 0,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },

  liabCard: {
    backgroundColor: C.bg2,
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: `${C.error}33`,
    padding: ms(14),
    ...CARD_SHADOW,
  },
  liabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg2,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: ms(16),
    paddingHorizontal: ms(20),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    height: ms(36),
    backgroundColor: C.border,
  },
  footerLabel: {
    fontSize: ms(11),
    color: C.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: ms(4),
  },
  footerVal: {
    fontSize: ms(20),
    fontWeight: '800',
    color: C.cream,
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(12),
    borderWidth: 1,
    paddingVertical: ms(9),
  },
  eligibilityText: {
    fontSize: ms(13),
    fontWeight: '700',
    marginLeft: ms(7),
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    paddingHorizontal: ms(28),
  },
  modalCard: {
    backgroundColor: C.bg2,
    borderRadius: ms(24),
    padding: ms(26),
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: C.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(16),
  },
  modalTitle: {
    fontSize: ms(18),
    fontWeight: '800',
    color: C.cream,
    marginBottom: ms(10),
    textAlign: 'center',
  },
  modalBody: {
    fontSize: ms(14),
    color: C.beige,
    lineHeight: ms(22),
    textAlign: 'center',
    marginBottom: ms(22),
  },
  modalBtnWrap: { width: '100%' },
  modalBtn: {
    backgroundColor: C.mint,
    borderRadius: ms(14),
    paddingVertical: ms(14),
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: ms(15),
    fontWeight: '800',
    color: C.bg0,
  },
});