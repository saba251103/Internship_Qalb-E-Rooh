import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/* ================= TYPES ================= */

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

type FeatureItem = {
  label: string;
  icon: MaterialIconName;
  route: string;
};

type FeatureSection = {
  title: string;
  items: FeatureItem[];
};

/* ================= DATA ================= */

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: "Featured",
    items: [
      { label: "Ummah\nPro", icon: "forum" ,route:'/'},
      { label: "Journal", icon: "menu-book",route:'./journal' },
    ],
  },
  {
    title: "Deen",
    items: [
      { label: "Prayer\nTimes", icon: "access-time",route: "./prayer"},
      { label: "Quran", icon: "menu-book",route:'/' },
      { label: "Tasbih", icon: "bubble-chart",route:'./tasbeeh' },
      { label: "Qibla", icon: "explore",route:'./qibla' },
      { label: "Duas", icon: "pan-tool-alt",route:'/tasbeeh' },
      { label: "Khatam", icon: "auto-stories" ,route:'/tasbeeh'},
      { label: "Mosques", icon: "mosque",route:'./mosque' },
      { label: "Daily Deen", icon: "nights-stay",route:'/tasbeeh' },
      { label: "Learn", icon: "psychology",route:'/tasbeeh' },
      { label: "Immerse", icon: "headset",route:'/tasbeeh' },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Quests", icon: "extension",route:'/tasbeeh' },
      { label: "Deen\nMode", icon: "alarm",route:'/tasbeeh' },
      { label: "Ask\nRubina", icon: "smart-toy",route:'/tasbeeh' },
      { label: "Qalbox", icon: "play-arrow" ,route:'/tasbeeh'},
      { label: "Inspiration", icon: "lightbulb-outline",route:'/tasbeeh' },
      { label: "Greeting\nMessages", icon: "mark-email-read",route:'/tasbeeh' },
      { label: "Ummah\nPro", icon: "forum",route:'/tasbeeh' },
      { label: "Blog", icon: "article" ,route:'/tasbeeh'},
    ],
  },
  {
    title: "Utility",
    items: [
      { label: "Journal", icon: "menu-book",route:'./journal' },
      { label: "Tracker", icon: "show-chart" ,route:'./tracker'},
      { label: "Calendar", icon: "calendar-today",route:'/tasbeeh' },
      { label: "Zakat", icon: "calculate",route:'./zakat' },
      { label: "Shahadah", icon: "grid-view",route:'./kalima' },
      { label: "Names", icon: "translate" ,route:'/tasbeeh'},
      { label: "Halal", icon: "ramen-dining",route:'/tasbeeh' },
      { label: "Widgets", icon: "dashboard-customize" ,route:'/tasbeeh'},
    ],
  },
  {
    title: "Hajj",
    items: [
      { label: "Makkah\nLive", icon: "play-circle-outline" ,route:'/tasbeeh'},
      { label: "Hajj &\nUmrah", icon: "account-balance",route:'/tasbeeh' },
      { label: "Hajj\nJourney", icon: "location-on" ,route:'/tasbeeh'},
    ],
  },
];

/* ================= SCREEN ================= */
export default function IslamicFeaturesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("../../(tabs)")}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Features</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {FEATURE_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.grid}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.card}
                  activeOpacity={0.75}
                  // ADDED: Navigation handler
                  onPress={() => router.push(item.route as any)}
                >
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <MaterialIcons
                    name={item.icon}
                    size={32}
                    color="#0a3d3d"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a3d3d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#0d4a4a",
    marginTop: "10%", 
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#9FE0C3",
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardLabel: {
    color: "#0a3d3d",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    flex: 1,
    textAlign: "center",
  },
  bottomSpace: {
    height: 80,
  },
});
