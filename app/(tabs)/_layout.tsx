import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#9FE0C3",
        tabBarInactiveTintColor: "#cfd8dc",
        tabBarStyle: {
          backgroundColor: "#0a3d3d",
          borderTopColor: "#0d4a4a",
          // 1. Dynamic height: Base height (65) + system navigation bar height
          height: 65 + insets.bottom,
          // 2. Pad the bottom to push icons above the system buttons
          paddingBottom: Platform.OS === "android" ? insets.bottom + 5 : insets.bottom,
          // 3. Keep icons centered at the top of the bar
          paddingTop: 10,
        },
        // Optional: Gives a little breathing room below the text labels
        tabBarLabelStyle: {
          paddingBottom: 5,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Qibla */}
      <Tabs.Screen
        name="qibla"
        options={{
          title: "Qibla",
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "compass" : "compass-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Quran */}
      <Tabs.Screen
        name="quran"
        options={{
          title: "Quran",
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "book-open-variant" : "book-open-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Prayer */}
      <Tabs.Screen
        name="prayer"
        options={{
          title: "Prayer",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* Tasbeeh */}
      <Tabs.Screen
        name="tasbeeh"
        options={{
          title: "Tasbeeh",
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name="counter" size={24} color={color} />
          ),
        }}
      />
      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}