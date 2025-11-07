import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';

const GradientBackground = ({ children }: { children?: React.ReactNode }) => {
  return (
    <LinearGradient
      colors={[
        'rgba(2,0,36,1)',
        'rgba(134,148,180,1)',
      ]}
      locations={[0.5, 1]}
      start={{ x: 0.2, y: 0.5 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default GradientBackground;
