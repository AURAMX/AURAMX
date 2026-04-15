import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface HeatMapItem {
  symbol: string;
  price: string;
  change: number;
}

const HeatMapCell = ({ item }: { item: HeatMapItem }) => {
  const router = useRouter();
  const scale = useSharedValue(1);

  const getBackgroundColor = (change: number) => {
    if (change >= 10) return '#00C853'; // Deep Green
    if (change >= 2) return '#69F0AE';  // Light Green
    if (change > -2) return '#1A1F2E';  // Neutral
    if (change > -10) return '#FF8A80'; // Light Red
    return '#D50000';                   // Deep Red
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: getBackgroundColor(item.change),
  }));

  const handlePressIn = () => { scale.value = withSpring(1.05); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  return (
    <Pressable 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => router.push({ pathname: '/(tabs)/trade', params: { symbol: item.symbol } })}
      style={styles.cellWrapper}
    >
      <Animated.View style={[styles.cell, animatedStyle]}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.change}>{item.change > 0 ? '+' : ''}{item.change}%</Text>
      </Animated.View>
    </Pressable>
  );
};

export const HeatMapGrid = () => {
  const data: HeatMapItem[] = [
    { symbol: 'BTC', price: '₹84L', change: 2.5 },
    { symbol: 'ETH', price: '₹2.1L', change: -1.2 },
    { symbol: 'SOL', price: '₹12K', change: 12.8 },
    { symbol: 'BNB', price: '₹52K', change: 0.8 },
    { symbol: 'XRP', price: '₹95', change: -3.4 },
    { symbol: 'ADA', price: '₹42', change: -11.2 },
    { symbol: 'DOGE', price: '₹14', change: 15.5 },
    { symbol: 'MATIC', price: '₹48', change: 1.2 },
    { symbol: 'DOT', price: '₹520', change: -5.1 },
    { symbol: 'LINK', price: '₹1.2K', change: 4.8 },
    { symbol: 'SHIB', price: '₹0.002', change: -0.5 },
    { symbol: 'LTC', price: '₹8K', change: 2.1 },
  ];

  return (
    <View style={styles.grid}>
      {data.map((item) => (
        <HeatMapCell key={item.symbol} item={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  cellWrapper: {
    width: (width - 64) / 3, // 3 columns
    height: 80,
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  symbol: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  price: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  change: { color: 'white', fontSize: 11, fontWeight: '800', marginTop: 4 }
});
