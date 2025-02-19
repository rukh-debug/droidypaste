import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Share } from 'react-native';

import { uploadFile } from './api';
import { notifyUploadSuccess, notifyUploadError } from './notifications';

export interface ShareOptions {
  expiry?: string;
  oneshot?: boolean;
}

export async function requestMediaLibraryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickAndUploadFile(
  serverUrl: string,
  authToken: string,
  options: ShareOptions = {}
) {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const url = await uploadFile(result.assets[0].uri, serverUrl, authToken, options);
      await notifyUploadSuccess('File', url);
      return url;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await notifyUploadError('File', message);
    throw error;
  }
}

export async function pickAndUploadImage(
  serverUrl: string,
  authToken: string,
  options: ShareOptions = {}
) {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const url = await uploadFile(result.assets[0].uri, serverUrl, authToken, options);
      await notifyUploadSuccess('Image', url);
      return url;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await notifyUploadError('Image', message);
    throw error;
  }
}

export async function handleReceivedFile(
  uri: string,
  serverUrl: string,
  authToken: string,
  options: ShareOptions = {}
) {
  try {
    // For iOS, we need to copy shared files to app's cache directory
    let fileUri = uri;
    if (Platform.OS === 'ios' && uri.startsWith('file://')) {
      const cacheUri = `${FileSystem.cacheDirectory}${uri.split('/').pop()}`;
      await FileSystem.copyAsync({ from: uri, to: cacheUri });
      fileUri = cacheUri;
    }

    const url = await uploadFile(fileUri, serverUrl, authToken, options);
    await notifyUploadSuccess('Shared file', url);
    return url;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await notifyUploadError('Shared file', message);
    throw error;
  }
}

export async function isAvailableForSharing() {
  return true; // Share API is always available in React Native
}

export async function shareUrl(url: string) {
  try {
    await Share.share({
      message: url,
      url: url, // iOS only
    }, {
      dialogTitle: 'Share URL',
    });
  } catch (error) {
    console.error('Failed to share URL:', error);
    throw error;
  }
}