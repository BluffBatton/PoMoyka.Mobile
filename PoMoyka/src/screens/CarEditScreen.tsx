// src/screens/EditCarInfoScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, SafeAreaView,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { CarType } from '../constants/CarTypes';
import { API_URL, useAuth } from '../context/AuthContext';
import axios from 'axios';
import { carTypeOptions } from '../constants/CarTypes';

interface CarData {
    id: string;
    name: string;
    licensePlate: string;
    carType: string;
}


interface CarUpdateData {
    name?: string;
    licensePlate?: string;
    carType?: string;
}

const EditCarInfoScreen = () => {
  const navigation = useNavigation<any>();
  const { authState, onLogout } = useAuth();

  const [carModel, setCarModel] = useState('BMW X3');
  const [carType, setCarType] = useState<string>(carTypeOptions[0]);
  const [licensePlate, setLicensePlate] = useState('AX 9013 XA');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
    useFocusEffect(
        useCallback(() => {
            const fetchCarData = async () => {
                console.log("Loading car...");
                setLoading(true);
                setError(null);
                try {
                    const response = await axios.get<CarData>(`${API_URL}/api/Car/GetMyCar`, {
                         headers: { Authorization: `Bearer ${authState.token}` }
                    });
                    const carData = response.data;
                    setCarModel(carData.name);
                    setLicensePlate(carData.licensePlate);

                    if (carTypeOptions.includes(carData.carType)) {
                        setCarType(carData.carType); // Сохраняем как есть ("crossOver")
                    } else {
                        console.warn(`Получен неизвестный тип машины: ${carData.carType}. Установлен тип по умолчанию.`);
                        setCarType(carTypeOptions[0]); // Ставим "hatchback"
                    }
                    console.log("Car was loaded:", carData);
                } catch (err: any) {
                    console.error("Failed to fetch car data:", err);
                    setError(err.response?.data?.message || err.message || "Could not fetch car data.");
                    if (err.response?.status === 401) {
                        Alert.alert("Session expired", "Please log in again.");
                        await onLogout();
                    }
                     if (err.response?.status === 404) {
                         console.log("No car found for user.");
                     }
                } finally {
                    setLoading(false);
                }
            };
            if (authState.token) {
                 fetchCarData();
            } else {
                setLoading(false);
                console.log("No auth token, skipping car data fetch.");
            }
        }, [authState.token, onLogout])
    );

const handleSave = async () => {
        if (!carModel.trim() || !licensePlate.trim() || !carType) {
            Alert.alert('Error', 'All fields must be filled.');
            return;
        }

        setSaving(true);
        setError(null);

        const updateDto: CarUpdateData = {
            name: carModel.trim(),
            licensePlate: licensePlate.trim().toUpperCase(),
            carType: carType,
        };

        try {
            console.log("Sending data on PUT /api/Cars/UpdateMyCar:", updateDto);
            await axios.put(`${API_URL}/api/Car/UpdateMyCar`, updateDto, {
                 headers: { Authorization: `Bearer ${authState.token}` }
             });

            Alert.alert('Saved', 'Data about car was saved.');
            navigation.goBack();

        } catch (err: any) {
            console.error("Save car error:", err.response?.data || err.message);
            const message = err.response?.data?.message || err.message || "Не удалось сохранить данные.";
            setError(message);
            Alert.alert('Save car error', message);
             if (err.response?.status === 401) {
                Alert.alert("Session expired", "Please log in again.");
                await onLogout();
            }
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
            <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
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
                                style={styles.picker}
                                dropdownIconColor="#fff"
                            >
                                  {carTypeOptions.map((typeName) => (
                                <Picker.Item
                                    key={typeName}
                                    label={typeName === 'crossOver' ? 'CrossOver' : typeName.charAt(0).toUpperCase() + typeName.slice(1)}
                                    value={typeName}
                                  />
                                ))}
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
                        {error && saving && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={{ width: '100%' }} disabled={saving}>
                            <LinearGradient
                                colors={['#9E6A52', '#38261D']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.saveButton}
                            >
                               {saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveButtonText}>Save changes</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safeArea: {
     flex: 1 
  },
  flex: { 
    flex: 1 
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
  },
  picker: {
    height: 50,
    color: '#fff',
  },
  centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
        fontSize: 14,
    },
});

export default EditCarInfoScreen;