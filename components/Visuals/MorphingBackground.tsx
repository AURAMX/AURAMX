import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolateColor,
  Easing 
} from 'react-native-reanimated';

/**
 * Premium Morphing Gradient Background
 * Transitions between deep navy and subtle charcoal over a 10s cycle.
 */
export const MorphingBackground = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.linear) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#0B0F1A', '#1A1F2E']
    );
    return { backgroundColor };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <View style={styles.vignette} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Using a simple radial-like gradient feel with opacity
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 100,
  }
});
