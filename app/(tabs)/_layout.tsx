import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, ArrowRightLeft, LineChart, BookOpen, GraduationCap, User } from 'lucide-react-native';

import { VoiceMic } from '@/components/ui/VoiceMic';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const tint = Colors.gold;

  const bottomOffset = Math.max(insets.bottom, 24) + 16;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: 'rgba(26, 31, 46, 0.9)',
            borderTopColor: 'rgba(255,255,255,0.05)',
            height: 74,
            paddingBottom: 0,
            position: 'absolute',
            bottom: bottomOffset,
            left: 20,
            right: 20,
            borderRadius: 30,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.08)',
            elevation: 10,
            shadowColor: Colors.gold,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 25,
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="trade"
          options={{
            title: 'Trade',
            tabBarIcon: ({ color }) => <ArrowRightLeft size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="markets"
          options={{
            title: 'Markets',
            tabBarIcon: ({ color }) => <LineChart size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: 'Learn',
            tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="academy"
          options={{
            title: 'Academy',
            tabBarIcon: ({ color }) => <GraduationCap size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
      </Tabs>
      
      <VoiceMic />
    </View>
  );
}
