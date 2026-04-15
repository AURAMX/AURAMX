import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  interpolate
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

export const RSIGauge = ({ value = 45, size = 120 }) => {
  const rotation = useSharedValue(0);
  const radius = size / 2.5;
  const center = size / 2;

  React.useEffect(() => {
    rotation.value = withTiming(value, { duration: 1500, easing: Easing.out(Easing.exp) });
  }, [value]);

  const needleStyle = useAnimatedStyle(() => {
    const angle = interpolate(rotation.value, [0, 100], [-135, 135]);
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
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Track */}
          <Circle cx={center} cy={center} r={radius} fill="none" stroke="#222" strokeWidth="8" />
          {/* Overbought (70-100) */}
          <Path d={`M ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`} fill="none" stroke="#FF5252" strokeWidth="8" />
          {/* Oversold (0-30) */}
          <Path d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center} ${center - radius}`} fill="none" stroke="#00C853" strokeWidth="8" opacity={0.3} />
        </G>
        <AnimatedG style={needleStyle}>
           <Path d={`M ${center - 2} ${center} L ${center} ${center - radius + 10} L ${center + 2} ${center} Z`} fill="#fff" />
           <Circle cx={center} cy={center} r="4" fill="#fff" />
        </AnimatedG>
      </Svg>
      <Text style={styles.val}>{value}</Text>
      <Text style={styles.label}>RSI</Text>
    </View>
  );
};

export const VolumeBars = ({ data = [40, 60, 30, 80, 50, 90, 70], height = 40, width = 200 }) => {
    const barWidth = width / data.length - 4;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height, width }}>
            {data.map((v, i) => (
                <View key={i} style={{ 
                    width: barWidth, 
                    height: (v / 100) * height, 
                    backgroundColor: i % 2 === 0 ? '#00C853' : '#FF5252', 
                    borderRadius: 2,
                    opacity: 0.6
                }} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  val: { color: '#fff', fontSize: 18, fontWeight: 'bold', position: 'absolute', top: '35%' },
  label: { color: '#8A8D93', fontSize: 10, fontWeight: 'bold', position: 'absolute', top: '55%' }
});
