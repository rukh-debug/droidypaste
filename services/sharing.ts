import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { uploadFile } from './api';

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
): Promise<string | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      // User cancelled the picker
      return null;
    }

    if (result.assets?.[0]) {
      const url = await uploadFile(result.assets[0].uri, serverUrl, authToken, options);
      return url;
    }

    // No file selected
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
}

export async function pickAndUploadImage(
  serverUrl: string,
  authToken: string,
  options: ShareOptions = {}
): Promise<string | null> {
  try {
    // Request permission first
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      throw new Error('Permission to access media library is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled) {
      // User cancelled the picker
      return null;
    }

    if (result.assets?.[0]) {
      const url = await uploadFile(result.assets[0].uri, serverUrl, authToken, options);
      return url;
    }

    // No image selected
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
}

