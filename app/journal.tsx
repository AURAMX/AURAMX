import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Share } from 'react-native';
import { FileText, Share2, Target, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import { engineCall } from '@/lib/stability_engine';
import * as Haptics from 'expo-haptics';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { RippleButton } from '@/components/Visuals/RippleButton';
import { Skeleton } from '@/components/UI/SkeletonLoader';
import { Colors, Spacing, Layout, Typography } from '@/constants/theme';

type TradeRecord = {
    id: string;
    asset_symbol: string;
    type: 'buy' | 'sell';
    quantity: number;
    price_at_trade: number;
    total_value: number;
    timestamp: string;
    note?: string;
};

export default function JournalScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [trades, setTrades] = useState<TradeRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrades = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await engineCall(async () => 
            await supabase.from('trades').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
            { cacheKey: `journal_${user.id}` }
        );
        if (data) setTrades(data);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchTrades(); }, [fetchTrades]);

    const handleShare = async (trade: TradeRecord) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const message = `AURAMX Institutional Trade Receipt\nAsset: ${trade.asset_symbol}\nType: ${trade.type.toUpperCase()}\nQty: ${trade.quantity}\nEx Price: ₹${trade.price_at_trade.toLocaleString()}\nTotal Value: ₹${trade.total_value.toLocaleString()}\n\n"Mastering Markets with AURAMX"`;
            await Share.share({ message });
        } catch (error) {
            console.error(error);
        }
    };

    const totalInvested = trades.filter(t => t.type === 'buy').reduce((s, t) => s + Number(t.total_value), 0);

    return (
        <SafeView loading={false}>
            <MorphingBackground />
            <ParticleSystem />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </Pressable>
                <Text style={styles.title}>Trade Journal</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <GlassCard style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{trades.length}</Text>
                        <Text style={styles.statLabel}>Executions</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statVal, { color: Colors.profit }]}>
                            ₹{totalInvested.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Total Exposure</Text>
                    </View>
                </GlassCard>

                <Text style={styles.secTitle}>Audit Log</Text>

                {loading ? (
                    <View style={{ gap: 12 }}>
                        <Skeleton height={100} borderRadius={16} />
                        <Skeleton height={100} borderRadius={16} />
                        <Skeleton height={100} borderRadius={16} />
                    </View>
                ) : (
                    trades.map(trade => (
                        <GlassCard key={trade.id} style={styles.tradeCard}>
                            <View style={styles.tradeRow}>
                                <View style={[styles.typeBadge, { backgroundColor: trade.type === 'buy' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                    {trade.type === 'buy' ? <TrendingUp color={Colors.profit} size={16} /> : <TrendingDown color={Colors.loss} size={16} />}
                                </View>
                                
                                <View style={styles.tradeMain}>
                                    <Text style={styles.assetName}>{trade.asset_symbol}</Text>
                                    <Text style={styles.tradeDate}>{new Date(trade.timestamp).toLocaleDateString()}</Text>
                                </View>

                                <View style={styles.tradeValues}>
                                    <Text style={styles.valueMain}>₹{Number(trade.total_value).toLocaleString()}</Text>
                                    <Text style={styles.valueSub}>{trade.quantity} @ ₹{Number(trade.price_at_trade).toLocaleString()}</Text>
                                </View>

                                <Pressable style={styles.shareIcon} onPress={() => handleShare(trade)}>
                                    <Share2 color={Colors.gold} size={18} />
                                </Pressable>
                            </View>
                            {trade.note && (
                                <View style={styles.noteBox}>
                                    <FileText color={Colors.gold} size={12} style={{ marginRight: 8, opacity: 0.5 }} />
                                    <Text style={styles.noteText}>{trade.note}</Text>
                                </View>
                            )}
                        </GlassCard>
                    ))
                )}

                {!loading && trades.length === 0 && (
                    <View style={styles.empty}>
                        <Target color={Colors.card} size={64} />
                        <Text style={styles.emptyText}>Empty Audit Trail</Text>
                        <RippleButton title="EXECUTE FIRST TRADE" variant="gold" style={styles.startBtn} onPress={() => router.push('/(tabs)/trade')} />
                    </View>
                )}
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingTop: 60 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    title: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    scroll: { padding: Spacing.md },
    statsCard: { flexDirection: 'row', padding: 32, marginBottom: 32, justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statVal: { color: '#fff', fontSize: 24, fontWeight: '900' },
    statLabel: { color: '#8A8D93', fontSize: 11, marginTop: 6, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.05)', height: '100%' },
    secTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
    tradeCard: { marginBottom: 15, padding: 20 },
    tradeRow: { flexDirection: 'row', alignItems: 'center' },
    typeBadge: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    tradeMain: { flex: 1 },
    assetName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    tradeDate: { color: '#8A8D93', fontSize: 11, marginTop: 4, fontWeight: 'bold' },
    tradeValues: { alignItems: 'flex-end', marginRight: 16 },
    valueMain: { color: '#fff', fontSize: 17, fontWeight: '900' },
    valueSub: { color: '#8A8D93', fontSize: 11, marginTop: 4, fontWeight: 'bold' },
    shareIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
    noteBox: { 
        marginTop: 16, 
        paddingTop: 16, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255,255,255,0.05)', 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    noteText: { color: '#8A8D93', fontSize: 13, fontWeight: '500', fontStyle: 'italic' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#444', fontSize: 18, marginTop: 24, marginBottom: 32, fontWeight: '900' },
    startBtn: { paddingHorizontal: 40 }
});
