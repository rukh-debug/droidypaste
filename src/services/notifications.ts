import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationsPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('upload-results', {
      name: 'Upload Results',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

interface NotifyUploadResultOptions {
  title: string;
  url: string;
  error?: boolean;
}

export async function notifyUploadResult({ title, url, error = false }: NotifyUploadResultOptions) {
  try {
    if (!error) {
      await Clipboard.setStringAsync(url);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: error ? url : 'URL copied to clipboard',
        data: { url },
        sound: true,
      },
      trigger: null,
    });
  } catch (err) {
    console.error('Failed to show notification:', err);
  }
}

export async function notifyUploadSuccess(type: string, url: string) {
  await notifyUploadResult({
    title: `${type} uploaded successfully`,
    url,
  });
}

export async function notifyUploadError(type: string, error: string) {
  console.error(`${type} upload failed:`, error);
  await notifyUploadResult({
    title: `${type} upload failed`,
    url: error,
    error: true,
  });
}