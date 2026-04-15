import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Dimensions, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';
import Svg, { Rect, Line, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { TrendingUp, TrendingDown, CreditCard, Activity, Target, Layers } from 'lucide-react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withRepeat, 
    withSequence 
} from 'react-native-reanimated';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { RippleButton } from '@/components/Visuals/RippleButton';
import { RSIGauge, VolumeBars } from '@/components/Infographics/MarketIndicators';

import { engineCall } from '@/lib/stability_engine';
import { trackEvent, earnXP, unlockBadge } from '@/lib/analytics_tracker';
import { analyzeMarket } from '@/lib/gemini_service';
import { CardSkeleton } from '@/components/UI/SkeletonLoader';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';

type Candle = { open: number; high: number; low: number; close: number; timestamp: number; };
const CHART_HEIGHT = 220;
const CHART_WIDTH = width - 40;

import { CandlestickChart, LineChart } from 'react-native-wagmi-charts';

export const ProductionChart = React.memo(({ candles, type }: { candles: Candle[], type: 'candle' | 'line' }) => {
  if (candles.length === 0) return <CardSkeleton />;

  return (
    <View style={styles.chartContainer}>
        {type === 'candle' ? (
            <CandlestickChart.Provider data={candles}>
                <CandlestickChart height={CHART_HEIGHT} width={CHART_WIDTH}>
                    <CandlestickChart.Candles positiveColor={Colors.profit} negativeColor={Colors.loss} />
                    <CandlestickChart.Crosshair>
                        <CandlestickChart.Tooltip />
                    </CandlestickChart.Crosshair>
                </CandlestickChart>
            </CandlestickChart.Provider>
        ) : (
            <LineChart.Provider data={candles}>
                <LineChart height={CHART_HEIGHT} width={CHART_WIDTH}>
                    <LineChart.Path color={Colors.gold} />
                    <LineChart.CursorCrosshair>
                        <LineChart.Tooltip />
                    </LineChart.CursorCrosshair>
                </LineChart>
            </LineChart.Provider>
        )}
    </View>
  );
});

export default function TradeScreen() {
  const { symbol = 'BTC' } = useLocalSearchParams<{ symbol: string }>();
  const { user, balance, setBalance, triggerCelebration } = useAuthStore();
  
  const [asset, setAsset] = useState<any>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [trading, setTrading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priceColor, setPriceColor] = useState('#fff');

  const candleRef = useRef<Candle[]>([]);

  // 5s Moving Candle Simulation
  useEffect(() => {
    const interval = setInterval(() => {
        if (candleRef.current.length === 0) return;
        const last = candleRef.current[candleRef.current.length - 1];
        const change = (Math.random() - 0.5) * 50; 
        const newCandle = {
            ...last,
            close: last.close + change,
            high: Math.max(last.high, last.close + change),
            low: Math.min(last.low, last.close + change),
            timestamp: Date.now()
        };
        const updated = [...candleRef.current.slice(1), newCandle];
        candleRef.current = updated;
        setCandles(updated);

        // Flash Color
        setPriceColor(change >= 0 ? '#00C853' : '#FF5252');
        setTimeout(() => setPriceColor('#fff'), 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await engineCall(async () => await supabase.from('assets').select('*').eq('symbol', symbol).single());
    if (data) {
        setAsset(data);
        const initial = [...Array(30)].map((_, i) => ({
            open: data.current_price, close: data.current_price, high: data.current_price + 10, low: data.current_price - 10, timestamp: Date.now() - i * 5000
        }));
        setCandles(initial);
        candleRef.current = initial;
    }
    setLoading(false);
  }, [user, symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!user || trading) return;
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return Alert.alert('Invalid Order', 'Please enter a valid quantity.');
    
    const price = candles[candles.length - 1]?.close || asset?.current_price;
    const totalValue = qty * price;

    if (type === 'buy' && totalValue > balance) {
        return Alert.alert('Insufficient Funds', 'Your virtual balance is too low for this transaction.');
    }

    setTrading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
        // 1. Write Trade to Supabase (Authority)
        const { data: trade, error: tErr } = await engineCall(async () => await supabase.from('trades').insert({
            user_id: user.id,
            symbol: symbol,
            type: type,
            quantity: qty,
            price: price,
            timestamp: new Date().toISOString()
        }).select().single());

        if (tErr) throw tErr;

        // 2. Update Profile Balance (Authority)
        const newBalance = type === 'buy' ? balance - totalValue : balance + totalValue;
        const { error: pErr } = await engineCall(async () => await supabase.from('profiles').update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
        }).eq('id', user.id));

        if (pErr) throw pErr;

        // 3. Sync Journal (Requirement)
        if (note.trim()) {
            await engineCall(async () => await supabase.from('journal').insert({
                user_id: user.id,
                note: note,
                trade_id: trade.id
            }), { silent: true });
        }

        // 4. Update Client State & Earn XP
        setBalance(newBalance);
        await earnXP(user.id, 25, 'trade_execution');
        
        triggerCelebration();
        setQuantity('');
        setNote('');
        Alert.alert('Trade Executed', `Successfully ${type === 'buy' ? 'purchased' : 'sold'} ${qty} ${symbol}.`);
        
    } catch (e: any) {
        console.error('[TradeEngine] Critical Failure:', e.message);
        Alert.alert('Execution Error', 'The institutional matching engine failed to process your order. Please retry.');
    } finally {
        setTrading(false);
    }
  };

  return (
    <SafeView loading={loading}>
        <MorphingBackground />
        <ParticleSystem />

        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
                <Text style={styles.symbol}>{symbol} / INR</Text>
                <Text style={[styles.price, { color: priceColor }]}>
                    ₹{(candles[candles.length - 1]?.close || asset?.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
            </View>

            {/* Chart Area */}
            <GlassCard style={styles.chartCard}>
                <View style={[styles.row, { marginBottom: 15 }]}>
                    <View style={styles.selector}>
                        <Pressable onPress={() => setChartType('candle')} style={[styles.selBtn, chartType === 'candle' && styles.selActive]}>
                            <Layers size={14} color={chartType === 'candle' ? '#000' : '#8A8D93'} />
                        </Pressable>
                        <Pressable onPress={() => setChartType('line')} style={[styles.selBtn, chartType === 'line' && styles.selActive]}>
                            <Activity size={14} color={chartType === 'line' ? '#000' : '#8A8D93'} />
                        </Pressable>
                    </View>
                    <View style={styles.row}>
                        <Target size={14} color="#00C853" style={{ marginRight: 4 }} />
                        <Text style={styles.indicatorText}>Live Feed</Text>
                    </View>
                </View>
                
                <ProductionChart candles={candles} type={chartType} />
                
                <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <RippleButton 
                        title="AI ANALYST" 
                        variant="gold" 
                        size="sm"
                        style={{ width: 140 }}
                        onPress={async () => {
                            const insight = await analyzeMarket(symbol, candles, { rsi: 65 });
                            Alert.alert('AI Insight', insight);
                        }}
                    />
                    <RSIGauge value={65} size={80} />
                </View>
            </GlassCard>

            {/* Order Panel */}
            <GlassCard style={styles.orderCard}>
                <View style={styles.row}>
                    <Text style={styles.label}>Available Balance</Text>
                    <Text style={styles.balVal}>₹{balance.toLocaleString()}</Text>
                </View>
                
                <TextInput 
                    style={styles.input} 
                    placeholder="Quantity" 
                    placeholderTextColor="#444" 
                    keyboardType="numeric" 
                    value={quantity}
                    onChangeText={setQuantity}
                />
                
                <View style={styles.actions}>
                    <RippleButton 
                        title="BUY" 
                        variant="green" 
                        style={{ flex: 1, marginRight: 10, height: 60, shadowColor: Colors.profit, shadowOpacity: 0.2, shadowRadius: 10 }} 
                        onPress={() => handleTrade('buy')}
                        disabled={trading}
                    />
                    <RippleButton 
                        title="SELL" 
                        variant="red" 
                        style={{ flex: 1, height: 60 }} 
                        onPress={() => handleTrade('sell')}
                        disabled={trading}
                    />
                </View>
            </GlassCard>

            <View style={{ height: 100 }} />
        </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 24 },
  symbol: { color: GOLD, fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  price: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 4 },
  chartCard: { padding: 15, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 },
  selBtn: { width: 36, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  selActive: { backgroundColor: GOLD },
  indicatorText: { color: '#00C853', fontSize: 11, fontWeight: 'bold' },
  chartContainer: { height: CHART_HEIGHT, width: CHART_WIDTH, justifyContent: 'center' },
  orderCard: { padding: 24 },
  label: { color: '#8A8D93', fontSize: 13, fontWeight: 'bold' },
  balVal: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', height: 60, borderRadius: 12, paddingHorizontal: 20, marginVertical: 20, fontSize: 20, fontWeight: 'bold', borderWidth: 1, borderColor: '#333' },
  actions: { flexDirection: 'row' }
});
