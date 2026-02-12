import { Ionicons } from '@expo/vector-icons';
import React, { useState } from "react";
import { Share, StyleSheet, TouchableOpacity, View } from 'react-native'; // Removed 'onClick' error
import YoutubePlayer from 'react-native-youtube-iframe';
const MakkahLiveScreen = () => {
  const videoId = "Cm1v4bteXbI"; 
  const [playing, setPlaying] = useState(true); // 🟢 Default to TRUE for Auto-Play
  const onShare = async () => {
    try {
      await Share.share({
        message: `Watch Makkah Live Stream: https://www.youtube.com/watch?v=${videoId}`,
      });
    } catch (error) {
      // FIX: Cast 'error' to Error type to access .message safely
      const errorMessage = (error as Error).message;
      console.log(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log('Back pressed')}> 
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* FIX: Changed onClick to onPress */}
        <TouchableOpacity onPress={onShare}>
          <Ionicons name="share-social-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Video Player Section */}
      <View style={styles.playerWrapper}>
        <YoutubePlayer
        height={260}
        play={playing}            // Auto-plays because state starts as true
        videoId={"Cm1v4bteXbI"}   // 🟢 Your Makkah Live ID
        initialPlayerParams={{
        modestbranding: true,   // 🟢 Hides YouTube Logo
        rel: false,             // No related videos
        loop: true,             // Loops if stream resets
        }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 60, // Safe area for status bar
  },
  playerWrapper: {
    flex: 1,
    justifyContent: 'center', 
  },
});

export default MakkahLiveScreen;