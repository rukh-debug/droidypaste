import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';

type TabIconName = 'square.and.arrow.up' | 'gear';

export default function TabLayout() {
  const tabBarBackground = useThemeColor(
    { light: '#ffffff', dark: '#000000' },
    'background'
  );

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: tabBarBackground,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="square.and.arrow.up" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="gear" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, size }: { name: TabIconName; color: string; size: number }) {
  if (Platform.OS === 'ios') {
    return (
      <IconSymbol
        name={name}
        color={color}
        size={size}
      />
    );
  }

  // For Android and web, use Material Icons
  const materialIconName = name === 'square.and.arrow.up' ? 'upload' : 'settings';
  return (
    <MaterialIcons
      name={materialIconName}
      size={size}
      color={color}
    />
  );
}
