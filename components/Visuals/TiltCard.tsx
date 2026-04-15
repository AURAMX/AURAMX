import React from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  Gesture, 
  GestureDetector, 
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate 
} from 'react-native-reanimated';

interface TiltCardProps {
  children: React.ReactNode;
}

/**
 * Premium 3D Tilt Wrapper
 * Follows touch/gesture to create a ±5deg perspective tilt effect.
 */
export const TiltCard = ({ children }: TiltCardProps) => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin((e) => {
      x.value = withSpring(e.x);
      y.value = withSpring(e.y);
    })
    .onUpdate((e) => {
      x.value = e.x;
      y.value = e.y;
    })
    .onEnd(() => {
      x.value = withSpring(0);
      y.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    // Note: We use static width/height for interpolation or measure on layout
    // For now, simple direct mapping
    const rotateX = `${interpolate(y.value, [-100, 100], [5, -5])}deg`;
    const rotateY = `${interpolate(x.value, [-100, 100], [-5, 5])}deg`;

    return {
      transform: [
        { perspective: 1000 },
        { rotateX },
        { rotateY },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    backfaceVisibility: 'hidden',
  }
});
