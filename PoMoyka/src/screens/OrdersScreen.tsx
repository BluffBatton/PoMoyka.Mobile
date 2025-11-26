// src/screens/OrdersScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '../components/ScreenWrapper';
import { useAuth, API_URL } from '../context/AuthContext';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

interface BookingDto {
  id: string;
  centerName: string;
  serviceName: string;
  bookedTime: string;
  status: string;
  price: number;
}

const OrdersScreen = () => {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { onLogout } = useAuth();
  const isMountedRef = React.useRef(true); // Отслеживание монтирования

  // Cleanup при размонтировании
  React.useEffect(() => {
    return () => {
      console.log('[OrdersScreen] Component unmounting');
      isMountedRef.current = false;
    };
  }, []);

  const fetchBookings = useCallback(async () => {
    console.log('[OrdersScreen] Fetching bookings...');
    
    // Таймаут для защиты от зависания
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    try {
      const response = await Promise.race([
        axios.get<any>(`${API_URL}/api/Booking/GetMy`),
        timeoutPromise
      ]) as any;
      console.log('[OrdersScreen] Response received');
      
      // Проверяем что компонент все еще смонтирован
      if (!isMountedRef.current) {
        console.log('[OrdersScreen] Component unmounted, skipping state update');
        return;
      }
      
      console.log('[OrdersScreen] Response type:', typeof response.data);
      console.log('[OrdersScreen] Is array:', Array.isArray(response.data));
      
      if (!response.data) {
        console.warn('[OrdersScreen] Empty response data');
        if (isMountedRef.current) setBookings([]);
        return;
      }
      
      const rawData = Array.isArray(response.data) ? response.data : [response.data];
      console.log('[OrdersScreen] Bookings count:', rawData.length);
      
      if (rawData.length > 0) {
        console.log('[OrdersScreen] First booking keys:', Object.keys(rawData[0]));
        console.log('[OrdersScreen] First booking id:', rawData[0].id);
        console.log('[OrdersScreen] First booking centerName:', rawData[0].centerName);
      }
      
      // Мапим данные с защитой
      const mappedBookings = rawData
        .map((item: any, index: number) => {
          try {
            // Безопасное извлечение полей
            const id = String(item.id || item.bookingId || `booking-${index}`);
            const centerName = String(item.centerName || item.center?.name || 'Unknown Center');
            const serviceName = String(item.serviceName || item.service?.name || 'Unknown Service');
            const bookedTime = String(item.bookedTime || new Date().toISOString());
            const status = String(item.status || 'Waiting').toLowerCase();
            const price = typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0);
            
            return {
              id,
              centerName,
              serviceName,
              bookedTime,
              status,
              price,
            };
          } catch (error) {
            console.error('[OrdersScreen] Error mapping booking at index', index, ':', error);
            return null;
          }
        })
        .filter(Boolean); // Убираем null значения
      
      console.log('[OrdersScreen] Mapped bookings:', mappedBookings.length);
      
      // Проверяем перед setState
      if (isMountedRef.current) {
        setBookings(mappedBookings as BookingDto[]);
        console.log('[OrdersScreen] State updated successfully');
      } else {
        console.log('[OrdersScreen] Component unmounted, skipping state update');
      }
    } catch (err: any) {
      console.error('[OrdersScreen] Error loading bookings:', err?.message || 'Unknown error');
      console.error('[OrdersScreen] Status code:', err.response?.status);
      
      if (!isMountedRef.current) {
        console.log('[OrdersScreen] Component unmounted, skipping error handling');
        return;
      }
      
      if (err.response?.status === 401) {
        await onLogout();
      } else if (err.response?.status === 403) {
        console.warn('[OrdersScreen] Access denied (403). This is an Admin account.');
        setIsAdminMode(true);
        setBookings([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
        console.log('[OrdersScreen] Loading finished');
      }
    }
  }, [onLogout]); // Зависимости для useCallback

  useFocusEffect(
    useCallback(() => {
      console.log('[OrdersScreen] Screen focused');
      
      // Проверяем что компонент смонтирован
      if (!isMountedRef.current) {
        console.log('[OrdersScreen] Component not mounted, skipping fetch');
        return;
      }
      
      console.log('[OrdersScreen] Loading bookings...');
      fetchBookings();
      
      // Cleanup при потере фокуса
      return () => {
        console.log('[OrdersScreen] Screen lost focus');
      };
    }, [fetchBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusColor = (status: string): string => {
    if (!status) return '#999';
    
    const lowerStatus = String(status).toLowerCase();
    switch (lowerStatus) {
      case 'waiting': return '#FFA500';
      case 'confirmed': return '#32CD32';
      case 'completed': return '#4169E1';
      case 'cancelled': return '#FF6347';
      default: return '#999';
    }
  };

  const getStatusIcon = (status: string): 'schedule' | 'check-circle' | 'done-all' | 'cancel' | 'help' => {
    if (!status) return 'help';
    
    const lowerStatus = String(status).toLowerCase();
    switch (lowerStatus) {
      case 'waiting': return 'schedule';
      case 'confirmed': return 'check-circle';
      case 'completed': return 'done-all';
      case 'cancelled': return 'cancel';
      default:
        console.warn('[OrdersScreen] Unknown status:', status);
        return 'help';
    }
  };

  // ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ДО УСЛОВНЫХ RETURN!
  const renderBooking = useCallback(({ item, index }: { item: BookingDto; index: number }) => {
    try {
      return (
        <View style={styles.bookingCard}>
          <Text style={styles.centerName}>
            {String(item.centerName || 'Unknown')}
          </Text>
          <Text style={styles.infoText}>
            {String(item.serviceName || 'Unknown Service')}
          </Text>
          <Text style={styles.infoText}>
            Status: {String(item.status || 'waiting')}
          </Text>
          <Text style={styles.priceText}>
            ${Number(item.price || 0).toFixed(2)}
          </Text>
        </View>
      );
    } catch (error) {
      console.error(`[OrdersScreen] Error rendering booking ${index}:`, error);
      return null;
    }
  }, []);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Bookings</Text>
      {bookings.length > 0 && (
        <Text style={{ color: '#fff', padding: 20, fontSize: 16 }}>
          Found {bookings.length} bookings
        </Text>
      )}
    </View>
  ), [bookings.length]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No bookings</Text>
    </View>
  ), []);

  // Условный return ПОСЛЕ всех хуков
  if (isLoading) {
    return (
      <GradientBackground>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9E6A52" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </GradientBackground>
    );
  }

  // Защита от краша при рендеринге
  try {
    return (
      <GradientBackground>
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item, index) => item.id || `booking-${index}`}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          contentContainerStyle={styles.container}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.5}
        />
      </GradientBackground>
    );
  } catch (error) {
    console.error('[OrdersScreen] Render error:', error);
    return (
      <GradientBackground>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Failed to display bookings</Text>
          <Text style={styles.emptySubtext}>Please try again later</Text>
          <TouchableOpacity onPress={fetchBookings} style={{ marginTop: 20, padding: 10, backgroundColor: '#9E6A52', borderRadius: 8 }}>
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9E6A52',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  centerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
  },
  priceText: {
    color: '#32CD32',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OrdersScreen;