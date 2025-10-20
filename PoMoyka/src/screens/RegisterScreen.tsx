import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import GradientBackground from '../components/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

export default function MultiStepSignUp() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    carModel: '',
    carType: '',
    licensePlate: '',
  });

  interface Form {
    name: string;
    surname: string;
    email: string;
    password: string;
    carModel: string;
    carType: string;
    licensePlate: string;
  }

  enum CarType {
        Hatchback = "Hatchback",
        CrossOver = "CrossOver",
        SUV = "SUV"
}

  type FormField = keyof Form;

  function update(field: FormField, value: string): void {
    setForm((prev: Form) => ({ ...prev, [field]: value }));
  }

  function next() {
    // basic step validation
    if (step === 0 && (!form.name.trim() || !form.surname.trim())) {
      Alert.alert('Error', 'Please, fill in name and surname');
      return;
    }
    if (step === 1 && (!form.email.trim() || !form.password.trim())) {
      Alert.alert('Error', 'Please, fill in email and password');
      return;
    }
    setStep(s => Math.min(s + 1, 2));
  }

  function back() {
    setStep(s => Math.max(s - 1, 0));
  }

  function submit() {
    if (!form.carModel.trim() || !form.carType.trim() || !form.licensePlate.trim()) {
      Alert.alert('Error', 'Please, fill in all car details');
      return;
    }
    // TODO: call API
    Alert.alert('Success', `Data: ${JSON.stringify(form)}`);
    navigation.navigate('Main', { screen: 'Profile' });
  }

  const progress = [0, 1, 2];

  return (
    <GradientBackground>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.progressRow}>
                {progress.map((p, i) => (
                  <View key={i} style={styles.progressItem}>
                    <TouchableOpacity onPress={() => setStep(i)} style={styles.dotWrapper}>
                      <View style={[styles.dot, step === i ? styles.dotActive : null]} />
                    </TouchableOpacity>
                    {i < progress.length - 1 && <View style={styles.progressLine} />}
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.title}>Sign Up</Text>

            <View style={styles.formArea}>
              {step === 0 && (
                <View>
                  <Input label="Name" placeholder="Enter name" value={form.name} onChangeText={v => update('name', v)} icon={'👤'} />
                  <Input label="Surname" placeholder="Enter surname" value={form.surname} onChangeText={v => update('surname', v)} icon={'👥'} />
                </View>
              )}

              {step === 1 && (
                <View>
                  <Input label="E-mail" placeholder="you@example.com" value={form.email} onChangeText={v => update('email', v)} icon={'✉️'} keyboardType="email-address" />
                  <Input label="Password" placeholder="********" value={form.password} onChangeText={v => update('password', v)} icon={'🔒'} secureTextEntry />
                </View>
              )}

              {step === 2 && (
                <View>
                  <Input label="Car Model" placeholder="Ford Escape 2020" value={form.carModel} onChangeText={v => update('carModel', v)} icon={'🚗'} />
                  <View style={styles.inputWrap}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputIcon}>🏷️</Text>
                      <Text style={styles.inputLabel}>Type of car</Text>
                    </View>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={form.carType}
                        onValueChange={(v) => update('carType', v)}
                        style={styles.picker}
                        dropdownIconColor="#fff"
                      >
                        <Picker.Item label="Select type..." value="" color="#7b7171" />
                        {Object.values(CarType).map((type) => (
                          <Picker.Item key={type} label={type} value={type} color="#fff" />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <Input label="License plate" placeholder="AX 0000 BC" value={form.licensePlate} onChangeText={v => update('licensePlate', v)} icon={'🔢'} />
                </View>
              )}
            </View>

            {/* Footer buttons */}
            <View style={styles.footerRow}>
              {step > 0 ? (
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={back}>
                  <Text style={styles.btnGhostText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 100 }} />
              )}

              {step < 2 ? (
                <TouchableOpacity style={styles.btnPrimary} onPress={next}>
                  <Text style={styles.btnPrimaryText}>Continue</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.btnPrimary} onPress={submit}>
                  <Text style={styles.btnPrimaryText}>Register</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </GradientBackground>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode | string;
  secureTextEntry?: boolean;
  keyboardType?: any;
}) {
  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputRow}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7b7171"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  container: { alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'transparent',
    minHeight: 720,
    padding: 24,
    borderRadius: 18,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { color: '#9aa0a6', fontSize: 12, textTransform: 'uppercase' },
  progressRow: { flexDirection: 'row', alignItems: 'center', padding: 50, marginLeft: 10 },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  dotWrapper: { padding: 6, color: '#fff' },
  dot: { width: 12, height: 12, borderRadius: 12, backgroundColor: '#ffffffff', borderWidth: 1, borderColor: '#4b4b4b' },
  dotActive: { backgroundColor: 'transparent', borderColor: '#c07a5a', borderWidth: 2 },
  progressLine: { width: 48, height: 2, backgroundColor: '#ffffffff', marginHorizontal: 8 },
  title: { color: '#e9e9ea', fontSize: 40, fontWeight: '900', marginBottom: 20 },
  formArea: { flex: 1 },
  inputWrap: { marginBottom: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  inputIcon: { fontSize: 16, marginRight: 8, color: '#d1c7c2' },
  inputLabel: { color: '#c6c6c6', fontSize: 13 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#2f2f2f',
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 28, minWidth: 100, alignItems: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3b3b3b' },
  btnGhostText: { color: '#bdbdbd' },
  btnPrimary: { backgroundColor: '#8a5a43', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 24, minWidth: 140, alignItems: 'center', margin: 100, marginLeft: 0, },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2f2f2f',
  },
  picker: {
    color: '#fff',
    backgroundColor: 'transparent',
    marginLeft: -8,
  },

});
