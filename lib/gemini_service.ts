import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCVy2PVNNiosTaohmyv0rTbHYIQ2l7hfkM';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * AURAMX AI Service (Powered by Gemini)
 * Strictly follows the EDUCATIONAL ONLY rule.
 */

export const analyzeMarket = async (symbol: string, candles: any[], indicators: any) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            You are AURAMX AI, an expert financial educator. 
            Analyze this data for ${symbol}:
            Recent Candles: ${JSON.stringify(candles.slice(-10))}
            Indicators: ${JSON.stringify(indicators)}
            
            RULES:
            1. Be warm, encouraging, and educational.
            2. Explain the current trend (uptrend/downtrend/sideways).
            3. Identify potential support and resistance levels.
            4. Explain what this means for a beginner in simple terms.
            5. STRICT: NO price predictions allowed.
            6. STRICT: Refuse to give any financial advice or "buy/sell" signals.
            7. Keep the response under 150 words.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('[GeminiService] Analysis failed:', error);
        return "I'm having trouble analyzing the data right now. Let's stick to the basics: always manage your risk and keep learning! 📚";
    }
};

export const getAIBrief = async (portfolio: any[]) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            You are AURAMX AI, a financial expert. Give a very short 2-sentence morning brief 
            for a beginner investor holding: ${JSON.stringify(portfolio)}.
            Focus on learning, no financial advice. Keep it under 40 words.
        `;

        const result = await model.generateContent(prompt);
        return (await result.response).text();
    } catch (error) {
        console.error('[GeminiService] Brief generation failed:', error);
        return "Market volatility is high today. Great time to learn about risk management! 🛡️";
    }
};

export const parseVoiceCommand = async (transcript: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            Extract the trading intent from this voice transcript: "${transcript}"
            Return a JSON object with:
            - action: 'buy' | 'sell' | 'navigate' | 'unknown'
            - asset: string (e.g. 'BTC', 'NIFTY')
            - amount: number | null
            - target: string (e.g. 'portfolio', 'markets', 'learn')
            
            Example: "buy BTC worth 1000" -> { "action": "buy", "asset": "BTC", "amount": 1000 }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Extract JSON from response (handling potential markdown)
        const jsonMatch = text.match(/\{.*\}/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { action: 'unknown' };
    } catch (error) {
        console.error('[GeminiService] Command parsing failed:', error);
        return { action: 'unknown' };
    }
};

export const askEducationalAI = async (query: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            You are AURAMX AI, a warm and expert financial professor for beginners.
            Dataset focus: Global markets, Crypto, Technical Analysis, Risk Management.
            
            Question: "${query}"
            
            RULES:
            1. Use a friendly, encouraging personality. 🚀📈💡
            2. Use at least one analogy (e.g. "Liquidity is like how fast you can turn your toys into candy").
            3. Keep answers under 150 words.
            4. Never use jargon without explaining it.
            5. STRICT: Mention that this is part of the AURAMX learning experience with ₹1,00,000 practice money.
            6. STRICT: No financial advice or specific buy/sell recommendations.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('[GeminiService] Educational query failed:', error);
        return "I'm currently studying the latest market trends! 📚 In the meantime, remember: diversification is the key to a healthy portfolio! 🚀";
    }
};
