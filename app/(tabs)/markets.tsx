import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Search, Filter, TrendingUp, Clock, Globe } from 'lucide-react-native';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { RippleButton } from '@/components/Visuals/RippleButton';
import { MarketCapBubbles } from '@/components/Infographics/MarketCapBubbles';
import { HeatMapGrid } from '@/components/Infographics/HeatMapGrid';
import { PerformanceSparkline } from '@/components/Infographics/PerformanceSparkline';

import { engineCall } from '@/lib/stability_engine';
import { trackEvent } from '@/lib/analytics_tracker';
import { useAuthStore } from '@/hooks/useAuthStore';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';

export default function MarketsScreen() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const router = useRouter();

  const fetchAssets = useCallback(async () => {
    const { data } = await engineCall(async () => await supabase.from('assets').select('*').order('symbol'), { cacheKey: 'markets_all_assets' });
    if (data) setAssets(data);
    setLoading(false);
    if (user) trackEvent(user.id, 'view_markets');
  }, [user]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Mock Live Feed: Jitter prices every 3 seconds to feel "Real"
  useEffect(() => {
    if (assets.length === 0) return;
    const interval = setInterval(() => {
        setAssets(prev => prev.map(item => {
            const jitter = 1 + (Math.random() * 0.004 - 0.002); // +/- 0.2% movement
            return {
                ...item,
                current_price: parseFloat((item.current_price * jitter).toFixed(2)),
                change_24h: parseFloat((item.change_24h + (jitter - 1) * 100).toFixed(2))
            };
        }));
    }, 3000);
    return () => clearInterval(interval);
  }, [assets.length]);

  const onSelect = (symbol: string) => router.push({ pathname: '/(tabs)/trade', params: { symbol } });

  return (
    <SafeView loading={loading}>
        <MorphingBackground />
        <ParticleSystem />

        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Search & Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Markets</Text>
                <GlassCard style={styles.searchBar}>
                    <Search color="#8A8D93" size={18} />
                    <TextInput 
                        placeholder="Search coins (BTC, SOL...)" 
                        placeholderTextColor="#444" 
                        style={styles.searchInput} 
                    />
                </GlassCard>
            </View>

            {/* Market Indicators Overlay */}
            <View style={styles.statusRow}>
                <View style={styles.indicator}>
                    <View style={styles.pulse} />
                    <Text style={styles.indicatorText}>NSE: OPEN</Text>
                </View>
                <View style={styles.indicator}>
                    <Globe color="#00C853" size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.indicatorText}>GLOBAL: HIGH VOL</Text>
                </View>
            </View>

            {/* Visual Insights Section */}
            <Text style={styles.secTitle}>Market Sentiment</Text>
            <MarketCapBubbles />
            
            <View style={styles.spacer} />
            
            <Text style={styles.secTitle}>Daily Heatmap</Text>
            <HeatMapGrid />

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                {['All', 'Favorites', 'Altcoins', 'DeFi', 'Gaming'].map(cat => (
                    <Pressable 
                        key={cat} 
                        onPress={() => setCategory(cat)}
                        style={[styles.filterBtn, category === cat && styles.filterBtnActive]}
                    >
                        <Text style={[styles.filterText, category === cat && styles.filterTextActive]}>{cat}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Ticker List */}
            <View style={styles.list}>
                {assets.map(a => (
                    <TiltCard key={a.id}>
                        <Pressable onPress={() => onSelect(a.symbol)}>
                            <GlassCard style={styles.tickerItem}>
                                <View style={styles.row}>
                                    <View style={styles.rowInner}>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{a.symbol[0]}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.name}>{a.name}</Text>
                                            <Text style={styles.symbol}>{a.symbol}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={{ alignItems: 'center', width: 60 }}>
                                        <PerformanceSparkline 
                                            data={[40, 60, 30, 80, 50, 90, 70]} 
                                            color={a.change_24h >= 0 ? '#00C853' : '#FF5252'} 
                                            width={60} 
                                            height={24} 
                                        />
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.price}>₹{a.current_price.toLocaleString()}</Text>
                                        <Text style={[styles.change, { color: a.change_24h >= 0 ? '#00C853' : '#FF5252' }]}>
                                            {a.change_24h > 0 ? '+' : ''}{a.change_24h}%
                                        </Text>
                                    </View>
                                </View>
                            </GlassCard>
                        </Pressable>
                    </TiltCard>
                ))}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    </SafeView>
  );
}

// Internal Local Component for Tilt logic on markets list
const TiltCard = ({ children }: { children: React.ReactNode }) => {
    return <View style={{ marginBottom: 12 }}>{children}</View>;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 4, paddingHorizontal: 15, height: 52 },
  searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 16 },
  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  indicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,200,83,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  indicatorText: { color: '#00C853', fontSize: 10, fontWeight: 'bold' },
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C853', marginRight: 6 },
  secTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  spacer: { height: 30 },
  filterBar: { flexDirection: 'row', marginBottom: 20 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
  filterBtnActive: { backgroundColor: GOLD },
  filterText: { color: '#8A8D93', fontWeight: 'bold' },
  filterTextActive: { color: '#000' },
  list: { marginTop: 10 },
  tickerItem: { padding: 15, height: 74 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  rowInner: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  badgeText: { color: GOLD, fontWeight: 'bold', fontSize: 18 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  symbol: { color: '#8A8D93', fontSize: 11, fontWeight: 'bold' },
  price: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  change: { fontSize: 12, fontWeight: 'bold' }
});
