import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();

  const handleChangePassword = () => {
    // Navigate to change password screen
    console.log("Change Password");
  };

  const handleDeleteAccount = () => {
    // Show delete account confirmation
    console.log("Delete Account");
  };

  const handleTermsOfService = () => {
    // Show terms of service
    console.log("Terms of Service");
  };

  const handlePrivacyPolicy = () => {
    // Show privacy policy
    console.log("Privacy Policy");
  };

  const handleAppVersion = () => {
    // Show app version info
    console.log("App Version");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Account Settings Section */}
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.spacerMedium} />

          <SettingItem
            title="Change Password"
            icon="lock-closed"
            onPress={handleChangePassword}
          />

          <SettingItem
            title="Delete Account"
            icon="trash"
            onPress={handleDeleteAccount}
            isDestructive
          />

          <View style={styles.spacerLarge} />

          {/* About Section */}
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.spacerMedium} />

          <SettingItem
            title="Terms of Service"
            icon="document-text"
            onPress={handleTermsOfService}
          />

          <SettingItem
            title="Privacy Policy"
            icon="shield-checkmark"
            onPress={handlePrivacyPolicy}
          />

          <SettingItem
            title="App Version"
            icon="information-circle"
            subtitle="1.0.0"
            onPress={handleAppVersion}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= SETTING ITEM COMPONENT ================= */

interface SettingItemProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
}

function SettingItem({
  title,
  icon,
  subtitle,
  onPress,
  isDestructive = false,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          isDestructive && styles.iconContainerDestructive,
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={isDestructive ? "#ef4444" : "white"}
        />
      </View>

      <View style={styles.settingTextContainer}>
        <Text
          style={[
            styles.settingTitle,
            isDestructive && styles.settingTitleDestructive,
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#0a4a4a",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  spacerMedium: {
    height: 16,
  },
  spacerLarge: {
    height: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#7be8c2",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#0a4a4a",
    borderWidth: 1,
    borderColor: "#7be8c2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconContainerDestructive: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    color: "white",
  },
  settingTitleDestructive: {
    color: "#ef4444",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
});