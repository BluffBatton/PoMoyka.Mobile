// src/screens/EditCarInfoScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { CarType } from '../constants/CarTypes';

const EditCarInfoScreen = () => {
  const navigation = useNavigation<any>();

  const [carModel, setCarModel] = useState('BMW X3');
  const [carType, setCarType] = useState('SUV');
  const [licensePlate, setLicensePlate] = useState('AX 9013 XA');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Saved', 'Car information successfully updated.');
      navigation.goBack();
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
            <Text style={styles.headerTitle}>Edit car info</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.form}>
<Text style={styles.label}>Car model</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={carModel}
                onChangeText={setCarModel}
                placeholder="Car model"
                placeholderTextColor="#7b7b7b"
                style={styles.input}
              />
            </View>
            <Text style={styles.label}>Type of car</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={carType}
                onValueChange={(value) => setCarType(value)}
              >
                <Picker.Item label="Select type..." value={null} color="#7b7171" />
                <Picker.Item label="Hatchback" value={CarType.Hatchback} />
                <Picker.Item label="Crossover" value={CarType.CrossOver} />
                <Picker.Item label="SUV" value={CarType.SUV} />
              </Picker>

            </View>
            <Text style={styles.label}>License plate</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="License plate"
                placeholderTextColor="#7b7b7b"
                autoCapitalize="characters"
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
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
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
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 18,
    // На Android может потребоваться убрать paddingVertical/Horizontal отсюда
  },
  picker: {
    height: 50, // Высота как у TextInput
    color: '#fff', // Цвет текста для iOS
    // На Android цвет текста обычно наследуется или задается через dropdown style
  },
});

export default EditCarInfoScreen;
