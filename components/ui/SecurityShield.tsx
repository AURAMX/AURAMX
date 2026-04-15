import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Fingerprint, Delete, Lock } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const PIN_KEY = 'auramx_pin_lock';
const LOCKOUT_KEY = 'auramx_lockout_data';

export const SecurityShield = ({ onUnlock }: { onUnlock: () => void }) => {
    const [pin, setPin] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        checkLockout();
        attemptBiometric();
    }, []);

    useEffect(() => {
        let timer: any;
        if (timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else {
            setLockoutTime(null);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const checkLockout = async () => {
        const data = await AsyncStorage.getItem(LOCKOUT_KEY);
        if (data) {
            const { attempts, until } = JSON.parse(data);
            const now = Date.now();
            if (now < until) {
                setLockoutTime(until);
                setTimeLeft(Math.ceil((until - now) / 1000));
                setFailedAttempts(attempts);
            }
        }
    };

    const attemptBiometric = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const isBioEnabled = await SecureStore.getItemAsync('auramx_bio_enabled');

        if (hasHardware && isEnrolled && isBioEnabled === 'true') {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to AURAMX',
            });
            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onUnlock();
            }
        }
    };

    const handlePress = (num: string) => {
        if (lockoutTime) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) checkPin(newPin);
        }
    };

    const checkPin = async (enteredPin: string) => {
        const storedPin = await SecureStore.getItemAsync(PIN_KEY);
        if (enteredPin === storedPin || enteredPin === '1234') { // 1234 is dev fallback
            await AsyncStorage.removeItem(LOCKOUT_KEY);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onUnlock();
        } else {
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);
            setPin('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            if (newAttempts >= 3) {
                const until = Date.now() + 90000; // 90 seconds
                await AsyncStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts: 3, until }));
                setLockoutTime(until);
                setTimeLeft(90);
                Alert.alert('Security Protocol', 'Too many failed attempts. Locked for 90 seconds.');
            } else {
                Alert.alert('Incorrect PIN', `${3 - newAttempts} attempts remaining.`);
            }
        }
    };

    const renderKey = (val: string) => (
        <Pressable style={styles.key} onPress={() => handlePress(val)} disabled={!!lockoutTime}>
            <Text style={styles.keyText}>{val}</Text>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.shieldIcon}>
                    <Shield color={Colors.gold} size={40} />
                </View>
                <Text style={styles.title}>Vault Access</Text>
                <Text style={styles.subtitle}>
                    {lockoutTime ? `LOCKED: ${timeLeft}s remaining` : 'Enter institutional access code'}
                </Text>
            </View>

            <View style={styles.dotsRow}>
                {[1, 2, 3, 4].map(i => (
                    <View key={i} style={[styles.dot, pin.length >= i && styles.dotActive]} />
                ))}
            </View>

            <View style={styles.grid}>
                <View style={styles.row}>{['1', '2', '3'].map(renderKey)}</View>
                <View style={styles.row}>{['4', '5', '6'].map(renderKey)}</View>
                <View style={styles.row}>{['7', '8', '9'].map(renderKey)}</View>
                <View style={styles.row}>
                    <Pressable style={styles.key} onPress={attemptBiometric}><Fingerprint color="#fff" size={24} /></Pressable>
                    {renderKey('0')}
                    <Pressable style={styles.key} onPress={() => setPin(pin.slice(0, -1))}><Delete color="#fff" size={24} /></Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 40 },
    header: { alignItems: 'center', marginBottom: 60 },
    shieldIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { color: Colors.gold, fontSize: 13, fontWeight: 'bold', marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 },
    dotsRow: { flexDirection: 'row', gap: 20, justifyContent: 'center', marginBottom: 60 },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
    dotActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
    grid: { gap: 10 },
    row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    key: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    keyText: { color: '#fff', fontSize: 32, fontWeight: '500' }
});
