import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#9FE0C3",
        tabBarInactiveTintColor: "#cfd8dc",
        tabBarStyle: {
          backgroundColor: "#0a3d3d",
          borderTopColor: "#0d4a4a",
          height: 60,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Capella */}
      <Tabs.Screen
        name="library"
        options={{
          title: "Capella",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "musical-note" : "musical-note-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Videos */}
      <Tabs.Screen
        name="videos"
        options={{
          title: "Videos",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "play" : "play-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Ask Rubina */}
      <Tabs.Screen
        name="ask-rubina"
        options={{
          title: "Ask Rubina",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
