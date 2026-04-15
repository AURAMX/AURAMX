import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Switch, Dimensions } from 'react-native';
import { Bell, BellRing, Plus, X, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { engineCall } from '@/lib/stability_engine';
import { useAuthStore } from '@/hooks/useAuthStore';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { RippleButton } from '@/components/Visuals/RippleButton';
import { Skeleton } from '@/components/UI/SkeletonLoader';
import { Colors, Spacing, Layout } from '@/constants/theme';

const { width } = Dimensions.get('window');

type PriceAlert = {
    id: string;
    symbol: string;
    target_price: number;
    is_active: boolean;
};

export default function AlertsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [newSymbol, setNewSymbol] = useState('BTC');
    const [newPrice, setNewPrice] = useState('');

    const fetchAlerts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await engineCall(async () => 
            await supabase.from('price_alerts').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
            { cacheKey: `alerts_${user.id}` }
        );
        if (data) setAlerts(data);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    const addAlert = async () => {
        if (!newPrice || !user) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        await engineCall(async () => 
            await supabase.from('price_alerts').insert({
                user_id: user.id,
                symbol: newSymbol.toUpperCase(),
                target_price: parseFloat(newPrice),
                is_active: true
            })
        );
        
        setIsAdding(false);
        setNewPrice('');
        fetchAlerts();
        Alert.alert('Alert Set', `We will notify you when ${newSymbol.toUpperCase()} hits ₹${newPrice}`);
    };

    const toggleAlert = async (id: string, current: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
        
        await engineCall(async () => 
            await supabase.from('price_alerts').update({ is_active: !current }).eq('id', id)
        );
    };

    const deleteAlert = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setAlerts(prev => prev.filter(a => a.id !== id));
        await engineCall(async () => await supabase.from('price_alerts').delete().eq('id', id));
    };

    return (
        <SafeView loading={false}>
            <MorphingBackground />
            <ParticleSystem />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <X color="#fff" size={24} />
                </Pressable>
                <Text style={styles.title}>Price Alerts</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <GlassCard style={styles.summaryCard}>
                    <BellRing color={Colors.gold} size={32} />
                    <View style={styles.summaryText}>
                        <Text style={styles.summaryTitle}>{alerts.filter(a => a.is_active).length} Active Guards</Text>
                        <Text style={styles.summarySub}>Institutional monitoring active</Text>
                    </View>
                </GlassCard>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Intelligence Bots</Text>
                    <Pressable style={styles.addBtn} onPress={() => setIsAdding(true)}>
                        <Plus color="#000" size={20} />
                    </Pressable>
                </View>

                {loading ? (
                    <View style={{ gap: 12 }}>
                        <Skeleton height={80} borderRadius={16} />
                        <Skeleton height={80} borderRadius={16} />
                    </View>
                ) : (
                    alerts.map(alert => (
                        <GlassCard key={alert.id} style={styles.alertCard}>
                            <View style={styles.alertRow}>
                                <View style={styles.typeIcon}>
                                    <Bell color={Colors.gold} size={16} />
                                </View>
                                <View style={styles.alertInfo}>
                                    <Text style={styles.alertSymbol}>{alert.symbol}</Text>
                                    <Text style={styles.alertType}>Target Reached Notification</Text>
                                </View>
                                <View style={styles.alertPriceContainer}>
                                    <Text style={styles.alertPrice}>₹{alert.target_price.toLocaleString()}</Text>
                                </View>
                                <Switch 
                                    value={alert.is_active} 
                                    onValueChange={() => toggleAlert(alert.id, alert.is_active)}
                                    trackColor={{ true: Colors.gold }}
                                />
                                <Pressable style={styles.delBtn} onPress={() => deleteAlert(alert.id)}>
                                    <X color="#444" size={18} />
                                </Pressable>
                            </View>
                        </GlassCard>
                    ))
                )}

                {!loading && alerts.length === 0 && (
                    <View style={styles.empty}>
                        <Bell color="#1A1F2E" size={64} />
                        <Text style={styles.emptyText}>No alerts set</Text>
                    </View>
                )}
                
                <View style={{ height: 100 }} />
            </ScrollView>

            {isAdding && (
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modal}>
                        <Text style={styles.modalTitle}>New Price Guard</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Asset Symbol</Text>
                            <TextInput 
                                style={styles.input} 
                                value={newSymbol} 
                                onChangeText={setNewSymbol}
                                placeholder="e.g. BTC"
                                placeholderTextColor="#444"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Target price (₹)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={newPrice} 
                                onChangeText={setNewPrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#444"
                            />
                        </View>

                        <RippleButton style={styles.createBtn} onPress={addAlert} title="DEPLOY GUARD" variant="gold" />
                        
                        <Pressable style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                            <Text style={styles.cancelBtnText}>Back to Dashboard</Text>
                        </Pressable>
                    </GlassCard>
                </View>
            )}
        </SafeView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingTop: 60 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scroll: { padding: Spacing.md },
    summaryCard: { flexDirection: 'row', alignItems: 'center', padding: 24, marginBottom: 30 },
    summaryText: { marginLeft: 20 },
    summaryTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    summarySub: { color: Colors.gold, fontSize: 12, marginTop: 4, fontWeight: 'bold' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center' },
    alertCard: { marginBottom: 12 },
    alertRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    typeIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    alertInfo: { flex: 1 },
    alertSymbol: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    alertType: { color: '#8A8D93', fontSize: 10, marginTop: 2, fontWeight: 'bold' },
    alertPriceContainer: { marginRight: 15 },
    alertPrice: { color: '#fff', fontSize: 15, fontWeight: '900' },
    delBtn: { marginLeft: 15, padding: 5 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#444', marginTop: 20, fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
    modal: { padding: 32, borderRadius: 32 },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 32, textAlign: 'center' },
    inputGroup: { marginBottom: 24 },
    label: { color: '#8A8D93', fontSize: 11, marginBottom: 8, fontWeight: '900', textTransform: 'uppercase' },
    input: { backgroundColor: 'rgba(0,0,0,0.3)', height: 60, borderRadius: 16, paddingHorizontal: 20, color: '#fff', fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: '#333' },
    createBtn: { height: 60, marginTop: 10 },
    cancelBtn: { alignItems: 'center', marginTop: 24 },
    cancelBtnText: { color: '#444', fontWeight: 'bold' }
});
