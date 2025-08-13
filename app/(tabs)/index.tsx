import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Alert, ScrollView, Pressable, ActivityIndicator, RefreshControl, View, ToastAndroid, Linking } from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSettings } from '@/hooks/useSettings';
import { listUploads, deleteFile } from '@/services/api';

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
      Alert.alert('Success', 'File deleted successfully');
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
      // Alert.alert('Success', 'URL copied to clipboard');

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
        contentContainerStyle={[
          styles.contentContainer,
          { marginTop: Constants.statusBarHeight }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.sortControls}>
          {/* <ThemedText style={styles.sortLabel}>Sort by:</ThemedText> */}
        </View>
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
          <ThemedText style={styles.emptyText}>No uploads found</ThemedText>
        ) : (
          <>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtonsContainer}>
              <Pressable
                style={[styles.sortButton, sortField === 'name' && styles.sortButtonActive]}
                onPress={() => {
                  if (sortField === 'name') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('name');
                    setSortDirection('asc');
                  }
                }}
              >
                <ThemedText style={[styles.sortButtonText, sortField === 'name' && styles.sortButtonTextActive]}>
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.sortButton, sortField === 'size' && styles.sortButtonActive]}
                onPress={() => {
                  if (sortField === 'size') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('size');
                    setSortDirection('asc');
                  }
                }}
              >
                <ThemedText style={[styles.sortButtonText, sortField === 'size' && styles.sortButtonTextActive]}>
                  Size {sortField === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.sortButton, sortField === 'expiration' && styles.sortButtonActive]}
                onPress={() => {
                  if (sortField === 'expiration') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('expiration');
                    setSortDirection('asc');
                  }
                }}
              >
                <ThemedText style={[styles.sortButtonText, sortField === 'expiration' && styles.sortButtonTextActive]}>
                  Expires {sortField === 'expiration' && (sortDirection === 'asc' ? '↑' : '↓')}
                </ThemedText>
              </Pressable>
            </ScrollView>

            {
              sortUploads(uploads, sortField, sortDirection).map((upload) => (
                <ThemedView key={upload.file_name} style={styles.uploadItem}>
                  <Pressable
                    onPress={() => {
                      const url = `${settings.serverUrl}/${upload.file_name}`;
                      Linking.openURL(url);
                    }}
                    style={styles.uploadDetails}>
                    <View style={styles.fileNameRow}>
                      <ThemedText style={styles.fileName}>{upload.file_name}</ThemedText>
                      <MaterialIcons name="open-in-new" size={16} color="#666666" />
                    </View>
                    <ThemedText style={styles.fileInfo}>
                      Size: {formatFileSize(upload.file_size)}
                    </ThemedText>
                    <ThemedText style={styles.fileInfo}>
                      Expires: {formatDate(upload.expires_at_utc)}
                    </ThemedText>
                  </Pressable>
                  <ThemedView style={styles.buttonRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.button,
                        styles.copyButton,
                        { opacity: pressed ? 0.7 : 1 }
                      ]}
                      onPress={() => handleCopy(upload.file_name)}
                    >
                      <ThemedText style={styles.buttonText}>Copy URL</ThemedText>
                    </Pressable>
                    {settings.deleteToken !== '' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.button,
                          styles.deleteButton,
                          { opacity: pressed ? 0.7 : 1 }
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
                        <ThemedText style={styles.buttonText}>Delete</ThemedText>
                      </Pressable>
                    )}
                  </ThemedView>
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
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sortControls: {
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#A7C83F',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  uploadItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  uploadDetails: {
    marginBottom: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#A7C83F',
  },
  deleteButton: {
    backgroundColor: '#E38C19',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
