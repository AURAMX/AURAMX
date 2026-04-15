import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    interpolate,
    FadeInDown
} from 'react-native-reanimated';
import { ChevronDown, GraduationCap, BarChart3, ShieldAlert, CheckCircle2, PlayCircle } from 'lucide-react-native';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { RippleButton } from '@/components/Visuals/RippleButton';

import { supabase } from '@/lib/supabase';
import { engineCall } from '@/lib/stability_engine';
import { earnXP, trackEvent } from '@/lib/analytics_tracker';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';

const MODULES = [
  { 
    id: 'btc', 
    title: 'Bitcoin Sovereignty', 
    icon: GraduationCap, 
    content: 'Bitcoin is digital gold with a fixed supply of 21M. It solves the double-spend problem without a central authority.',
    infographic: 'SUPPLY_HALVING'
  },
  { 
    id: 'patterns', 
    title: 'Advanced Price Action', 
    icon: BarChart3, 
    content: 'Master bull flags, double bottoms, and the psychology of candlesticks. Learn where institutions hide liquidity.',
    infographic: 'CANDLE_ANATOMY'
  },
  { 
    id: 'risk', 
    title: 'Institutional Risk Guard', 
    icon: ShieldAlert, 
    content: 'Stop-losses are secondary to position sizing. Never risk more than 1% of your equity on a single trade.',
    infographic: 'RISK_TRIANGLE'
  }
];

const InfographicPlaceholder = ({ type }: { type: string }) => {
    return (
        <View style={styles.infoBox}>
            <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>{type}</Text></View>
            <View style={styles.infoLine} />
        </View>
    );
};

const ModuleItem = ({ module, isDone, isRecommended, onComplete }: { module: any, isDone: boolean, isRecommended: boolean, onComplete: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const rotate = useSharedValue(0);

    const arrowStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotate.value}deg` }]
    }));

    const toggle = () => {
        setIsOpen(!isOpen);
        rotate.value = withTiming(isOpen ? 0 : 180);
    };

    return (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.moduleWrapper}>
            <GlassCard style={[styles.module, isDone && styles.doneMod]}>
                <Pressable style={styles.modHeader} onPress={toggle}>
                    <View style={styles.row}>
                        <View style={styles.iconCircle}><module.icon color={GOLD} size={20}/></View>
                        <View>
                            <View style={styles.row}>
                                <Text style={styles.modTitle}>{module.title}</Text>
                                {isRecommended && !isDone && (
                                    <View style={styles.recBadge}>
                                        <Sparkles color={Colors.gold} size={10} />
                                        <Text style={styles.recText}>AI SUGGESTED</Text>
                                    </View>
                                )}
                            </View>
                            {isDone && <Text style={styles.completedTag}>COMPLETED</Text>}
                        </View>
                    </View>
                    <Animated.View style={arrowStyle}>
                        <ChevronDown color="#444" size={20} />
                    </Animated.View>
                </Pressable>
                
                {isOpen && (
                    <View style={styles.modContent}>
                        <Text style={styles.contentTxt}>{module.content}</Text>
                        <InfographicPlaceholder type={module.infographic} />
                        {!isDone && (
                            <RippleButton 
                                title="Mark as Completed" 
                                variant="gold" 
                                style={{ marginTop: 20 }}
                                onPress={() => { onComplete(); toggle(); }}
                            />
                        )}
                    </View>
                )}
            </GlassCard>
        </Animated.View>
    );
};

export default function AcademyScreen() {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<string[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    // Fetch Progress
    const { data: progData } = await engineCall(async () => 
        await supabase.from('lessons_progress').select('module_id').eq('user_id', user.id),
        { cacheKey: `academy_progress_${user.id}` }
    );
    if (progData) setProgress((progData as any[]).map(d => d.module_id));

    // Fetch Quiz Results for Adaptive Logic
    const { data: quizData } = await engineCall(async () => 
        await supabase.from('quiz_results').select('topic, score').eq('user_id', user.id)
    );
    if (quizData) {
        const weak = (quizData as any[])
            .filter(q => q.score < 60)
            .map(q => q.topic);
        setWeakAreas(weak);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComplete = async (id: string) => {
    if (progress.includes(id)) return;
    await engineCall(async () => await supabase.from('lessons_progress').upsert({ user_id: user?.id, module_id: id }));
    
    // Rewards Spec: Lesson +20 XP
    if (user) await earnXP(user.id, 20);
    
    trackEvent(user?.id || '', 'academy_lesson_unlocked', { id });
    setProgress([...progress, id]);
  };

  return (
    <SafeView loading={loading}>
        <MorphingBackground />
        <ParticleSystem />

        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
                <Text style={styles.title}>Academy</Text>
                <Text style={styles.subtitle}>Curated Institutional Knowledge</Text>
            </View>

            {MODULES.map(m => (
                <ModuleItem 
                    key={m.id} 
                    module={m} 
                    isDone={progress.includes(m.id)} 
                    isRecommended={weakAreas.includes(m.id)}
                    onComplete={() => handleComplete(m.id)} 
                />
            ))}

            <View style={styles.footer}>
                <CheckCircle2 color={GOLD} size={24} />
                <Text style={styles.footerText}>
                    {progress.length} / {MODULES.length} Path Completed
                </Text>
            </View>
        </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 30 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { color: GOLD, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  moduleWrapper: { marginBottom: 16 },
  module: { padding: 0 },
  doneMod: { borderColor: 'rgba(0,200,83,0.3)' },
  modHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, minHeight: 80 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  modTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  completedTag: { color: '#00C853', fontSize: 10, fontWeight: '900', marginTop: 4 },
  modContent: { padding: 20, paddingTop: 0 },
  contentTxt: { color: '#8A8D93', fontSize: 15, lineHeight: 22 },
  infoBox: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 20, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  infoBadge: { backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  infoBadgeText: { color: GOLD, fontSize: 10, fontWeight: 'bold' },
  infoLine: { height: 60, width: '100%', marginTop: 15, borderStyle: 'dotted', borderWidth: 1, borderColor: '#444' },
  footer: { marginTop: 40, alignItems: 'center', gap: 10 },
  footerText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  recBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  recText: { color: Colors.gold, fontSize: 8, fontWeight: '900' }
});
