// src/screens/ProfileEditScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string | null;
}

const ProfileEditScreen = () => {
  const navigation = useNavigation<any>();
  const { authState, onLogout } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null); // то, что с сервера
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // локальный выбор/текущее

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarProcessing, setAvatarProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        console.log('Loading profile');
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get<UserProfileData>(
            `${API_URL}/api/User/GetMyProfile`,
            {
              headers: { Authorization: `Bearer ${authState.token}` },
            }
          );
          const userData = response.data;
          setFirstName(userData.firstName);
          setLastName(userData.lastName);
          setEmail(userData.email);
          setNewPassword('');

          // тянем аватарку
          try {
            const avatarResp = await axios.get<string>(
              `${API_URL}/api/User/GetUserImageUrl`,
              {
                headers: { Authorization: `Bearer ${authState.token}` },
              }
            );
            const url = avatarResp.data;
            if (url && typeof url === 'string' && url.trim().length > 0) {
              setInitialAvatarUrl(url);
              setAvatarUri(url);
            } else {
              setInitialAvatarUrl(null);
              setAvatarUri(null);
            }
          } catch (e) {
            console.log('No avatar or error loading avatar:', e);
            setInitialAvatarUrl(null);
            setAvatarUri(null);
          }

          console.log('Profile has been loaded:', userData);
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
          setLoading(false);
        }
      };

      fetchUserData();
    }, [authState.token, onLogout])
  );

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'We need permission to access your photos.'
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.6,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setAvatarUri(result.assets[0].uri); // локальный файл
      }
    } catch (err) {
      console.warn('Image pick error', err);
    }
  };

  // удаление аватарки с подтверждением
  const confirmDeleteAvatar = () => {
    if (!avatarUri && !initialAvatarUrl) return;

    Alert.alert(
      'Видалити аватарку',
      'Чи точно ви хочете видалити аватарку?',
      [
        { text: 'Ні', style: 'cancel' },
        {
          text: 'Так',
          style: 'destructive',
          onPress: deleteAvatar,
        },
      ]
    );
  };

  const deleteAvatar = async () => {
    try {
      setAvatarProcessing(true);
      await axios.delete(`${API_URL}/api/User/DeleteImage`, {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      setInitialAvatarUrl(null);
      setAvatarUri(null);
      Alert.alert('Готово', 'Аватарку видалено ✅');
    } catch (e: any) {
      console.error('Delete avatar error:', e);
      Alert.alert(
        'Помилка',
        e.response?.data?.message ||
          e.message ||
          'Не вдалося видалити аватарку'
      );
    } finally {
      setAvatarProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Error', 'First name, last name, and email are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const updateDto: UserUpdateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: newPassword ? newPassword : null,
    };

    try {
      // 1. Сохраняем профиль
      await axios.put(`${API_URL}/api/User/UpdateMyProfile`, updateDto, {
        headers: { Authorization: `Bearer ${authState.token}` },
      });

      // 2. Если выбрали НОВУЮ фотку (локальный файл, не URL сервера) — загружаем
      if (avatarUri && !avatarUri.startsWith('http')) {
        setAvatarProcessing(true);

        const formData = new FormData();
        formData.append(
          'image',
          {
            uri: avatarUri,
            name: 'avatar.jpg',
            type: 'image/jpeg',
          } as any
        );

        await axios.post(`${API_URL}/api/User/UploadImage`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${authState.token}`,
          },
        });

        // после загрузки забираем свежий URL
        try {
          const avatarResp = await axios.get<string>(
            `${API_URL}/api/User/GetUserImageUrl`,
            {
              headers: { Authorization: `Bearer ${authState.token}` },
            }
          );
          const url = avatarResp.data;
          if (url && typeof url === 'string' && url.trim().length > 0) {
            setInitialAvatarUrl(url);
            setAvatarUri(url);
          }
        } catch (e) {
          console.log('Error reloading avatar after upload:', e);
        } finally {
          setAvatarProcessing(false);
        }
      }

      Alert.alert('Saved', 'Info has been changed.');
      
      // Безопасный возврат назад
      try {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Main', { screen: 'Profile' });
        }
      } catch (error: any) {
        console.error('[ProfileEdit] Navigation error after save:', error?.message);
        navigation.navigate('Main', { screen: 'Profile' });
      }
    } catch (err: any) {
      console.error('Save profile error:', err.response?.data || err.message);
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to save profile.';
      setError(message);
      Alert.alert('Saving Error', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f0f10', '#0b0b0c']}
        style={[styles.bg, styles.centerContent]}
      >
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  const displayAvatar =
    avatarUri || initialAvatarUrl || 'https://i.pravatar.cc/300';

  return (
    <LinearGradient colors={['#0f0f10', '#0b0b0c']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={styles.backButtonWrapper}>
              <TouchableOpacity 
                onPress={() => {
                  console.log('[ProfileEdit] Back button pressed');
                  try {
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else {
                      navigation.navigate('Main', { screen: 'Profile' });
                    }
                  } catch (error: any) {
                    console.error('[ProfileEdit] Navigation error:', error?.message);
                    navigation.navigate('Main', { screen: 'Profile' });
                  }
                }}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                activeOpacity={0.6}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Edit profile</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.avatarWrap}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />

            {(avatarProcessing || saving) && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}

            {/* Кнопка выбора новой фотки */}
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <MaterialIcons name="photo-camera" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Красный крестик для удаления */}
            {(initialAvatarUrl || avatarUri) && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDeleteAvatar}
              >
                <MaterialIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>New Password (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                onChangeText={setNewPassword}
                placeholder="Enter new password to change"
                placeholderTextColor="#7b7b7b"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.85}
              style={{ width: '100%' }}
              disabled={saving || avatarProcessing}
            >
              <LinearGradient
                colors={['#9E6A52', '#38261D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 48,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  backButtonWrapper: {
    zIndex: 100,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  avatarWrap: {
    marginTop: 8,
    marginBottom: 26,
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#2b2b2b',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  deleteButton: {
    position: 'absolute',
    left: -4,
    top: -4,
    backgroundColor: '#e53935',
    borderRadius: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  form: {
    width: '100%',
    marginTop: 6,
  },
  label: {
    color: '#d6d6d6',
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 6,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  input: {
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileEditScreen;
