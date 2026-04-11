import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { COLORS } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home" size={size} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="barbell" size={size} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Premios',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="gift" size={size} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="trophy" size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person" size={size} />,
        }}
      />
    </Tabs>
  );
}
