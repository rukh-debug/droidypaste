import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInput, Alert, ScrollView, Pressable } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/hooks/useSettings';
import { uploadText, shortenUrl, uploadFromRemoteUrl } from '@/services/api';
import { pickAndUploadFile, pickAndUploadImage, ShareOptions } from '@/services/sharing';
import { notifyUploadError, notifyUploadSuccess, requestNotificationsPermission } from '@/services/notifications';

type UploadType = 'text' | 'file' | 'image' | 'url' | 'remote';

export default function UploadScreen() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [expiry, setExpiry] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { settings } = useSettings();

  const inputBackground = useThemeColor({ light: '#f0f0f0', dark: '#dadada' }, 'background');

  const handleUpload = useCallback(async (type: UploadType, oneshot = false) => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      await requestNotificationsPermission();
      const options: ShareOptions = {};

      if (expiry.trim()) {
        options.expiry = expiry.trim();
      }

      if (oneshot) {
        options.oneshot = true;
      }

      let resultUrl: string | undefined;

      switch (type) {
        case 'text':
          if (!text.trim()) {
            Alert.alert('Error', 'Please enter some text');
            return;
          }
          resultUrl = await uploadText(text.trim(), settings.serverUrl, settings.authToken, options) as string;
          setText('');
          break;

        case 'file':
          resultUrl = await pickAndUploadFile(settings.serverUrl, settings.authToken, options) as string;
          break;

        case 'image':
          resultUrl = await pickAndUploadImage(settings.serverUrl, settings.authToken, options) as string;
          break;

        case 'url':
          if (!url.trim()) {
            Alert.alert('Error', 'Please enter a URL');
            return;
          }
          resultUrl = await shortenUrl(url.trim(), settings.serverUrl, settings.authToken) as string;
          setUrl('');
          break;

        case 'remote':
          if (!url.trim()) {
            Alert.alert('Error', 'Please enter a remote URL');
            return;
          }
          resultUrl = await uploadFromRemoteUrl(url.trim(), settings.serverUrl, settings.authToken, options) as string;
          setUrl('');
          break;
      }

      if (resultUrl) {
        await notifyUploadSuccess(type.charAt(0).toUpperCase() + type.slice(1), resultUrl);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await notifyUploadError(
        type.charAt(0).toUpperCase() + type.slice(1),
        message
      );
    } finally {
      setIsUploading(false);
    }
  }, [text, url, expiry, isUploading]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Upload',
          headerLargeTitle: true,
        }}
      />

      <ScrollView style={styles.container}
        contentContainerStyle={{ marginTop: Constants.statusBarHeight }}
      >

        <ThemedView style={styles.section}>
          <ThemedText type="title">Text Upload</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: inputBackground }]}
            value={text}
            onChangeText={setText}
            placeholder="Enter text to upload..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            editable={!isUploading}
          />
          <ThemedView style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: isUploading ? 0.5 : pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleUpload('text')}
              disabled={isUploading}
            >
              <ThemedText style={styles.buttonText}>Upload Text</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: isUploading ? 0.5 : pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleUpload('text', true)}
              disabled={isUploading}
            >
              <ThemedText style={styles.buttonText}>One-shot Text</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="title">URL Operations</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground }]}
            value={url}
            onChangeText={setUrl}
            placeholder="Enter URL..."
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isUploading}
          />
          <ThemedView style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: isUploading ? 0.5 : pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleUpload('url')}
              disabled={isUploading}
            >
              <ThemedText style={styles.buttonText}>Shorten URL</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: isUploading ? 0.5 : pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleUpload('remote')}
              disabled={isUploading}
            >
              <ThemedText style={styles.buttonText}>Upload Remote</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ThemedText type="title">File Upload</ThemedText>
            <Pressable onPress={() => IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: 'https://github.com/orhun/rustypaste?tab=readme-ov-file#expiration' })}>
              <ThemedText style={{ color: '#007AFF' }}>Expiration help</ThemedText>
            </Pressable>
          </ThemedView>

          <TextInput
            style={[styles.input, { backgroundColor: inputBackground }]}
            value={expiry}
            onChangeText={setExpiry}
            placeholder="Expiry (optional, e.g. 1h, 1d)"
            placeholderTextColor="#888"
            editable={!isUploading}
          />
          <ThemedView style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: isUploading ? 0.5 : pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleUpload('file')}
              disabled={isUploading}
            >
              <ThemedText style={styles.buttonText}>Upload File</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: isUploading ? 0.5 : pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleUpload('image')}
              disabled={isUploading}
            >
              <ThemedText style={styles.buttonText}>Upload Image</ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: isUploading ? 0.5 : pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleUpload('file', true)}
              disabled={isUploading}
            >
              <ThemedText style={styles.buttonText}>One-shot File</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  input: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#A7C83F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
