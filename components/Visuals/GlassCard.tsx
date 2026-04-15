import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassTokens } from '@/constants/theme';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  children: React.ReactNode;
}

/**
 * Premium Glassmorphism Card
 * Features background blur, subtle gold border, and high radius.
 */
export const GlassCard = ({ 
  intensity = 15, 
  tint = 'dark', 
  children, 
  style,
  ...props 
}: GlassCardProps) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: GlassTokens.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)', // Subtle gold border
    backgroundColor: 'rgba(26, 31, 46, 0.6)', // Base transparency
  },
  blur: {
    flex: 1,
  },
  content: {
    padding: 20,
    flex: 1,
  }
});
