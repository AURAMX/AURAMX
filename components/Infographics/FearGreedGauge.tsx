import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  interpolate
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

interface FearGreedGaugeProps {
  value?: number; // 0 to 100
  size?: number;
}

/**
 * Premium Fear & Greed Gauge
 * Semi-circle with color segments and animated needle.
 */
export const FearGreedGauge = ({ 
  value = 63, 
  size = 200 
}: FearGreedGaugeProps) => {
  const rotation = useSharedValue(0);
  const radius = size / 2.2;
  const strokeWidth = 12;
  const center = size / 2;

  useEffect(() => {
    rotation.value = withTiming(value, { 
        duration: 2000, 
        easing: Easing.out(Easing.exp) 
    });
  }, [value]);

  const needleStyle = useAnimatedStyle(() => {
    const angle = interpolate(rotation.value, [0, 100], [-90, 90]);
    return {
      transform: [
        { translateX: center },
        { translateY: center },
        { rotate: `${angle}deg` },
        { translateX: -center },
        { translateY: -center },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size / 1.5}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF5252" />
            <Stop offset="50%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#00C853" />
          </LinearGradient>
        </Defs>
        <G rotation="-180" origin={`${center}, ${center}`}>
          <Path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </G>
        <AnimatedG style={needleStyle}>
           <Line 
             x1={center} 
             y1={center} 
             x2={center} 
             y2={center - radius + 5} 
             stroke="#fff" 
             strokeWidth="3" 
             strokeLinecap="round" 
           />
           <Circle cx={center} cy={center} r="6" fill="#fff" />
        </AnimatedG>
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.status}>
            {value > 75 ? 'Extreme Greed' : value > 50 ? 'Greed' : value > 25 ? 'Fear' : 'Extreme Fear'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginTop: -20,
    alignItems: 'center',
  },
  value: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  status: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
