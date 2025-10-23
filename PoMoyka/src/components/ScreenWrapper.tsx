import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';

const GradientBackground = ({ children }: { children?: React.ReactNode }) => {
  return (
    <LinearGradient
      colors={[
        'rgba(2,0,36,1)',       // тёмно-синий почти чёрный
        'rgba(134,148,180,1)',  // серо-синий светлый оттенок
      ]}
      locations={[0.5, 1]}        // 60% и 100% как в CSS
      start={{ x: 0.2, y: 0.5 }}    // 90deg → горизонтально слева направо
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
