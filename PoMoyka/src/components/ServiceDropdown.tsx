import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const ServiceDropdown = ({ services, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [heightAnim] = useState(new Animated.Value(0));

  const toggle = () => {
    setIsOpen((prev) => !prev);
    Animated.timing(heightAnim, {
      toValue: isOpen ? 0 : services.length * 50,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.ease,
    }).start();
  };

  const handleSelect = (item: any) => {
    setSelected(item);
    onSelect(item);
    toggle();
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.dropdownHeader} onPress={toggle}>
        <Text style={styles.dropdownText}>
          {selected ? selected.serviceName : 'Choose service'}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>

      <Animated.View style={[styles.dropdownBody, { height: heightAnim }]}>
        {services.map((item: any) => (
          <TouchableOpacity
            key={item.centerServiceId}
            style={styles.dropdownItem}
            onPress={() => handleSelect(item)}
          >
            <Text style={styles.dropdownItemText}>
              {item.serviceName} — {item.price}$
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownHeader: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 15,
  },
  dropdownBody: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginTop: 6,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 14,
  },
});
