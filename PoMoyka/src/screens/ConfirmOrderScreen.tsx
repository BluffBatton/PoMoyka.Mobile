import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '../components/ScreenWrapper';
import { API_URL, useAuth } from '../context/AuthContext';
import { ServiceDropdown } from '../components/ServiceDropdown';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import axios from 'axios';

interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface CarData {
  id: string;
  name: string;
  licensePlate: string;
  carType: string;
}

interface PricedServiceDto {
  centerServiceId: string;
  serviceName: string;
  carType: string;
  price: number;
  description?: string;
}

interface CenterData {
  centerId: string;
  centerName: string;
  address: string;
  services: PricedServiceDto[];
}

interface PaymentResponseDto {
  bookingId: string;
  data: string;
  signature: string;
}

const createInitialBookedTime = () => {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 8) {
    now.setHours(8, 0, 0, 0);
  } else if (hour >= 18) {
    now.setDate(now.getDate() + 1);
    now.setHours(8, 0, 0, 0);
  } else {
    now.setMinutes(0, 0, 0);
  }

  return now;
};

const ConfirmOrderScreen = ({ route, navigation }: any) => {
  const { center }: { center: CenterData } = route.params;
  const { authState, onLogout } = useAuth();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [car, setCar] = useState<CarData | null>(null);

  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const [selectedService, setSelectedService] = useState<PricedServiceDto | null>(null);

  const [bookedTime, setBookedTime] = useState<Date>(createInitialBookedTime);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!authState.token) {
          Alert.alert('Error', 'You are not authorized.');
          setLoading(false);
          await onLogout();
          return;
        }

        setLoading(true);
        try {
          const [userRes, carRes] = await Promise.all([
            axios.get(`${API_URL}/api/User/GetMyProfile`),
            axios.get(`${API_URL}/api/Car/GetMyCar`),
          ]);

          setProfile(userRes.data);
          setCar(carRes.data);
          console.log('User:', userRes.data);
          console.log('Car:', carRes.data);
        } catch (err: any) {
          console.error(
            'Error while loading data:',
            err.response?.data || err.message
          );
          Alert.alert(
            'Error',
            'Failed to load profile or car data.'
          );
          if (err.response?.status === 401) {
            await onLogout();
          }
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [authState.token, onLogout])
  );

  const onPickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowPicker(false);

    if (event.type !== 'set' || !selectedDate) {
      return;
    }

    if (pickerMode === 'date') {
      setBookedTime(prev => {
        const updated = new Date(prev);
        updated.setFullYear(selectedDate.getFullYear());
        updated.setMonth(selectedDate.getMonth());
        updated.setDate(selectedDate.getDate());
        return updated;
      });
    } else if (pickerMode === 'time') {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();

      const isOutOfWorkHours =
        hours < 8 || hours > 18 || (hours === 18 && minutes > 0);

      if (isOutOfWorkHours) {
        Alert.alert(
          'Invalid time',
          'Please select a time between 08:00 and 18:00.'
        );
        return;
      }

      setBookedTime(prev => {
        const updated = new Date(prev);
        updated.setHours(hours);
        updated.setMinutes(minutes);
        updated.setSeconds(0);
        updated.setMilliseconds(0);
        return updated;
      });
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service.');
      return;
    }

    const now = new Date();
    if (bookedTime <= now) {
      Alert.alert(
        'Invalid time',
        'Please choose a time in the future.'
      );
      return;
    }

    const hours = bookedTime.getHours();
    const minutes = bookedTime.getMinutes();
    const isOutOfWorkHours =
      hours < 8 || hours > 18 || (hours === 18 && minutes > 0);

    if (isOutOfWorkHours) {
      Alert.alert(
        'Invalid time',
        'Booking is available only between 08:00 and 18:00.'
      );
      return;
    }

    setIsConfirming(true);

    const createBookingDto = {
      centerServiceId: selectedService.centerServiceId,
      bookedTime: bookedTime.toISOString(),
    };

    console.log('Sending booking:', createBookingDto);

    try {
      const response = await axios.post<PaymentResponseDto>(
        `${API_URL}/api/Booking/Create`,
        createBookingDto
      );

      const { bookingId, data, signature } = response.data;
      console.log(
        'Booking created, LiqPay data received, ID:',
        bookingId
      );

      navigation.navigate('LiqPay', {
        data,
        signature,
        bookingId,
      });
    } catch (err: any) {
      console.error(
        'Booking error:',
        err.response?.data || err.message
      );
      Alert.alert('Error', 'Failed to create booking');
      if (err.response?.status === 401) {
        await onLogout();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9E6A52" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {center?.centerName || 'Detailing Center'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Order total</Text>
          <Text style={styles.totalValue}>
            {selectedService
              ? `${selectedService.price.toFixed(2)}$`
              : '0.00$'}
          </Text>
        </View>

        {/* Customer details */}
        <Text style={styles.sectionTitle}>Customer details</Text>
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            {profile
              ? `${profile.firstName} ${profile.lastName}`
              : 'Loading...'}
          </Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            {car?.name || 'Car is not specified'}
          </Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            {car?.carType || 'Car type is not specified'}
          </Text>
        </View>

        {/* Order details */}
        <Text style={styles.sectionTitle}>Order details</Text>

        {/* Services dropdown */}
        <ServiceDropdown
          services={center?.services || []}
          onSelect={(service: PricedServiceDto) => {
            console.log('Selected service:', service);
            setSelectedService(service);
          }}
        />

        {/* Booking date */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            Date: {bookedTime.toLocaleDateString()}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setPickerMode('date');
              setShowPicker(true);
            }}
          >
            <LinearGradient
              colors={['#B87333', '#5A3A1E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniButton}
            >
              <Text style={styles.miniButtonText}>Change</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            Time:{' '}
            {bookedTime.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setPickerMode('time');
              setShowPicker(true);
            }}
          >
            <LinearGradient
              colors={['#B87333', '#5A3A1E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniButton}
            >
              <Text style={styles.miniButtonText}>Change</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={bookedTime}
            mode={pickerMode}
            is24Hour={true}
            display="default"
            onChange={onPickerChange}
            minimumDate={
              pickerMode === 'date' ? new Date() : undefined
            }
          />
        )}

        <TouchableOpacity
          onPress={handleConfirmOrder}
          disabled={isConfirming || !selectedService}
        >
          <LinearGradient
            colors={
              !selectedService
                ? ['#555', '#333']
                : ['#9E6A52', '#38261D']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmButton}
          >
            {isConfirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>Confirm order</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  totalContainer: {
    backgroundColor: '#4a2e22',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  totalValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    borderBottomColor: '#555',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 15,
  },
  confirmButton: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniButton: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5A3A1E',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  miniButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConfirmOrderScreen;
