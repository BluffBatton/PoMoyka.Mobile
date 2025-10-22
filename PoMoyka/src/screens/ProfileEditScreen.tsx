// src/screens/ProfileEditScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator, } from 'react-native';
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
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                console.log("Loading profile");
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.get<UserProfileData>(`${API_URL}/api/User/GetMyProfile`, {
                        headers: { Authorization: `Bearer ${authState.token}` }
                    });
                    const userData = response.data;
                    setFirstName(userData.firstName);
                    setLastName(userData.lastName);
                    setEmail(userData.email);
                    setNewPassword('');
                    setAvatarUri(null);
                    console.log("Profile has been loaded:", userData);
                } catch (err: any) {
                    console.error("Failed to fetch profile:", err);
                    setError(err.response?.data?.message || err.message || "Could not fetch profile data.");
                    if (err.response?.status === 401) {
                        Alert.alert("Session expired", "Please log in again.");
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
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'We need permission to access your photos.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsEditing: true,
        aspect: [1, 1],
      });

    if (!result.canceled) { 
      
      setAvatarUri(result.assets[0].uri); 
    }
    } catch (err) {
      console.warn('Image pick error', err);
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
           
            password: newPassword ? newPassword : null
        };

        try {
            await axios.put(`${API_URL}/api/User/UpdateMyProfile`, updateDto, {
                 headers: { Authorization: `Bearer ${authState.token}` }
             });
            Alert.alert('Saved', 'Info has been changed.');
            navigation.goBack();

        } catch (err: any) {
            console.error("Save profile error:", err.response?.data || err.message);
            const message = err.response?.data?.message || err.message || "Unable to save profile.";
            setError(message);
            Alert.alert('Saving Error', message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
         return (
             <LinearGradient colors={['#0f0f10', '#0b0b0c']} style={[styles.bg, styles.centerContent]}>
                 <ActivityIndicator size="large" color="#fff"/>
             </LinearGradient>
         );
    }

  return (
    <LinearGradient colors={['#0f0f10', '#0b0b0c']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit profile</Text>
            <View style={{ width: 28 }} /> {/* spacer */}
          </View>

          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri || 'https://i.pravatar.cc/300' }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <MaterialIcons name="photo-camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.form}>

            <Text style={styles.label}>First Name</Text>
               <View style={styles.inputContainer}>
                   <TextInput value={firstName} onChangeText={setFirstName} /*...*/ style={styles.input} />
               </View>
            <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputContainer}>
                   <TextInput value={lastName} onChangeText={setLastName} /*...*/ style={styles.input} />
                </View>
            <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                    <TextInput value={email} onChangeText={setEmail} /*...*/ style={styles.input} />
                </View>
            <Text style={styles.label}>New Password (optional)</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        onChangeText={setNewPassword} // Просто обновляем стейт
                        placeholder="Enter new password to change" // Пояснение
                        placeholderTextColor="#7b7b7b"
                        secureTextEntry
                        style={styles.input}
                      />
                </View>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={{ width: '100%' }}>
              <LinearGradient
                colors={['#9E6A52', '#38261D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save changes'}</Text>
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
    borderRadius: 140 / 2,
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
