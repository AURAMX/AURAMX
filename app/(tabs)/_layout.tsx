import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, ArrowRightLeft, LineChart, BookOpen, GraduationCap, User } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint || '#d4af37'; // gold theme

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Trade',
          tabBarIcon: ({ color }) => <ArrowRightLeft size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: 'Markets',
          tabBarIcon: ({ color }) => <LineChart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: 'Academy',
          tabBarIcon: ({ color }) => <GraduationCap size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
