import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions, ViewToken } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolate
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { Flame, TrendingUp, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';
const BG_COLOR = '#0B0F1A';

// Mock Data
const MOCK_BTC_PRICES = [65400, 64200, 66100, 65800, 67200, 66900, 68000];
const MIN_PRICE = Math.min(...MOCK_BTC_PRICES);
const MAX_PRICE = Math.max(...MOCK_BTC_PRICES);

// ----------------------------------------------------
// COMPONENTS (Memoized and safe)
// ----------------------------------------------------

const ParallaxBackground = memo(({ scrollY }: { scrollY: Animated.SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * 0.3 }], // Lightweight parallax
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backgroundContainer, animatedStyle]}>
      {/* Decorative blurred circles for background */}
      <View style={[styles.blurNode, { top: -100, left: -50, backgroundColor: 'rgba(212, 175, 55, 0.15)' }]} />
      <View style={[styles.blurNode, { top: 300, right: -100, backgroundColor: 'rgba(55, 125, 212, 0.1)' }]} />
    </Animated.View>
  );
});

const TiltCard = memo(({ children, onPress }: { children: React.ReactNode, onPress?: () => void }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onPress}
      android_ripple={{ color: 'rgba(212, 175, 55, 0.15)', borderless: false }}
    >
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
          {children}
        </BlurView>
      </Animated.View>
    </Pressable>
  );
});

const Skeleton = ({ width, height, borderRadius = 8, style }: any) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withTiming(0.7, { duration: 800 });
    const interval = setInterval(() => {
      opacity.value = withTiming(opacity.value === 0.3 ? 0.7 : 0.3, { duration: 800 });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View 
      style={[
        { width, height, borderRadius, backgroundColor: '#ffffff22' }, 
        style, 
        animatedStyle
      ]} 
    />
  );
};

const BalanceWidget = memo(({ loading, balance }: { loading: boolean, balance: number | null }) => {
  return (
    <TiltCard>
      <View style={styles.cardInner}>
        <Text style={styles.cardSubtitle}>Total Portfolio Value</Text>
        {loading || balance === null ? (
          <Skeleton width={150} height={36} style={{ marginTop: 8 }} />
        ) : (
          <Text style={styles.balanceText}>
            ₹{balance.toLocaleString('en-IN')}
          </Text>
        )}
      </View>
    </TiltCard>
  );
});

const StatsWidget = memo(({ loading, xp, streak }: { loading: boolean, xp: number | null, streak: number | null }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = xp !== null ? circumference - (xp / 100) * circumference : circumference;

  return (
    <View style={styles.rowGrid}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <TiltCard>
          <View style={[styles.cardInner, { alignItems: 'center', paddingVertical: 16 }]}>
            <Text style={styles.cardSubtitle}>Daily Streak</Text>
            {loading || streak === null ? (
              <Skeleton width={40} height={28} style={{ marginTop: 8 }} />
            ) : (
              <View style={styles.row}>
                <Flame color="#FFA500" size={24} style={{ marginRight: 6 }} />
                <Text style={styles.statText}>{streak}</Text>
              </View>
            )}
          </View>
        </TiltCard>
      </View>

      <View style={{ flex: 1 }}>
        <TiltCard>
          <View style={[styles.cardInner, { alignItems: 'center', paddingVertical: 16 }]}>
            <Text style={styles.cardSubtitle}>Level XP</Text>
            {loading || xp === null ? (
              <Skeleton width={48} height={48} borderRadius={24} style={{ marginTop: 8 }} />
            ) : (
              <View style={styles.xpContainer}>
                <Svg width={52} height={52} viewBox="0 0 52 52">
                  <Circle
                    cx="26"
                    cy="26"
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <Circle
                    cx="26"
                    cy="26"
                    r={radius}
                    stroke={GOLD}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                  />
                </Svg>
                <View style={styles.xpTextWrapper}>
                  <Text style={styles.xpText}>{xp}</Text>
                </View>
              </View>
            )}
          </View>
        </TiltCard>
      </View>
    </View>
  );
});

const BtcCard = memo(({ loading }: { loading: boolean }) => {
  // Map points for simple SVG sparkline
  const chartHeight = 40;
  const chartWidth = width - 80;
  
  const points = MOCK_BTC_PRICES.map((price, index) => {
    const x = (index / (MOCK_BTC_PRICES.length - 1)) * chartWidth;
    const y = chartHeight - ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <TiltCard>
      <View style={styles.cardInner}>
        <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
          <View style={styles.row}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinBadgeText}>₿</Text>
            </View>
            <View>
              <Text style={styles.coinName}>Bitcoin</Text>
              <Text style={styles.coinSymbol}>BTC</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             {loading ? <Skeleton width={80} height={20} /> : <Text style={styles.coinPrice}>₹56,42,100</Text>}
             {loading ? <Skeleton width={50} height={14} style={{ marginTop: 4 }} /> : <Text style={styles.coinChange}>+2.4%</Text>}
          </View>
        </View>

        {loading ? (
          <Skeleton width="100%" height={chartHeight} />
        ) : (
          <Svg width="100%" height={chartHeight}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={GOLD} stopOpacity="1" />
                <Stop offset="1" stopColor={GOLD} stopOpacity="0.2" />
              </LinearGradient>
            </Defs>
            <Polyline
              points={points}
              fill="none"
              stroke="url(#grad)"
              strokeWidth="2"
            />
          </Svg>
        )}
      </View>
    </TiltCard>
  );
});

// ----------------------------------------------------
// MAIN SCREEN
// ----------------------------------------------------

const WIDGETS = [
  { id: 'balance' },
  { id: 'stats' },
  { id: 'portfolio_preview' },
  { id: 'btc_market' },
];

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ balance: 50000, xp: 75, streak: 12 });
  const scrollY = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Mock fetch fallback safe
        await new Promise(res => setTimeout(res, 1200));
        if (mounted) setLoading(false);
      } catch (err) {
        console.error(err);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const renderItem = useCallback(({ item }: { item: any }) => {
    switch (item.id) {
      case 'balance':
        return <BalanceWidget loading={loading} balance={data.balance} />;
      case 'stats':
        return <StatsWidget loading={loading} xp={data.xp} streak={data.streak} />;
      case 'portfolio_preview':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Markets to Watch</Text>
            <Pressable hitSlop={15} style={styles.row}>
              <Text style={styles.seeAll}>See All</Text>
              <ChevronRight color={GOLD} size={16} />
            </Pressable>
          </View>
        );
      case 'btc_market':
        return <BtcCard loading={loading} />;
      default:
        return null;
    }
  }, [loading, data]);

  return (
    <View style={styles.container}>
      <ParallaxBackground scrollY={scrollY} />
      
      <Animated.FlatList
        data={WIDGETS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BG_COLOR 
  },
  backgroundContainer: {
    overflow: 'hidden',
    zIndex: -1,
  },
  blurNode: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: 'blur(50px)', // Web fallback, absolute circles work naturally in RN standard views but true blur filters might not apply correctly across platforms; we use it conceptually as low-opacity nodes
  },
  listContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120, // 24px bottom margin essentially + tab bar allowance
  },
  cardWrapper: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    backgroundColor: 'rgba(11, 15, 26, 0.5)',
  },
  cardBlur: {
    padding: 24,
  },
  cardInner: {
    justifyContent: 'center',
  },
  rowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8A8D93',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -1,
  },
  statText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpContainer: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpText: {
    color: GOLD,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '600',
    marginRight: 4,
  },
  coinBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(247, 147, 26, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coinBadgeText: {
    color: '#F7931A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  coinName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coinSymbol: {
    color: '#8A8D93',
    fontSize: 13,
    marginTop: 2,
  },
  coinPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coinChange: {
    color: '#00C853',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
