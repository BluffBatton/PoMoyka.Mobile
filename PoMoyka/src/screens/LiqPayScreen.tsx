// src/screens/LiqPayScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth, API_URL } from '../context/AuthContext';

export default function LiqPayScreen() {
  const { authState } = useAuth();
  const route      = useRoute<any>();
  const navigation = useNavigation<any>();
  const { amount, fuel_type, liters } = route.params;
  const [html, setHtml] = useState<string|null>(null);
  const GLOBAL_API_URL = 'https://gregarious-happiness-production.up.railway.app';

  useEffect(() => {
    fetch(
      `${GLOBAL_API_URL}/api/liqpay/pay/?amount=${amount}&liters=${liters}&fuel_type=${encodeURIComponent(fuel_type)}`,
      { 
        headers: { 
          'Accept': 'text/html',
          'Authorization': `Bearer ${authState?.token}`
        },
      }
    )
    .then(res => {
      if (res.status === 401) {
        Alert.alert('Error', 'Log in first');
        return '';
      }
      return res.text();
    })
    .then(setHtml)
    .catch(err => {
      console.error(err);
      Alert.alert('Error', 'Unable to load payment page');
    });
  }, [amount, fuel_type, authState]);

  const onNavigationStateChange = (navState: any) => {
    if (navState.url.includes('/api/liqpay/result/')) {
      navigation.navigate('Main', { screen: 'Wallet', });
    }
  };

  if (!html) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      onNavigationStateChange={navState => {
        const url = navState.url;
        if (url.startsWith(`${GLOBAL_API_URL}/api/liqpay/result`)) {
          navigation.navigate('Main', { screen: 'Wallet' });
        }
      }}
      mixedContentMode="always"
    />
  );
}

const styles = StyleSheet.create({
  center: { 
    flex:1, 
    justifyContent:'center', 
    alignItems:'center' 
  },
});
