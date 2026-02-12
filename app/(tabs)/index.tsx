import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Genre, GuidanceForTheHeart, mockData, Song } from "../../data/mockData";

const { width } = Dimensions.get("window");

/* ---------------- CAROUSEL ---------------- */

const carouselImages = [
  require("../../assets/carousel/one.png"),
  require("../../assets/carousel/two.png"),
  require("../../assets/carousel/three.png"),
];

/* ---------------- FEATURES ---------------- */

const features = [
  { icon: "explore", label: "Qibla" },
  { icon: "pan-tool-alt", label: "Duas" },
  { icon: "bubble-chart", label: "Tasbih" },
  { icon: "menu-book", label: "Journal" },
];

/* ================= SCREEN ================= */

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Qalberooh</Text>

        <Link href="/screens/search" asChild>
          <TouchableOpacity>
            <Ionicons name="search" size={26} color="#7be8c2" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* ---------- CAROUSEL ---------- */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carouselContainer}
      >
        {carouselImages.map((item, index) => (
          <View key={index} style={{ width: width - 40 }}>
            <Image
              source={item}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* ---------- FEATURES ---------- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Features</Text>
        <Link href="/screens/features" asChild>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialIcons name={f.icon as any} size={28} color="#0d5b5b" />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* ---------- RECENTLY PLAYED ---------- */}
      <Text style={styles.sectionTitle}>Recently Played</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.recentlyPlayedContainer}
      >
        {mockData.recentlyPlayed.map((song: Song) => (
          <Link
            key={song.id}
            href={{
              pathname: "/screens/player/[songId]",
              params: { songId: song.id },
            }}
            asChild
          >
            <TouchableOpacity style={styles.songCard}>
              <Image
                source={song.albumArt}
                style={styles.songImage}
              />
              <Text style={styles.songTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {song.artist}
              </Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>

      {/* ---------- GENRES ---------- */}
      <Text style={styles.sectionTitle}>Capella Songs</Text>

      <GenreGrid data={mockData.genres} />

      {/* ---------- GUIDANCE ---------- */}
      <Text style={styles.sectionTitle}>Guidance for the Heart</Text>

      <GuidanceGrid data={mockData.guidanceForTheHeart} />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

/* ================= GENRE GRID ================= */

function GenreGrid({ data }: { data: Genre[] }) {
  return (
    <View style={styles.gridContainer}>
      {data.map((item) => (
        <Link
          key={item.id}
          href={{
            pathname: "/screens/genre/[genreId]",
            params: { genreId: item.id },
          }}
          asChild
        >
          <TouchableOpacity style={styles.genreCard}>
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
            <Text style={styles.genreTitle}>{item.name}</Text>
          </TouchableOpacity>
        </Link>
      ))}
    </View>
  );
}

/* ================= GUIDANCE GRID ================= */

function GuidanceGrid({ data }: { data: GuidanceForTheHeart[] }) {
  return (
    <View style={styles.gridContainer}>
      {data.map((item) => (
        <Link
          key={item.id}
          href={{
            pathname: "/screens/guidance/[guidanceId]",
            params: { guidanceId: item.id },
          }}
          asChild
        >
          <TouchableOpacity style={styles.genreCard}>
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
            <Text style={styles.genreTitle}>{item.name}</Text>
          </TouchableOpacity>
        </Link>
      ))}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a4a4a',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7be8c2',
  },
  carouselContainer: {
    marginBottom: 24,
  },
  carouselImage: {
    width: width - 40,
    height: 200,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#7be8c2',
    fontWeight: '500',
    fontSize: 14,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featureItem: {
    alignItems: 'center',
    width: '22%',
  },
  featureIcon: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: '#7be8c2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 14,
    color: '#ffffff',
  },
  recentlyPlayedContainer: {
    marginBottom: 32,
  },
  songCard: {
    marginRight: 16,
    width: 140,
  },
  songImage: {
    height: 140,
    width: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  songTitle: {
    fontWeight: '600',
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 13,
    color: '#7a9999',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  genreCard: {
    width: '48%',
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#0d4444',
    position: 'relative',
    textAlign:'center',
  },
  cardBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  darkOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButtonTopLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  genreTitle: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    zIndex: 10,
  },
});