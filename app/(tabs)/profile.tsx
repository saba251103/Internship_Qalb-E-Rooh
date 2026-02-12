import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  username: string;
  email: string;
  memberSince?: string;
}

export default function ProfileScreen() {
  const router = useRouter();

  // Replace with actual user data from your auth context/provider
  const user: User = {
    username: "User",
    email: "user@example.com",
    memberSince: "January 2023",
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    console.log("Edit Profile");
  };

  const handleSettings = () => {
    router.push("/screens/settings");
  };
  
  const handleRateUs = () => {
    router.push("/screens/rating");
  };
  

  const handleLogout = async () => {
    // Implement logout logic
    // await signOut();
    // router.replace("/login");
    console.log("Logout");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.spacerTop} />

        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
        <Image
          source={require("../../assets/images/person.png")}
          style={styles.avatar}
        />

        </View>

        <View style={styles.spacerMedium} />

        {/* Username */}
        <Text style={styles.username}>{user.username}</Text>

        {/* Email */}
        <Text style={styles.email}>{user.email}</Text>

        {/* Member Since */}
        <Text style={styles.memberSince}>
          Member since {user.memberSince}
        </Text>

        <View style={styles.spacerLarge} />

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.spacerSmall} />

          <ActionButton
            label="Edit Profile"
            icon="person"
            onPress={handleEditProfile}
          />

          <View style={styles.buttonSpacer} />

          <ActionButton
            label="Settings"
            icon="settings"
            onPress={handleSettings}
          />

          <View style={styles.buttonSpacer} />

          <ActionButton
            label="Rate Us"
            icon="star"
            onPress={handleRateUs}
          />

          <View style={styles.buttonSpacer} />

          <ActionButton
            label="Logout"
            icon="log-out"
            onPress={handleLogout}
          />
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

/* ================= ACTION BUTTON COMPONENT ================= */

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

function ActionButton({ label, icon, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={24} color="white" />
      <Text style={styles.actionButtonText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="white" />
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a4a4a",
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  spacerTop: {
    height: 24,
  },
  spacerSmall: {
    height: 16,
  },
  spacerMedium: {
    height: 16,
  },
  spacerLarge: {
    height: 32,
  },
  buttonSpacer: {
    height: 12,
  },
  bottomSpacer: {
    height: 70,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    marginTop:'15%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#0a4a4a",
  },
  username: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 4,
  },
  memberSince: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginTop: 4,
  },
  actionsContainer: {
    width: "100%",
    padding: 16,
    backgroundColor: "#0a4a4a",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 18,
    color: "white",
    marginLeft: 16,
  },
});