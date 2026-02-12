import { mockData, Song } from "@/data/mockData";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ================= RESPONSIVE UTILITIES ================= */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scaleWidth = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleHeight = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scaleWidth(size) - size) * factor;

/* ================= SCREEN ================= */

export default function MusicPlayerScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const router = useRouter();

  const song: Song | undefined =
    mockData.recentlyPlayed.find((s) => s.id.toString() === songId) ??
    mockData.genreSongs("").find((s) => s.id.toString() === songId);

  if (!song) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Song not found</Text>
      </View>
    );
  }

  /* ---------- AUDIO STATE ---------- */

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(song.isLiked ?? false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  /* ---------- AUDIO LIFECYCLE ---------- */

  useEffect(() => {
    setupAndPlay();

    return () => {
      stopAndUnload();
    };
  }, []);

  const setupAndPlay = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    await playMusic();
  };

  const playMusic = async () => {
    await stopAndUnload();

    try {
      const { sound } = await Audio.Sound.createAsync(
        song.audioURL,
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio load error:", error);
    }
  };

  const stopAndUnload = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.warn("Audio cleanup error:", error);
      } finally {
        soundRef.current = null;
      }
    }
  };

  const togglePlayback = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    setPosition(status.positionMillis);
    setDuration(status.durationMillis ?? 1);
    setIsPlaying(status.isPlaying);
  };

  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    return `${Math.floor(total / 60)
      .toString()
      .padStart(2, "0")}:${(total % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  const handleBack = async () => {
    await stopAndUnload();
    router.back();
  };

  /* ================= UI ================= */

  return (
    <LinearGradient
      colors={["#9FF0D0", "#4FA3A3", "#0a4a4a"]}
      locations={[0, 0.45, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Ionicons
              name="chevron-down"
              size={moderateScale(28)}
              color="white"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Now Playing</Text>

          <TouchableOpacity style={styles.headerButton}>
            <Ionicons
              name="ellipsis-vertical"
              size={moderateScale(22)}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* ALBUM ART */}
        <View style={styles.albumContainer}>
          <Image
            source={song.albumArt}
            resizeMode="cover"
            style={styles.albumArt}
          />
        </View>

        {/* SONG INFO */}
        <View style={styles.songInfo}>
          <View style={styles.songTextContainer}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsLiked(!isLiked)}
            style={styles.likeButton}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={moderateScale(26)}
              color={isLiked ? "#9FF0D0" : "white"}
            />
          </TouchableOpacity>
        </View>

        {/* SLIDER */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={async (v) => {
              if (soundRef.current) {
                await soundRef.current.setPositionAsync(v);
              }
            }}
            minimumTrackTintColor="#9FF0D0"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#9FF0D0"
          />

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* CONTROLS */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons
              name="skip-previous"
              size={moderateScale(36)}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={moderateScale(36)}
              color="#0a4a4a"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons
              name="skip-next"
              size={moderateScale(36)}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  notFound: {
    flex: 1,
    backgroundColor: "#0a4a4a",
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    color: "white",
    fontSize: moderateScale(16),
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(8),
    paddingBottom: scaleHeight(10),
  },
  headerButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "500",
    opacity: 0.9,
  },

  albumContainer: {
    alignItems: "center",
    marginTop: scaleHeight(16),
    marginBottom: scaleHeight(24),
  },
  albumArt: {
    width: Math.min(SCREEN_WIDTH * 0.8, scaleWidth(320)),
    height: Math.min(SCREEN_WIDTH * 0.8, scaleWidth(320)) * (4 / 3),
    borderRadius: moderateScale(18),
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(24),
    shadowOffset: { width: 0, height: moderateScale(12) },
    elevation: 14,
  },

  songInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleWidth(24),
    marginBottom: scaleHeight(20),
  },
  songTextContainer: {
    flex: 1,
    marginRight: scaleWidth(12),
  },
  songTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: moderateScale(22),
  },
  songArtist: {
    color: "rgba(255,255,255,0.8)",
    marginTop: scaleHeight(4),
    fontSize: moderateScale(16),
  },
  likeButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: "center",
    alignItems: "center",
  },

  sliderContainer: {
    paddingHorizontal: scaleWidth(24),
    marginTop: scaleHeight(8),
  },
  slider: {
    width: "100%",
    height: moderateScale(40),
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scaleHeight(4),
  },
  timeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: moderateScale(12),
  },

  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scaleHeight(28),
  },
  controlButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "#9FF0D0",
    width: Math.min(SCREEN_WIDTH * 0.18, moderateScale(78)),
    height: Math.min(SCREEN_WIDTH * 0.18, moderateScale(78)),
    borderRadius:
      Math.min(SCREEN_WIDTH * 0.18, moderateScale(78)) / 2,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: scaleWidth(28),
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(10),
    shadowOffset: { width: 0, height: moderateScale(4) },
    elevation: 10,
  },

  bottomSpacer: {
    height: scaleHeight(34),
  },
});
