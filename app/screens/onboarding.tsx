import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// IMAGE DIMENSIONS
const IMAGE_WIDTH = width * 0.95; // Narrower width (95% of screen)
const IMAGE_AREA_HEIGHT = height * 0.75; // Tall, elongated height

const slides = [
  { id: '1', image: require('../../assets/images/Qalberooh.png'), title: '' },
  { id: '2', image: require('../../assets/images/Halal.png'), title: '' },
  { id: '3', image: require('../../assets/images/Inspiring.png'), title: '' },
  { id: '4', image: require('../../assets/images/Space.png'), title: '' },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (index < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          snapToAlignment="center"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(page);
          }}
          renderItem={({ item }) => (
            <View style={styles.slideWrapper}>
              {/* IMAGE AREA – NARROWER & ELONGATED */}
              <View style={styles.imageContainer}>
                <Image
                  source={item.image}
                  style={styles.image}
                  resizeMode="cover" 
                />
              </View>
              
              <View style={styles.textContainer}>
                 <Text style={styles.titleText}>{item.title}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* BOTTOM CONTROLS */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { width: i === index ? 24 : 8, backgroundColor: i === index ? '#C6FFE3' : '#6FAF9C' }
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {index === slides.length - 1 ? 'Start' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1F4F4A' 
  },
  slideWrapper: { 
    width: width, 
    alignItems: 'center', // Centers the narrower image container
    paddingTop: 20 
  },
  imageContainer: { 
    width: IMAGE_WIDTH, 
    height: IMAGE_AREA_HEIGHT, 
    borderRadius: 24, // Rounded corners for a premium feel
    overflow: 'hidden',
    backgroundColor: '#163a36', // Subtle placeholder color
    elevation: 10, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  textContainer: { 
    marginTop: 20, 
    paddingHorizontal: 40 
  },
  titleText: { 
    color: 'white', 
    fontSize: 26, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
  controls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingBottom: 30
  },
  skipText: { 
    color: '#BFEAD6', 
    fontSize: 16 
  },
  pagination: { 
    flexDirection: 'row' 
  },
  dot: { 
    height: 8, 
    borderRadius: 4, 
    marginHorizontal: 4 
  },
  nextButton: {
    backgroundColor: '#8FE3C1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
  },
  nextButtonText: { 
    color: '#0E3B33', 
    fontWeight: '700', 
    fontSize: 16 
  }
});