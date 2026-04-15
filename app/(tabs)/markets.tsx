import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, TextInput, Modal } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    FadeIn,
    SlideInRight,
    withSpring,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Search, TrendingUp, TrendingDown, Globe, Zap, X } from 'lucide-react-native';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { PerformanceSparkline } from '@/components/Infographics/PerformanceSparkline';

import { engineCall } from '@/lib/stability_engine';
import { trackEvent } from '@/lib/analytics_tracker';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePriceStore } from '@/hooks/usePriceStore';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';

// ─── Live Price Row ────────────────────────────────────────
const LiveTickerRow = React.memo(({ asset, onPress }: { asset: any; onPress: () => void }) => {
    const { prices } = usePriceStore();
    const live = prices[asset.symbol];
    const currentPrice = live?.price ?? asset.current_price;
    const change = live?.change24h ?? asset.change_24h;

    const flashOpacity = useSharedValue(0);
    const scale = useSharedValue(1);
    const prevPrice = useRef(currentPrice);

    useEffect(() => {
        if (live?.price && live.price !== prevPrice.current) {
            const isUp = live.price > prevPrice.current;
            flashOpacity.value = 0.35;
            flashOpacity.value = withTiming(0, { duration: 700 });
            scale.value = withSequence(
                withTiming(1.03, { duration: 120 }),
                withTiming(1, { duration: 200 })
            );
            prevPrice.current = live.price;
        }
    }, [live?.price]);

    const flashStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 16,
        backgroundColor: change >= 0
            ? `rgba(0, 200, 83, ${flashOpacity.value})`
            : `rgba(255, 82, 82, ${flashOpacity.value})`,
    }));

    const rowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const isUp = change >= 0;
    const sparkData = [40, 60, 30, 80, 50, 90, 70].map(v =>
        v * (1 + (Math.random() * 0.06 - 0.03))
    );

    return (
        <Animated.View style={[rowStyle, { marginBottom: 10 }]}>
            <Pressable onPress={onPress}>
                <GlassCard style={styles.tickerItem}>
                    <Animated.View style={flashStyle} />
                    <View style={styles.tickerRow}>
                        <View style={styles.coinBadge}>
                            <Text style={styles.coinInitial}>{asset.symbol[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.coinName}>{asset.name}</Text>
                            <Text style={styles.coinSym}>{asset.symbol}</Text>
                        </View>
                        <View style={{ width: 64, alignItems: 'center' }}>
                            <PerformanceSparkline
                                data={sparkData}
                                color={isUp ? '#00C853' : '#FF5252'}
                                width={60}
                                height={24}
                            />
                        </View>
                        <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
                            <Text style={styles.price}>₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                            <View style={[styles.changeBadge, { backgroundColor: isUp ? 'rgba(0,200,83,0.12)' : 'rgba(255,82,82,0.12)' }]}>
                                {isUp ? <TrendingUp size={9} color="#00C853" /> : <TrendingDown size={9} color="#FF5252" />}
                                <Text style={[styles.changeText, { color: isUp ? '#00C853' : '#FF5252' }]}>
                                    {isUp ? '+' : ''}{change.toFixed(2)}%
                                </Text>
                            </View>
                        </View>
                    </View>
                </GlassCard>
            </Pressable>
        </Animated.View>
    );
});

// ─── Market Mood Indicator ─────────────────────────────────
const MarketMoodBadge = () => {
    const { marketMood } = usePriceStore();
    const flicker = useSharedValue(1);

    useEffect(() => {
        flicker.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.quad) }),
                withTiming(1, { duration: 800 })
            ),
            -1, true
        );
    }, []);

    const flickerStyle = useAnimatedStyle(() => ({ opacity: flicker.value }));
    const moodColor = marketMood === 'Bullish' ? '#00C853' : marketMood === 'Bearish' ? '#FF5252' : GOLD;
    const moodEmoji = marketMood === 'Bullish' ? '🚀' : marketMood === 'Bearish' ? '🔻' : '⚖️';

    return (
        <View style={[styles.moodBadge, { borderColor: moodColor }]}>
            <Animated.View style={[styles.moodDot, { backgroundColor: moodColor }, flickerStyle]} />
            <Text style={[styles.moodText, { color: moodColor }]}>{moodEmoji} {marketMood.toUpperCase()}</Text>
        </View>
    );
};

// ─── Asset Detail Modal ────────────────────────────────────
const AssetModal = ({ asset, visible, onClose }: { asset: any; visible: boolean; onClose: () => void }) => {
    const { prices } = usePriceStore();
    const live = prices[asset?.symbol];
    if (!asset) return null;

    const currentPrice = live?.price ?? asset.current_price;
    const change = live?.change24h ?? asset.change_24h;
    const isUp = change >= 0;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalBg}>
                <Animated.View entering={SlideInRight} style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>{asset.name}</Text>
                            <Text style={styles.modalSym}>{asset.symbol} / INR</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X color="#fff" size={20} />
                        </Pressable>
                    </View>
                    <Text style={[styles.modalPrice, { color: isUp ? '#00C853' : '#FF5252' }]}>
                        ₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Text>
                    <View style={[styles.changeBadge, { backgroundColor: isUp ? 'rgba(0,200,83,0.12)' : 'rgba(255,82,82,0.12)', alignSelf: 'flex-start', padding: 8 }]}>
                        <Text style={{ color: isUp ? '#00C853' : '#FF5252', fontWeight: 'bold', fontSize: 16 }}>
                            {isUp ? '+' : ''}{change.toFixed(2)}%
                        </Text>
                    </View>
                    <View style={styles.modalStatsRow}>
                        <View style={styles.modalStat}>
                            <Text style={styles.modalStatLabel}>24H HIGH</Text>
                            <Text style={styles.modalStatVal}>₹{(live?.high ?? currentPrice * 1.05).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                        </View>
                        <View style={styles.modalStat}>
                            <Text style={styles.modalStatLabel}>24H LOW</Text>
                            <Text style={styles.modalStatVal}>₹{(live?.low ?? currentPrice * 0.95).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                        </View>
                    </View>
                    <Text style={styles.modalDisclaimer}>This is a simulated market. Prices are for educational purposes only.</Text>
                </Animated.View>
            </View>
        </Modal>
    );
};

// ─── MAIN SCREEN ──────────────────────────────────────────
export default function MarketsScreen() {
    const { user } = useAuthStore();
    const { updatePrice } = usePriceStore();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const router = useRouter();

    const fetchAssets = useCallback(async () => {
        const { data } = await engineCall(
            async () => await supabase.from('assets').select('*').order('symbol'),
            { cacheKey: 'markets_all_assets' }
        );
        if (data) {
            setAssets(data);
            data.forEach((a: any) => updatePrice(a.symbol, a.current_price));
        }
        setLoading(false);
        if (user) trackEvent(user.id, 'view_markets');
    }, [user]);

    useEffect(() => { fetchAssets(); }, [fetchAssets]);

    const filteredAssets = assets.filter(a =>
        searchQuery.trim() === '' ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeView loading={loading}>
            <MorphingBackground />

            <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Live Markets</Text>
                        <MarketMoodBadge />
                    </View>
                    <View style={[styles.liveTag]}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                </View>

                {/* Search */}
                <GlassCard style={styles.searchBar}>
                    <Search color={GOLD} size={16} />
                    <TextInput
                        placeholder="Search BTC, ETH, NIFTY..."
                        placeholderTextColor="#555"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </GlassCard>

                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingVertical: 4 }}>
                    {['All', 'Crypto', 'Stocks', 'DeFi', 'Favorites'].map(cat => (
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
                    {filteredAssets.map((a, i) => (
                        <Animated.View key={a.id} entering={FadeIn.delay(i * 60)}>
                            <LiveTickerRow
                                asset={a}
                                onPress={() => setSelectedAsset(a)}
                            />
                        </Animated.View>
                    ))}
                    {filteredAssets.length === 0 && !loading && (
                        <View style={styles.emptyState}>
                            <Zap color={GOLD} size={40} />
                            <Text style={styles.emptyText}>No assets found</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Asset Detail Modal */}
            <AssetModal
                asset={selectedAsset}
                visible={!!selectedAsset}
                onClose={() => setSelectedAsset(null)}
            />
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    title: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
    moodDot: { width: 7, height: 7, borderRadius: 4 },
    moodText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    liveTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,200,83,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,200,83,0.3)' },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00C853' },
    liveText: { color: '#00C853', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    searchBar: { flexDirection: 'row', alignItems: 'center', padding: 4, paddingHorizontal: 15, height: 52, marginBottom: 16 },
    searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 15 },
    filterBar: { flexDirection: 'row', marginBottom: 20 },
    filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
    filterBtnActive: { backgroundColor: GOLD, borderColor: GOLD },
    filterText: { color: '#8A8D93', fontWeight: 'bold', fontSize: 13 },
    filterTextActive: { color: '#000', fontWeight: '900' },
    list: {},
    tickerItem: { padding: 14 },
    tickerRow: { flexDirection: 'row', alignItems: 'center' },
    coinBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212,175,55,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
    coinInitial: { color: GOLD, fontWeight: '900', fontSize: 18 },
    coinName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    coinSym: { color: '#8A8D93', fontSize: 10, fontWeight: 'bold' },
    price: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
    changeText: { fontSize: 11, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { color: '#8A8D93', fontSize: 16 },
    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#121827', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, borderTopWidth: 1.5, borderColor: 'rgba(212,175,55,0.25)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
    modalSym: { color: GOLD, fontSize: 12, fontWeight: 'bold', marginTop: 2 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    modalPrice: { fontSize: 40, fontWeight: '900', marginBottom: 12, letterSpacing: -1 },
    modalStatsRow: { flexDirection: 'row', gap: 20, marginTop: 24 },
    modalStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 },
    modalStatLabel: { color: '#8A8D93', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    modalStatVal: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    modalDisclaimer: { color: '#444', fontSize: 10, marginTop: 24, textAlign: 'center', lineHeight: 16 },
});
