// src/screens/TransactionsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/ScreenWrapper';
import { useAuth, API_URL } from '../context/AuthContext';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

interface TransactionDto {
  id: string;
  amount: number;
  createdAt: string;
  
  // Booking info
  bookingId: string;
  bookedTime: string;
  bookingStatus: string;
  
  // User info
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  
  // Center info
  centerId: string;
  centerName: string;
  
  // Service info
  serviceName: string;
  carType: string;
  
  // Rating info
  ratingId?: string;
  ratingValue?: number;
}

const TransactionsScreen = ({ navigation }: any) => {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { onLogout } = useAuth();
  const isMountedRef = React.useRef(true);

  // Cleanup при размонтировании
  React.useEffect(() => {
    return () => {
      console.log('[TransactionsScreen] Component unmounting');
      isMountedRef.current = false;
    };
  }, []);

  const fetchTransactions = useCallback(async () => {
    console.log('[TransactionsScreen] Fetching transactions...');
    
    // Таймаут для защиты от зависания
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    try {
      const response = await Promise.race([
        axios.get<TransactionDto[]>(`${API_URL}/api/Transaction/GetMy`),
        timeoutPromise
      ]) as any;
      
      console.log('[TransactionsScreen] Response received');
      
      // Проверяем что компонент все еще смонтирован
      if (!isMountedRef.current) {
        console.log('[TransactionsScreen] Component unmounted, skipping state update');
        return;
      }
      
      if (!response.data) {
        console.warn('[TransactionsScreen] Empty response data');
        if (isMountedRef.current) setTransactions([]);
        return;
      }
      
      const data = Array.isArray(response.data) ? response.data : [response.data];
      console.log('[TransactionsScreen] Transactions count:', data.length);
      
      if (isMountedRef.current) {
        setTransactions(data);
        console.log('[TransactionsScreen] State updated successfully');
      }
    } catch (err: any) {
      console.error('[TransactionsScreen] Error loading transactions:', err?.message || 'Unknown error');
      
      if (!isMountedRef.current) return;
      
      if (err.response?.status === 401) {
        await onLogout();
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
        console.log('[TransactionsScreen] Loading finished');
      }
    }
  }, [onLogout]);

  useFocusEffect(
    useCallback(() => {
      console.log('[TransactionsScreen] Screen focused');
      
      if (!isMountedRef.current) {
        console.log('[TransactionsScreen] Component not mounted, skipping fetch');
        return;
      }
      
      console.log('[TransactionsScreen] Loading transactions...');
      fetchTransactions();
      
      return () => {
        console.log('[TransactionsScreen] Screen lost focus');
      };
    }, [fetchTransactions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string): string => {
    if (!status) return '#999';
    
    const lowerStatus = String(status).toLowerCase();
    switch (lowerStatus) {
      case 'waiting': return '#FFA500';
      case 'confirmed': return '#32CD32';
      case 'done': return '#4169E1';
      case 'cancelled': return '#FF6347';
      default: return '#999';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={star <= rating ? '#FFD700' : '#666'}
          />
        ))}
      </View>
    );
  };

  const renderTransaction = useCallback(({ item, index }: { item: TransactionDto; index: number }) => {
    try {
      return (
        <View style={styles.transactionCard}>
          {/* Header с датой и суммой */}
          <View style={styles.cardHeader}>
            <View style={styles.dateContainer}>
              <MaterialIcons name="calendar-today" size={14} color="#9E6A52" />
              <Text style={styles.dateText}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>
                ${Number(item.amount || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Центр */}
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={16} color="#ccc" />
            <Text style={styles.infoText}>
              {item.centerName || 'Unknown Center'}
            </Text>
          </View>

          {/* Услуга */}
          <View style={styles.infoRow}>
            <MaterialIcons name="build" size={16} color="#ccc" />
            <Text style={styles.infoText}>
              {item.serviceName || 'Unknown Service'} ({item.carType || 'N/A'})
            </Text>
          </View>

          {/* Время бронирования */}
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={16} color="#ccc" />
            <Text style={styles.infoText}>
              Booked: {formatDate(item.bookedTime)}
            </Text>
          </View>

          {/* Footer со статусом и рейтингом */}
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.bookingStatus) }]}>
              <Text style={styles.statusText}>
                {String(item.bookingStatus || 'Unknown').toUpperCase()}
              </Text>
            </View>
            
            {item.ratingValue && renderStars(item.ratingValue)}
          </View>
        </View>
      );
    } catch (error) {
      console.error(`[TransactionsScreen] Error rendering transaction ${index}:`, error);
      return null;
    }
  }, []);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Transaction History</Text>
      <View style={{ width: 24 }} />
    </View>
  ), [navigation]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt" size={64} color="#666" />
      <Text style={styles.emptyText}>No transactions yet</Text>
      <Text style={styles.emptySubtext}>
        Your completed bookings will appear here
      </Text>
    </View>
  ), []);

  if (isLoading) {
    return (
      <GradientBackground>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9E6A52" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </GradientBackground>
    );
  }

  try {
    return (
      <GradientBackground>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item, index) => item.id || `transaction-${index}`}
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
    console.error('[TransactionsScreen] Render error:', error);
    return (
      <GradientBackground>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Failed to display transactions</Text>
          <Text style={styles.emptySubtext}>Please try again later</Text>
          <TouchableOpacity onPress={fetchTransactions} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9E6A52',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: '#ccc',
    fontSize: 12,
  },
  amountContainer: {
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amountText: {
    color: '#32CD32',
    fontSize: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  retryButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#9E6A52',
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TransactionsScreen;

