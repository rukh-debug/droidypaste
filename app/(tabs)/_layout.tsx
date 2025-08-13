import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';

type TabIconName = 'square.and.arrow.up' | 'list.bullet' | 'gear';

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
        tabBarActiveTintColor: '#A7C83F',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="square.and.arrow.up" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Uploads',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="list.bullet" color={color} size={size} />
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
  const materialIconName = name === 'square.and.arrow.up' ? 'upload' : name === 'list.bullet' ? 'list' : 'settings';
  return (
    <MaterialIcons
      name={materialIconName}
      size={size}
      color={color}
    />
  );
}
