import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Animated, } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth, API_URL } from '../context/AuthContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface CenterMapDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  averageRating?: number | null;
  totalRatings?: number;
}
interface PricedServiceDto {
  centerServiceId: string;
  serviceName: string;
  price: number;
}
interface CenterPricelistDto {
  centerId: string;
  centerName: string;
  address: string;
  services: PricedServiceDto[];
  averageRating?: number | null;
  totalRatings?: number;
}

const INITIAL_REGION: Region = {
  latitude: 49.9935,
  longitude: 36.2304,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Кастомный компонент маркера с названием центра
const CustomMarker = ({ center, onPress }: { center: CenterMapDto; onPress: () => void }) => {
  return (
    <Marker
      coordinate={{ latitude: center.latitude, longitude: center.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={markerStyles.container}>
        <View style={markerStyles.markerIcon}>
          <MaterialIcons name="location-on" size={32} color="#9E6A52" />
        </View>
        <View style={markerStyles.labelContainer}>
          <Text style={markerStyles.labelText} numberOfLines={1}>
            {center.name}
          </Text>
          {center.averageRating !== null && center.averageRating !== undefined && (
            <View style={markerStyles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={markerStyles.ratingText}>
                {center.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Marker>
  );
};

export default function CentersScreen() {
  const navigation = useNavigation<any>();
  const { authState, onLogout } = useAuth();

  const [mapReady, setMapReady] = useState(false);
  const [centers, setCenters] = useState<CenterMapDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false); // Флаг для отслеживания загрузки
  const [selectedCenter, setSelectedCenter] = useState<CenterPricelistDto | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const fetchCenters = async () => {
        // Проверяем флаг загрузки вместо длины массива
        if (isFetched) {
          console.log('[CentersScreen] Centers already fetched:', centers.length);
          return;
        }

        // Ждем пока токен станет доступен
        if (!authState.token) {
          console.log('[CentersScreen] Waiting for auth token...');
          // Повторим попытку через 500мс
          setTimeout(() => {
            if (authState.token) {
              console.log('[CentersScreen] Token ready, retrying...');
              fetchCenters();
            }
          }, 500);
          return;
        }

        console.log('[CentersScreen] Fetching centers from API...');
        setIsLoading(true);
        try {
          const response = await axios.get<CenterMapDto[]>(`${API_URL}/api/Centers/GetAll`);
          console.log('[CentersScreen] Centers received:', response.data);
          console.log('[CentersScreen] Centers count:', response.data.length);
          
          if (response.data.length === 0) {
            console.warn('[CentersScreen] No centers in database!');
          }
          
          setCenters(response.data);
          setIsFetched(true); // Устанавливаем флаг после успешной загрузки
        } catch (err: any) {
          console.error('[CentersScreen] Error loading centers:', err);
          console.error('[CentersScreen] Error details:', err.response?.data || err.message);
          if (err.response?.status === 401) {
            console.error('[CentersScreen] Unauthorized! Retrying...');
            // Повторная попытка через секунду
            setTimeout(fetchCenters, 1000);
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchCenters();
    }, [isFetched, authState.token]) // Добавляем зависимость от токена
  );

  const togglePanel = () => {
    Animated.timing(slideAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const handleMarkerPress = async (center: any) => {
    setIsLoading(true);
    try {
      // Используем GetById вместо несуществующего GetPriceList
      const response = await axios.get(`${API_URL}/api/Centers/GetById/${center.id}`);
      const data = response.data;
      
      console.log('[CentersScreen] Center data received:', data);
      console.log('[CentersScreen] Average rating:', data.averageRating);
      console.log('[CentersScreen] Total ratings:', data.totalRatings);
      
      // Обновляем рейтинг в списке центров
      setCenters(prevCenters => 
        prevCenters.map(c => 
          c.id === center.id 
            ? { ...c, averageRating: data.averageRating, totalRatings: data.totalRatings }
            : c
        )
      );
      
      // Адаптируем ответ под нужную структуру
      setSelectedCenter({
        centerId: data.id || center.id,
        centerName: data.name || center.name,
        address: data.address || 'Address not specified',
        services: Array.isArray(data.services) ? data.services : [],
        averageRating: data.averageRating ?? null,
        totalRatings: data.totalRatings ?? 0,
      });
      setIsExpanded(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Error while loading services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const panelTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 0],
  });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        onMapReady={() => {
          console.log('[CentersScreen] Map is ready');
          setMapReady(true);
        }}
      >
        {centers.length > 0 ? (
          centers.map((center) => {
            console.log('[CentersScreen] Rendering marker:', center.name, center.latitude, center.longitude);
            return (
              <CustomMarker
                key={center.id}
                center={center}
                onPress={() => handleMarkerPress(center)}
              />
            );
          })
        ) : (
          console.log('[CentersScreen] No centers to render markers'),
          null
        )}
      </MapView>


      {selectedCenter && (
        <Animated.View style={[styles.infoPanel, { transform: [{ translateY: panelTranslateY }] }]}>
          <TouchableOpacity onPress={togglePanel}>
            <View style={styles.infoHeader}>
              <View style={styles.infoHeaderLeft}>
                <Text style={styles.centerName}>{selectedCenter.centerName}</Text>
                <Text style={styles.centerAddress}>{selectedCenter.address}</Text>
                {selectedCenter.averageRating !== null && selectedCenter.averageRating !== undefined ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.centerRating}>
                      {selectedCenter.averageRating.toFixed(1)}
                    </Text>
                    {selectedCenter.totalRatings && selectedCenter.totalRatings > 0 && (
                      <Text style={styles.ratingCount}>
                        ({selectedCenter.totalRatings})
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noRatingText}>No ratings yet</Text>
                )}
              </View>
              <MaterialIcons
                name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={22}
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          {isExpanded && selectedCenter.services.length > 0 && (
            <View style={styles.serviceList}>
              {selectedCenter.services.map((s) => (
                <Text key={s.centerServiceId} style={styles.serviceText}>
                  {s.serviceName} — {s.price}$
                </Text>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {selectedCenter && (
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => {
          if (selectedCenter) {
            navigation.navigate('ConfirmOrder', { center: selectedCenter });
          }
        }}
        disabled={!selectedCenter}
      >
        <Text style={styles.selectText}>Select</Text>
      </TouchableOpacity>
      )}

      {(!mapReady || isLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {isLoading ? 'Loading centers...' : 'Loading maps...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width, height },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#fff', marginTop: 10 },

  infoPanel: {
    position: 'absolute',
    top: 60,
    left: width * 0.05,
    width: width * 0.9,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    padding: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  centerName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  centerAddress: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  centerRating: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 14,
  },
  ratingCount: {
    color: '#999',
    fontSize: 12,
  },
  noRatingText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  serviceList: { marginTop: 8 },
  serviceText: { color: '#fff', fontSize: 13, marginBottom: 3 },

  selectButton: {
    position: 'absolute',
    bottom: 130,
    left: width * 0.25,
    width: width * 0.5,
    backgroundColor: '#9E6A52',
    borderRadius: 25,
    alignItems: 'center',
    paddingVertical: 12,
  },
  selectText: {
    color: '#fff',
    fontWeight: '600',
  },
});

// Стили для кастомного маркера
const markerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  markerIcon: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    maxWidth: 150,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9E6A52',
  },
  labelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
});