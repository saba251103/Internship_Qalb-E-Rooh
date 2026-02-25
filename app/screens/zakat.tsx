import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─────────────────────────────────────────
   ANDROID LAYOUT ANIMATION ENABLE
───────────────────────────────────────── */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─────────────────────────────────────────
   RESPONSIVE SCALE  ← single source of truth
───────────────────────────────────────── */
const { width: W, height: H } = Dimensions.get('window');
// Scale relative to iPhone 14 base (390 × 844)
const rs  = (n: number) => Math.round((n / 390) * W);   // horizontal / font
const rvs = (n: number) => Math.round((n / 844) * H);   // vertical

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const C = {
  // Backgrounds — deep teal hierarchy
  bg0: '#072020',
  bg1: '#092828',
  bg2: '#0c3333',
  bg3: '#0f3e3c',
  bg4: '#144a47',

  // Mint accent
  mint:      '#5bbfb0',
  mintLight: '#7dd4c7',
  mintBg:    'rgba(91,191,176,0.12)',
  mintBorder:'rgba(91,191,176,0.22)',

  // Warm text
  cream:  '#f0e8d5',
  beige:  '#cec5ad',
  muted:  '#7aada8',
  dimmed: '#3d706b',

  // Soft amber (replaces gold — readable against dark teal)
  amber:       '#e8c882',
  amberBg:     'rgba(232,200,130,0.12)',
  amberBorder: 'rgba(232,200,130,0.25)',

  // Status
  success: '#5ec97a',
  warning: '#e8a87c',
  error:   '#e87c7c',

  border:  'rgba(255,255,255,0.065)',
  shadow:  '#000',
};

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const STORAGE_KEY     = '@zakat_calculations_v2';
const TOLA_TO_GRAM    = 11.66;
const GOLD_NISAB_TOLAS   = 7.5;
const SILVER_NISAB_TOLAS = 52.5;

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   CATEGORY DATA
───────────────────────────────────────── */
const CATEGORY_DATA: Record<string, CategoryDef> = {
  Money:       { rate: 0.025, icon: 'cash-multiple',      color: C.mint,   info: '2.5% on cash & bank balances.',              inputs: [{ id: 'cash_hand', label: 'Cash in hand' }, { id: 'cash_bank', label: 'Bank balance' }] },
  Gold:        { rate: 0.025, icon: 'gold',                color: C.amber,  info: '2.5% on current market value of gold.',      inputs: [{ id: 'gold_value', label: 'Gold value (₹)' }] },
  Silver:      { rate: 0.025, icon: 'circle-outline',      color: C.beige,  info: '2.5% on current value of silver items.',     inputs: [{ id: 'silver_value', label: 'Silver value (₹)' }] },
  Investments: { rate: 0.025, icon: 'chart-line',          color: C.mintLight, info: 'Shares, stocks, and firm capital.',        inputs: [{ id: 'inv_shares', label: 'Shares value' }, { id: 'inv_firm', label: 'Firm capital' }] },
  Properties:  { rate: 0.025, icon: 'home-city',           color: '#9fd4b0', info: 'Investment properties only (not personal).',inputs: [{ id: 'prop_rental', label: 'Net rental income' }, { id: 'prop_inv', label: 'Plot / flat value' }] },
  Business:    { rate: 0.025, icon: 'briefcase-outline',   color: C.cream,  info: 'Stock-in-trade and trade receivables.',      inputs: [{ id: 'bus_stock', label: 'Stock value' }, { id: 'bus_recv', label: 'Receivables' }] },
  Others:      { rate: 0.025, icon: 'dots-horizontal',     color: C.muted,  info: 'Loans given to others that are recoverable.',inputs: [{ id: 'other_loans', label: 'Loans given' }] },
};

/* ─────────────────────────────────────────
   REUSABLE: PRESS SCALE
───────────────────────────────────────── */
const PressScale: React.FC<{
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
  to?: number;
  disabled?: boolean;
}> = ({ onPress, children, style, to = 0.97, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg = { useNativeDriver: true, speed: 40, bounciness: 0 };
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
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
}> = ({ history, onNew, onEdit }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalZakat = history.reduce((s, r) => s + r.zakatDue, 0);

  return (
    <View style={s.flex}>
      {/* ── Header ── */}
      <View style={[s.dashHeader, { paddingTop: insets.top + rs(10) }]}>
        <View style={s.dashHeaderRow}>
          <PressScale onPress={() => router.back()}>
            <View style={s.iconBtn}>
              <MaterialCommunityIcons name="arrow-left" size={rs(22)} color={C.cream} />
            </View>
          </PressScale>

          <View style={s.dashHeaderMid}>
            <Text style={s.dashGreeting}>Assalamu Alaikum</Text>
            <Text style={s.dashTitle}>Zakat Calculator</Text>
          </View>

          <View style={s.iconBtn}>
            <MaterialCommunityIcons name="star-crescent" size={rs(22)} color={C.amber} />
          </View>
        </View>

        {/* Stats row */}
        {history.length > 0 && (
          <View style={s.statRow}>
            <View style={s.statCard}>
              <MaterialCommunityIcons name="calculator" size={rs(18)} color={C.mint} />
              <Text style={s.statNum}>{history.length}</Text>
              <Text style={s.statLbl}>Records</Text>
            </View>
            <View style={[s.statCard, s.statCardMid]}>
              <MaterialCommunityIcons name="hand-coin" size={rs(18)} color={C.amber} />
              <Text style={s.statNum}>
                ₹{history[0]?.zakatDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={s.statLbl}>Latest Zakat</Text>
            </View>
            <View style={s.statCard}>
              <MaterialCommunityIcons name="sigma" size={rs(18)} color={C.mintLight} />
              <Text style={s.statNum}>₹{totalZakat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              <Text style={s.statLbl}>Total Paid</Text>
            </View>
          </View>
        )}

        {/* New calc button */}
        <PressScale onPress={onNew} style={s.newBtnWrap} to={0.96}>
          <View style={s.newBtn}>
            <MaterialCommunityIcons name="plus-circle-outline" size={rs(20)} color={C.bg0} />
            <Text style={s.newBtnText}>New Calculation</Text>
          </View>
        </PressScale>
      </View>

      {/* ── History List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.dashScroll,
          { paddingBottom: insets.bottom + rs(30) },
        ]}
      >
        {history.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyCircle}>
              <MaterialCommunityIcons name="calculator-variant-outline" size={rs(52)} color={C.dimmed} />
            </View>
            <Text style={s.emptyTitle}>No Calculations Yet</Text>
            <Text style={s.emptySub}>Tap "New Calculation" to get started</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionTitle}>History</Text>
            {history.map((item) => (
              <PressScale key={item.id} onPress={() => onEdit(item)} style={{ marginBottom: rs(10) }} to={0.975}>
                <View style={s.histCard}>
                  <View style={s.histAccent} />
                  <View style={s.histLeft}>
                    <View style={s.histIconWrap}>
                      <MaterialCommunityIcons name="file-document-outline" size={rs(22)} color={C.mint} />
                    </View>
                    <View style={s.histInfo}>
                      <Text style={s.histName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.histDate}>{new Date(item.date).toLocaleDateString('en-IN')}</Text>
                    </View>
                  </View>
                  <View style={s.histRight}>
                    <Text style={s.histAmount}>₹{item.zakatDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                    <Text style={s.histLabel}>Zakat Due</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={rs(18)} color={C.dimmed} />
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
  const [disclaimerVisible, setDisclaimerVisible] = useState(!initialData);

  useEffect(() => {
    const kShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const kHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    const t = setTimeout(() => setLoading(false), 400);
    return () => { kShow.remove(); kHide.remove(); clearTimeout(t); };
  }, []);

  /* ── Zakat Calculation ── */
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

  /* ── Save ── */
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
      <View style={[s.calcNav, { paddingTop: insets.top + rs(10) }]}>
        <PressScale onPress={onCancel}>
          <View style={s.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={rs(22)} color={C.cream} />
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
        <MaterialCommunityIcons name="information-outline" size={rs(14)} color={C.muted} />
        <Text style={s.nisabStripText}>
          Nisab: Gold ≈ ₹{(GOLD_NISAB_TOLAS * TOLA_TO_GRAM * prices.gold).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Text>
      </View>

      {/* ── Inputs ── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={rs(10)}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.calcScroll,
            { paddingBottom: insets.bottom + rs(160) },
          ]}
        >
          {Object.entries(CATEGORY_DATA).map(([key, cat]) => {
            const isOpen = !!expanded[key];
            const catTotal = cat.inputs.reduce(
              (sum, inp) => sum + (parseFloat(values[inp.id]) || 0),
              0,
            );
            return (
              <View key={key} style={s.catCard}>
                {/* Header row */}
                <TouchableOpacity
                  style={s.catHeader}
                  onPress={() => toggleSection(key)}
                  activeOpacity={0.75}
                >
                  <View style={s.catLeft}>
                    <View style={[s.catIconWrap, { backgroundColor: cat.color + '1a' }]}>
                      <MaterialCommunityIcons
                        name={cat.icon as any}
                        size={rs(22)}
                        color={cat.color}
                      />
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
                      size={rs(20)}
                      color={C.dimmed}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded inputs */}
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
                <MaterialCommunityIcons name="minus-circle-outline" size={rs(22)} color={C.error} />
              </View>
              <View>
                <Text style={s.catTitle}>Liabilities</Text>
                <Text style={s.catInfo}>Debts / payables subtracted from assets</Text>
              </View>
            </View>
            <View style={[s.inputRow, { marginTop: rs(12) }]}>
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
        <View style={[s.footer, { paddingBottom: insets.bottom + rs(12) }]}>
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
              size={rs(15)}
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
              <MaterialCommunityIcons name="information" size={rs(30)} color={C.amber} />
            </View>
            <Text style={s.modalTitle}>Important Notice</Text>
            <Text style={s.modalBody}>
              This calculator is an estimator only. Please consult a qualified Islamic scholar for
              your specific Zakat ruling (Hanafi, Shafi'i, etc.).
            </Text>
            <PressScale onPress={() => setDisclaimerVisible(false)} to={0.94} style={s.modalBtnWrap}>
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
    } catch {}
  };

  const saveRecord = async (record: CalculationRecord) => {
    const next = [record, ...history.filter(h => h.id !== record.id)]
      .sort((a, b) => b.date - a.date);
    setHistory(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setView('dashboard');
  };

  const rootStyle = { flex: 1, backgroundColor: C.bg0 };

  if (view === 'dashboard') {
    return (
      <View style={rootStyle}>
        <Dashboard
          history={history}
          onNew={() => { setCurrent(null); setView('calculator'); }}
          onEdit={r  => { setCurrent(r);    setView('calculator'); }}
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
   STYLES
───────────────────────────────────────── */
const CARD_SHADOW = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 7 },
  android: { elevation: 4 },
});

const s = StyleSheet.create({
  flex:   { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  /* ── Icon button ── */
  iconBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    backgroundColor: C.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  /* ══════════════ DASHBOARD ══════════════ */
  dashHeader: {
    paddingHorizontal: rs(20),
    paddingBottom: rs(20),
    backgroundColor: C.bg2,
    borderBottomLeftRadius: rs(24),
    borderBottomRightRadius: rs(24),
    ...CARD_SHADOW,
  },
  dashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(18),
  },
  dashHeaderMid: {
    flex: 1,
    alignItems: 'center',
  },
  dashGreeting: {
    fontSize: rs(11),
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: rs(2),
  },
  dashTitle: {
    fontSize: rs(20),
    fontWeight: '800',
    color: C.cream,
    letterSpacing: 0.2,
  },

  /* Stat cards */
  statRow: {
    flexDirection: 'row',
    marginBottom: rs(16),
  },
  statCard: {
    flex: 1,
    backgroundColor: C.bg0,
    borderRadius: rs(14),
    paddingVertical: rs(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statCardMid: {
    marginHorizontal: rs(10),
  },
  statNum: {
    fontSize: rs(15),
    fontWeight: '800',
    color: C.cream,
    marginTop: rs(5),
    marginBottom: rs(2),
  },
  statLbl: {
    fontSize: rs(10),
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* New button */
  newBtnWrap: {},
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.mint,
    borderRadius: rs(16),
    paddingVertical: rs(15),
  },
  newBtnText: {
    fontSize: rs(15),
    fontWeight: '800',
    color: C.bg0,
    marginLeft: rs(8),
    letterSpacing: 0.3,
  },

  /* Scroll */
  dashScroll: {
    paddingHorizontal: rs(20),
    paddingTop: rs(20),
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    paddingTop: rvs(60),
    paddingHorizontal: rs(40),
  },
  emptyCircle: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    backgroundColor: C.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    marginBottom: rs(20),
  },
  emptyTitle: {
    fontSize: rs(18),
    fontWeight: '800',
    color: C.muted,
    marginBottom: rs(8),
  },
  emptySub: {
    fontSize: rs(13),
    color: C.dimmed,
    textAlign: 'center',
    lineHeight: rs(20),
  },

  /* Section label */
  sectionTitle: {
    fontSize: rs(13),
    fontWeight: '700',
    color: C.dimmed,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: rs(12),
  },

  /* History card */
  histCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg2,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    paddingRight: rs(14),
    ...CARD_SHADOW,
  },
  histAccent: {
    width: rs(4),
    alignSelf: 'stretch',
    backgroundColor: C.mint,
    opacity: 0.6,
  },
  histLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(14),
  },
  histIconWrap: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(12),
    backgroundColor: C.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
    borderWidth: 1,
    borderColor: C.mintBorder,
  },
  histInfo: { flex: 1 },
  histName: {
    fontSize: rs(14),
    fontWeight: '700',
    color: C.cream,
    marginBottom: rs(3),
  },
  histDate: {
    fontSize: rs(11),
    color: C.muted,
    fontWeight: '500',
  },
  histRight: {
    alignItems: 'flex-end',
    marginRight: rs(10),
  },
  histAmount: {
    fontSize: rs(15),
    fontWeight: '800',
    color: C.amber,
  },
  histLabel: {
    fontSize: rs(10),
    color: C.dimmed,
    fontWeight: '600',
    marginTop: rs(2),
  },

  /* ══════════════ CALCULATOR ══════════════ */
  calcNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingBottom: rs(14),
    backgroundColor: C.bg2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  navTitle: {
    fontSize: rs(16),
    fontWeight: '800',
    color: C.cream,
  },
  saveBtn: {
    backgroundColor: C.amber,
    paddingHorizontal: rs(18),
    paddingVertical: rs(9),
    borderRadius: rs(12),
  },
  saveBtnText: {
    fontSize: rs(13),
    fontWeight: '800',
    color: C.bg0,
    letterSpacing: 0.2,
  },

  /* Nisab strip */
  nisabStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingVertical: rs(8),
    backgroundColor: C.bg1,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  nisabStripText: {
    fontSize: rs(11),
    color: C.muted,
    marginLeft: rs(6),
    fontWeight: '500',
  },

  calcScroll: {
    paddingHorizontal: rs(16),
    paddingTop: rs(14),
  },

  /* Category card */
  catCard: {
    backgroundColor: C.bg2,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: rs(10),
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: rs(14),
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  catIconWrap: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  catTitleBlock: { flex: 1 },
  catTitle: {
    fontSize: rs(15),
    fontWeight: '700',
    color: C.cream,
    marginBottom: rs(2),
  },
  catInfo: {
    fontSize: rs(11),
    color: C.muted,
    fontWeight: '500',
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catTotal: {
    fontSize: rs(13),
    fontWeight: '700',
    marginRight: rs(8),
  },

  /* Inputs */
  inputsWrap: {
    backgroundColor: C.bg3,
    paddingHorizontal: rs(14),
    paddingBottom: rs(14),
    paddingTop: rs(4),
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(10),
  },
  inputLabel: {
    fontSize: rs(13),
    color: C.beige,
    fontWeight: '600',
    flex: 1,
    marginRight: rs(10),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg2,
    borderRadius: rs(10),
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: rs(12),
    width: rs(130),
    height: rs(42),
  },
  inputPrefix: {
    fontSize: rs(14),
    color: C.muted,
    fontWeight: '700',
    marginRight: rs(4),
  },
  inputField: {
    flex: 1,
    color: C.cream,
    fontSize: rs(14),
    fontWeight: '700',
    textAlign: 'right',
    paddingVertical: 0,
    // Android-specific style properties (ignored on iOS, valid in RN StyleSheet)
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },

  /* Liabilities */
  liabCard: {
    backgroundColor: C.bg2,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: `${C.error}33`,
    padding: rs(14),
    ...CARD_SHADOW,
  },
  liabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg2,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: rs(16),
    paddingHorizontal: rs(20),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(12),
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    height: rs(36),
    backgroundColor: C.border,
  },
  footerLabel: {
    fontSize: rs(11),
    color: C.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: rs(4),
  },
  footerVal: {
    fontSize: rs(20),
    fontWeight: '800',
    color: C.cream,
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rs(12),
    borderWidth: 1,
    paddingVertical: rs(9),
  },
  eligibilityText: {
    fontSize: rs(13),
    fontWeight: '700',
    marginLeft: rs(7),
  },

  /* Modal */
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  modalCard: {
    backgroundColor: C.bg2,
    borderRadius: rs(24),
    padding: rs(26),
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: rs(60),
    height: rs(60),
    borderRadius: rs(30),
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: C.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(16),
  },
  modalTitle: {
    fontSize: rs(18),
    fontWeight: '800',
    color: C.cream,
    marginBottom: rs(10),
    textAlign: 'center',
  },
  modalBody: {
    fontSize: rs(14),
    color: C.beige,
    lineHeight: rs(22),
    textAlign: 'center',
    marginBottom: rs(22),
  },
  modalBtnWrap: { width: '100%' },
  modalBtn: {
    backgroundColor: C.mint,
    borderRadius: rs(14),
    paddingVertical: rs(14),
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: rs(15),
    fontWeight: '800',
    color: C.bg0,
  },
});