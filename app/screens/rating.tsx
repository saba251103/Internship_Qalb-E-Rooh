import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RatingScreen() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0 && review.trim().length === 0) {
      Alert.alert(
        "Missing Information",
        "Please provide at least a rating or a review"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Replace with actual Firestore update
      // const updateData: any = {};
      // if (rating !== 0) updateData.rating = rating.toString();
      // if (review.trim().length > 0) updateData.review = review.trim();
      // await firestore().collection('users').doc(userId).update(updateData);

      Alert.alert("Success", "Thank you for your feedback!");
      setRating(0);
      setReview("");
    } catch (error) {
      Alert.alert("Error", `Something went wrong: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index <= rating;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index)}
        activeOpacity={0.7}
        style={styles.starButton}
      >
        <Ionicons
          name={isFilled ? "star" : "star-outline"}
          size={36}
          color="#FFD700"
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.spacerTop} />

        {/* Header */}
        <Text style={styles.title}>How was your experience?</Text>

        <View style={styles.spacerSmall} />

        <Text style={styles.subtitle}>
          Your experience helps us grow better. Feel free to leave as many
          reviews as you want.
        </Text>

        <View style={styles.spacerLarge} />

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
        </View>

        <View style={styles.spacerLarge} />

        {/* Review Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Write your review..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.spacerLarge} />

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitReview}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a4a4a",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  spacerTop: {
    height: 24,
  },
  spacerSmall: {
    height: 16,
  },
  spacerLarge: {
    height: 32,
  },
  bottomSpacer: {
    height: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: "white",
    minHeight: 120,
  },
  submitButton: {
    width: "100%",
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(255, 215, 0, 0.5)",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a4a4a",
  },
});