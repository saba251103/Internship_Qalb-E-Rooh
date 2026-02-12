import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CACHE_KEY = "mosque_cache_v4";

const COLORS = {
  primary: "#0D5C5C",
  primaryLight: "#167373",
  primaryDark: "#063B3B",
  accent: "#4FA3A3",
  background: "#EEF3F3",
  surface: "#FFFFFF",
  textMain: "#1A2332",
  textSecondary: "#425466",
  textMuted: "#6B7280",
  border: "#D6E0E0",
  white: "#FFFFFF",
};

export default function NearbyMosquesList() {
  const [mosques, setMosques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [fadeAnim] = useState(new Animated.Value(0));
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Location required to find mosques.");
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return loc.coords;
  };

  // ✅ SAFE FETCH
  const fetchMosques = async (lat: number, lng: number) => {
    const delta = 0.06;
    const query = `
      [out:json][timeout:25];
      (
        nwr["amenity"="place_of_worship"]["religion"="muslim"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
        nwr["building"="mosque"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
        nwr["name"~"mosque|masjid", i](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
      );
      out center tags;
    `;

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      const text = await res.text();

      if (!text.startsWith("{")) {
        console.log("Overpass non-JSON response:", text.slice(0, 100));
        return [];
      }

      const data = JSON.parse(text);
      return data.elements || [];
    } catch (e) {
      console.log("Overpass fetch failed", e);
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const coords = await getLocation();
        if (!coords) return setLoading(false);

        setUserCoords(coords);

        const cache = await AsyncStorage.getItem(CACHE_KEY);
        if (cache) setMosques(JSON.parse(cache));

        const fresh = await fetchMosques(coords.latitude, coords.longitude);

        const unique: any = {};
        fresh.forEach((m: any) => {
          const lat = m.lat || m.center?.lat;
          const lon = m.lon || m.center?.lon;
          const name = m.tags?.name || "Masjid";
          if (lat && lon) unique[name + lat] = { ...m, lat, lon };
        });

        const arr = Object.values(unique);
        setMosques(arr);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(arr));
      } catch {
        Alert.alert("Error", "Could not load mosque data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const mosquesWithDistance = useMemo(() => {
    if (!userCoords) return [];
    return mosques
      .map((m: any) => ({
        ...m,
        distance: getDistance(userCoords.latitude, userCoords.longitude, m.lat, m.lon),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [mosques, userCoords]);

  const openDirections = (lat: number, lon: number, label = "Masjid") => {
    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lon}`,
      android: `geo:0,0?q=${lat},${lon}(${label})`,
    });
    Linking.openURL(scheme!);
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.loader}>
        <MaterialCommunityIcons name="mosque" size={100} color={COLORS.accent} />
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={styles.loadingSubtext}>Finding nearby masjids…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Masjid Finder</Text>
            <TouchableOpacity onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}>
              <MaterialCommunityIcons
                name={viewMode === "list" ? "map" : "format-list-bulleted"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {viewMode === "list" ? (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={mosquesWithDistance}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => openDirections(item.lat, item.lon)}>
                <FontAwesome5 name="mosque" size={18} color={COLORS.primary} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.mosqueName}>{item.tags?.name || "Masjid"}</Text>
                  <Text style={styles.distanceText}>{item.distance.toFixed(2)} km away</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      ) : (
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          {mosquesWithDistance.map((m: any) => (
            <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lon }}>
              <Callout onPress={() => openDirections(m.lat, m.lon)}>
                <Text>{m.tags?.name || "Masjid"}</Text>
                <Text>{m.distance.toFixed(2)} km</Text>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingSubtext: { color: "white", marginTop: 10 },
  header: { padding: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },
  mosqueName: { fontSize: 16, fontWeight: "bold", color: COLORS.textMain },
  distanceText: { color: COLORS.textSecondary, marginTop: 3 },
});
