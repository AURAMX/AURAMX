import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle, Path } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface PortfolioDonutProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  totalValue?: string;
}

/**
 * Premium Portfolio Donut Chart
 * Features draw-in animation and centered portfolio value.
 */
export const PortfolioDonut = ({ 
  data, 
  size = 200, 
  totalValue = "₹0" 
}: PortfolioDonutProps) => {
  const progress = useSharedValue(0);
  const radius = size / 2.5;
  const strokeWidth = 15;
  const center = size / 2;
  
  useEffect(() => {
    progress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) });
  }, []);

  let cumulativeAngle = 0;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {data.map((item, index) => {
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + (item.value / 100) * 360;
            cumulativeAngle = endAngle;

            const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
            const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
            const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
            const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);

            const largeArcFlag = (item.value / 100) * 360 > 180 ? 1 : 0;
            const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

            return (
              <AnimatedPath
                key={index}
                d={d}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                opacity={progress}
              />
            );
          })}
        </G>
      </Svg>
      <View style={[styles.centerLabel, { width: size, height: size }]}>
        <Text style={styles.total}>{totalValue}</Text>
        <Text style={styles.subText}>Portfolio</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  total: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subText: {
    color: '#8A8D93',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
