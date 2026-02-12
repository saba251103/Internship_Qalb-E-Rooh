import { Entypo } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { mockData } from "../../data/mockData";

/* ---------------------------------------------------
 * TAB TYPES
 * --------------------------------------------------- */

type TabType = "playlists" | "artists" | "albums";

/* ---------------------------------------------------
 * SCREEN
 * --------------------------------------------------- */

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("playlists");

  return (
    <View style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Library</Text>
      </View>

      {/* ---------- TABS ---------- */}
      <View style={styles.tabsContainer}>
        <TabButton
          label="Playlists"
          active={activeTab === "playlists"}
          onPress={() => setActiveTab("playlists")}
        />
        <TabButton
          label="Artists"
          active={activeTab === "artists"}
          onPress={() => setActiveTab("artists")}
        />
        <TabButton
          label="Albums"
          active={activeTab === "albums"}
          onPress={() => setActiveTab("albums")}
        />
      </View>

      {/* ---------- CONTENT ---------- */}
      {activeTab === "playlists" && <PlaylistsTab />}
      {activeTab === "artists" && <ArtistsTab />}
      {activeTab === "albums" && <AlbumsTab />}
    </View>
  );
}

/* ---------------------------------------------------
 * TAB BUTTON
 * --------------------------------------------------- */

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------------------------------------------------
 * PLAYLISTS TAB
 * --------------------------------------------------- */

function PlaylistsTab() {
  const playlists = [
    {
      name: "Liked Songs",
      count: mockData.likedSongs.length,
      image: require("../../assets/images/playlist.png"),
    },
    { name: "Workout Mix", count: 25 },
    { name: "Chill Vibes", count: 42 },
    { name: "Road Trip", count: 18 },
    { name: "Party Anthems", count: 30 },
  ];

  return (
    <FlatList
      data={playlists}
      keyExtractor={(item) => item.name}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.playlistItem}>
          <Image
            source={item.image ?? require("../../assets/images/playlist.png")}
            style={styles.playlistImage}
          />

          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName}>{item.name}</Text>
            <Text style={styles.playlistCount}>{item.count} songs</Text>
          </View>

          <TouchableOpacity style={styles.menuButton}>
            <Entypo name="dots-three-vertical" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

/* ---------------------------------------------------
 * ARTISTS TAB
 * --------------------------------------------------- */

function ArtistsTab() {
  const artists = Array.from(
    new Set(mockData.recentlyPlayed.map((song) => song.artist))
  );

  return (
    <FlatList
      data={artists}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.artistItem}>
          <Image
            source={require("../../assets/images/artist.png")}
            style={styles.artistImage}
          />

          <View>
            <Text style={styles.artistName}>{item}</Text>
            <Text style={styles.artistLabel}>Artist</Text>
          </View>
        </View>
      )}
    />
  );
}

/* ---------------------------------------------------
 * ALBUMS TAB (DEDUPED CORRECTLY)
 * --------------------------------------------------- */

function AlbumsTab() {
  const albumsMap = new Map<
    string,
    { name: string; artist: string; image: any }
  >();

  mockData.recentlyPlayed.forEach((song) => {
    const key = `${song.albumArt}-${song.artist}`;
    if (!albumsMap.has(key)) {
      albumsMap.set(key, {
        name: song.title,
        artist: song.artist,
        image: song.albumArt,
      });
    }
  });

  const albums = Array.from(albumsMap.values());

  return (
    <FlatList
      data={albums}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.albumItem}>
          <Image source={item.image} style={styles.albumImage} />

          <View>
            <Text style={styles.albumName}>{item.name}</Text>
            <Text style={styles.albumArtist}>{item.artist}</Text>
          </View>
        </View>
      )}
    />
  );
}

/* ---------------------------------------------------
 * STYLES
 * --------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a4a4a",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#1DB954",
  },
  tabButtonText: {
    fontWeight: "600",
    color: "white",
  },
  tabButtonTextActive: {
    color: "#1DB954",
  },
  listContent: {
    padding: 16,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 16,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  playlistCount: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  menuButton: {
    padding: 8,
  },
  artistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  artistImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  artistName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  artistLabel: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  albumItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  albumImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 16,
  },
  albumName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  albumArtist: {
    color: "rgba(255, 255, 255, 0.7)",
  },
});