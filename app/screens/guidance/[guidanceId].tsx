import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  GuidanceCategory,
  GuidanceForTheHeart,
  mockData,
} from "../../../data/mockData";

/* ================= SCREEN ================= */

export default function GuidanceDetailsScreen() {
  const { guidanceId } = useLocalSearchParams<{ guidanceId: string }>();
  const router = useRouter();

  const guidance: GuidanceForTheHeart | undefined =
    mockData.guidanceForTheHeart.find(
      (g) => g.id === guidanceId
    );

  const [selectedCategory, setSelectedCategory] =
    useState<GuidanceCategory | null>(null);

  if (!guidance) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Guidance not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* ---------- HEADER ---------- */}
      {!selectedCategory && (
        <View style={styles.headerContainer}>
          <Image
            source={guidance.imageUrl}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {guidance.name}
            </Text>
          </View>
        </View>
      )}

      {/* ---------- CATEGORY GRID ---------- */}
      {!selectedCategory && guidance.categories.length > 0 && (
        <View style={styles.categoryGrid}>
          {guidance.categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryButton}
              onPress={() => setSelectedCategory(cat)}
            >
              {/* Category Image */}
              <Image
                source={guidance.imageUrl}
                style={styles.categoryImage}
                resizeMode="cover"
              />
              
              {/* Category Name */}
              <Text style={styles.categoryButtonText}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ---------- CATEGORY VIDEOS ---------- */}
      {selectedCategory && (
        <>
          <View style={styles.categoryHeader}>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.categoryHeaderText}>
              {selectedCategory.name}
            </Text>
          </View>

          {selectedCategory.videoUrls.map((url) => (
            <YouTubeTile
              key={url}
              url={url}
              fallbackImage={guidance.imageUrl}
              router={router}
            />
          ))}
        </>
      )}

      {/* ---------- DIRECT VIDEOS (NO CATEGORIES) ---------- */}
      {!selectedCategory &&
        guidance.categories.length === 0 &&
        guidance.videoUrls.map((url) => (
          <YouTubeTile
            key={url}
            url={url}
            fallbackImage={guidance.imageUrl}
            router={router}
          />
        ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

/* ================= YOUTUBE TILE ================= */

function YouTubeTile({
  url,
  fallbackImage,
  router,
}: {
  url: string;
  fallbackImage: any;
  router: any;
}) {
  const [title, setTitle] = useState("");
  const [thumb, setThumb] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const id = extractYouTubeId(url);
    if (!id) return;

    setThumb(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);

    fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
        url
      )}`
    )
      .then((r) => r.json())
      .then((d) => setTitle(d.title))
      .catch(() => {});
  }, [url]);

  return (
    <View style={styles.videoTile}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/webview",
            params: { url },
          })
        }
      >
        {/* Video Thumbnail */}
        <View style={styles.videoImageContainer}>
          <Image
            source={thumb ? { uri: thumb } : fallbackImage}
            style={styles.videoImage}
            resizeMode="cover"
          />
        </View>

        {/* Play Icon */}
        <View style={styles.playIconContainer}>
          <Ionicons
            name="play-circle"
            size={64}
            color="rgba(255,255,255,0.95)"
          />
        </View>
      </TouchableOpacity>

      {/* Title + Like */}
      <View style={styles.videoInfoContainer}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {title}
        </Text>

        <TouchableOpacity onPress={() => setLiked(!liked)}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={28}
            color={liked ? "red" : "white"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= HELPERS ================= */

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a4a4a",
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a4a4a",
  },
  notFoundText: {
    color: "white",
    fontSize: 16,
  },
  headerContainer: {
    height: 350,
    position: "relative",
  },
  headerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  headerTitleContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  categoryGrid: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryButton: {
    width: "48%",
    height: 180,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  
    borderWidth: 2,
    borderColor: "#7be8c2",
  
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  
  categoryImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    opacity: 0.25,
  },
  categoryOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  
  categoryIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139, 157, 157, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  categoryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  
  categoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: "10%",
  },
  categoryHeaderText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  videoTile: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#7be8c2",
    overflow: "hidden",
    backgroundColor: "black",
  },
  videoImageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "black",
  },
  videoImage: {
    width: "100%",
    height: "100%",
  },
  playIconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  videoInfoContainer: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a4a4a",
  },
  videoTitle: {
    flex: 1,
    color: "white",
    fontWeight: "600",
    fontSize: 15,
    marginRight: 12,
  },
  bottomSpacer: {
    height: 96,
  },
});