import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export const VolumeProfile = ({ data = [20, 45, 90, 60, 30, 15] }) => {
    const max = Math.max(...data);
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Institutional Volume Profile</Text>
            <View style={styles.chart}>
                {data.map((val, i) => (
                    <View key={i} style={styles.row}>
                        <View style={[styles.bar, { width: `${(val / max) * 100}%`, backgroundColor: val > (max * 0.7) ? Colors.gold : 'rgba(255,255,255,0.1)' }]} />
                    </View>
                ))}
            </View>
        </View>
    );
};

export const OrderFlowVisual = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Order Flow Dominance</Text>
            <View style={styles.flowRow}>
                <View style={[styles.flowHalf, { backgroundColor: 'rgba(0,200,83,0.1)', flex: 0.65 }]}>
                    <Text style={styles.flowTxt}>BUY 65%</Text>
                </View>
                <View style={[styles.flowHalf, { backgroundColor: 'rgba(255,82,82,0.1)', flex: 0.35 }]}>
                    <Text style={styles.flowTxt}>SELL 35%</Text>
                </View>
            </View>
            <Text style={styles.sub}>Institutional Accumulation Detected</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { color: Colors.gold, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
    chart: { gap: 4 },
    row: { height: 12, width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 2, overflow: 'hidden' },
    bar: { height: '100%' },
    flowRow: { flexDirection: 'row', height: 40, borderRadius: 8, overflow: 'hidden', gap: 2 },
    flowHalf: { justifyContent: 'center', alignItems: 'center' },
    flowTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    sub: { color: '#8A8D93', fontSize: 9, marginTop: 8, fontWeight: 'bold', textAlign: 'center' }
});
