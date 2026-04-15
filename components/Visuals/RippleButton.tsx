import React from 'react';
import { 
  StyleSheet, 
  Pressable, 
  View, 
  Text, 
  PressableProps, 
  Dimensions 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface RippleButtonProps extends PressableProps {
  title?: string;
  variant?: 'gold' | 'outline' | 'red' | 'green';
  children?: React.ReactNode;
}

/**
 * Premium Ripple Button
 * Features scale animation, haptic feedback, and a gradient-like ripple.
 */
export const RippleButton = ({ 
  title, 
  variant = 'gold', 
  children, 
  style, 
  onPress,
  ...props 
}: RippleButtonProps) => {
  const scale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    rippleOpacity.value = 1;
    rippleScale.value = 0;
    rippleScale.value = withTiming(2, { duration: 400, easing: Easing.out(Easing.quad) });
    rippleOpacity.value = withTiming(0, { duration: 400 });

    if (onPress) onPress(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
    position: 'absolute',
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }]
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <Pressable 
        style={({ pressed }) => [
          styles.btn, 
          styles[variant],
        ]}
        onPress={handlePress}
        {...props}
      >
        <Animated.View style={rippleStyle} />
        {title ? <Text style={[styles.text, variant === 'outline' && { color: '#D4AF37' }]}>{title}</Text> : children}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btn: {
    minHeight: 52,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  gold: {
    backgroundColor: '#D4AF37',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  red: {
    backgroundColor: '#FF5252',
  },
  green: {
    backgroundColor: '#00C853',
  }
});
