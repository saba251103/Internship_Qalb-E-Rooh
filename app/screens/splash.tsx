import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { FC } from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

/* ================= TYPES ================= */

interface AnimationRefs {
  fade: Animated.Value;
  scale: Animated.Value;
  pulse: Animated.Value;
  glow: Animated.Value;
  bgPulse: Animated.Value;
}

/* ================= CONSTANTS ================= */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const ANIMATION_DURATION = {
  FADE: 1200,
  GLOW: 1500,
  PULSE: 1600,
  BG_PULSE: 6000,
  SPLASH_DISPLAY: 3200,
} as const;

const COLORS = {
  GRADIENT_START: "#063B3B",
  GRADIENT_MID: "#0B4F4F",
  GRADIENT_END: "#063B3B",
  GLOW: "#9FF0D0",
  TEXT_PRIMARY: "#FFFFFF",
  TEXT_SECONDARY: "#E6FFFA",
  TEXT_TERTIARY: "rgba(255,255,255,0.75)",
} as const;

/* ================= RESPONSIVE UTILS ================= */

const scaleWidth = (size: number): number => (SCREEN_WIDTH / BASE_WIDTH) * size;
const scaleHeight = (size: number): number => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scaleWidth(size) - size) * factor;

/* ================= SPLASH SCREEN COMPONENT ================= */

const Splash: FC = () => {
  const router = useRouter();

  // Animation refs
  const animRefs = useRef<AnimationRefs>({
    fade: new Animated.Value(0),
    scale: new Animated.Value(0.9),
    pulse: new Animated.Value(1),
    glow: new Animated.Value(0),
    bgPulse: new Animated.Value(1),
  }).current;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Creates a looping pulse animation
   */
  const createPulseAnimation = useCallback(
    (animValue: Animated.Value, duration: number, toValue: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    []
  );

  /**
   * Initialize all animations
   */
  const initializeAnimations = useCallback(() => {
    // Entry animations
    const entryAnimations = Animated.parallel([
      Animated.timing(animRefs.fade, {
        toValue: 1,
        duration: ANIMATION_DURATION.FADE,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(animRefs.scale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animRefs.glow, {
        toValue: 1,
        duration: ANIMATION_DURATION.GLOW,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Start entry animations
    entryAnimations.start();

    // Start continuous pulse animations
    createPulseAnimation(
      animRefs.pulse,
      ANIMATION_DURATION.PULSE,
      1.05
    ).start();

    createPulseAnimation(
      animRefs.bgPulse,
      ANIMATION_DURATION.BG_PULSE,
      1.05
    ).start();
  }, [animRefs, createPulseAnimation]);

  /**
   * Navigate to onboarding screen
   */
  const navigateToOnboarding = useCallback(() => {
    try {
      router.replace("/screens/onboarding");
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback navigation
      router.push("/screens/onboarding");
    }
  }, [router]);

  /**
   * Setup and cleanup effects
   */
  useEffect(() => {
    // Initialize animations
    initializeAnimations();

    // Setup navigation timer
    timerRef.current = setTimeout(() => {
      navigateToOnboarding();
    }, ANIMATION_DURATION.SPLASH_DISPLAY);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop all animations
      animRefs.fade.stopAnimation();
      animRefs.scale.stopAnimation();
      animRefs.pulse.stopAnimation();
      animRefs.glow.stopAnimation();
      animRefs.bgPulse.stopAnimation();
    };
  }, [initializeAnimations, navigateToOnboarding, animRefs]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Animated Background */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ scale: animRefs.bgPulse }] },
        ]}
      >
        <LinearGradient
          colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_MID, COLORS.GRADIENT_END]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Radial Glow Effect */}
      <View style={styles.radialGlow} />

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: animRefs.fade,
            transform: [
              { scale: Animated.multiply(animRefs.scale, animRefs.pulse) },
              {
                translateY: animRefs.pulse.interpolate({
                  inputRange: [1, 1.05],
                  outputRange: [0, -6],
                }),
              },
            ],
          },
        ]}
      >
        {/* Bismillah - Arabic Calligraphy */}
        <Animated.Text
          style={[
            styles.bismillah,
            {
              opacity: animRefs.glow,
            },
          ]}
          accessibilityLabel="Bismillah - In the name of Allah"
          accessibilityRole="text"
        >
          ✨ بِسْمِ ٱللَّٰهِ ✨
        </Animated.Text>

        {/* App Name - Urdu */}
        <Text
          style={styles.urduTitle}
          accessibilityLabel="Qalb e Rooh - Heart of Soul"
          accessibilityRole="header"
        >
          قلبِ روح
        </Text>

        {/* App Name - English */}
        <Text
          style={styles.englishTitle}
          accessibilityLabel="Qalb e Rooh"
          accessibilityRole="text"
        >
          Qalb e Rooh
        </Text>
      </Animated.View>
    </View>
  );
};

export default Splash;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRADIENT_START,
    alignItems: "center",
    justifyContent: "center",
  },

  radialGlow: {
    position: "absolute",
    width: SCREEN_WIDTH * 1.6,
    height: SCREEN_WIDTH * 1.6,
    borderRadius: SCREEN_WIDTH * 0.8,
    backgroundColor: COLORS.GLOW,
    opacity: 0.06,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.GLOW,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 60,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  bismillah: {
    fontSize: moderateScale(26),
    color: COLORS.TEXT_SECONDARY,
    marginBottom: scaleHeight(18),
    fontWeight: "500",
    letterSpacing: 1,
    textAlign: "center",
    ...Platform.select({
      ios: {
        textShadowColor: COLORS.GLOW,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
      },
      android: {
        textShadowColor: COLORS.GLOW,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
      },
    }),
  },

  urduTitle: {
    fontSize: moderateScale(42),
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: scaleHeight(6),
    textAlign: "center",
  },

  englishTitle: {
    fontSize: moderateScale(18),
    color: COLORS.TEXT_TERTIARY,
    letterSpacing: 4,
    textTransform: "uppercase",
    textAlign: "center",
    fontWeight: "400",
  },
});