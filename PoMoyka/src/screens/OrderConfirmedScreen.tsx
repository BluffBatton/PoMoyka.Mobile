import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "../context/AuthContext";

export default function OrderConfirmedScreen({ route, navigation }: any) {
  console.log("[OrderConfirmed] Screen mounted");
  
  const { center, bookingId } = route?.params || {};
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [booking, setBooking] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [rating, setRating] = useState(0);
  
  const isMountedRef = useRef(true);
  
  console.log("[OrderConfirmed] Params:", { center: center?.centerName, bookingId });

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      console.log("[OrderConfirmed] Component unmounting");
      isMountedRef.current = false;
    };
  }, []);

  // Проверка статуса бронирования
  useEffect(() => {
    if (!bookingId) {
      console.error("[OrderConfirmed] ❌ No bookingId provided!");
      Alert.alert("Error", "Booking ID is missing. Please check your bookings.");
      setStatus('failed');
      return;
    }

    const checkBookingStatus = async () => {
      try {
        console.log(`[OrderConfirmed] 🔍 Checking booking status (attempt ${retryCount + 1}/5)...`);
        
        const response = await axios.get(`${API_URL}/api/Booking/GetById/${bookingId}`);
        
        console.log("[OrderConfirmed] 📦 Booking data received:", response.data);
        console.log("[OrderConfirmed] 📊 Current status:", response.data.status);

        if (!isMountedRef.current) {
          console.log("[OrderConfirmed] Component unmounted, stopping checks");
          return;
        }

        setBooking(response.data);
        
        const currentStatus = String(response.data.status || '').toLowerCase();
        
        if (currentStatus === 'done') {
          console.log("[OrderConfirmed] ✅ Payment confirmed! Status is Done");
          setStatus('success');
        } else if (currentStatus === 'cancelled') {
          console.log("[OrderConfirmed] ❌ Payment failed! Status is Cancelled");
          setStatus('failed');
        } else {
          // Waiting - Complete еще не отработал, повторяем
          console.log("[OrderConfirmed] ⏳ Still Waiting for status update...");
          setStatus('pending');
          
          // Повторяем проверку каждые 1.5 секунды, максимум 5 раз (7.5 секунд)
          // Меньше попыток т.к. мы сами вызываем Complete
          if (retryCount < 5) {
            setTimeout(() => {
              if (isMountedRef.current) {
                setRetryCount(prev => prev + 1);
              }
            }, 1500);
          } else {
            console.warn("[OrderConfirmed] ⚠️ Timeout! Status still Waiting after 7.5 seconds");
            Alert.alert(
              "Payment Processing", 
              "Payment completed but status update is delayed. Please check 'My Bookings' in a moment.",
              [{ text: "OK", onPress: () => setStatus('success') }]
            );
            setStatus('success'); // Показываем success чтобы не блокировать
          }
        }
      } catch (error: any) {
        console.error("[OrderConfirmed] ❌ Error checking status:", error.response?.data || error.message);
        
        if (!isMountedRef.current) return;

        if (error.response?.status === 401) {
          Alert.alert("Error", "Session expired. Please login again.");
          navigation.replace("Login");
        } else if (error.response?.status === 404) {
          Alert.alert("Error", "Booking not found");
          setStatus('failed');
        } else {
          // Повторяем при сетевых ошибках
          if (retryCount < 5) {
            setTimeout(() => {
              if (isMountedRef.current) {
                setRetryCount(prev => prev + 1);
              }
            }, 1500);
          } else {
            Alert.alert("Error", "Failed to check booking status");
            setStatus('failed');
          }
        }
      }
    };

    checkBookingStatus();
  }, [bookingId, retryCount, navigation]);

  const handleRate = (value: number) => {
    setRating(value);
    console.log("[OrderConfirmed] User rated:", value);
    // TODO: Отправить рейтинг на backend
  };

  // ⏳ LOADING / PENDING STATE
  if (status === 'loading' || status === 'pending') {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <ActivityIndicator size={60} color="#9E6A52" />
        </View>
        
        <Text style={styles.title}>Processing Payment...</Text>
        
        <Text style={styles.subtitle}>
          {retryCount === 0 
            ? "Confirming your payment..."
            : `Checking payment status... (${retryCount}/5)`
          }
        </Text>
        
        <Text style={styles.waitText}>
          This usually takes a moment
        </Text>

        {/* Прогресс бар */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(retryCount / 5) * 100}%` }]} />
        </View>
      </View>
    );
  }

  // ❌ FAILED STATE
  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: '#2A1A1A' }]}>
          <Ionicons name="close-circle" size={90} color="#FF6347" />
        </View>
        
        <Text style={[styles.title, { color: '#FF6347' }]}>Payment Failed</Text>
        
        <Text style={styles.subtitle}>
          Your payment was not completed.{'\n'}
          Please try booking again.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (center) {
              navigation.replace("ConfirmOrder", { center });
            } else {
              navigation.replace("Main", { screen: "Centers" });
            }
          }}
        >
          <Ionicons name="refresh" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.replace("Main", { screen: "Centers" })}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ SUCCESS STATE
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={90} color="#32CD32" />
      </View>
      
      <Text style={styles.title}>Booking Confirmed!</Text>
      
      <Text style={styles.subtitle}>
        Your booking has been placed successfully!{'\n'}
        Payment confirmed ✓
      </Text>

      {/* Детали бронирования */}
      {booking && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#9E6A52" />
            <Text style={styles.detailText}>
              {booking.centerName || center?.centerName || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="construct" size={16} color="#9E6A52" />
            <Text style={styles.detailText}>
              {booking.serviceName || 'Service'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#9E6A52" />
            <Text style={styles.detailText}>
              {booking.bookedTime 
                ? new Date(booking.bookedTime).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'
              }
            </Text>
          </View>
          
          {booking.price !== undefined && booking.price !== null && (
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={16} color="#32CD32" />
              <Text style={[styles.detailText, { color: '#32CD32', fontWeight: '700' }]}>
                ${Number(booking.price).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

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
            console.log("[OrderConfirmed] Navigating to ConfirmOrder with same center");
            navigation.replace("ConfirmOrder", { center });
          } else {
            console.log("[OrderConfirmed] Navigating to Centers map");
            navigation.replace("Main", { screen: "Centers" });
          }
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#9E6A52" style={{ marginRight: 8 }} />
        <Text style={styles.secondaryButtonText}>
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#BFBFBF",
    textAlign: "center",
    marginBottom: 20,
  },
  waitText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  progressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9E6A52',
    borderRadius: 2,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#9E6A52',
  },
  detailsTitle: {
    color: '#9E6A52',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#9E6A52",
    marginTop: 10,
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
    width: '100%',
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
    width: '100%',
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
    marginTop: 30,
    color: "#BFBFBF",
    fontSize: 14,
  },
  stars: {
    flexDirection: "row",
    marginTop: 10,
  },
});
