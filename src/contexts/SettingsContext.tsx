import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  serverUrl: string;
  authToken: string;
}

interface SettingsContextType {
  settings: Settings;
  setServerUrl: (url: string) => Promise<void>;
  setAuthToken: (token: string) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  serverUrl: '',
  authToken: '',
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  setServerUrl: async () => {},
  setAuthToken: async () => {},
  isLoading: true,
});

export function SettingsProvider({ children }: Readonly<PropsWithChildren>) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = React.useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      try {
        const [serverUrl, authToken] = await Promise.all([
          AsyncStorage.getItem('serverUrl'),
          SecureStore.getItemAsync('authToken'),
        ]);

        if (isMounted) {
          setSettings({
            serverUrl: serverUrl || '',
            authToken: authToken || '',
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load settings:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const setServerUrl = async (url: string) => {
    try {
      await AsyncStorage.setItem('serverUrl', url);
      if (mountedRef.current) {
        setSettings(prev => ({ ...prev, serverUrl: url }));
      }
    } catch (error) {
      console.error('Failed to save server URL:', error);
      throw error;
    }
  };

  const setAuthToken = async (token: string) => {
    try {
      await SecureStore.setItemAsync('authToken', token);
      if (mountedRef.current) {
        setSettings(prev => ({ ...prev, authToken: token }));
      }
    } catch (error) {
      console.error('Failed to save auth token:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider 
      value={{
        settings,
        setServerUrl,
        setAuthToken,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}