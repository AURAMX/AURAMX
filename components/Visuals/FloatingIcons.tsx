import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { Bitcoin, Coins } from 'lucide-react-native';

const GOLD = '#D4AF37';

const FloatingIcon = ({ 
  children, 
  duration, 
  delay = 0, 
  size = 80,
  style 
}: { 
  children: React.ReactNode, 
  duration: number, 
  delay?: number,
  size?: number,
  style?: any 
}) => {
  const float = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    rotate.value = withRepeat(
      withTiming(1, { duration: duration * 1.5, easing: Easing.inOut(Easing.linear) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(float.value, [0, 1], [-10, 10]);
    const rotation = interpolate(rotate.value, [0, 1], [-5, 5]);
    return {
      transform: [
        { translateY },
        { rotate: `${rotation}deg` }
      ],
    };
  });

  return (
    <Animated.View style={[styles.floating, style, animatedStyle]}>
        <View style={[styles.glow, { width: size, height: size, borderRadius: size/2 }]} />
        {children}
    </Animated.View>
  );
};

export const FloatingIcons = () => {
  return (
    <>
      {/* Bitcoin Top Right */}
      <FloatingIcon duration={6000} size={80} style={styles.btcPosition}>
        <Bitcoin color={GOLD} size={80} strokeWidth={1} />
      </FloatingIcon>

      {/* Ethereum Bottom Left (using Coins as proxy if Ethereum icon isn't standard in lucide-react-native) */}
      <FloatingIcon duration={7000} size={70} style={styles.ethPosition}>
        <Coins color="#627EEA" size={70} strokeWidth={1} />
      </FloatingIcon>
    </>
  );
};

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: GOLD,
    opacity: 0.15,
    // Note: React Native doesn't support blur filters easily on View, 
    // but the low opacity + size gives a glow feel.
  },
  btcPosition: {
    top: 60,
    right: 30,
  },
  ethPosition: {
    bottom: 120,
    left: 40,
  }
});
