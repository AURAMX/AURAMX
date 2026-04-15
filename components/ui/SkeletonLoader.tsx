import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = ({ 
  width: w = '100%', 
  height: h = 20, 
  borderRadius: r = 8, 
  style 
}: SkeletonProps) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[
      styles.container, 
      { width: w as any, height: h as any, borderRadius: r }, 
      style
    ]}>
      <Animated.View style={[
        StyleSheet.absoluteFill, 
        { transform: [{ translateX }] }
      ]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const CardSkeleton = () => (
    <View style={styles.card}>
        <Skeleton width="60%" height={24} style={{ marginBottom: 12 }} />
        <Skeleton width="40%" height={16} style={{ marginBottom: 20 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width="45%" height={44} borderRadius={12} />
            <Skeleton width="45%" height={44} borderRadius={12} />
        </View>
    </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
  },
  card: {
    padding: 24,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
  }
});
