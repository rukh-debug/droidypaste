import { StyleSheet, TextInput, ScrollView, Alert, Pressable, ToastAndroid } from 'react-native';
import { useCallback, useState } from 'react';
import * as IntentLauncher from 'expo-intent-launcher';

import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSettings } from '@/hooks/useSettings';
import { useThemeColor } from '@/hooks/useThemeColor';

import Constants from 'expo-constants';


export default function SettingsScreen() {
  const { settings, setServerUrl, setAuthToken, setDeleteToken } = useSettings();
  const [tempServerUrl, setTempServerUrl] = useState(settings.serverUrl);
  const [tempAuthToken, setTempAuthToken] = useState(settings.authToken);
  const [tempDeleteToken, setTempDeleteToken] = useState(settings.deleteToken);
  const inputBackground = useThemeColor({ light: '#f0f0f0', dark: '#dadada' }, 'background');

  const handleSaveSettings = useCallback(async () => {
    try {
      if (!tempServerUrl.trim()) {
        Alert.alert('Error', 'Server URL cannot be empty');
        return;
      }

      if (!tempAuthToken.trim()) {
        await new Promise((resolve) => {
          Alert.alert(
            'Warning',
            'If your server requires authentication, you need to provide an auth token',
            [{ text: 'OK', onPress: resolve }]
          );
        });
      }

      if (!tempDeleteToken.trim()) {
        await new Promise((resolve) => {
          Alert.alert(
            'Warning',
            'Without delete token you won\'t be able to delete pastes',
            [{ text: 'OK', onPress: resolve }]
          );
        });
      }

      // Basic URL validation
      try {
        new URL(tempServerUrl);
      } catch (e) {
        Alert.alert('Error', 'Invalid server URL format');
        return;
      }

      await Promise.all([
        setServerUrl(tempServerUrl.trim()),
        setAuthToken(tempAuthToken.trim()),
        setDeleteToken(tempDeleteToken.trim()),
      ]);
      
      // Alert.alert('Success', 'Settings saved successfully');
      ToastAndroid.show('Settings saved successfully', ToastAndroid.SHORT);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error(error);
    }
  }, [tempServerUrl, tempAuthToken, tempDeleteToken, setServerUrl, setAuthToken, setDeleteToken]);

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={{
        marginTop: Constants.statusBarHeight,
      }}
    >
      <ThemedView style={styles.section}>
        <ThemedText type="title" style={styles.title}>
          Server Configuration
        </ThemedText>

        <ThemedText style={styles.label}>Server URL</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground }]}
          value={tempServerUrl}
          onChangeText={setTempServerUrl}
          placeholder="https://paste.example.com"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <ThemedText style={styles.label}>Auth Token</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground }]}
          value={tempAuthToken}
          onChangeText={setTempAuthToken}
          placeholder="Your authentication token"
          placeholderTextColor="#888"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ThemedText style={styles.label}>Delete Token</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground }]}
          value={tempDeleteToken}
          onChangeText={setTempDeleteToken}
          placeholder="Your delete token"
          placeholderTextColor="#888"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ThemedView
          style={[styles.saveButton, { opacity: !tempServerUrl ? 0.5 : 1 }]}
          onTouchEnd={handleSaveSettings}
        >
          <ThemedText style={styles.saveButtonText}>Save Settings</ThemedText>
        </ThemedView>
      </ThemedView>

      <Collapsible title="About">
        <ThemedText>
          This app allows you to easily share files, text, and URLs through your configured
          <Pressable onPress={() => IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: 'https://github.com/orhun/rustypaste' })}>
            <ThemedText style={{ color: '#007AFF' }}> rustypaste </ThemedText>
          </Pressable> service.
          Make sure to configure your server URL and authentication token in the settings above.
        </ThemedText>
      </Collapsible>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
