import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Genre, mockData, Song } from "@/data/mockData";

/* ---------------- RESPONSIVE UTILS ---------------- */
const { width, height } = Dimensions.get("window");

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scaleWidth = (size: number) => (width / BASE_WIDTH) * size;
const scaleHeight = (size: number) => (height / BASE_HEIGHT) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scaleWidth(size) - size) * factor;

/* ---------------- COLORS (TEAL THEME) ---------------- */
const COLORS = {
  background: "#063B3B",
  card: "#0B4F4F",
  accent: "#1ECAD3",
  border: "#2FE6C8",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.75)",
  overlay: "rgba(0,0,0,0.45)",
};

/* ---------------- SCREEN ---------------- */
export default function GenreDetailScreen() {
  const { genreId } = useLocalSearchParams<{ genreId: string }>();

  const genre: Genre | undefined = mockData.genres.find(
    (g) => g.id === genreId
  );

  const songs: Song[] = mockData.genreSongs(genreId ?? "");

  if (!genre) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Genre not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Image
          source={genre.imageUrl}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{genre.name}</Text>
        </View>
      </View>

      {/* ---------- FEATURED PLAYLISTS ---------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Playlists</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playlistScrollContent}
        >
          {[0, 1, 2].map((index) => (
            <View key={index} style={styles.playlistCard}>
              <Image
                source={require("../../../assets/images/playlist.png")}
                style={styles.playlistImage}
              />

              <View style={styles.playlistInfo}>
                <Text style={styles.playlistTitle} numberOfLines={1}>
                  Best of {genre.name}
                </Text>
                <Text style={styles.playlistSubtitle}>
                  {15 + index * 5} songs
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ---------- POPULAR SONGS ---------- */}
      <View style={styles.songsSection}>
        <Text style={styles.sectionTitle}>Popular Songs</Text>
      </View>

      {songs.map((song) => (
        <Link
          key={song.id}
          href={{
            pathname: "/screens/player/[songId]" as const,
            params: { songId: song.id.toString() },
          }}
          asChild
        >
          <TouchableOpacity style={styles.songItem}>
            <Image source={song.albumArt} style={styles.songAlbumArt} />

            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {song.artist}
              </Text>
            </View>

            <View style={styles.songActions}>
              <Text style={styles.songDuration}>04:00</Text>
              <Ionicons
                name="ellipsis-vertical"
                size={moderateScale(18)}
                color={COLORS.accent}
              />
            </View>
          </TouchableOpacity>
        </Link>
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: COLORS.textPrimary,
    fontSize: moderateScale(16),
  },

  /* Header */
  header: {
    height: scaleHeight(220),
  },
  headerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  headerTextContainer: {
    position: "absolute",
    bottom: scaleHeight(16),
    left: scaleWidth(16),
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: moderateScale(30),
    fontWeight: "bold",
  },

  /* Sections */
  section: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(24),
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: moderateScale(20),
    fontWeight: "600",
    marginBottom: scaleHeight(16),
  },

  /* Playlists */
  playlistScrollContent: {
    paddingRight: scaleWidth(16),
  },
  playlistCard: {
    width: scaleWidth(160),
    marginRight: scaleWidth(16),
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: COLORS.border,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  playlistImage: {
    height: scaleHeight(112),
    width: "100%",
  },
  playlistInfo: {
    padding: moderateScale(10),
  },
  playlistTitle: {
    color: COLORS.textPrimary,
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  playlistSubtitle: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(12),
    marginTop: 2,
  },

  /* Songs */
  songsSection: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(32),
    paddingBottom: scaleHeight(8),
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  songAlbumArt: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(6),
    marginRight: scaleWidth(16),
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: COLORS.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  songArtist: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(13),
  },
  songActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  songDuration: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(13),
    marginRight: scaleWidth(12),
  },

  bottomSpacer: {
    height: scaleHeight(80),
  },
});
