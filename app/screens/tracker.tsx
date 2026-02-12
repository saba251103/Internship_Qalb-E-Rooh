import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // 1. Import useRouter
import moment from "moment-hijri";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

type Prayer = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
const prayers: Prayer[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const prayerArabic = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

export default function NamazTracker() {
  const router = useRouter(); // 2. Initialize router
  const today = moment().format("YYYY-MM-DD");
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [allData, setAllData] = useState<any>({});
  const [prayerState, setPrayerState] = useState<Record<Prayer, boolean>>({
    Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false,
  });
  const [isFasting, setIsFasting] = useState(false);
  const [calendarMarkings, setCalendarMarkings] = useState<any>({});
  const [monthlyFastingCount, setMonthlyFastingCount] = useState(0);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", message: "", icon: "" });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (allData[selectedDate]) {
      setPrayerState(allData[selectedDate].prayers || {});
      setIsFasting(allData[selectedDate].fasting || false);
    } else {
      setPrayerState({ Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false });
      setIsFasting(false);
    }
    generateCalendarMarkings(allData);
    calculateMonthlyFasting(allData, selectedDate);
  }, [selectedDate, allData]);

  const loadData = async () => {
    const stored = await AsyncStorage.getItem("namazData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setAllData(parsed);
    }
  };

  const calculateMonthlyFasting = (data: any, date: string) => {
    const currentMonth = moment(date).format("YYYY-MM");
    const count = Object.keys(data).filter(key => 
      key.startsWith(currentMonth) && data[key].fasting === true
    ).length;
    setMonthlyFastingCount(count);
  };

  const showMashaAllah = (type: 'fasting' | 'prayers') => {
    const config = type === 'fasting' 
      ? { title: "MashaAllah! ✨", message: "Your fast has been recorded. May Allah accept your sacrifice and grant you the highest rewards.", icon: "star-face" }
      : { title: "MashaAllah! 🤲", message: "All prayers for today are complete! Your dedication to your Salah is beautiful.", icon: "check-decagram" };
    
    setModalConfig(config);
    setModalVisible(true);
  };

  const saveData = async (updatedPrayers: any, updatedFasting: boolean, triggeredBy: 'prayer' | 'fasting') => {
    const newData = {
      ...allData,
      [selectedDate]: { prayers: updatedPrayers, fasting: updatedFasting },
    };
    
    setAllData(newData);
    await AsyncStorage.setItem("namazData", JSON.stringify(newData));

    if (triggeredBy === 'fasting' && updatedFasting) {
      showMashaAllah('fasting');
    } else if (triggeredBy === 'prayer') {
      const allDone = Object.values(updatedPrayers).every(Boolean);
      if (allDone) showMashaAllah('prayers');
    }
  };

  const generateCalendarMarkings = (data: any) => {
    let marked: any = {};
    Object.keys(data).forEach((date) => {
      const day = data[date];
      const pCount = Object.values(day.prayers || {}).filter(Boolean).length;
      const fasting = day.fasting;

      let bgColor = "transparent";
      if (pCount === 5) bgColor = "#10B981"; 
      else if (pCount > 0) bgColor = "rgba(16, 185, 129, 0.4)"; 

      marked[date] = {
        customStyles: {
          container: {
            backgroundColor: bgColor,
            borderRadius: 8,
            borderWidth: fasting ? 2 : 0,
            borderColor: "#6EE7B7",
          },
          text: { color: "#FFFFFF", fontWeight: "700" },
        },
      };
    });

    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: "rgba(255, 255, 255, 0.2)",
    };
    setCalendarMarkings(marked);
  };

  const togglePrayer = (prayer: Prayer) => {
    const updated = { ...prayerState, [prayer]: !prayerState[prayer] };
    setPrayerState(updated);
    saveData(updated, isFasting, 'prayer');
  };

  const toggleFasting = () => {
    const updated = !isFasting;
    setIsFasting(updated);
    saveData(prayerState, updated, 'fasting');
  };

  return (
    <LinearGradient colors={["#0A4A4A", "#073333", "#041F1F"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          {/* 3. Back Arrow Implementation */}
          <TouchableOpacity 
            onPress={() => router.push("./features")} 
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#FFF" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Prayer Tracker</Text>
            <Text style={styles.hijriText}>{moment(selectedDate).format("iD iMMMM iYYYY")} AH</Text>
          </View>

          <View style={styles.monthlyStats}>
            <Text style={styles.monthLabel}>{moment(selectedDate).format("MMMM")}</Text>
            <View style={styles.mintBadge}>
              <Text style={styles.mintBadgeText}>{monthlyFastingCount} Fasts</Text>
            </View>
          </View>
        </View>

        {/* Calendar Wrapper */}
        <View style={styles.calendarWrapper}>
          <Calendar
            markingType="custom"
            markedDates={calendarMarkings}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            theme={{
              calendarBackground: "transparent",
              textSectionTitleColor: "#6EE7B7",
              dayTextColor: "#FFFFFF",
              todayTextColor: "#FCD34D",
              monthTextColor: "#FFFFFF",
              arrowColor: "#FFFFFF",
              textDisabledColor: "rgba(255,255,255,0.2)",
            }}
          />
        </View>

        {/* Action Content */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Daily Worship — {moment(selectedDate).format("MMM D")}</Text>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={toggleFasting} 
            style={[styles.fastingCard, isFasting && styles.fastingActive]}
          >
            <MaterialCommunityIcons 
              name={isFasting ? "moon-waning-crescent" : "white-balance-sunny"} 
              size={26} 
              color={isFasting ? "#0A4A4A" : "#9CA3AF"} 
            />
            <View style={{flex: 1, marginLeft: 12}}>
                <Text style={[styles.fastingLabel, isFasting && styles.textMintDark]}>Sawm (Fasting)</Text>
                <Text style={styles.fastingSubText}>{isFasting ? "Alhamdulillah, fasting recorded!" : "Tap to record today's fast"}</Text>
            </View>
            {isFasting && <MaterialCommunityIcons name="check-circle" size={22} color="#0A4A4A" />}
          </TouchableOpacity>

          {prayers.map((prayer) => (
            <TouchableOpacity
              key={prayer}
              activeOpacity={0.7}
              onPress={() => togglePrayer(prayer)}
              style={[styles.prayerRow, prayerState[prayer] && styles.prayerRowActive]}
            >
              <View style={styles.prayerInfo}>
                <View style={[styles.checkbox, prayerState[prayer] && styles.checkboxChecked]}>
                  {prayerState[prayer] && <MaterialCommunityIcons name="check" size={16} color="#FFF" />}
                </View>
                <Text style={[styles.prayerName, prayerState[prayer] && styles.textWhite]}>{prayer}</Text>
              </View>
              <Text style={[styles.prayerArabic, prayerState[prayer] && styles.textWhite]}>{prayerArabic[prayer]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* MashaAllah Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name={modalConfig.icon as any} size={64} color="#0A4A4A" />
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalSub}>{modalConfig.message}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Alhamdulillah</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 40 },
  header: { paddingHorizontal: 15, marginBottom: 25, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }, // Added style for button
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#FFF", letterSpacing: -0.5 },
  hijriText: { color: "#6EE7B7", fontSize: 13, fontWeight: "600" },
  
  monthlyStats: { alignItems: 'flex-end' },
  monthLabel: { fontSize: 10, fontWeight: "800", color: "#6EE7B7", textTransform: 'uppercase', letterSpacing: 1 },
  mintBadge: { backgroundColor: '#6EE7B7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 4 },
  mintBadgeText: { color: '#0A4A4A', fontWeight: '900', fontSize: 13 },
  
  calendarWrapper: { 
    backgroundColor: "rgba(255,255,255,0.06)", 
    marginHorizontal: 15, 
    borderRadius: 20, 
    padding: 10, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.1)" 
  },

  contentSection: { paddingHorizontal: 20 },
  sectionTitle: { color: "#6EE7B7", fontSize: 12, fontWeight: "800", textTransform: 'uppercase', marginBottom: 15 },
  
  fastingCard: { backgroundColor: "#FFF", flexDirection: "row", padding: 18, borderRadius: 20, alignItems: "center", marginBottom: 15 },
  fastingActive: { backgroundColor: "#6EE7B7" },
  fastingLabel: { fontSize: 16, fontWeight: "700", color: "#374151" },
  fastingSubText: { fontSize: 12, color: "#6B7280" },
  textMintDark: { color: "#0A4A4A" },

  prayerRow: { backgroundColor: "rgba(255,255,255,0.1)", flexDirection: "row", justifyContent: "space-between", padding: 18, borderRadius: 16, marginBottom: 10, alignItems: "center" },
  prayerRowActive: { backgroundColor: "#10B981" },
  prayerInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#6EE7B7", justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: "#0A4A4A", borderColor: "#0A4A4A" },
  prayerName: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  prayerArabic: { color: "rgba(255,255,255,0.4)", fontSize: 18, fontWeight: 'bold' },
  textWhite: { color: "#FFF" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFF", padding: 30, borderRadius: 25, alignItems: "center", width: "85%" },
  modalTitle: { fontSize: 24, fontWeight: "800", color: "#0A4A4A", marginTop: 15 },
  modalSub: { fontSize: 15, color: "#4B5563", textAlign: "center", marginTop: 10, marginBottom: 25, lineHeight: 22 },
  closeBtn: { backgroundColor: "#0A4A4A", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 15 },
  closeBtnText: { color: "#FFF", fontWeight: "700" },
});