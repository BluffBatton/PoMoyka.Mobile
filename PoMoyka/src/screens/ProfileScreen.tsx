// src/screens/ProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GradientBackground from '../components/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    console.log('Logged out');
    navigation.navigate('Login');
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {/* <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
          </TouchableOpacity> */}
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 24 }} /> 
        </View>
        <View style={styles.profileInfo}>
          <Image
            source={{
              uri: 'https://i.pravatar.cc/150?img=3',
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>Adam Kadirov</Text>

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
              <Text style={styles.infoValue}>adamkadirov@gmail.com</Text>
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
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 14,
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
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
});
