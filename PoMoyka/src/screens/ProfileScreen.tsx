// src/screens/ProfileScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '../components/ScreenWrapper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { API_URL, useAuth } from '../context/AuthContext';
import axios from 'axios';

interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { onLogout } = useAuth();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<UserProfileData>(
        `${API_URL}/api/User/GetMyProfile`
      );
      setUserData(response.data);
      console.log('Profile data loaded:', response.data);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not fetch profile data.'
      );
      if (err.response?.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        await onLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [onLogout]);

  const fetchAvatar = useCallback(async () => {
    setAvatarLoading(true);
    try {
      const resp = await axios.get<string>(
        `${API_URL}/api/User/GetUserImageUrl`
      );
      const url = resp.data;
      if (url && typeof url === 'string' && url.trim().length > 0) {
        setAvatarUrl(url);
      } else {
        setAvatarUrl(null);
      }
    } catch (e) {
      console.log('No avatar or error getting avatar:', e);
      setAvatarUrl(null);
    } finally {
      setAvatarLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchAvatar();
    }, [fetchProfile, fetchAvatar])
  );

  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await onLogout();
          } catch (e) {
            console.error('Logout error:', e);
            Alert.alert('Error', 'Failed to log out. Try again.');
          }
        },
      },
    ]);
  };

  if (isLoading && !userData) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </GradientBackground>
    );
  }

  if (!userData) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>
            {error || 'No user data available.'}
          </Text>
          <TouchableOpacity style={styles.tabLogout} onPress={handleLogout}>
            <Text style={styles.tabLogoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const finalAvatarSource = avatarUrl
    ? { uri: avatarUrl }
    : { uri: `https://i.pravatar.cc/150?u=${userData.id}` };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarWrapper}>
            <Image source={finalAvatarSource} style={styles.avatar} />

            {avatarLoading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.name}>
            {userData.firstName} {userData.lastName}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Personal Info</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabLogout} onPress={handleLogout}>
              <Text style={styles.tabLogoutText}>Log out</Text>
              <MaterialIcons name="logout" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={20} color="#ccc" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => navigation.navigate('ProfileEdit')}
          >
            <MaterialIcons name="person" size={20} color="#ccc" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Edit Profile</Text>
              <Text style={styles.infoHint}>Keep your profile up to date</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => navigation.navigate('CarEdit')}
          >
            <MaterialIcons name="directions-car" size={20} color="#ccc" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Edit car info</Text>
              <Text style={styles.infoHint}>Manage your car information</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <MaterialIcons name="history" size={20} color="#ccc" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Purchase history</Text>
              <Text style={styles.infoHint}>
                View all your past purchases in one place
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    marginBottom: 14,
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  tabActiveText: {
    color: '#000',
    fontWeight: '600',
  },
  tabLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8a5a43',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  tabLogoutText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },
  infoSection: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  infoText: {
    marginLeft: 14,
  },
  infoLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  infoValue: {
    color: '#ccc',
    fontSize: 14,
  },
  infoHint: {
    color: '#aaa',
    fontSize: 13,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
});
