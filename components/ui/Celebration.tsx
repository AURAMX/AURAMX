import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';

export type CelebrationHandle = {
    trigger: (type: 'confetti' | 'fireworks') => void;
};

export const Celebration = forwardRef<CelebrationHandle>((props, ref) => {
    const [visible, setVisible] = useState(false);
    const [type, setType] = useState<'confetti' | 'fireworks'>('confetti');

    useImperativeHandle(ref, () => ({
        trigger: (t: 'confetti' | 'fireworks') => {
            setType(t);
            setVisible(true);
            setTimeout(() => setVisible(false), 3000);
        }
    }));

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay} pointerEvents="none">
                <LottieView 
                    source={type === 'confetti' 
                        ? { uri: 'https://assets9.lottiefiles.com/packages/lf20_u4yrau.json' } 
                        : { uri: 'https://assets5.lottiefiles.com/packages/lf20_X948pY.json' }
                    }
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                />
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lottie: { width: '100%', height: '100%' }
});
