import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OrderConfirmedScreen({ navigation }: any) {
  const [rating, setRating] = useState(0);

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
        Your booking has been placed successfully.
        <Text
          style={styles.link}
          onPress={() => navigation.navigate("OrdersScreen")}
        >
          Transaction History
        </Text>
      </Text>
      <Text style={styles.deliveryText}>
        Your date is <Text style={styles.bold}>Стас, доделай пж</Text>
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Main", { screen: "MyOrder" })}
      >
        <Text style={styles.buttonText}>Go to bookings</Text>
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
  deliveryText: {
    fontSize: 13,
    color: "#BFBFBF",
    marginTop: 8,
    textAlign: "center",
  },
  bold: {
    fontWeight: "600",
    color: "#FFF",
  },
  link: {
    color: "#32CD32",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#7A4D35",
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
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
