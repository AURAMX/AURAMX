import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, ArrowRightLeft, LineChart, BookOpen, GraduationCap, User } from 'lucide-react-native';

import { VoiceMic } from '@/components/UI/VoiceMic';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors.gold;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            borderTopColor: 'rgba(255,255,255,0.05)',
            height: 70,
            paddingBottom: 0,
            position: 'absolute',
            bottom: 24,
            left: 20,
            right: 20,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            elevation: 10,
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
