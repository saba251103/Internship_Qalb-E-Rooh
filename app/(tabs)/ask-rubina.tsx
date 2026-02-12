import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AskRubinaScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    if (messageText.trim()) {
      setMessages([...messages, messageText.trim()]);
      setMessageText("");
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask Rubina</Text>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#0a4a4a" />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>Rubina</Text>
            <Text style={styles.profileSubtitle}>Your AI Assistant</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Ask me anything! I'm here to help you with your questions.
          </Text>
        </View>
      </View>

      {/* Messages Section */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, index) => (
          <View key={index} style={styles.messageWrapper}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{msg}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#0a4a4a" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

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
  infoContainer: {
    width: "100%",
    padding: 20,
    backgroundColor: "#0a4a4a",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#7be8c2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileText: {
    alignItems: "flex-start",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  infoBox: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(123, 232, 194, 0.3)",
  },
  infoText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#0a4a4a",
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#7be8c2",
    borderRadius: 20,
  },
  messageText: {
    fontSize: 16,
    color: "#0a4a4a",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#0a4a4a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(123, 232, 194, 0.3)",
    marginRight: 12,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: "white",
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7be8c2",
    alignItems: "center",
    justifyContent: "center",
  },
});