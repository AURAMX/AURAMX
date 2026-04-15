import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

/**
 * Premium 7-Day Performance Sparkline
 * Features draw animation and subtle area gradient.
 */
export const PerformanceSparkline = ({ 
  data = [10, 45, 20, 80, 50, 100, 90], 
  color = '#00C853',
  width = 120,
  height = 50 
}: SparklineProps) => {
  const progress = useSharedValue(0);
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  });

  const d = `M ${points.join(' L ')}`;
  const areaD = `${d} L ${width},${height} L 0,${height} Z`;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2000, easing: Easing.bezier(0.25, 1, 0.5, 1) });
  }, []);

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - progress.value) * 1000, // Large enough offset to hide
  }));

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaD} fill="url(#fillGradient)" />
        <Path 
            d={d} 
            stroke={color} 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
      </Svg>
    </View>
  );
};
