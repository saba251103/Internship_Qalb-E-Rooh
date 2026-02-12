import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  GuidanceForTheHeart,
  mockData,
} from "../../data/mockData";

/* ================= SCREEN ================= */

export default function VideosScreen() {
  return (
    <View style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Videos</Text>
      </View>

      {/* ---------- GRID ---------- */}
      <FlatList
        data={mockData.guidanceForTheHeart}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <GuidanceCard item={item} />
        )}
      />
    </View>
  );
}

/* ================= CARD ================= */

function GuidanceCard({ item }: { item: GuidanceForTheHeart }) {
  return (
    <Link
      href={{
        pathname: "/screens/guidance/[guidanceId]",
        params: { guidanceId: item.id },
      }}
      asChild
    >
      <TouchableOpacity style={styles.card}>
        {/* Full Background Image */}
        <Image
          source={item.imageUrl}
          style={styles.cardBackgroundImage}
          resizeMode="cover"
        />
        
        {/* Dark Overlay */}
        <View style={styles.darkOverlay} />
        
        {/* Play Button - Top Left */}
        <View style={styles.playButtonTopLeft}>
          <Ionicons name="play-circle" size={40} color="white" />
        </View>
        
        {/* Title - Bottom Left */}
        <Text style={styles.cardTitle}>{item.name}</Text>
      </TouchableOpacity>
    </Link>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a4a4a",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#0d4444",
    position: "relative",
  },
  cardBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },
  darkOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  playButtonTopLeft: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
  },
  cardTitle: {
    position: "absolute",
    bottom: 16,
    left: 16,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 10,
  },
});