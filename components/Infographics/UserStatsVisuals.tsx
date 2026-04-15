import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const XPProgressCircle = ({ 
    xp = 450, 
    total = 500, 
    size = 120,
    level = 2
}: { 
    xp: number, 
    total: number, 
    size?: number,
    level: number 
}) => {
  const progress = useSharedValue(0);
  const radius = size / 2.5;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  useEffect(() => {
    progress.value = withTiming(xp / total, { duration: 1500, easing: Easing.out(Easing.exp) });
  }, [xp, total]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
           <Circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
           <AnimatedCircle 
             cx={center} 
             cy={center} 
             r={radius} 
             fill="none" 
             stroke="#D4AF37" 
             strokeWidth="10" 
             strokeDasharray={circumference} 
             animatedProps={animatedProps}
             strokeLinecap="round"
           />
        </G>
      </Svg>
      <View style={[styles.centerLabel, { width: size, height: size }]}>
        <Text style={styles.xpText}>{xp}/{total} XP</Text>
        <Text style={styles.lvlText}>Lvl {level} → {level + 1}</Text>
      </View>
    </View>
  );
};

export const StreakHeatMap = ({ activityData = [] }: { activityData: boolean[] }) => {
    // activityData: array of 28-31 booleans representing activity for the month
    return (
        <View style={styles.streakGrid}>
            {[...Array(28)].map((_, i) => {
                const active = activityData[i] || Math.random() > 0.7; // Mocking activity
                const trade = active && Math.random() > 0.5;
                return (
                    <View key={i} style={[
                        styles.day, 
                        active && { backgroundColor: '#c8e6c9' },
                        trade && { backgroundColor: '#00C853' },
                        i === 14 && { borderColor: '#D4AF37', borderWidth: 1 } // Current day
                    ]} />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  centerLabel: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  xpText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  lvlText: { color: '#8A8D93', fontSize: 10, marginTop: 2, fontWeight: 'bold' },
  streakGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: 230 },
  day: { width: 22, height: 22, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' }
});
