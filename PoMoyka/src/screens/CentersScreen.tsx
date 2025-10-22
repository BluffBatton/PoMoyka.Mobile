// src/screens/CentersScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';

// Get screen dimensions for styling
const { width, height } = Dimensions.get('window');

// Initial coordinates for Kharkiv
const INITIAL_REGION: Region = {
  latitude: 49.9935,
  longitude: 36.2304,
  latitudeDelta: 0.0922, // Zoom level
  longitudeDelta: 0.0421, // Zoom level
};

export default function StationsScreen() {
  const [mapReady, setMapReady] = useState(false);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION} // Set the starting position
        showsUserLocation={true} // Optionally show the user's current location
        onMapReady={() => setMapReady(true)} // Track when the map is loaded
      >
      </MapView>
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Background while map loads
  },
  map: {
    width: width, // Full screen width
    height: height, // Full screen height
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
});