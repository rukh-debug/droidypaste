import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, TextInput, Alert, ScrollView, Pressable, Switch, Platform, LayoutAnimation, UIManager, ToastAndroid } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/hooks/useSettings';
import { uploadText, shortenUrl, uploadFromRemoteUrl } from '@/services/api';
import { pickAndUploadFile, pickAndUploadImage, ShareOptions } from '@/services/sharing';
import { requestNotificationsPermission } from '@/services/notifications';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type UploadType = 'text' | 'file' | 'image' | 'url' | 'remote';

export default function UploadScreen() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);
  const [tempOptionIsOnMessage, setTempOptionIsOnMessage] = useState(false);
  const { settings, setExpiry, setIsOneShot } = useSettings();


  const [tempExpiry, setTempExpiry] = useState(settings.expiry);
  const [tempIsOneShot, setTempIsOneShot] = useState(settings.isOneShot);

  useEffect(() => {
    setTempExpiry(settings.expiry);
    console.log('settings.expiry changed:', settings.expiry);
  }, [settings.expiry]);

  useEffect(() => {
    setTempIsOneShot(settings.isOneShot);
    console.log('settings.isOneShot changed:', settings.isOneShot);
  }, [settings.isOneShot]);

  // Check if temporary options differ from saved settings
  const hasUnsavedChanges = tempExpiry !== settings.expiry || tempIsOneShot !== settings.isOneShot;

  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1C1C1E' }, 'background');
  const inputBackground = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const subtleTextColor = useThemeColor({ light: '#6c757d', dark: '#adb5bd' }, 'text');
  const primaryColor = '#A7C83F';
  const separatorColor = useThemeColor({ light: '#E5E5EA', dark: '#3A3A3C' }, 'background');

  const rotation = useSharedValue(isOptionsExpanded ? 0 : -90);

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const toggleOptions = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    rotation.value = withTiming(isOptionsExpanded ? -90 : 0, { duration: 200 });
    setIsOptionsExpanded(!isOptionsExpanded);
  }, [isOptionsExpanded, rotation]);

  const handleSaveUploadOptions = useCallback(async () => {
    try {
      await setExpiry(tempExpiry);
      await setIsOneShot(tempIsOneShot);
      ToastAndroid.show('Upload options saved', ToastAndroid.SHORT);
      if (isOptionsExpanded) {
        toggleOptions();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save upload options');
      console.error(error);
    }
  }, [tempExpiry, tempIsOneShot, setExpiry, setIsOneShot, isOptionsExpanded, toggleOptions]);

  const handleUpload = useCallback(async (type: UploadType) => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      await requestNotificationsPermission();
      const options: ShareOptions = {
        expiry: tempExpiry.trim() || undefined,
        oneshot: tempIsOneShot || undefined,
      };

      let resultUrl: string | undefined;

      switch (type) {
        case 'text':
          if (!text.trim()) {
            Alert.alert('Error', 'Please enter some text to upload.');
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
            Alert.alert('Error', 'Please enter a URL to shorten.');
            return;
          }
          resultUrl = await shortenUrl(url.trim(), settings.serverUrl, settings.authToken, options) as string;
          setUrl('');
          break;
        case 'remote':
          if (!url.trim()) {
            Alert.alert('Error', 'Please enter a remote URL to upload.');
            return;
          }
          resultUrl = await uploadFromRemoteUrl(url.trim(), settings.serverUrl, settings.authToken, options) as string;
          setUrl('');
          break;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Upload error:', message);
    } finally {
      setIsUploading(false);
    }
  }, [text, url, isUploading, settings, tempExpiry, tempIsOneShot]);

  const renderSectionHeader = (title: string, icon: React.ComponentProps<typeof Ionicons>['name'], isCollapsible = false) => (
    <Pressable onPress={isCollapsible ? toggleOptions : undefined} style={styles.sectionHeader}>
      <Ionicons name={icon} size={22} color={subtleTextColor} />
      <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
      {isCollapsible && (
        <Animated.View style={[styles.chevron, animatedChevronStyle]}>
          <Ionicons name="chevron-down" size={24} color={subtleTextColor} />
        </Animated.View>
      )}
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Upload', headerLargeTitle: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Options Card */}
        <ThemedView style={[styles.card, { backgroundColor: cardColor, paddingBottom: isOptionsExpanded ? 16 : 8 }]}>
          {renderSectionHeader('Upload Options', 'options-outline', true)}
          {isOptionsExpanded && (
            <ThemedView>
              <ThemedView style={styles.optionRow}>
                <ThemedView style={styles.optionLabelContainer}>
                  <Ionicons name="flame-outline" size={20} color={subtleTextColor} />
                  <ThemedText style={styles.optionLabel}>One-shot Upload</ThemedText>
                </ThemedView>
                <Switch
                  value={tempIsOneShot}
                  onValueChange={(value) => setTempIsOneShot(value)}
                  trackColor={{ false: '#767577', true: primaryColor }}
                  thumbColor={tempIsOneShot ? '#FFFFFF' : '#f4f3f4'}
                  disabled={isUploading}
                />
              </ThemedView>
              <ThemedView style={[styles.separator, { backgroundColor: separatorColor }]} />
              <ThemedView style={styles.optionRow}>
                <ThemedView style={styles.optionLabelContainer}>
                  <Ionicons name="timer-outline" size={20} color={subtleTextColor} />
                  <ThemedText style={styles.optionLabel}>Expires in</ThemedText>
                </ThemedView>
                <TextInput
                  style={[styles.expiryInput, { backgroundColor: inputBackground, color: textColor }]}
                  value={tempExpiry}
                  onChangeText={setTempExpiry}
                  placeholder="e.g., 1h, 1d"
                  placeholderTextColor="#888"
                  editable={!isUploading}
                />
              </ThemedView>
              <Pressable onPress={() => IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: 'https://github.com/orhun/rustypaste?tab=readme-ov-file#expiration' })}>
                <ThemedText style={styles.helpText}>Learn about expiration syntax</ThemedText>
              </Pressable>
              {hasUnsavedChanges && (
                <ThemedView style={styles.warningMessage}>
                  <Ionicons name="information-circle-outline" size={16} color="#FF9500" />
                  <ThemedText style={styles.warningText}>
                    These temporary options will override your saved settings for uploads
                  </ThemedText>
                </ThemedView>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  {
                    opacity: !hasUnsavedChanges ? 0.5 : pressed ? 0.8 : 1,
                    marginTop: 16
                  }
                ]}
                onPress={handleSaveUploadOptions}
                disabled={!hasUnsavedChanges}
              >
                <ThemedText style={styles.saveButtonText}>Save Options</ThemedText>
              </Pressable>
            </ThemedView>
          )}
          {!isOptionsExpanded && (
            <ThemedView style={styles.summaryContainer}>
              <ThemedView style={styles.summaryItem}>
                <Ionicons name="flame-outline" size={16} color={subtleTextColor} />
                <ThemedText style={[styles.summaryText, { color: subtleTextColor }]}>
                  {`One-shot: ${tempIsOneShot ? 'enabled' : 'disabled'}`}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.summaryItem}>
                <Ionicons name="timer-outline" size={16} color={subtleTextColor} />
                <ThemedText style={[styles.summaryText, { color: subtleTextColor }]}>
                  {`Expiry: ${tempExpiry.trim() || 'Permanent'}`}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>

        {/* Unsaved Changes Warning - Outside Options Panel */}
        {hasUnsavedChanges && !isOptionsExpanded && (
          <ThemedView style={[styles.warningMessage, styles.warningCard, { backgroundColor: cardColor, marginBottom: 16 }]}>
            <Ionicons name="information-circle-outline" size={16} color="#FF9500" />
            <ThemedText style={styles.warningText}>
              You have unsaved upload options that will be used for uploads
            </ThemedText>
          </ThemedView>
        )}

        {/* Text Upload Card */}
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          {renderSectionHeader('Paste Text', 'text-outline')}
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: inputBackground, color: textColor }]}
            value={text}
            onChangeText={setText}
            placeholder="Enter text to upload..."
            placeholderTextColor="#888"
            multiline
            editable={!isUploading}
          />
          <Pressable
            style={({ pressed }) => [styles.button, { backgroundColor: primaryColor, opacity: isUploading ? 0.6 : pressed ? 0.8 : 1 }]}
            onPress={() => handleUpload('text')}
            disabled={isUploading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Upload Text</ThemedText>
          </Pressable>
        </ThemedView>

        {/* File Upload Card */}
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          {renderSectionHeader('Upload File', 'document-attach-outline')}
          <ThemedView style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.button, styles.secondaryButton, { opacity: isUploading ? 0.6 : pressed ? 0.8 : 1 }]}
              onPress={() => handleUpload('file')}
              disabled={isUploading}
            >
              <Ionicons name="document-outline" size={20} color={primaryColor} />
              <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Choose File</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, styles.secondaryButton, { opacity: isUploading ? 0.6 : pressed ? 0.8 : 1 }]}
              onPress={() => handleUpload('image')}
              disabled={isUploading}
            >
              <Ionicons name="image-outline" size={20} color={primaryColor} />
              <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Choose Image</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        {/* URL Card */}
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          {renderSectionHeader('From URL', 'link-outline')}
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
            value={url}
            onChangeText={setUrl}
            placeholder="URL to shorten or upload from remote"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="url"
            editable={!isUploading}
          />
          <ThemedView style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.button, styles.secondaryButton, { opacity: isUploading ? 0.6 : pressed ? 0.8 : 1 }]}
              onPress={() => handleUpload('url')}
              disabled={isUploading}
            >
              <Ionicons name="cut-outline" size={20} color={primaryColor} />
              <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>Shorten</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, { backgroundColor: primaryColor, opacity: isUploading ? 0.6 : pressed ? 0.8 : 1 }]}
              onPress={() => handleUpload('remote')}
              disabled={isUploading}
            >
              <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>Upload</ThemedText>
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
  },
  sectionTitle: {
    fontWeight: '600',
    flex: 1,
  },
  chevron: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  optionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  optionLabel: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  separator: {
    height: 1,
    width: '100%',
  },
  expiryInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    minWidth: 120,
    textAlign: 'right',
  },
  helpText: {
    color: '#007AFF',
    textAlign: 'right',
    fontSize: 14,
    paddingTop: 4,
  },
  infoMessage: {
    textAlign: 'center',
    fontSize: 14,
    marginVertical: 8,
    paddingHorizontal: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#A7C83F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#A7C83F',
  },
  saveButton: {
    backgroundColor: '#A7C83F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 0,
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
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
});