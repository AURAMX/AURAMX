import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withSequence, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const COLORS = ['#D4AF37', '#FFD700', '#FFFFFF', '#00C853', '#FF5252'];

const Particle = ({ delay, color }: { delay: number, color: string }) => {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(-20);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    y.value = withDelay(delay, withTiming(height + 20, { 
        duration: 2000 + Math.random() * 1000, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    rotation.value = withDelay(delay, withTiming(Math.random() * 360, { duration: 2000 }));
    opacity.value = withDelay(delay + 1500, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    opacity: opacity.value,
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={10} height={10}>
        <Rect width={10} height={10} fill={color} />
      </Svg>
    </Animated.View>
  );
};

import { Fireworks } from './Visuals/Fireworks';

const Particle = ({ delay, color }: { delay: number, color: string }) => {
    // ... (existing particle logic)
};

export const Celebration = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fireworks onComplete={() => {}} />
      {[...Array(40)].map((_, i) => (
        <Particle 
            key={i} 
            delay={1000 + (i * 50)} 
            color={COLORS[i % COLORS.length]} 
        />
      ))}
    </View>
  );
};
