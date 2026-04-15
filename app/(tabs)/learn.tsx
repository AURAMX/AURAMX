import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Modal } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { Trophy, BookOpen, CheckCircle, Brain, X } from 'lucide-react-native';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { RippleButton } from '@/components/Visuals/RippleButton';

import { useAuthStore } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase';
import { engineCall } from '@/lib/stability_engine';
import { trackEvent, earnXP } from '@/lib/analytics_tracker';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';

const TOPICS = [
  "Bitcoin", "Ethereum", "Wallets", "Exchanges", 
  "Stablecoins", "NFTs", "DeFi", "Smart Contracts", 
  "Technical", "Fundamental", "Risk", "Altcoins", 
  "Mining", "Staking", "Governance", "Web3"
];

const MatrixCell = ({ 
    topic, 
    index, 
    isCompleted, 
    onPress 
}: { 
    topic: string, 
    index: number, 
    isCompleted: boolean, 
    onPress: () => void 
}) => {
  const rotateY = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value + 180}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  }));

  const handlePress = () => {
    rotateY.value = withTiming(rotateY.value === 0 ? 180 : 0, { duration: 500 });
    onPress();
  };

  return (
    <Pressable style={styles.cellWrapper} onPress={handlePress}>
        <Animated.View style={[styles.cellInner, frontStyle]}>
            <GlassCard style={[styles.cellCard, isCompleted && styles.doneCell]}>
                <Brain size={20} color={isCompleted ? GOLD : '#444'} />
                <Text style={[styles.cellText, isCompleted && { color: GOLD }]}>{topic}</Text>
            </GlassCard>
        </Animated.View>
        <Animated.View style={[styles.cellInner, backStyle]}>
            <GlassCard style={[styles.cellCard, { backgroundColor: GOLD }]}>
                <CheckCircle size={20} color="#000" />
                <Text style={[styles.cellText, { color: '#000' }]}>VIEW</Text>
            </GlassCard>
        </Animated.View>
    </Pressable>
  );
};

export default function LearnScreen() {
  const { user, triggerCelebration } = useAuthStore();
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await engineCall(async () => 
        await supabase.from('quiz_results').select('topic_index').eq('user_id', user.id),
        { cacheKey: `learn_matrix_${user.id}` }
    );
    if (data) setCompleted((data as any[]).map(d => d.topic_index));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComplete = async () => {
    if (selected === null || !user) return;
    await engineCall(async () => await supabase.from('quiz_results').upsert({ user_id: user.id, topic_index: selected }));
    await earnXP(user.id, 50);
    trackEvent(user.id, 'matrix_unlocked', { topic: TOPICS[selected] });
    
    triggerCelebration(); 
    setCompleted([...completed, selected]);
    setSelected(null);
  };

  return (
    <SafeView loading={loading}>
        <MorphingBackground />
        <ParticleSystem />

        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
                <Text style={styles.title}>Knowledge Matrix</Text>
                <Text style={styles.subtitle}>Unlock all 16 cores to become a Master</Text>
            </View>

            <View style={styles.grid}>
                {TOPICS.map((t, i) => (
                    <MatrixCell 
                        key={i} 
                        topic={t} 
                        index={i} 
                        isCompleted={completed.includes(i)}
                        onPress={() => setSelected(i)}
                    />
                ))}
            </View>

            <View style={styles.legend}>
                <Award color={GOLD} size={20} />
                <Text style={styles.legendText}>{completed.length} / 16 Cores Mastered</Text>
            </View>
        </ScrollView>

        <Modal visible={selected !== null} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <GlassCard style={styles.modalContent}>
                    <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                        <X color="#fff" size={24} />
                    </Pressable>
                    <Trophy color={GOLD} size={64} style={{ alignSelf: 'center', marginBottom: 20 }} />
                    <Text style={styles.modalTitle}>{selected !== null ? TOPICS[selected] : ''}</Text>
                    <Text style={styles.modalDesc}>
                        Mastering this core builds your fundamental understanding of digital sovereignty.
                    </Text>
                    
                    <RippleButton 
                        title="Start Assessment" 
                        variant="gold" 
                        onPress={handleComplete} 
                    />
                </GlassCard>
            </View>
        </Modal>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 30 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { color: GOLD, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cellWrapper: { width: (width - 64) / 4, height: (width - 64) / 4 },
  cellInner: { flex: 1 },
  cellCard: { flex: 1, padding: 4, justifyContent: 'center', alignItems: 'center' },
  doneCell: { borderColor: GOLD, backgroundColor: 'rgba(212,175,55,0.1)' },
  cellText: { color: '#8A8D93', fontSize: 9, textAlign: 'center', marginTop: 4, fontWeight: 'bold' },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 40, justifyContent: 'center', gap: 10 },
  legendText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 30 },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  modalTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalDesc: { color: '#8A8D93', textAlign: 'center', marginBottom: 30, fontSize: 14, lineHeight: 20 }
});

const Award = ({ color, size }: { color: string, size: number }) => <Trophy color={color} size={size} />;
