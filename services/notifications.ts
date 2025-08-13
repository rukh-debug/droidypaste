import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Platform, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';


// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Notification categories for interactive notifications
const NOTIFICATION_CATEGORIES = {
  SUCCESS: 'UPLOAD_SUCCESS',
  ERROR: 'UPLOAD_ERROR',
} as const;

export async function requestNotificationsPermission(): Promise<boolean> {
  try {
    // Set up notification channels for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('droidypaste-success', {
        name: 'Upload Success',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#00C851',
        description: 'Notifications for successful paste uploads',
      });

      await Notifications.setNotificationChannelAsync('droidypaste-error', {
        name: 'Upload Errors',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FF4444',
        description: 'Notifications for upload errors',
      });
    }

    // Set up notification categories for interactive notifications
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.SUCCESS, [
      {
        identifier: 'copy_url',
        buttonTitle: 'Copy URL',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'open_url',
        buttonTitle: 'Open URL',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.ERROR, [
      // {
      //   identifier: 'retry_upload',
      //   buttonTitle: 'Retry',
      //   options: {
      //     opensAppToForeground: true,
      //   },
      // },
      {
        identifier: 'view_details',
        buttonTitle: 'Details',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to setup notifications:', error);
    return false;
  }
}

interface NotificationData {
  type: 'success' | 'error';
  url?: string;
  errorMessage?: string;
  uploadType?: string;
  timestamp: number;
}

interface SuccessNotificationOptions {
  title: string;
  url: string;
  uploadType: string;
  autoClipboard?: boolean;
}

interface ErrorNotificationOptions {
  title: string;
  errorMessage: string;
  uploadType: string;
}

export async function showSuccessNotification({
  title,
  url,
  uploadType,
  autoClipboard = true,
}: SuccessNotificationOptions): Promise<void> {
  try {
    // Auto-copy to clipboard if enabled
    if (autoClipboard) {
      await Clipboard.setStringAsync(url);
      // Provide haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const notificationData: NotificationData = {
      type: 'success',
      url,
      uploadType,
      timestamp: Date.now(),
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: autoClipboard 
          ? `URL copied to clipboard! Tap to view options.`
          : `Upload completed! Tap to copy URL.`,
        data: notificationData,
        sound: true,
        categoryIdentifier: NOTIFICATION_CATEGORIES.SUCCESS,
      },
      trigger: null,
    });

    console.log('Success notification sent for ' + uploadType + ' upload');
  } catch (error) {
    console.error('Failed to show success notification:', error);
  }
}

export async function showErrorNotification({
  title,
  errorMessage,
  uploadType,
}: ErrorNotificationOptions): Promise<void> {
  try {
    // Provide haptic feedback for error
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const notificationData: NotificationData = {
      type: 'error',
      errorMessage,
      uploadType,
      timestamp: Date.now(),
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: `Error: ${errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage}`,
        data: notificationData,
        sound: true,
        categoryIdentifier: NOTIFICATION_CATEGORIES.ERROR,
      },
      trigger: null,
    });

    console.error('Error notification sent for ' + uploadType + ' upload:', errorMessage);
  } catch (error) {
    console.error('Failed to show error notification:', error);
  }
}

// Convenient wrapper functions
export async function notifyUploadSuccess(uploadType: string, url: string): Promise<void> {
  const title = `${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} Upload Complete`;
  await showSuccessNotification({
    title,
    url,
    uploadType,
  });
}

export async function notifyUploadError(uploadType: string, errorMessage: string): Promise<void> {
  const title = `${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} Upload Failed`;
  await showErrorNotification({
    title,
    errorMessage,
    uploadType,
  });
}

// Handle notification interactions
export function setupNotificationResponseHandler(): void {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data as NotificationData;

    try {
      switch (actionIdentifier) {
        case 'copy_url':
          if (data.url) {
            await Clipboard.setStringAsync(data.url);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Copied', 'URL copied to clipboard!', [{ text: 'OK' }]);
          }
          break;

        case 'open_url':
          if (data.url) {
            console.log('Opening URL:', data.url);
            IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: data.url });
          }
          break;

        case 'retry_upload':
          console.log('Retry upload requested for:', data.uploadType);
          // TODO: Navigate to upload screen or trigger retry logic
          break;

        case 'view_details':
          if (data.errorMessage) {
            Alert.alert(
              'Error Details',
              data.errorMessage,
              [
                { text: 'Copy Error', onPress: () => Clipboard.setStringAsync(data.errorMessage!) },
                { text: 'OK' },
              ]
            );
          }
          break;

        default:
          // Handle default tap (when notification body is tapped)
          if (data.type === 'success' && data.url) {
            await Clipboard.setStringAsync(data.url);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert(
              'URL Copied',
              'The paste URL has been copied to your clipboard.',
              [
                { text: 'OK' },
                {
                  text: 'Open URL',
                  onPress: () => console.log('Opening URL:', data.url),
                },
              ]
            );
          }
          break;
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  });
}

// Utility function to copy URL manually with feedback
export async function copyUrlWithFeedback(url: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(url);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'URL copied to clipboard!', [{ text: 'OK' }]);
  } catch (error) {
    console.error('Failed to copy URL:', error);
    Alert.alert('Error', 'Failed to copy URL to clipboard', [{ text: 'OK' }]);
  }
}