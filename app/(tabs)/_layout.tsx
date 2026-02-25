import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
          height: 80,
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
              <MaterialCommunityIcons
                name="counter"
                size={24}
                color={color}
              />
          ),
        }}
      />

    </Tabs>
  );
}
