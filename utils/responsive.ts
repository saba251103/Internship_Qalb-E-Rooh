import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for standard iPhone design (iPhone 14/15)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Calculate responsive scales
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
const moderateScale = (size: number, factor = 0.5) => 
  size + (Math.max(widthScale, heightScale) - 1) * size * factor;

// Normalize font size based on screen width
const fontScale = PixelRatio.getFontScale();

// Responsive helper functions
export const responsive = {
  // Scale size proportionally
  scale: (size: number) => Math.round(size * widthScale),
  
  // Vertical scale based on height
  verticalScale: (size: number) => Math.round(size * heightScale),
  
  // Moderate scale - blend of both
  moderateScale: (size: number, factor = 0.5) => 
    Math.round(size + (Math.max(widthScale, heightScale) - 1) * size * factor),
  
  // Font size with pixel ratio consideration
  fontSize: (size: number) => Math.round(size * fontScale * widthScale),
  
  // Screen dimensions
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  
  // Check if device is small (iPhone SE, mini)
  isSmallDevice: SCREEN_WIDTH < 375,
  
  // Check if device is large (Plus/Max, Pro Max)
  isLargeDevice: SCREEN_WIDTH > 400,
  
  // Check if device is tablet
  isTablet: SCREEN_WIDTH > 768,
  
  // Check if device is in landscape
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  
  // Get responsive padding
  padding: {
    small: Math.round(8 * widthScale),
    medium: Math.round(16 * widthScale),
    large: Math.round(24 * widthScale),
    xlarge: Math.round(32 * widthScale),
  },
  
  // Get responsive margin
  margin: {
    small: Math.round(8 * widthScale),
    medium: Math.round(16 * widthScale),
    large: Math.round(24 * widthScale),
    xlarge: Math.round(32 * widthScale),
  },
  
  // Get responsive border radius
  borderRadius: {
    small: Math.round(4 * widthScale),
    medium: Math.round(8 * widthScale),
    large: Math.round(16 * widthScale),
    xlarge: Math.round(24 * widthScale),
    round: 9999,
  },
  
  // Icon sizes
  iconSize: {
    small: Math.round(16 * widthScale),
    medium: Math.round(24 * widthScale),
    large: Math.round(32 * widthScale),
    xlarge: Math.round(48 * widthScale),
  },
  
  // Common responsive values
  vs: (size: number) => Math.round(size * heightScale), // vertical scale
  hs: (size: number) => Math.round(size * widthScale), // horizontal scale
};

export default responsive;

