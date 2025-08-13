import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Alert, ScrollView, Pressable, ActivityIndicator, RefreshControl, View, ToastAndroid, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSettings } from '@/hooks/useSettings';
import { listUploads, deleteFile } from '@/services/api';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Upload {
  file_name: string;
  file_size: number;
  expires_at_utc: string | null;
}

type SortField = 'name' | 'size' | 'expiration';
type SortDirection = 'asc' | 'desc';

const sortUploads = (uploads: Upload[], field: SortField, direction: SortDirection): Upload[] => {
  const sortedUploads = [...uploads];

  sortedUploads.sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.file_name.localeCompare(b.file_name);
        break;
      case 'size':
        comparison = a.file_size - b.file_size;
        break;
      case 'expiration':
        // Handle null dates by placing them at the end
        if (a.expires_at_utc === null && b.expires_at_utc === null) {
          comparison = 0;
        } else if (a.expires_at_utc === null) {
          comparison = 1;
        } else if (b.expires_at_utc === null) {
          comparison = -1;
        } else {
          comparison = new Date(a.expires_at_utc).getTime() - new Date(b.expires_at_utc).getTime();
        }
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sortedUploads;
};

export default function ListScreen() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { settings, isLoading: settingsLoading } = useSettings();

  const cardColor = useThemeColor({ light: '#ffffff', dark: '#1C1C1E' }, 'background');
  const subtleTextColor = useThemeColor({ light: '#6c757d', dark: '#adb5bd' }, 'text');
  const primaryColor = '#A7C83F';
  const destructiveColor = '#E38C19';
  const iconColor = useThemeColor({ light: '#666666', dark: '#999999' }, 'text');
  const separatorColor = useThemeColor({ light: '#E5E5EA', dark: '#3A3A3C' }, 'background');


  const loadUploads = useCallback(async () => {
    try {
      const data = await listUploads(settings.serverUrl, settings.authToken);
      setUploads(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to load uploads: ${message}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [settings]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadUploads();
  }, [loadUploads]);

  const handleDelete = useCallback(async (fileName: string) => {
    try {
      await deleteFile(fileName, settings.serverUrl, settings.deleteToken);
      // Refresh the list after successful deletion

      loadUploads();
      ToastAndroid.show('File deleted successfully', ToastAndroid.SHORT);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to delete file: ${message}`);
    }
  }, [settings, loadUploads]);

  const handleCopy = useCallback(async (fileName: string) => {
    try {
      const url = `${settings.serverUrl}/${fileName}`;
      await Clipboard.setStringAsync(url);
      ToastAndroid.show('URL copied to clipboard', ToastAndroid.SHORT);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy URL');
    }
  }, [settings]);

  useEffect(() => {
    if (settingsLoading) {
      return;
    }

    if (!settings.serverUrl || settings.serverUrl === '') {
      Alert.alert(
        'Settings Required',
        'Please configure server URL first',
        [
          {
            text: 'OK',
            onPress: () => router.push('/settings')
          }
        ]
      );
      return;
    }

    loadUploads();
  }, [loadUploads, settings, settingsLoading]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Uploads',
          headerLargeTitle: true,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <ThemedText
          style={{
            fontFamily: 'Takota',
            fontSize: 32,
            textAlign: 'center',
            paddingVertical: 20,
            color: '#A7C83F'
          }}
          type="default">
          droidypaste
        </ThemedText>

        {isLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : uploads.length === 0 ? (
          <ThemedView style={[styles.card, { backgroundColor: cardColor, alignItems: 'center', paddingVertical: 32 }]}>
            <Ionicons name="cloud-offline-outline" size={48} color={subtleTextColor} />
            <ThemedText style={styles.emptyText}>No uploads found</ThemedText>
            <ThemedText style={{ color: subtleTextColor, textAlign: 'center' }}>Pull down to refresh or upload something new.</ThemedText>
          </ThemedView>
        ) : (
          <>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtonsContainer}>
              <Pressable
                style={[styles.sortButton, { borderColor: separatorColor }, sortField === 'name' && styles.sortButtonActive]}
                onPress={() => handleSort('name')}
              >
                <ThemedText style={[styles.sortButtonText, { color: subtleTextColor }, sortField === 'name' && styles.sortButtonTextActive]}>
                  Name {sortField === 'name' && <Ionicons name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} />}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.sortButton, { borderColor: separatorColor }, sortField === 'size' && styles.sortButtonActive]}
                onPress={() => handleSort('size')}
              >
                <ThemedText style={[styles.sortButtonText, { color: subtleTextColor }, sortField === 'size' && styles.sortButtonTextActive]}>
                  Size {sortField === 'size' && <Ionicons name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} />}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.sortButton, { borderColor: separatorColor }, sortField === 'expiration' && styles.sortButtonActive]}
                onPress={() => handleSort('expiration')}
              >
                <ThemedText style={[styles.sortButtonText, { color: subtleTextColor }, sortField === 'expiration' && styles.sortButtonTextActive]}>
                  Expires {sortField === 'expiration' && <Ionicons name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} />}
                </ThemedText>
              </Pressable>
            </ScrollView>

            {
              sortUploads(uploads, sortField, sortDirection).map((upload) => (
                <ThemedView key={upload.file_name} style={[styles.card, { backgroundColor: cardColor }]}>
                  <Pressable
                    onPress={() => {
                      const url = `${settings.serverUrl}/${upload.file_name}`;
                      Linking.openURL(url);
                    }}
                    style={styles.fileNameRow}
                  >
                    <Ionicons name="document-outline" size={24} color={primaryColor} />
                    <ThemedText style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">{upload.file_name}</ThemedText>
                    <MaterialIcons name="open-in-new" size={18} color={iconColor} />
                  </Pressable>

                  <View style={styles.fileInfoContainer}>
                    <View style={styles.infoRow}>
                      <Ionicons name="server-outline" size={16} color={subtleTextColor} />
                      <ThemedText style={[styles.fileInfo, { color: subtleTextColor }]}>
                        {formatFileSize(upload.file_size)}
                      </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="timer-outline" size={16} color={subtleTextColor} />
                      <ThemedText style={[styles.fileInfo, { color: subtleTextColor }]}>
                        {formatDate(upload.expires_at_utc)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.buttonRow, { borderTopColor: separatorColor }]}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.button,
                        styles.copyButton,
                        { opacity: pressed ? 0.8 : 1 }
                      ]}
                      onPress={() => handleCopy(upload.file_name)}
                    >
                      <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.buttonText}>Copy URL</ThemedText>
                    </Pressable>
                    {settings.deleteToken !== '' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.button,
                          { backgroundColor: destructiveColor, opacity: pressed ? 0.8 : 1 }
                        ]}
                        onPress={() => {
                          Alert.alert(
                            'Confirm Delete',
                            `Are you sure you want to delete ${upload.file_name}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => handleDelete(upload.file_name) }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.buttonText}>Delete</ThemedText>
                      </Pressable>
                    )}
                  </View>
                </ThemedView>
              ))
            }
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Constants.statusBarHeight,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
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
  sortButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginRight: 8,
    borderWidth: 1,
  },
  sortButtonActive: {
    backgroundColor: '#A7C83F',
    borderColor: '#A7C83F',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileInfo: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
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
  copyButton: {
    backgroundColor: '#A7C83F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
