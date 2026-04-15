import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Mic, X, Send, Sparkles, User, Bot } from 'lucide-react-native';
import { Colors, Spacing, Layout, Typography } from '@/constants/theme';
import { parseVoiceCommand, askEducationalAI } from '@/lib/gemini_service';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../Visuals/GlassCard';

type ChatMsg = { role: 'user' | 'ai'; text: string };

export const VoiceMic = () => {
    const [visible, setVisible] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chat, setChat] = useState<ChatMsg[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setVisible(true);
    };

    const processCommand = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setChat(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            // 1. Try Command Intent Parsing
            const intent = await parseVoiceCommand(userMsg);
            
            if (intent.action === 'navigate') {
                if (intent.target === 'portfolio') router.push('/(tabs)/profile');
                else if (intent.target === 'markets') router.push('/(tabs)/markets');
                else if (intent.target === 'learn') router.push('/(tabs)/learn');
                setVisible(false);
                return;
            } else if (intent.action === 'buy' || intent.action === 'sell') {
                router.push({ pathname: '/(tabs)/trade', params: { symbol: intent.asset || 'BTC' } });
                setVisible(false);
                return;
            } 

            // 2. Fallback to Educational Chat
            const aiResponse = await askEducationalAI(userMsg);
            setChat(prev => [...prev, { role: 'ai', text: aiResponse }]);
            
        } catch (e) {
            setChat(prev => [...prev, { role: 'ai', text: "I hit a data bump! 🎢 Let's try that again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Pressable style={styles.fab} onPress={handlePress}>
                <Sparkles color="#000" size={24} />
            </Pressable>

            <Modal visible={visible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.header}>
                            <View style={styles.titleRow}>
                                <Sparkles color={Colors.gold} size={18} />
                                <Text style={styles.title}>AURAMX AI EXPERT</Text>
                            </View>
                            <Pressable onPress={() => setVisible(false)}><X color="#8A8D93" /></Pressable>
                        </View>

                        <ScrollView 
                            ref={scrollViewRef}
                            style={styles.chatArea} 
                            contentContainerStyle={{ paddingBottom: 20 }}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        >
                            {chat.length === 0 && (
                                <Text style={styles.emptyTxt}>Ask me anything like "What is Market Cap?" or "Buy BTC"</Text>
                            )}
                            {chat.map((msg, i) => (
                                <View key={i} style={[styles.msgRow, msg.role === 'user' ? styles.userRow : styles.aiRow]}>
                                    <View style={[styles.avatar, msg.role === 'user' ? styles.userAvatar : styles.aiAvatar]}>
                                        {msg.role === 'user' ? <User size={14} color="#fff" /> : <Bot size={14} color="#000" />}
                                    </View>
                                    <GlassCard style={styles.msgCard}>
                                        <Text style={styles.msgTxt}>{msg.text}</Text>
                                    </GlassCard>
                                </View>
                            ))}
                            {loading && (
                                <View style={styles.aiRow}>
                                    <ActivityIndicator color={Colors.gold} size="small" />
                                </View>
                            )}
                        </ScrollView>
                        
                        <View style={styles.inputRow}>
                            <TextInput 
                                style={styles.input}
                                placeholder="Type or ask anything..."
                                placeholderTextColor="#444"
                                value={input}
                                onChangeText={setInput}
                                autoFocus
                            />
                            <Pressable 
                                style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} 
                                onPress={processCommand}
                                disabled={loading || !input.trim()}
                            >
                                <Send color="#000" size={20} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    fab: { position: 'absolute', bottom: 120, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, zIndex: 999 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#0B0F1A', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: Colors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    chatArea: { flex: 1, marginVertical: 10 },
    emptyTxt: { color: '#444', textAlign: 'center', marginTop: 100, fontSize: 14, fontWeight: '500' },
    msgRow: { flexDirection: 'row', marginBottom: 16, gap: 10, alignItems: 'flex-end' },
    userRow: { flexDirection: 'row-reverse' },
    aiRow: { },
    avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    userAvatar: { backgroundColor: '#333' },
    aiAvatar: { backgroundColor: Colors.gold },
    msgCard: { padding: 12, maxWidth: '80%' },
    msgTxt: { color: '#fff', fontSize: 14, lineHeight: 20 },
    inputRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 10 },
    input: { flex: 1, height: 56, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },
    sendBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center' }
});
