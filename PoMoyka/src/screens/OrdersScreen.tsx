// src/screens/OrdersScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/ScreenWrapper';
import { useAuth, API_URL } from '../context/AuthContext';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

interface PricedServiceDto {
  centerServiceId: string;
  serviceName: string;
  carType: string;
  price: number;
  description?: string;
}

interface BookingDto {
  id: string;
  centerName: string;
  serviceName: string;
  bookedTime: string;
  status: string;
  price: number;
  // Дополнительные поля для оплаты и рейтинга
  centerId?: string;
  centerServiceId?: string;
  transactionId?: string;
  ratingValue?: number | null;
  centerAddress?: string;
  services?: PricedServiceDto[];
}

const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { onLogout } = useAuth();
  const isMountedRef = React.useRef(true); // Отслеживание монтирования
  
  // Состояние для модального окна рейтинга
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isPaying, setIsPaying] = useState<string | null>(null); // ID бронирования, которое оплачивается
  const [isCancelling, setIsCancelling] = useState<string | null>(null); // ID бронирования, которое отменяется
  
  // Состояние для модального окна успешной отправки рейтинга
  const [successModalVisible, setSuccessModalVisible] = useState(false);

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
            
            // Дополнительные поля
            const centerId = item.centerId || item.center?.id || null;
            const centerServiceId = item.centerServiceId || item.centerService?.id || null;
            const transactionId = item.transactionId || item.transaction?.id || null;
            // Ищем рейтинг в разных местах (может быть в transaction.ratingValue или напрямую)
            let ratingValue = null;
            if (item.ratingValue !== undefined && item.ratingValue !== null) {
              const val = Number(item.ratingValue);
              // Если значение от 0-4 (enum), конвертируем в 1-5 для отображения
              if (val >= 0 && val <= 4) {
                ratingValue = val + 1; // 0->1, 1->2, ..., 4->5
              } else if (val >= 1 && val <= 5) {
                ratingValue = val; // Уже в правильном формате
              }
            } else if (item.transaction?.ratingValue !== undefined && item.transaction?.ratingValue !== null) {
              const val = Number(item.transaction.ratingValue);
              if (val >= 0 && val <= 4) {
                ratingValue = val + 1;
              } else if (val >= 1 && val <= 5) {
                ratingValue = val;
              }
            } else if (item.rating?.ratingValue !== undefined && item.rating?.ratingValue !== null) {
              const val = Number(item.rating.ratingValue);
              if (val >= 0 && val <= 4) {
                ratingValue = val + 1;
              } else if (val >= 1 && val <= 5) {
                ratingValue = val;
              }
            }
            const centerAddress = item.centerAddress || item.center?.address || null;
            const services = item.services || item.center?.services || null;
            
            console.log('[OrdersScreen] Mapped booking:', {
              id,
              status,
              transactionId,
              ratingValue,
              centerServiceId,
            });
            
            return {
              id,
              centerName,
              serviceName,
              bookedTime,
              status,
              price,
              centerId,
              centerServiceId,
              transactionId,
              ratingValue,
              centerAddress,
              services,
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

  // Функция для оплаты бронирования
  const handlePay = async (booking: BookingDto) => {
    if (!booking.centerId || !booking.centerServiceId) {
      Alert.alert('Error', 'Cannot pay: missing center or service information');
      return;
    }

    setIsPaying(booking.id);
    
    try {
      console.log('[OrdersScreen] Creating payment for booking:', booking.id);
      
      // Создаем новое бронирование (это инициирует оплату)
      const createBookingDto = {
        centerServiceId: booking.centerServiceId,
        bookedTime: booking.bookedTime,
      };

      const response = await axios.post(`${API_URL}/api/Booking/Create`, createBookingDto);
      const { bookingId, data, signature } = response.data;

      console.log('[OrdersScreen] Payment data received, navigating to LiqPay...');

      // Навигация на LiqPay с данными центра
      navigation.navigate('LiqPay', {
        data,
        signature,
        bookingId,
        center: {
          centerId: booking.centerId,
          centerName: booking.centerName,
          address: booking.centerAddress || 'Address not specified',
          services: booking.services || [],
        },
      });
    } catch (err: any) {
      console.error('[OrdersScreen] Error creating payment:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    } finally {
      setIsPaying(null);
    }
  };

  // Функция для отмены бронирования
  const handleCancel = async (booking: BookingDto) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(booking.id);
            
            try {
              console.log('[OrdersScreen] Cancelling booking:', booking.id);
              
              await axios.post(`${API_URL}/api/Booking/Cancel/${booking.id}`);
              
              console.log('[OrdersScreen] Booking cancelled successfully');
              
              Alert.alert('Success', 'Booking cancelled successfully');
              
              // Обновляем список бронирований
              fetchBookings();
            } catch (err: any) {
              console.error('[OrdersScreen] Error cancelling booking:', err.response?.data || err.message);
              
              let errorMessage = 'Failed to cancel booking';
              if (err.response?.status === 401) {
                errorMessage = 'Unauthorized. Please login again.';
              } else if (err.response?.status === 403) {
                errorMessage = 'Access denied.';
              } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
              } else if (err.message) {
                errorMessage = err.message;
              }
              
              Alert.alert('Error', errorMessage);
            } finally {
              setIsCancelling(null);
            }
          },
        },
      ]
    );
  };

  // Функция для открытия модального окна рейтинга
  const handleRatePress = (booking: BookingDto) => {
    setSelectedBooking(booking);
    setSelectedRating(0);
    setRatingModalVisible(true);
  };

  // Функция для отправки рейтинга
  const handleSubmitRating = async () => {
    if (!selectedBooking || !selectedBooking.transactionId || selectedRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setIsSubmittingRating(true);

    try {
      console.log('[OrdersScreen] Submitting rating:', {
        transactionId: selectedBooking.transactionId,
        rating: selectedRating,
      });

      // RatingValue должен быть от 1 до 5, но в бэке это RatingNumber enum: One=0, Two=1, etc.
      // Поэтому нужно уменьшить на 1
      const ratingValue = selectedRating - 1; // Конвертируем 1-5 в 0-4 (enum: One=0, Two=1, etc.)
      
      const ratingCreateDto = {
        transactionId: selectedBooking.transactionId,
        ratingValue: ratingValue,
      };

      const url = `${API_URL}/api/Rating/Create`;
      console.log('[OrdersScreen] Rating URL:', url);
      console.log('[OrdersScreen] Rating DTO:', JSON.stringify(ratingCreateDto, null, 2));

      const response = await axios.post(
        url, 
        ratingCreateDto,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('[OrdersScreen] Rating created successfully:', response.data);
      
      // Закрываем модальное окно рейтинга
      setRatingModalVisible(false);
      
      // Показываем красивое модальное окно успеха
      setSuccessModalVisible(true);
      
      // Обновляем список бронирований
      setSelectedBooking(null);
      setSelectedRating(0);
      fetchBookings(); // Обновляем список
      
      // Автоматически закрываем окно успеха через 2 секунды
      setTimeout(() => {
        setSuccessModalVisible(false);
      }, 2000);
    } catch (err: any) {
      console.error('[OrdersScreen] Error submitting rating:', err.response?.data || err.message);
      
      let errorMessage = 'Failed to submit rating';
      if (err.response?.status === 404) {
        errorMessage = 'Rating endpoint not found (404). Please check backend configuration.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. Only clients can rate bookings.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getStatusColor = (status: string): string => {
    if (!status) return '#999';
    
    const lowerStatus = String(status).toLowerCase();
    switch (lowerStatus) {
      case 'waiting': return '#FFA500';
      case 'confirmed': return '#32CD32';
      case 'done': return '#4169E1';
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
      case 'done': return 'done-all';
      case 'completed': return 'done-all';
      case 'cancelled': return 'cancel';
      default:
        console.warn('[OrdersScreen] Unknown status:', status);
        return 'help';
    }
  };

  // Функция для отображения звезд рейтинга
  const renderStars = (rating: number) => {
return (
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#FFD700' : '#666'}
          />
        ))}
      </View>
    );
  };

  // ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ДО УСЛОВНЫХ RETURN!
  const renderBooking = useCallback(({ item, index }: { item: BookingDto; index: number }) => {
    try {
      const status = String(item.status || 'waiting').toLowerCase();
      const isWaiting = status === 'waiting';
      const isDone = status === 'done';
      const hasRating = item.ratingValue !== null && item.ratingValue !== undefined && item.ratingValue > 0;
      const canRate = isDone && !hasRating && item.transactionId;
      const canPay = isWaiting;
      const canCancel = isWaiting;

      return (
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingTitle}>
              <Text style={styles.centerName}>
                {String(item.centerName || 'Unknown')}
              </Text>
              {item.centerAddress && (
                <Text style={styles.centerAddress}>
                  {item.centerAddress}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <MaterialIcons 
                name={getStatusIcon(item.status)} 
                size={14} 
                color="#fff" 
                style={{ marginRight: 4 }} 
              />
              <Text style={styles.statusText}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.bookingBody}>
            <View style={styles.infoRow}>
              <MaterialIcons name="build" size={16} color="#ccc" />
              <Text style={styles.infoText}>
                {String(item.serviceName || 'Unknown Service')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={16} color="#ccc" />
              <Text style={styles.infoText}>
                {new Date(item.bookedTime).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

          </View>

          <View style={styles.bookingFooter}>
            <View style={styles.footerLeft}>
              <Text style={styles.priceText}>
                ${Number(item.price || 0).toFixed(2)}
              </Text>
              {/* Показываем рейтинг, если он есть */}
              {hasRating && item.ratingValue !== null && item.ratingValue !== undefined && (
                <View style={styles.footerRating}>
                  <MaterialIcons name="star" size={14} color="#FFD700" />
                  {renderStars(item.ratingValue)}
                  <Text style={styles.footerRatingText}>
                    {item.ratingValue}/5
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              {canPay && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.payButton]}
                  onPress={() => handlePay(item)}
                  disabled={isPaying === item.id}
                >
                  {isPaying === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="payment" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Pay</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {canCancel && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelBookingButton]}
                  onPress={() => handleCancel(item)}
                  disabled={isCancelling === item.id}
                >
                  {isCancelling === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="close" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {canRate && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rateButton]}
                  onPress={() => handleRatePress(item)}
                >
                  <Ionicons name="star-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Rate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    } catch (error) {
      console.error(`[OrdersScreen] Error rendering booking ${index}:`, error);
      return null;
    }
  }, [isPaying, isCancelling, handlePay, handleCancel, handleRatePress]);

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
          style={styles.list}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={true}
        />

        {/* Модальное окно для рейтинга */}
        <Modal
          visible={ratingModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setRatingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              
              {selectedBooking && (
                <>
                  <Text style={styles.modalCenterName}>
                    {selectedBooking.centerName}
                  </Text>
                  <Text style={styles.modalServiceName}>
                    {selectedBooking.serviceName}
                  </Text>
                </>
              )}

              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setSelectedRating(rating)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={rating <= selectedRating ? 'star' : 'star-outline'}
                      size={48}
                      color={rating <= selectedRating ? '#FFD700' : '#ccc'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setRatingModalVisible(false);
                    setSelectedBooking(null);
                    setSelectedRating(0);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    selectedRating === 0 && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitRating}
                  disabled={selectedRating === 0 || isSubmittingRating}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Модальное окно успешной отправки рейтинга */}
        <Modal
          visible={successModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSuccessModalVisible(false)}
        >
          <View style={styles.successModalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={48} color="#32CD32" />
                </View>
              </View>
              
              <Text style={styles.successTitle}>Rating Submitted!</Text>
              <Text style={styles.successMessage}>
                Thank you for your feedback!{'\n'}
                Your rating has been saved successfully.
              </Text>

              <TouchableOpacity
                style={styles.successButton}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 120, // Увеличен для нижней навигации (tab bar ~70px + запас)
  },
  container: {
    flex: 1,
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
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingTitle: {
    flex: 1,
    marginRight: 10,
  },
  centerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  centerAddress: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bookingBody: {
    marginBottom: 12,
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
    flex: 1,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLeft: {
    flex: 1,
    gap: 6,
  },
  priceText: {
    color: '#32CD32',
    fontSize: 18,
    fontWeight: '700',
  },
  footerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  footerRatingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  payButton: {
    backgroundColor: '#32CD32',
  },
  rateButton: {
    backgroundColor: '#9E6A52',
  },
  cancelBookingButton: {
    backgroundColor: '#FF6347',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Стили для модального окна
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalCenterName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalServiceName: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  starButton: {
    padding: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#9E6A52',
  },
  submitButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Стили для модального окна успеха
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#32CD32',
    shadowColor: '#32CD32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#32CD32',
  },
  successTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    color: '#ccc',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successButton: {
    backgroundColor: '#32CD32',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#32CD32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OrdersScreen;