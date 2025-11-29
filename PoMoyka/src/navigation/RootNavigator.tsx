// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WalletScreen from '../screens/OrdersScreen';
import LiqPayScreen from '../screens/LiqPayScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import CentersScreen from '../screens/CentersScreen';
import CarEditScreen from '../screens/CarEditScreen';
import ConfirmOrderScreen from '../screens/ConfirmOrderScreen';
import OrderConfirmedScreen from '../screens/OrderConfirmedScreen';
import TransactionsScreen from '../screens/TransactionsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBarButton({ children, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.centerButtonContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.centerButton}>{children}</View>
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Map"   // ✅ добавь это
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 12, marginBottom: 6 },
      }}
    >
      <Tab.Screen
        name="MyOrder"
        component={WalletScreen}
        options={{
          tabBarLabel: 'My order',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="receipt-long" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={CentersScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="explore"
              size={28}
              color={focused ? '#fff' : '#000'}
            />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
const { authState } = useAuth();
  
return authState.authenticated ? (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LiqPay"
        component={LiqPayScreen}
        options={{ title: 'LiqPay Payment', headerShown: true }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: 'History', headerShown: false }}
      />
      <Stack.Screen
        name="CarEdit"
        component={CarEditScreen}
        options={{ title: 'Edit Car', headerShown: false }}
      />
      <Stack.Screen
        name="ConfirmOrder"
        component={ConfirmOrderScreen}
        options={{ title: 'Edit Car', headerShown: false }}
      />
      <Stack.Screen
        name="OrderConfirmed"
        component={OrderConfirmedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
) : (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    elevation: 0,
    backgroundColor: '#111',
    borderRadius: 20,
    height: 70,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  centerButtonContainer: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 65,
    height: 65,
    borderRadius: 40,
    backgroundColor: '#E47C3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
});