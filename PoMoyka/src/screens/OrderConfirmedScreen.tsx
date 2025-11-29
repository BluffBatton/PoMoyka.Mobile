import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OrderConfirmedScreen({ route, navigation }: any) {
  console.log("[OrderConfirmed] Screen mounted");
  const { center } = route?.params || {};
  const [rating, setRating] = useState(0);
  
  console.log("[OrderConfirmed] Center data:", center);

  const handleRate = (value: number) => {
    setRating(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={90} color="#32CD32" />
      </View>
      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>
        Your booking has been placed successfully!{'\n'}
        We will notify you about the details.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          console.log("[OrderConfirmed] Navigating to MyOrder");
          navigation.replace("Main", { screen: "MyOrder" });
        }}
      >
        <Ionicons name="list" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>View My Bookings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          if (center) {
            console.log("[OrderConfirmed] Navigating to ConfirmOrder with same center:", center.centerName);
            navigation.replace("ConfirmOrder", { center });
          } else {
            console.log("[OrderConfirmed] No center data, navigating to Centers map");
            navigation.replace("Main", { screen: "Centers" });
          }
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#9E6A52" style={{ marginRight: 8 }} />
        <Text style={styles.secondaryButtonText} numberOfLines={1} ellipsizeMode="tail">
          {center ? 'Book Again Here' : 'Make Another Booking'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.rateLabel}>Rate our work</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity key={value} onPress={() => handleRate(value)}>
            <Ionicons
              name={value <= rating ? "star" : "star-outline"}
              size={30}
              color={value <= rating ? "#FFD700" : "#999"}
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 100,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#BFBFBF",
    textAlign: "center",
  },
  link: {
    color: "#32CD32",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#9E6A52",
    marginTop: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#9E6A52",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#9E6A52",
    fontSize: 16,
    fontWeight: "700",
  },
  rateLabel: {
    marginTop: 40,
    color: "#BFBFBF",
    fontSize: 14,
  },
  stars: {
    flexDirection: "row",
    marginTop: 10,
  },
});
