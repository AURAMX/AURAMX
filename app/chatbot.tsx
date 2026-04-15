import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, Bot, User, X, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOLD = '#D4AF37';
const BG_COLOR = '#0B0F1A';

export default function ChatbotScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "👋 Hello! I am AURAMX AI, your guide to mastering the markets. I can help you understand trading, crypto, and how to level up in the app. How can I assist you today? 🚀", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // SYSTEM PROMPT LOGIC (Simulated Gemini Engine)
    setTimeout(() => {
        let response = "";
        const query = input.toLowerCase();
        
        // 1. App Specific & Developer
        if (query.includes('nauman') || query.includes('developer')) {
            response = "👨‍💻 NAUMAN ALAM KHAN is the brilliant developer who built AURAMX! He's a Software Architect with 5+ years of fintech experience. You can find his WhatsApp and Instagram links in the Profile section! 💡";
        } 
        // 2. XP & Gamification
        else if (query.includes('xp') || query.includes('level') || query.includes('badge') || query.includes('streak')) {
            response = "🌟 You earn XP by: Trades (+25, first +75!), lessons (+20), and quizzes (+10 per correct answer). Maintain a daily login streak for huge bonuses (+50 XP for 3 days!). Level up every 100 XP to earn virtual ₹500! 🎯 Check your Profile to see your current badges like Knowledge Seeker 📚";
        }
        // 3. Bitcoin & Crypto
        else if (query.includes('bitcoin') || query.includes('btc')) {
            response = "🪙 Bitcoin is like digital gold! Created in 2009 by Satoshi Nakamoto, it's decentralized (no banks) and limited to 21 million units. This scarcity makes it a store of value. 💡 Remeber: In AURAMX, you can practice buying BTC with your ₹1,00,000 virtual money! 🚀";
        }
        else if (query.includes('ethereum') || query.includes('eth')) {
            response = "💎 Ethereum is like the 'Android of Blockchain'. Developers build decentralized apps on it! It transitioned to Proof-of-Stake to be more energy-efficient. 💡 It's the core of DeFi and NFTs. 📈";
        }
        // 4. Stocks & Markets
        else if (query.includes('nifty') || query.includes('nse')) {
            response = "🇮🇳 NIFTY 50 is India's benchmark index! It tracks the top 50 companies like Reliance and TCS on the National Stock Exchange. It's like a thermometer for the Indian economy. 📈 Market hours are 9:15 AM to 3:30 PM IST. 💡";
        }
        else if (query.includes('p/e') || (query.includes('price') && query.includes('earning'))) {
            response = "📊 The P/E Ratio tells you if a stock is cheap or expensive! It's Share Price ÷ Earnings. High P/E (>25) often means high growth expectations, while low P/E (<15) might mean it's undervalued. 💡 Analogy: It's like checking the price-per-gram when buying gold! 📈";
        }
        // 5. Hard Logic: Advice & Predictions (Prohibited)
        else if (query.includes('buy') || query.includes('sell') || query.includes('should i') || query.includes('price target')) {
            response = "⚠️ I can't give financial advice or predict future prices. But I can teach you! 📚 Look at indicators like RSI or Volume, and check Support/Resistance levels before making a decision. 💡 Practice with your virtual cash first to build your skills safely! 📈";
        }
        // 6. Indicators & Patterns
        else if (query.includes('rsi')) {
            response = "📊 RSI is like a speed meter for price! Above 70 means 'Overbought' (may drop), while below 30 means 'Oversold' (may bounce). Use it to see if the market is too hot or cold! 💡 Neutral is between 30-70. 📈";
        }
        else if (query.includes('candle')) {
            response = "🕯️ Candlesticks are the language of traders! Green = Price up (Buyers won!), Red = Price down (Sellers won!). The 'wicks' show you the highest and lowest prices reached. 💡 Check the Academy for interactive visuals on patterns like 'Hammers'! 📈";
        }
        // 7. Fallback
        else {
            response = "💡 That's a great question! While I'm still learning, I recommend checking the Academy or Learn section for a deep dive on that topic. 📚 Keep practicing with your virtual ₹1,00,000 to master the markets! 🚀";
        }

        const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'ai' };
        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);
    }, 1200);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 90 : 0}
    >
      <BlurView intensity={20} tint="dark" style={styles.header}>
          <View style={styles.row}>
            <View style={styles.botIcon}>
                <Sparkles color={GOLD} size={20} />
            </View>
            <View>
                <Text style={styles.headerTitle}>AURAMX AI Advisor</Text>
                <Text style={styles.headerStatus}>✨ Gemini-Powered Intelligence</Text>
            </View>
          </View>
          <Pressable onPress={() => router.back()}>
              <X color="#fff" size={24} />
          </Pressable>
      </BlurView>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContainer}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgWrapper, msg.sender === 'user' ? styles.userMsgWrapper : styles.aiMsgWrapper]}>
            <View style={[styles.msgBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.msgText, msg.sender === 'user' ? styles.userText : styles.aiText]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {loading && (
            <View style={styles.aiMsgWrapper}>
                <View style={[styles.msgBubble, styles.aiBubble]}>
                    <ActivityIndicator color={GOLD} size="small" />
                </View>
            </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything about trading or AURAMX..."
            placeholderTextColor="#666"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={handleSend}>
              <Send color="#000" size={20} />
          </Pressable>
      </View>
      
      <View style={styles.footerNote}>
          <Text style={styles.footerText}>AURAMX AI can make mistakes. Always verify info. ✨</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  botIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerStatus: { color: GOLD, fontSize: 11, fontWeight: '600' },
  chatContainer: { padding: 20, paddingBottom: 40 },
  msgWrapper: { marginBottom: 20, maxWidth: '85%' },
  userMsgWrapper: { alignSelf: 'flex-end' },
  aiMsgWrapper: { alignSelf: 'flex-start' },
  msgBubble: { padding: 15, borderRadius: 20 },
  userBubble: { backgroundColor: GOLD, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: 'rgba(255,255,255,0.05)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  msgText: { fontSize: 14, lineHeight: 22 },
  userText: { color: '#000', fontWeight: '500' },
  aiText: { color: '#fff' },
  inputArea: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: '#0B0F1A', 
    alignItems: 'center', 
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  input: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    color: '#fff', 
    maxHeight: 100 
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' },
  footerNote: { paddingBottom: 30, backgroundColor: BG_COLOR, alignItems: 'center' },
  footerText: { color: '#444', fontSize: 10 }
});
