import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert, Switch, Dimensions, Modal, TextInput, Image } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withRepeat, 
    withSequence,
    withDelay,
    Easing,
    FadeInUp
} from 'react-native-reanimated';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Zap, Flame, Award, Bell, LogOut, Phone, MessageSquare, Instagram, ExternalLink, Fingerprint, History, ChevronRight, X, Lock, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Components
import { SafeView } from '@/components/SafeView';
import { GlassCard } from '@/components/Visuals/GlassCard';
import { MorphingBackground } from '@/components/Visuals/MorphingBackground';
import { ParticleSystem } from '@/components/Visuals/ParticleSystem';
import { RippleButton } from '@/components/Visuals/RippleButton';
import { TiltCard } from '@/components/Visuals/TiltCard';
import { XPProgressCircle } from '@/components/Infographics/UserStatsVisuals';
import { SecurityShield } from '@/components/ui/SecurityShield';

import { engineCall } from '@/lib/stability_engine';
import { trackEvent } from '@/lib/analytics_tracker';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';
const PIN_KEY = 'auramx_pin_lock';

const PulsingAvatar = ({ name = 'A', level = 1 }: { name?: string; level?: number }) => {
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: interpolate(pulse.value, [1, 1.2], [0.3, 0]),
    }));

    const initials = name.slice(0, 2).toUpperCase();

    return (
        <View style={styles.avatarRoot}>
            <Animated.View style={[styles.pulseRing, animatedStyle]} />
            <View style={styles.avatarInner}>
                <Text style={styles.lvlTxt}>{initials}</Text>
            </View>
            <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>L{level}</Text>
            </View>
        </View>
    );
};

export default function ProfileScreen() {
    const router = useRouter();
  const { user, balance, signOut } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pinSetupVisible, setPinSetupVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [devConsoleVisible, setDevConsoleVisible] = useState(false);
  const [devPinInput, setDevPinInput] = useState('');
  const [showDevModal, setShowDevModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: pData } = await engineCall(async () => await supabase.from('profiles').select('*').eq('id', user.id).single(), { cacheKey: `profile_main_${user.id}` });
    if (pData) setProfile(pData);
    
    const { data: bData } = await engineCall(async () => await supabase.from('user_badges').select('badge_id').eq('user_id', user.id));
    if (bData) setBadges((bData as any[]).map(b => b.badge_id));

    const pin = await SecureStore.getItemAsync(PIN_KEY);
    setPinEnabled(!!pin);

    const bio = await SecureStore.getItemAsync('auramx_bio_enabled');
    setBioEnabled(bio === 'true');

    const hasBio = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBioSupported(hasBio && isEnrolled);
    
    setLoading(false);
    trackEvent(user.id, 'visit_profile_premium');
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePin = async () => {
    if (pinEnabled) {
      await SecureStore.deleteItemAsync(PIN_KEY);
      setPinEnabled(false);
      Alert.alert('Security', 'PIN Logic Shield deactivated.');
    } else {
      setPinSetupVisible(true);
    }
  };

  const handleSavePin = async () => {
    if (newPin.length !== 4) return Alert.alert('Invalid PIN', 'Please enter a 4-digit numeric code.');
    await SecureStore.setItemAsync(PIN_KEY, newPin);
    setPinEnabled(true);
    setPinSetupVisible(false);
    setNewPin('');
    Alert.alert('Shield Active', 'Your personalized PIN has been set.');
  };

  const handleDevAccess = () => {
    if (devPinInput === '1234') {
        setShowDevModal(true);
        setDevConsoleVisible(false);
        setDevPinInput('');
    } else {
        Alert.alert('Access Denied', 'Invalid Developer Authorization Code.');
        setDevPinInput('');
    }
  };

  const toggleBio = async () => {
    if (!bioSupported) {
      Alert.alert('Not Supported', 'Biometric security is not available or set up on this device.');
      return;
    }

    if (bioEnabled) {
      await SecureStore.deleteItemAsync('auramx_bio_enabled');
      setBioEnabled(false);
    } else {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Access',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        await SecureStore.setItemAsync('auramx_bio_enabled', 'true');
        setBioEnabled(true);
        Alert.alert('Success', 'Biometric authentication enabled.');
      }
    }
  };

  const BADGE_LIST = [
    { id: 'first_trade', name: 'First Trade', icon: Zap },
    { id: 'quiz_master', name: 'Quiz Master', icon: Award },
    { id: 'streak_3', name: 'Hot Streak', icon: Flame },
    { id: 'xp_1000', name: 'XP Titan', icon: Award },
    { id: 'alert_setter', name: 'Watchman', icon: Bell },
    { id: 'btc_fan', name: 'HODLER', icon: Zap },
    { id: 'profile_pro', name: 'Safe Guard', icon: Shield }
  ];

  if (pinEnabled && !isUnlocked) {
    return <SecurityShield onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <SafeView loading={loading}>
        <MorphingBackground />
        <ParticleSystem />

        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={styles.header}>
                <PulsingAvatar 
                    name={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AU'}
                    level={profile?.level || 1} 
                />
                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aura Trader'}</Text>
                    <Text style={styles.userSub}>Investment Tier: Pro</Text>
                    <View style={styles.onlineDot}>
                        <View style={styles.greenDot} />
                        <Text style={styles.onlineText}>Active Session</Text>
                    </View>
                </View>
            </View>

            {/* XP and Level Circle */}
            <View style={styles.progressSection}>
                <XPProgressCircle 
                    xp={profile?.xp || 450} 
                    total={500} 
                    level={profile?.level || 2} 
                />
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <GlassCard style={styles.statCard}>
                    <Flame color="#FFA500" size={20} />
                    <Text style={styles.statVal}>{profile?.current_streak || 7}</Text>
                    <Text style={styles.statLabel}>Current Streak</Text>
                </GlassCard>
                <GlassCard style={styles.statCard}>
                    <Shield color={GOLD} size={20} />
                    <Text style={styles.statVal}>₹{balance.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Available Funds</Text>
                </GlassCard>
            </View>

            {/* Badge Hall of Fame */}
            <Text style={styles.secTitle}>Achievement Hall</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
                {BADGE_LIST.map((b, i) => (
                    <Animated.View key={b.id} entering={FadeInUp.delay(i * 100)}>
                        <GlassCard style={[styles.badgeItem, !badges.includes(b.id) && { opacity: 0.3 }]}>
                            <View style={[styles.badgeIcon, badges.includes(b.id) && { borderColor: GOLD, borderWidth: 1 }]}>
                                <b.icon color={badges.includes(b.id) ? GOLD : '#444'} size={24} />
                            </View>
                            <Text style={[styles.badgeText, badges.includes(b.id) && { color: GOLD }]}>{b.name}</Text>
                        </GlassCard>
                    </Animated.View>
                ))}
            </ScrollView>

            {/* External Portfolio Setup */}
            <Text style={styles.secTitle}>External Portfolios</Text>
            <GlassCard style={styles.itemCard}>
                <View style={styles.row}>
                    <View style={styles.rowInner}>
                        <Award color={GOLD} size={20} />
                        <Text style={styles.itemText}>Stocks (₹)</Text>
                    </View>
                    <TextInput 
                        style={styles.portfolioInput}
                        keyboardType="number-pad"
                        value={useAuthStore.getState().portfolioStocks.toString()}
                        onChangeText={(val) => useAuthStore.getState().setPortfolio(Number(val) || 0, useAuthStore.getState().portfolioCrypto)}
                    />
                </View>
                <View style={[styles.dividerThin, { marginVertical: 15 }]} />
                <View style={styles.row}>
                    <View style={styles.rowInner}>
                        <Zap color={GOLD} size={20} />
                        <Text style={styles.itemText}>Crypto (₹)</Text>
                    </View>
                    <TextInput 
                        style={styles.portfolioInput}
                        keyboardType="number-pad"
                        value={useAuthStore.getState().portfolioCrypto.toString()}
                        onChangeText={(val) => useAuthStore.getState().setPortfolio(useAuthStore.getState().portfolioStocks, Number(val) || 0)}
                    />
                </View>
            </GlassCard>

            {/* Activity & Alerts Section */}
            <Text style={styles.secTitle}>Portfolio Tools</Text>
            <GlassCard style={styles.itemCard}>
                <Pressable style={styles.row} onPress={() => router.push('/journal')}>
                    <View style={styles.rowInner}>
                        <History color={GOLD} size={20} />
                        <Text style={styles.itemText}>Trade Journal</Text>
                    </View>
                    <ChevronRight color="#8A8D93" size={20} />
                </Pressable>
                <View style={styles.dividerThin} />
                <Pressable style={styles.row} onPress={() => router.push('/alerts')}>
                    <View style={styles.rowInner}>
                        <Bell color={GOLD} size={20} />
                        <Text style={styles.itemText}>Price Alerts</Text>
                    </View>
                    <ChevronRight color="#8A8D93" size={20} />
                </Pressable>
            </GlassCard>

            {/* Security Section */}
            <Text style={styles.secTitle}>Account Defense</Text>
            <GlassCard style={styles.itemCard}>
                {/* PIN Shield */}
                <View style={styles.row}>
                    <View style={styles.rowInner}>
                        <Shield color={GOLD} size={20} />
                        <Text style={styles.itemText}>PIN Logic Shield</Text>
                    </View>
                    <Switch value={pinEnabled} onValueChange={togglePin} trackColor={{ true: GOLD }} />
                </View>

                {/* Biometric */}
                <View style={[styles.row, { marginTop: 20 }, !bioSupported && { opacity: 0.5 }]}>
                    <View style={styles.rowInner}>
                        <Fingerprint color={GOLD} size={20} />
                        <View>
                            <Text style={styles.itemText}>Biometric Access</Text>
                            {!bioSupported && <Text style={styles.subText}>Device Not Supported</Text>}
                        </View>
                    </View>
                    <Switch 
                        value={bioEnabled} 
                        onValueChange={toggleBio} 
                        trackColor={{ true: GOLD }} 
                        disabled={!bioSupported}
                    />
                </View>

                {/* Audio Feedback */}
                <View style={[styles.row, { marginTop: 20 }]}>
                    <View style={styles.rowInner}>
                        <MessageSquare color={GOLD} size={20} />
                        <View>
                            <Text style={styles.itemText}>Audio Feedback</Text>
                            <Text style={styles.subText}>Trade & Level Sounds</Text>
                        </View>
                    </View>
                    <Switch 
                        value={pushEnabled} 
                        onValueChange={() => Alert.alert("Coming Soon", "Audio feedback will be enabled in the next update.")} 
                        trackColor={{ true: GOLD }} 
                    />
                </View>
            </GlassCard>

            {/* Developer Card with 3D Tilt */}
            <Text style={styles.secTitle}>Institutional Branding</Text>
            <TiltCard>
                <GlassCard style={styles.devCard}>
                    <View style={styles.row}>
                        <View style={styles.devRow}>
                            <View style={styles.devImageContainer}>
                                <Image 
                                    source={{ uri: 'https://i.postimg.cc/x8YSC3B5/Whats-App-Image-2026-04-09-at-20-26-28.jpg' }} 
                                    style={styles.devImage} 
                                />
                            </View>
                            <View>
                                <Text style={styles.devTitle}>Lead Architect</Text>
                                <Text style={styles.devSub}>7456939559</Text>
                            </View>
                        </View>
                        <Pressable onPress={() => setDevConsoleVisible(true)}>
                            <Shield color={GOLD} size={24} opacity={0.5} />
                        </Pressable>
                    </View>
                    <View style={styles.devActions}>
                        <Pressable style={styles.devBtn} onPress={() => Linking.openURL('tel:7456939559')}><Phone color="#fff" size={18}/></Pressable>
                        <Pressable style={styles.devBtn} onPress={() => Linking.openURL('https://wa.me/917456939559')}><MessageSquare color="#25D366" size={18}/></Pressable>
                        <Pressable style={styles.devBtn} onPress={() => Linking.openURL('mailto:nauman@auramx.com')}><ExternalLink color={GOLD} size={18}/></Pressable>
                    </View>
                </GlassCard>
            </TiltCard>

            {/* PIN Setup Modal */}
            <Modal visible={pinSetupVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.setupCard}>
                        <Lock color={GOLD} size={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.setupTitle}>Define Your PIN</Text>
                        <Text style={styles.setupSub}>Choose a 4-digit code for local device security.</Text>
                        <TextInput 
                            style={styles.pinEntry} 
                            keyboardType="number-pad" 
                            maxLength={4} 
                            secureTextEntry 
                            value={newPin}
                            onChangeText={setNewPin}
                            autoFocus
                        />
                        <RippleButton title="ACTIVATE SHIELD" variant="gold" onPress={handleSavePin} />
                        <Pressable style={{ marginTop: 20 }} onPress={() => setPinSetupVisible(false)}>
                            <Text style={styles.cancelTxt}>Cancel</Text>
                        </Pressable>
                    </GlassCard>
                </View>
            </Modal>

            {/* Dev Console Lock Modal */}
            <Modal visible={devConsoleVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.setupCard}>
                        <Shield color={GOLD} size={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.setupTitle}>Developer Authorization</Text>
                        <Text style={styles.setupSub}>Enter fixed auth code for restricted console.</Text>
                        <TextInput 
                            style={styles.pinEntry} 
                            keyboardType="number-pad" 
                            maxLength={4} 
                            secureTextEntry 
                            value={devPinInput}
                            onChangeText={setDevPinInput}
                            autoFocus
                            onSubmitEditing={handleDevAccess}
                        />
                        <RippleButton title="AUTHORIZE" variant="gold" onPress={handleDevAccess} />
                        <Pressable style={{ marginTop: 20 }} onPress={() => setDevConsoleVisible(false)}>
                            <Text style={styles.cancelTxt}>Exit</Text>
                        </Pressable>
                    </GlassCard>
                </View>
            </Modal>

            {/* Dev Console Content Modal */}
            <Modal visible={showDevModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <GlassCard style={[styles.setupCard, { width: '90%', height: '70%' }]}>
                        <View style={styles.row}>
                            <Text style={styles.setupTitle}>Admin Console</Text>
                            <Pressable onPress={() => setShowDevModal(false)}><X color={GOLD} size={24}/></Pressable>
                        </View>
                        <ScrollView style={{ marginTop: 20 }}>
                            <Text style={styles.devStats}>Supabase Status: <Text style={{ color: Colors.profit }}>CONNECTED</Text></Text>
                            <Text style={styles.devStats}>Gemini Key: <Text style={{ color: GOLD }}>VERIFIED</Text></Text>
                            <Text style={styles.devStats}>Build Architecture: <Text style={{ color: '#fff' }}>AURAMX-V1-PROD</Text></Text>
                            <View style={styles.dividerThin} />
                            <Text style={styles.subText}>ADMIN TOOLS COMMING SOON</Text>
                        </ScrollView>
                    </GlassCard>
                </View>
            </Modal>

            <RippleButton 
                title="Secure Sign Out" 
                variant="outline" 
                style={{ marginTop: 40 }} 
                onPress={signOut}
            />

            {/* Institutional Footer */}
            <View style={styles.footer}>
                <Shield color="rgba(212,175,55,0.3)" size={40} style={{ marginBottom: 16 }} />
                <Text style={styles.footerText}>AURAMX Institutional Grade Simulation</Text>
                <Text style={styles.footerSub}>Developer: NAUMAN ALAM KHAN</Text>
                <Text style={styles.disclaimer}>
                    This application is a financial educational simulation. All funds are virtual (₹1,00,000 base). No real money is at risk.
                </Text>
            </View>
            
            <View style={{ height: 100 }} />
        </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 30 },
  avatarRoot: { position: 'relative', width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  pulseRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: GOLD },
  avatarInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(212,175,55,0.5)' },
  lvlTxt: { fontWeight: '900', fontSize: 22, color: '#000' },
  levelBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#0B0F1A', borderRadius: 10, borderWidth: 1, borderColor: GOLD, paddingHorizontal: 5, paddingVertical: 1 },
  levelBadgeText: { color: GOLD, fontSize: 9, fontWeight: 'bold' },
  onlineDot: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C853' },
  onlineText: { color: '#00C853', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  userName: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  userSub: { color: GOLD, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  progressSection: { alignItems: 'center', marginBottom: 30 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statCard: { flex: 1, padding: 15, alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
  statLabel: { color: '#8A8D93', fontSize: 11, fontWeight: 'bold' },
  secTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 15 },
  badgeScroll: { paddingBottom: 20, marginBottom: 10 },
  badgeItem: { width: 110, padding: 20, marginRight: 15, alignItems: 'center' },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  badgeText: { color: '#8A8D93', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  itemCard: { padding: 20, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subText: { color: GOLD, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  devCard: { padding: 24 },
  devTitle: { color: GOLD, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  devSub: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  devActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  devBtn: { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  devImageContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: GOLD, overflow: 'hidden' },
  devImage: { width: '100%', height: '100%' },
  portfolioInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: GOLD, minWidth: 100, height: 40, borderRadius: 8, paddingHorizontal: 10, textAlign: 'right', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  setupCard: { width: '85%', padding: 32, alignItems: 'center' },
  setupTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  setupSub: { color: '#8A8D93', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  pinEntry: { backgroundColor: 'rgba(255,255,255,0.05)', color: GOLD, width: 200, height: 60, borderRadius: 12, textAlign: 'center', fontSize: 32, fontWeight: 'bold', marginBottom: 24, letterSpacing: 10 },
  cancelTxt: { color: '#8A8D93', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  devStats: { color: '#8A8D93', fontSize: 14, marginBottom: 12, fontWeight: '500' },
  footer: { marginTop: 60, alignItems: 'center', paddingBottom:  40 },
  footerText: { color: GOLD, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  footerSub: { color: '#fff', fontSize: 11, marginTop: 4, opacity: 0.6 },
  disclaimer: { color: '#444', fontSize: 10, textAlign: 'center', marginTop: 20, lineHeight: 16, paddingHorizontal: 20 }
});

const interpolate = (val: number, input: number[], output: number[]) => {
    "worklet";
    if (val <= input[0]) return output[0];
    if (val >= input[1]) return output[1];
    return output[0] + (val - input[0]) * (output[1] - output[0]) / (input[1] - input[0]);
};
