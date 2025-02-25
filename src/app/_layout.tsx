import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ToastAndroid } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useShareIntent } from 'expo-share-intent';

import { useColorScheme } from '@/hooks/useColorScheme';
import { SettingsProvider, useSettings } from '@/hooks/useSettings';
import { shortenUrl, uploadFile, uploadText } from '@/services/api';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { settings, isLoading } = useSettings();
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();

  // Handle shared content via share intent
  useEffect(() => {
    const processShareIntent = async () => {
      if (isLoading) {
        // Wait until settings are loaded
        return;
      }

      if (!settings.serverUrl) {
        console.warn('Server URL not configured. Cannot upload shared content.');
        return;
      }

      if (hasShareIntent && shareIntent) {
        console.log('Processing share intent:', hasShareIntent, shareIntent, error);

        try {
          // Handle different types of shared content
          if (shareIntent.files && shareIntent.files.length > 0) {
            // Handle all files
            for (const file of shareIntent.files) {
              const { path } = file;
              // Handle as generic file
              console.log('Uploading shared file:', path);
              const url = await uploadFile(
                path,
                settings.serverUrl,
                settings.authToken
              );
              await Clipboard.setStringAsync(url);
              ToastAndroid.show('File uploaded and URL copied to clipboard', ToastAndroid.SHORT);
              console.log('File uploaded successfully:', url);
            }
          } else if (shareIntent.type === 'text' && shareIntent.text) {
            // Handle text content
            console.log('Uploading shared text');
            const url: any = await uploadText(
              shareIntent.text,
              settings.serverUrl,
              settings.authToken
            );
            ToastAndroid.show('Text uploaded and URL copied to clipboard', ToastAndroid.SHORT);
            await Clipboard.setStringAsync(url);
            console.log('Text uploaded successfully:', url);
          } else if (shareIntent.webUrl) {
            // Handle web URL - shorten it
            console.log('Shortening shared URL:', shareIntent.webUrl);
            const shortenedUrl: any = await shortenUrl(
              shareIntent.webUrl,
              settings.serverUrl,
              settings.authToken
            );
            ToastAndroid.show('URL shortened and URL copied to clipboard', ToastAndroid.SHORT);
            await Clipboard.setStringAsync(shortenedUrl);
            console.log('URL shortened successfully:', shortenedUrl);
          }

          // Reset the share intent after processing
          resetShareIntent();
          console.log('Intent cleanup complete');
        } catch (error) {
          console.error('Error handling shared content:', error);
        }
      }
    };

    processShareIntent();
  }, [hasShareIntent, shareIntent, settings.serverUrl, settings.authToken, isLoading, resetShareIntent]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar
        style='auto'
        animated={true}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Takota: require('../assets/fonts/Takota.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SettingsProvider>
      <RootLayoutNav />
    </SettingsProvider>
  );
}
