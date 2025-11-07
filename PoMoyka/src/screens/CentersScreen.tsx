import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Animated, } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth, API_URL } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface CenterMapDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
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
}

const INITIAL_REGION: Region = {
  latitude: 49.9935,
  longitude: 36.2304,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function CentersScreen() {
  const navigation = useNavigation<any>();
  const { authState, onLogout } = useAuth();

  const [mapReady, setMapReady] = useState(false);
  const [centers, setCenters] = useState<CenterMapDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<CenterPricelistDto | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const fetchCenters = async () => {
        if (centers.length > 0) return;

        setIsLoading(true);
        try {
          const response = await axios.get<CenterMapDto[]>(`${API_URL}/api/Centers/GetAll`);
          setCenters(response.data);
        } catch (err) {
          console.error('Err while loading centers:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCenters();
    }, [])
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
      const response = await axios.get(`${API_URL}/api/Centers/GetPriceList/${center.id}`);
      const data = response.data;
      setSelectedCenter({
        ...data,
        services: Array.isArray(data.services) ? data.services : [],
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
        onMapReady={() => setMapReady(true)}
      >
        {centers.map((center) => (
          <Marker
            key={center.id}
            coordinate={{ latitude: center.latitude, longitude: center.longitude }}
            title={center.name}
            onPress={() => handleMarkerPress(center)}
          />
        ))}
      </MapView>


      {selectedCenter && (
        <Animated.View style={[styles.infoPanel, { transform: [{ translateY: panelTranslateY }] }]}>
          <TouchableOpacity onPress={togglePanel}>
            <View style={styles.infoHeader}>
              <Text style={styles.centerName}>{selectedCenter.address}</Text>
              <Text style={styles.centerRating}>3/5⭐ TODO</Text>
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
    alignItems: 'center',
  },
  centerName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  centerRating: { color: '#ffc107', fontWeight: '600', marginLeft: 10 },
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