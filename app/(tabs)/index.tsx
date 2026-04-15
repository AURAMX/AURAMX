import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase';
import { engineCall } from '@/lib/stability_engine';
import { trackEvent } from '@/lib/analytics_tracker';
import { SafeView } from '@/components/SafeView';

// Visual Components
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { FloatingIcons } from '@/components/Visuals/FloatingIcons';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { TiltCard } from '@/components/Visuals/TiltCard';
import { TypingAnimation } from '@/components/Visuals/TypingAnimation';
import { RippleButton } from '@/components/Visuals/RippleButton';

// Infographics
import { XPProgressCircle, StreakHeatMap } from '@/components/Infographics/UserStatsVisuals';
import { PerformanceSparkline } from '@/components/Infographics/PerformanceSparkline';
import { PortfolioDonut } from '@/components/Infographics/PortfolioDonut';

import { Flame, ChevronRight, TrendingUp, Wallet, Award, Trophy, Sparkles } from 'lucide-react-native';
import { getAIBrief } from '@/lib/gemini_service';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { OrderFlowVisual, VolumeProfile } from '@/components/Infographics/AdvancedTrading';
import { FearGreedGauge } from '@/components/Infographics/FearGreedGauge';
import { Colors, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';

export default function HomeScreen() {
  const { user, balance } = useAuthStore();
  const [aiBrief, setAiBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setBriefLoading(true);
    
    const { data } = await engineCall(async () => 
        await supabase.from('profiles').select('*').eq('id', user.id).single(),
        { cacheKey: `home_profile_${user.id}` }
    );
    if (data) setProfile(data);
    
    // Fetch AI Brief
    const brief = await getAIBrief([{ symbol: 'BTC', quantity: 0.5 }]);
    setAiBrief(brief);
    
    setLoading(false);
    setBriefLoading(false);
    trackEvent(user.id, 'visit_home');
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <SafeView loading={loading}>
      <View style={{ flex: 1 }}>
        <MorphingBackground />
        <ParticleSystem />
        <FloatingIcons />

        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TypingAnimation 
                text={`GM, ${user?.email?.split('@')[0]}!`} 
                style={styles.welcomeText} 
            />
            <Text style={styles.subSubtitle}>Your portfolio is up 2.4% today</Text>
          </View>

          {/* Main Balance Card with 3D Tilt */}
          <TiltCard>
            <GlassCard style={styles.balanceCard}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>Net Worth</Text>
                        <Text style={styles.balanceValue}>₹{balance.toLocaleString('en-IN')}</Text>
                        <View style={styles.changeRow}>
                            <TrendingUp color="#00C853" size={16} />
                            <Text style={styles.changeText}>+₹4,200 (+2.4%)</Text>
                        </View>
                    </View>
                    <Wallet color={GOLD} size={32} opacity={0.6} />
                </View>
                <View style={styles.balanceActions}>
                    <RippleButton title="Add Cash" variant="gold" style={{ flex: 1, marginRight: 10 }} />
                    <RippleButton title="Withdraw" variant="outline" style={{ flex: 1 }} />
                </View>
            </GlassCard>
          </TiltCard>
          {/* AI Market Summary Card */}
          <GlassCard style={styles.aiCard}>
            <View style={styles.row}>
                <View style={styles.aiHeader}>
                    <Sparkles color={Colors.gold} size={18} />
                    <Text style={styles.aiTitle}>AI Morning Brief</Text>
                </View>
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>Educational</Text>
                </View>
            </View>
            {briefLoading ? (
                <View style={{ marginTop: 12 }}>
                    <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="70%" height={16} />
                </View>
            ) : (
                <Text style={styles.aiBrief}>{aiBrief}</Text>
            )}
          </GlassCard>

          {/* Sentiment Hub */}
          <Text style={styles.secTitle}>Sentiment Intelligence</Text>
          <View style={styles.statsGrid}>
            <GlassCard style={styles.sentimentCard}>
                <FearGreedGauge value={72} />
                <View style={styles.cardDivider} />
                <OrderFlowVisual />
            </GlassCard>
          </View>

          {/* Stats Section */}
          <View style={styles.statsGrid}>
            <View style={{ flex: 1.1, marginRight: 12 }}>
                <GlassCard style={styles.statCard}>
                    <XPProgressCircle 
                        xp={profile?.xp || 450} 
                        total={500} 
                        size={100} 
                        level={profile?.level || 2} 
                    />
                </GlassCard>
            </View>
            <View style={{ flex: 1 }}>
                <GlassCard style={styles.statCard}>
                    <Text style={styles.label}>Streak</Text>
                    <View style={[styles.row, { marginVertical: 8 }]}>
                        <Flame color="#FFA500" size={24} />
                        <Text style={styles.streakVal}>{profile?.current_streak || 7}</Text>
                    </View>
                    <StreakHeatMap activityData={[]} />
                </GlassCard>
            </View>
          </View>

          {/* Portfolio Allocation Infographic */}
          <View style={styles.section}>
            <Text style={styles.secTitle}>Asset Allocation</Text>
            <GlassCard style={{ padding: 10, alignItems: 'center' }}>
                <PortfolioDonut 
                    data={[
                        { label: 'BTC', value: 60, color: '#F7931A' },
                        { label: 'ETH', value: 30, color: '#627EEA' },
                        { label: 'Cash', value: 10, color: '#00C853' }
                    ]}
                    totalValue={`₹${balance.toLocaleString('en-IN')}`}
                />
            </GlassCard>
          </View>

          {/* Market Watch */}
          <View style={styles.sectionHeader}>
            <Text style={styles.secTitle}>Market Watch</Text>
            <Pressable style={styles.row} onPress={() => router.push('/(tabs)/markets')}>
                <Text style={styles.seeAll}>See All</Text>
                <ChevronRight color={GOLD} size={16} />
            </Pressable>
          </View>

          <TiltCard>
            <GlassCard style={styles.marketCard}>
                <View style={styles.row}>
                    <View style={styles.row}>
                        <View style={styles.coinBadge}><Trophy color={GOLD} size={20}/></View>
                        <View>
                            <Text style={styles.coinName}>Bitcoin</Text>
                            <Text style={styles.coinSub}>Top Gainer</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', flex: 1 }}>
                        <PerformanceSparkline 
                            data={[65, 40, 80, 50, 90, 70, 100]} 
                            color="#00C853" 
                            width={80} 
                        />
                        <Text style={styles.coinPrice}>₹84.2L</Text>
                    </View>
                </View>
            </GlassCard>
          </TiltCard>

        </ScrollView>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  header: { marginBottom: 30 },
  welcomeText: { color: GOLD, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subSubtitle: { color: '#8A8D93', fontSize: 14, marginTop: 4, fontWeight: '500' },
  balanceCard: { padding: 24, minHeight: 180 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#8A8D93', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: '900', marginVertical: 8 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { color: '#00C853', fontSize: 14, fontWeight: 'bold' },
  balanceActions: { flexDirection: 'row', marginTop: 24 },
  statsGrid: { flexDirection: 'row', marginVertical: 20 },
  statCard: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  streakVal: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginLeft: 8 },
  section: { marginBottom: 20 },
  secTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAll: { color: GOLD, fontWeight: '600', fontSize: 14, marginRight: 4 },
  marketCard: { padding: 20 },
  coinBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  coinName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  coinSub: { color: '#8A8D93', fontSize: 11, fontWeight: 'bold' },
  coinPrice: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginTop: 4 },
  aiCard: { padding: 16, marginTop: 16, borderColor: 'rgba(212,175,55,0.15)', borderWidth: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitle: { color: Colors.gold, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  aiBadge: { backgroundColor: 'rgba(0, 200, 83, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  aiBadgeText: { color: Colors.profit, fontSize: 9, fontWeight: 'bold' },
  aiBrief: { color: '#fff', fontSize: 13, lineHeight: 20, marginTop: 12, fontWeight: '500' },
  sentimentCard: { width: '100%', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDivider: { width: 1, height: 100, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 15 }
});
