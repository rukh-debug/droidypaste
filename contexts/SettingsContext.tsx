import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  serverUrl: string;
  authToken: string;
  deleteToken: string;
  expiry: string;
  isOneShot: boolean;
}

interface SettingsContextType {
  settings: Settings;
  setServerUrl: (url: string) => Promise<void>;
  setAuthToken: (token: string) => Promise<void>;
  setDeleteToken: (token: string) => Promise<void>;
  setExpiry: (expiry: string) => Promise<void>;
  setIsOneShot: (isOneShot: boolean) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  serverUrl: '',
  authToken: '',
  deleteToken: '',
  expiry: '',
  isOneShot: false,
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  setServerUrl: async () => {},
  setAuthToken: async () => {},
  setDeleteToken: async () => {},
  setExpiry: async () => {},
  setIsOneShot: async () => {},
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
        const [serverUrl, authToken, deleteToken, expiry, isOneShotStr] = await Promise.all([
          AsyncStorage.getItem('serverUrl'),
          SecureStore.getItemAsync('authToken'),
          SecureStore.getItemAsync('deleteToken'),
          AsyncStorage.getItem('expiry'),
          AsyncStorage.getItem('isOneShot'),
        ]);

        if (isMounted) {
          setSettings({
            serverUrl: serverUrl || '',
            authToken: authToken || '',
            deleteToken: deleteToken || '',
            expiry: expiry || '',
            isOneShot: isOneShotStr ? JSON.parse(isOneShotStr) : false,
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

  const setDeleteToken = async (token: string) => {
    try {
      await SecureStore.setItemAsync('deleteToken', token);
      if (mountedRef.current) {
        setSettings(prev => ({ ...prev, deleteToken: token }));
      }
    }
    catch (error) {
      console.error('Failed to save delete token:', error);
      throw error;
    }
  };

  const setExpiry = async (expiry: string) => {
    try {
      await AsyncStorage.setItem('expiry', expiry);
      if (mountedRef.current) {
        setSettings(prev => ({ ...prev, expiry }));
      }
    } catch (error) {
      console.error('Failed to save expiry:', error);
      throw error;
    }
  };

  const setIsOneShot = async (isOneShot: boolean) => {
    try {
      await AsyncStorage.setItem('isOneShot', JSON.stringify(isOneShot));
      if (mountedRef.current) {
        setSettings(prev => ({ ...prev, isOneShot }));
      }
    } catch (error) {
      console.error('Failed to save isOneShot:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider 
      value={{
        settings,
        setServerUrl,
        setAuthToken,
        setDeleteToken,
        setExpiry,
        setIsOneShot,
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
