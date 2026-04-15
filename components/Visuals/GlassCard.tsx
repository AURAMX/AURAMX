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
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)', // High-end 'Inner Glow' effect
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Frosted glass pane
    
    // Neumorphic Depth Elevation (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  blur: {
    flex: 1,
  },
  content: {
    padding: 20,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)', // Secondary subtle gold inner border
    borderRadius: 24,
  }
});
