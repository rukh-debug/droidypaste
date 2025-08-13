import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInput, ScrollView, Alert, Pressable, ToastAndroid, Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSettings } from '@/hooks/useSettings';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { settings, setServerUrl, setAuthToken, setDeleteToken, isLoading: settingsLoading } = useSettings();
  const [tempServerUrl, setTempServerUrl] = useState(settings.serverUrl);
  const [tempAuthToken, setTempAuthToken] = useState(settings.authToken);
  const [tempDeleteToken, setTempDeleteToken] = useState(settings.deleteToken);

  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1C1C1E' }, 'background');
  const inputBackground = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const subtleTextColor = useThemeColor({ light: '#6c757d', dark: '#adb5bd' }, 'text');
  const primaryColor = '#A7C83F';

  const handleSaveSettings = useCallback(async () => {
    try {
      if (!tempServerUrl.trim()) {
        Alert.alert('Error', 'Server URL cannot be empty');
        return;
      }

      // Basic URL validation
      try {
        new URL(tempServerUrl);
      } catch (e) {
        Alert.alert('Error', 'Invalid server URL format. Please include http:// or https://');
        return;
      }

      await Promise.all([
        setServerUrl(tempServerUrl.trim()),
        setAuthToken(tempAuthToken.trim()),
        setDeleteToken(tempDeleteToken.trim()),
      ]);

      ToastAndroid.show('Settings saved successfully', ToastAndroid.SHORT);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error(error);
    }
  }, [tempServerUrl, tempAuthToken, tempDeleteToken, setServerUrl, setAuthToken, setDeleteToken]);

  const renderSectionHeader = (title: string, icon: React.ComponentProps<typeof Ionicons>['name']) => (
    <ThemedView style={styles.sectionHeader}>
      <Ionicons name={icon} size={22} color={subtleTextColor} />
      <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
    </ThemedView>
  );

  const renderInputRow = (
    label: string,
    value: string,
    setter: (text: string) => void,
    placeholder: string,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    isSecure = false
  ) => (
    <ThemedView style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color={subtleTextColor} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#888"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={label === 'Server URL' ? 'url' : 'default'}
        secureTextEntry={isSecure}
        editable={!settingsLoading}
      />
    </ThemedView>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Settings', headerLargeTitle: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Server Configuration Card */}
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          {renderSectionHeader('Server Configuration', 'server-outline')}
          {renderInputRow('Server URL', tempServerUrl, setTempServerUrl, 'https://paste.example.com', 'globe-outline')}
          {renderInputRow('Auth Token', tempAuthToken, setTempAuthToken, 'Auth Token', 'key-outline', true)}
          {renderInputRow('Delete Token', tempDeleteToken, setTempDeleteToken, 'Delete Token', 'trash-bin-outline', true)}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: primaryColor, opacity: settingsLoading || !tempServerUrl ? 0.6 : pressed ? 0.8 : 1 }
            ]}
            onPress={handleSaveSettings}
            disabled={settingsLoading || !tempServerUrl}
          >
            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.saveButtonText}>Save Settings</ThemedText>
          </Pressable>
        </ThemedView>

        {/* About Card */}
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          {renderSectionHeader('About DroidyPaste', 'information-circle-outline')}
          <ThemedText style={{ color: subtleTextColor, lineHeight: 22 }}>
            This app allows you to easily share files, text, and URLs through your configured{' '}
            <ThemedText
              style={{ color: primaryColor, fontWeight: '600' }}
              onPress={() => Linking.openURL('https://github.com/orhun/rustypaste')}
            >
              rustypaste
            </ThemedText>
            {' '}service.
          </ThemedText>
          <ThemedText style={{ color: subtleTextColor, lineHeight: 22, marginTop: 12 }}>
            Built with love for the open-source community.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: Constants.statusBarHeight + 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.9,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontWeight: '600',
    flex: 1,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
