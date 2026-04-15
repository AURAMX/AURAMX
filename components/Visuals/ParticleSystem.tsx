import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  interpolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 30;

const Particle = ({ index }: { index: number }) => {
  const progress = useSharedValue(0);
  const randomX = Math.random() * width;
  const randomY = Math.random() * height;
  const duration = 15000 + Math.random() * 10000;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.linear) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -50 - Math.random() * 50]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.1, 0.2, 0.1]);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.particle, { left: randomX, top: randomY }, animatedStyle]}>
      <Svg height="4" width="4">
        <Circle cx="2" cy="2" r="1.5" fill="#D4AF37" />
      </Svg>
    </Animated.View>
  );
};

export const ParticleSystem = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(PARTICLE_COUNT)].map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  }
});
