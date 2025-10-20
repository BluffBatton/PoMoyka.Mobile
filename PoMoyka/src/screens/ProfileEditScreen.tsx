// src/screens/ProfileEditScreen.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const ProfileEditScreen = () => {
  const navigation = useNavigation<any>();

  // initial values (як на скріні)
  const [firstName, setFirstName] = useState('Adam');
  const [surname, setSurname] = useState('Kadirov');
  const [email, setEmail] = useState('adamkadirov@gmail.com');
  const [password, setPassword] = useState('password123');
  const [avatarUri, setAvatarUri] = useState<string | null>(
    'https://i.pravatar.cc/300?img=12' // заміни на локальний asset якщо потрібно
  );
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    try {
      // попросимо дозвіл (iOS)
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
      // @ts-ignore // <- Можно убрать @ts-ignore, т.к. result.uri теперь точно существует
      setAvatarUri(result.assets[0].uri); // <- Лучше брать uri из массива assets
    }
    } catch (err) {
      console.warn('Image pick error', err);
    }
  };

  const handleSave = () => {
    setSaving(true);
    // Тут — виклик API збереження профілю
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Saved', 'Your profile changes were saved.');
      navigation.goBack(); // повернутись до профілю
    }, 900);
  };

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
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#7b7b7b"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Surname</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={surname}
                onChangeText={setSurname}
                placeholder="Surname"
                placeholderTextColor="#7b7b7b"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#7b7b7b"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
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
});

export default ProfileEditScreen;
