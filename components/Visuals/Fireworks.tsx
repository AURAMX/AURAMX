import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withSequence, 
  Easing,
  runOnJS,
  withSpring
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const COLORS = ['#D4AF37', '#FFD700', '#F0B90B', '#00C853', '#FF5252', '#2196F3'];

const Spark = ({ x, y, angle, color, delay }: { x: number, y: number, angle: number, color: string, delay: number }) => {
    const distance = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
        distance.value = withDelay(delay, withSpring(100 + Math.random() * 50, { damping: 12 }));
        opacity.value = withDelay(delay + 800, withTiming(0, { duration: 400 }));
        scale.value = withDelay(delay + 500, withTiming(0, { duration: 700 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * distance.value;
        const ty = Math.sin(rad) * distance.value;
        
        return {
            position: 'absolute',
            left: x,
            top: y,
            opacity: opacity.value,
            transform: [
                { translateX: tx },
                { translateY: ty },
                { scale: scale.value }
            ]
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
        </Animated.View>
    );
};

const FireworkCore = ({ x, y, delay }: { x: number, y: number, delay: number }) => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(12)].map((_, i) => (
                <Spark 
                    key={i} 
                    x={x} 
                    y={y} 
                    angle={i * 30} 
                    color={COLORS[Math.floor(Math.random() * COLORS.length)]} 
                    delay={delay}
                />
            ))}
        </View>
    );
};

export const Fireworks = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <FireworkCore x={width * 0.2} y={height * 0.3} delay={0} />
        <FireworkCore x={width * 0.8} y={height * 0.4} delay={400} />
        <FireworkCore x={width * 0.5} y={height * 0.2} delay={800} />
        <FireworkCore x={width * 0.3} y={height * 0.6} delay={1200} />
        <FireworkCore x={width * 0.7} y={height * 0.7} delay={1600} />
    </View>
  );
};
