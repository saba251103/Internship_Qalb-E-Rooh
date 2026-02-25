import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  View
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get("window");

// ─── CACHE & TIMEOUT CONFIG ─────────────────────────────────────────────────
const CACHE_KEY = "mosque_cache_v12";
const CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 Hours
const OVERPASS_TIMEOUT_MS = 10000; // 10 Seconds

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  emerald: "#0D5C5C",
  emeraldDeep: "#083F3F",
  emeraldLight: "#1A7A7A",
  gold: "#C8A96E",
  goldLight: "#E8CC96",
  cream: "#F7F4EF",
  parchment: "#EDE8DF",
  ink: "#1A1A2E",
  inkMuted: "#4A4A6A",
  inkFaint: "#9898B8",
  white: "#FFFFFF",
  border: "rgba(200, 169, 110, 0.2)",
  cardShadow: "#0D5C5C",
  success: "#2ECC8A",
  error: "#E74C3C"
};

const fontScale = (size: number) =>
  Platform.OS === "android" ? moderateScale(size, 0.3) : moderateScale(size);

const SHEET_HEIGHT = hp("45%");

// ─── UTILS ───────────────────────────────────────────────────────────────────
// Timeout wrapper for flaky APIs
const fetchWithTimeout = async (url: string, options: any, timeout = OVERPASS_TIMEOUT_MS) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
};

// ─── LOADER SCREEN ───────────────────────────────────────────────────────────
const LoaderScreen = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [opacityAnim, pulseAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={ls.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[T.emeraldDeep, T.emerald, T.emeraldLight]} style={StyleSheet.absoluteFill} />

      {/* Decorative rings */}
      <View style={[ls.ring, { width: 280, height: 280, borderColor: "rgba(200,169,110,0.08)" }]} />
      <View style={[ls.ring, { width: 200, height: 200, borderColor: "rgba(200,169,110,0.14)" }]} />
      <View style={[ls.ring, { width: 130, height: 130, borderColor: "rgba(200,169,110,0.22)" }]} />

      <Animated.View style={{ opacity: opacityAnim, alignItems: "center" }}>
        <Animated.View style={[ls.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={{ transform: [{ rotate }], position: "absolute", width: 110, height: 110 }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <View
                key={i}
                style={[
                  ls.ornamentDot,
                  { transform: [{ rotate: `${deg}deg` }, { translateY: -50 }], opacity: i % 2 === 0 ? 0.9 : 0.4 },
                ]}
              />
            ))}
          </Animated.View>
          <MaterialCommunityIcons name="mosque" size={moderateScale(46)} color={T.gold} />
        </Animated.View>

        <Text style={ls.title}>Masjid Finder</Text>
        <View style={ls.dividerRow}>
          <View style={ls.line} />
          <View style={ls.diamond} />
          <View style={ls.line} />
        </View>
        <ActivityIndicator color={T.gold} size="small" style={{ marginTop: verticalScale(28) }} />
        <Text style={ls.subtitle}>Locating sacred spaces near you</Text>
      </Animated.View>
    </View>
  );
};

// ─── MOSQUE CARD (Memoized for FlatList performance) ────────────────────────
const MosqueCard = React.memo(({ item, index, onPress }: { item: any; index: number; onPress: () => void }) => {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    // Only animate the first few to save CPU
    const delay = index < 8 ? index * 60 : 0;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, [index, opacityAnim, slideAnim]);

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();

  const km = item.distance ? item.distance.toFixed(1) : null;
  const isClose = item.distance && item.distance < 0.5;

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }], marginBottom: verticalScale(14) }}>
      <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={cs.card}>
          <View style={cs.indexBadge}><Text style={cs.indexText}>{String(index + 1).padStart(2, "0")}</Text></View>
          <View style={cs.iconWrap}>
            <LinearGradient colors={[T.emerald, T.emeraldDeep]} style={cs.iconGrad}>
              <FontAwesome5 name="mosque" size={moderateScale(18)} color={T.gold} />
            </LinearGradient>
          </View>
          <View style={cs.content}>
            <Text style={cs.name} numberOfLines={1}>{item.name || "Masjid"}</Text>
            <View style={cs.meta}>
              {km ? (
                <>
                  <View style={[cs.distDot, { backgroundColor: isClose ? T.success : T.gold }]} />
                  <Text style={[cs.dist, { color: isClose ? T.success : T.inkMuted }]}>
                    {isClose ? "Very close" : `${km} km away`}
                  </Text>
                </>
              ) : (
                <Text style={cs.dist}>Nearby</Text>
              )}
            </View>
          </View>
          <View style={cs.navBtn}>
            <Ionicons name="navigate" size={moderateScale(16)} color={T.white} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function NearbyMosquesList() {
  const router = useRouter();
  const [mosques, setMosques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapIsLoading, setMapIsLoading] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bottomSheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const headerAnim = useRef(new Animated.Value(-80)).current;
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(headerAnim, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }),
    ]).start();
    init();
  }, []);

  // Bottom Sheet Animation
  useEffect(() => {
    if (selectedMosque) {
      Animated.spring(bottomSheetAnim, { toValue: 0, useNativeDriver: true, friction: 9, tension: 55 }).start();
    } else {
      Animated.timing(bottomSheetAnim, { toValue: SHEET_HEIGHT, duration: 280, useNativeDriver: true }).start();
    }
  }, [selectedMosque, bottomSheetAnim]);

  // Map transition simulator
  useEffect(() => {
    if (viewMode === 'map') {
      setMapIsLoading(true);
      const timer = setTimeout(() => setMapIsLoading(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  const init = async () => {
    try {
      // 1. Check Cache with Expiry strategy
      const cache = await AsyncStorage.getItem(CACHE_KEY);
      let shouldUseCache = false;
      if (cache) {
        const parsed = JSON.parse(cache);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
          setMosques(parsed.data);
          shouldUseCache = true;
        }
      }

      // 2. Get Location
      const coords = await getLocation();
      if (!coords) { setLoading(false); return; }
      setUserCoords(coords);

      // 3. Fetch Fresh Data if Cache expired or empty
      if (!shouldUseCache) {
        const fresh = await fetchMosques(coords.latitude, coords.longitude);
        if (fresh.length > 0) {
          processAndCacheData(fresh);
        } else if (mosques.length === 0) {
          setErrorMsg("No masjids found in this area.");
        }
      }
    } catch (e) {
      if (mosques.length === 0) setErrorMsg("Connection error. Please try again later.");
    } finally { 
      setLoading(false); 
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need location access to find mosques near you.", [{ text: "OK" }]);
      return null;
    }
    return (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords;
  };

  const fetchMosques = async (lat: number, lng: number) => {
    const delta = 0.05;
    const query = `[out:json][timeout:10];(nwr["amenity"="place_of_worship"]["religion"="muslim"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});nwr["building"="mosque"](${lat - delta},${lng - delta},${lat + delta},${lng + delta}););out center tags;`;
    try {
      const res = await fetchWithTimeout("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
      return (await (res as Response).json()).elements || [];
    } catch {
      return []; 
    }
  };

  const processAndCacheData = async (fresh: any[]) => {
    const unique: Record<string, any> = {};
    fresh.forEach((m) => {
      const lat = m.lat || m.center?.lat;
      const lon = m.lon || m.center?.lon;
      const name = m.tags?.name || m.tags?.["name:en"] || "Masjid";
      if (lat && lon) unique[name + lat] = { ...m, lat, lon, name };
    });
    const arr = Object.values(unique);
    setMosques(arr);
    // Cache with timestamp
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: arr, timestamp: Date.now() }));
  };

  // Fixed zero-coordinate bug
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const mosquesWithDistance = useMemo(() => {
    if (!userCoords) return mosques;
    return mosques
      .map((m) => ({
        ...m,
        distance: getDistance(userCoords.latitude, userCoords.longitude, m.lat, m.lon),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [mosques, userCoords]);

  // Memoized Callback for FlatList items
  const openDirections = useCallback((lat: number, lon: number, label = "Masjid") => {
    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lon}`,
      android: `geo:0,0?q=${lat},${lon}(${label})`,
    });
    Linking.openURL(scheme!);
  }, []);

  // Memoized HTML to prevent heavy DOM re-rendering
  const mapHTML = useMemo(() => {
    const lat = userCoords?.latitude || 0;
    const lon = userCoords?.longitude || 0;
    const markersData = JSON.stringify(mosquesWithDistance);

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #EAE6DF; }
    #map { height: 100vh; width: 100vw; }
    .leaflet-control-attribution, .leaflet-control-zoom { display: none; }

    .mosque-pin {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #0D5C5C, #083F3F);
      border-radius: 50%;
      border: 2.5px solid #C8A96E;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(13,92,92,0.45);
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease;
      cursor: pointer;
    }
    .mosque-pin:hover { transform: scale(1.18); box-shadow: 0 8px 24px rgba(13,92,92,0.6); }
    .mosque-pin i { color: #C8A96E; font-size: 17px; }

    .user-dot {
      width: 18px; height: 18px;
      background: #4A8CF7;
      border-radius: 50%; border: 3px solid #fff;
      box-shadow: 0 0 0 0 rgba(74,140,247,0.55);
      animation: beacon 1.8s infinite;
    }
    @keyframes beacon {
      0%   { box-shadow: 0 0 0 0 rgba(74,140,247,0.55); }
      70%  { box-shadow: 0 0 0 14px rgba(74,140,247,0); }
      100% { box-shadow: 0 0 0 0 rgba(74,140,247,0); }
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lon}], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

  var mosques = ${markersData};
  mosques.forEach(function(m) {
    var icon = L.divIcon({
      className: '',
      html: '<div class="mosque-pin"><i class="fa-solid fa-mosque"></i></div>',
      iconSize: [44, 44], iconAnchor: [22, 22],
    });
    L.marker([m.lat, m.lon], { icon: icon })
      .addTo(map)
      .on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify(m));
        map.flyTo([m.lat, m.lon], 16, { animate: true, duration: 0.9 });
      });
  });

  var userIcon = L.divIcon({
    className: '',
    html: '<div class="user-dot"></div>',
    iconSize: [18, 18], iconAnchor: [9, 9],
  });
  L.marker([${lat}, ${lon}], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
</script>
</body>
</html>`;
  }, [mosquesWithDistance, userCoords]);

  if (loading && mosques.length === 0) return <LoaderScreen />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.emeraldDeep} />

      {/* ─── HEADER ─── */}
      <Animated.View style={{ transform: [{ translateY: headerAnim }], zIndex: 10 }}>
        <LinearGradient colors={[T.emeraldDeep, T.emerald]} style={styles.header}>
          <View style={styles.ornamentLine} />
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerInner}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.75}>
                <Ionicons name="arrow-back" size={moderateScale(20)} color={T.white} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <View style={styles.headerIconRow}>
                  <View style={styles.crownDot} />
                  <MaterialCommunityIcons name="mosque" size={moderateScale(16)} color={T.gold} />
                  <View style={styles.crownDot} />
                </View>
                <Text style={styles.headerTitle}>Masjid Finder</Text>
                <Text style={styles.headerCount}>
                  {mosquesWithDistance.length > 0 ? `${mosquesWithDistance.length} places found` : "Searching…"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setViewMode(viewMode === "list" ? "map" : "list");
                  setSelectedMosque(null);
                }}
                style={styles.headerBtn}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={viewMode === "list" ? "map-marker-radius-outline" : "view-list"} size={moderateScale(20)} color={T.gold} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View style={styles.headerTail} />
        </LinearGradient>
      </Animated.View>

      {/* ─── CONTENT ─── */}
      {viewMode === "list" ? (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {errorMsg || mosquesWithDistance.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name={errorMsg ? "wifi-off" : "mosque"} size={moderateScale(56)} color={errorMsg ? T.error : T.parchment} />
              <Text style={styles.emptyTitle}>{errorMsg ? "Network Issue" : "No masjids found"}</Text>
              <Text style={styles.emptyBody}>{errorMsg || "Try expanding the search radius or check your connection."}</Text>
              {errorMsg && (
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setErrorMsg(null); init(); }}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={mosquesWithDistance}
              keyExtractor={(item, idx) => (item.id || idx).toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              // Performance Optimizations
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={true}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <Text style={styles.sectionLabel}>Nearest to you</Text>
                  <View style={styles.sectionLine} />
                </View>
              }
              renderItem={({ item, index }) => (
                <MosqueCard item={item} index={index} onPress={() => openDirections(item.lat, item.lon, item.name)} />
              )}
            />
          )}
        </Animated.View>
      ) : (
        <View style={styles.mapWrap}>
          {mapIsLoading && (
            <View style={styles.mapOverlayLoader}>
              <ActivityIndicator size="large" color={T.emerald} />
              <Text style={styles.mapLoaderText}>Loading Map...</Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: mapHTML }}
            style={{ flex: 1, opacity: mapIsLoading ? 0 : 1 }}
            onMessage={(event) => {
              try { setSelectedMosque(JSON.parse(event.nativeEvent.data)); } catch {}
            }}
            javaScriptEnabled
            domStorageEnabled
          />

          {!selectedMosque && (
            <TouchableOpacity style={styles.fab} onPress={() => setViewMode("list")} activeOpacity={0.85}>
              <LinearGradient colors={[T.emerald, T.emeraldDeep]} style={styles.fabInner}>
                <MaterialCommunityIcons name="view-list" size={moderateScale(18)} color={T.gold} />
                <Text style={styles.fabText}>List View</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ─── BOTTOM SHEET ─── */}
          <Animated.View style={[styles.sheet, { transform: [{ translateY: bottomSheetAnim }] }]}>
            {selectedMosque && (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetTop}>
                  <LinearGradient colors={[T.emerald, T.emeraldDeep]} style={styles.sheetIcon}>
                    <FontAwesome5 name="mosque" size={moderateScale(22)} color={T.gold} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetName} numberOfLines={2}>{selectedMosque.name}</Text>
                    <View style={styles.sheetMeta}>
                      <View style={styles.distDot} />
                      <Text style={styles.sheetDist}>
                        {selectedMosque.distance ? `${selectedMosque.distance.toFixed(2)} km from you` : "Nearby"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedMosque(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.closeBtn}>
                    <Ionicons name="close" size={moderateScale(18)} color={T.inkMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.sheetDivider} />
                <TouchableOpacity activeOpacity={0.85} onPress={() => openDirections(selectedMosque.lat, selectedMosque.lon, selectedMosque.name)}>
                  <LinearGradient colors={[T.emerald, T.emeraldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dirBtn}>
                    <Text style={styles.dirBtnText}>Get Directions</Text>
                    <View style={styles.dirBtnIcon}><Ionicons name="navigate" size={moderateScale(16)} color={T.emerald} /></View>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center" },
  ring: { position: "absolute", borderRadius: 1000, borderWidth: 1 },
  iconWrap: {
    width: moderateScale(100), height: moderateScale(100), borderRadius: moderateScale(50),
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(200,169,110,0.3)",
    justifyContent: "center", alignItems: "center", marginBottom: verticalScale(28),
  },
  ornamentDot: { position: "absolute", width: 5, height: 5, borderRadius: 2.5, backgroundColor: T.gold, alignSelf: "center", top: "50%" },
  title: { fontSize: fontScale(30), fontWeight: "800", color: T.white, letterSpacing: 2, textTransform: "uppercase" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: verticalScale(12), gap: 10 },
  line: { width: 40, height: 1, backgroundColor: T.gold, opacity: 0.5 },
  diamond: { width: 6, height: 6, backgroundColor: T.gold, transform: [{ rotate: "45deg" }] },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: fontScale(13), letterSpacing: 1, marginTop: verticalScale(12) },
});

const cs = StyleSheet.create({
  card: {
    backgroundColor: T.white, borderRadius: moderateScale(18), flexDirection: "row", alignItems: "center",
    paddingHorizontal: scale(16), paddingVertical: verticalScale(14), borderWidth: 1, borderColor: T.border,
    shadowColor: T.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  indexBadge: { marginRight: scale(10) },
  indexText: { fontSize: fontScale(11), fontWeight: "800", color: T.inkFaint, letterSpacing: 0.5 },
  iconWrap: { marginRight: scale(14), borderRadius: moderateScale(14), overflow: "hidden" },
  iconGrad: { width: moderateScale(46), height: moderateScale(46), justifyContent: "center", alignItems: "center" },
  content: { flex: 1 },
  name: { fontSize: fontScale(15), fontWeight: "700", color: T.ink, letterSpacing: 0.1, marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  distDot: { width: 6, height: 6, borderRadius: 3 },
  dist: { fontSize: fontScale(12), color: T.inkMuted },
  navBtn: {
    width: moderateScale(36), height: moderateScale(36), borderRadius: moderateScale(18),
    backgroundColor: T.emerald, justifyContent: "center", alignItems: "center", marginLeft: scale(10),
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.cream },
  header: {
    paddingBottom: verticalScale(8), borderBottomLeftRadius: moderateScale(32), borderBottomRightRadius: moderateScale(32),
    elevation: 24, shadowColor: T.emeraldDeep, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, overflow: "hidden",
  },
  ornamentLine: { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: T.gold, opacity: 0.6 },
  headerInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: wp("5%"), paddingTop: Platform.OS === "android" ? verticalScale(8) : 0, paddingBottom: verticalScale(16),
  },
  headerBtn: {
    width: moderateScale(42), height: moderateScale(42), borderRadius: moderateScale(21),
    backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(200,169,110,0.25)",
    justifyContent: "center", alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerIconRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  crownDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.gold, opacity: 0.6 },
  headerTitle: { fontSize: fontScale(20), fontWeight: "800", color: T.white, letterSpacing: 1.5, textTransform: "uppercase" },
  headerCount: { fontSize: fontScale(11), color: "rgba(255,255,255,0.5)", letterSpacing: 0.5, marginTop: 2 },
  headerTail: { height: verticalScale(4) },

  list: { padding: wp("4.5%"), paddingTop: verticalScale(4), paddingBottom: hp("8%") },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: verticalScale(16), marginTop: verticalScale(6) },
  sectionLabel: { fontSize: fontScale(11), fontWeight: "700", color: T.inkFaint, letterSpacing: 1.5, textTransform: "uppercase" },
  sectionLine: { flex: 1, height: 1, backgroundColor: T.border },

  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: wp("10%") },
  emptyTitle: { fontSize: fontScale(18), fontWeight: "700", color: T.inkMuted, marginTop: verticalScale(16) },
  emptyBody: { fontSize: fontScale(13), color: T.inkFaint, textAlign: "center", marginTop: 8, lineHeight: 20 },
  retryBtn: { marginTop: 20, backgroundColor: T.emerald, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { color: T.white, fontWeight: "bold" },

  mapWrap: { flex: 1, position: "relative", backgroundColor: T.cream },
  mapOverlayLoader: {
    ...StyleSheet.absoluteFillObject, backgroundColor: T.cream, zIndex: 5,
    justifyContent: "center", alignItems: "center"
  },
  mapLoaderText: { marginTop: 12, color: T.emerald, fontWeight: "600", fontSize: fontScale(14) },

  fab: {
    position: "absolute", bottom: verticalScale(32), alignSelf: "center", borderRadius: moderateScale(30),
    overflow: "hidden", elevation: 8, shadowColor: T.emeraldDeep, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  fabInner: { flexDirection: "row", alignItems: "center", paddingVertical: verticalScale(13), paddingHorizontal: scale(22), gap: 8 },
  fabText: { color: T.white, fontSize: fontScale(14), fontWeight: "700", letterSpacing: 0.5 },

  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: T.white,
    borderTopLeftRadius: moderateScale(28), borderTopRightRadius: moderateScale(28),
    paddingHorizontal: scale(22), paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: verticalScale(14),
    elevation: 24, shadowColor: T.emeraldDeep, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 16,
    borderTopWidth: 1, borderTopColor: T.border, height: SHEET_HEIGHT,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.parchment, alignSelf: "center", marginBottom: verticalScale(20) },
  sheetTop: { flexDirection: "row", alignItems: "center", gap: scale(14), marginBottom: verticalScale(18) },
  sheetIcon: { width: moderateScale(54), height: moderateScale(54), borderRadius: moderateScale(16), justifyContent: "center", alignItems: "center", flexShrink: 0 },
  sheetName: { fontSize: fontScale(17), fontWeight: "800", color: T.ink, marginBottom: 4, letterSpacing: 0.1 },
  sheetMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  distDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: T.success },
  sheetDist: { fontSize: fontScale(12), color: T.inkMuted },
  closeBtn: { width: moderateScale(32), height: moderateScale(32), borderRadius: moderateScale(16), backgroundColor: T.parchment, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  sheetDivider: { height: 1, backgroundColor: T.border, marginBottom: verticalScale(18) },
  dirBtn: { borderRadius: moderateScale(16), flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: verticalScale(16), paddingHorizontal: scale(20), gap: 12 },
  dirBtnText: { color: T.white, fontSize: fontScale(16), fontWeight: "800", letterSpacing: 0.5 },
  dirBtnIcon: { width: moderateScale(30), height: moderateScale(30), borderRadius: moderateScale(15), backgroundColor: T.gold, justifyContent: "center", alignItems: "center" },
});