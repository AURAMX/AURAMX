import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  interpolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const Bubble = ({ 
    symbol, 
    value, 
    change, 
    size, 
    x, 
    y 
}: { 
    symbol: string, 
    value: number, 
    change: number, 
    size: number, 
    x: number, 
    y: number 
}) => {
  const float = useSharedValue(0);
  const color = change >= 0 ? '#00C853' : '#FF5252';
  const opacity = Math.min(0.8, Math.max(0.3, Math.abs(change) / 10));

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [-5, 5]) }
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: x - size/2, top: y - size/2 }, animatedStyle]}>
      <Svg width={size} height={size}>
        <Circle 
            cx={size/2} 
            cy={size/2} 
            r={size/2 - 2} 
            fill={color} 
            opacity={opacity} 
            stroke={color} 
            strokeWidth={1} 
        />
        <SvgText
          x={size/2}
          y={size/2 + 2}
          fontSize={size/4}
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {symbol}
        </SvgText>
      </Svg>
    </Animated.View>
  );
};

export const MarketCapBubbles = () => {
  const data = [
    { symbol: 'BTC', value: 1000, change: 5, size: 100, x: width/2 - 40, y: 70 },
    { symbol: 'ETH', value: 500, change: -2, size: 80, x: width/2 + 60, y: 100 },
    { symbol: 'SOL', value: 200, change: 12, size: 60, x: width/2 - 80, y: 140 },
    { symbol: 'BNB', value: 200, change: 0.5, size: 55, x: width/2 + 20, y: 170 },
  ];

  return (
    <View style={styles.container}>
      {data.map((b, i) => (
        <Bubble key={b.symbol} {...b} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 240,
    width: '100%',
    position: 'relative',
  }
});
