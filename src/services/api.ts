import { useSettings } from '@/contexts/SettingsContext';

/**
 * API client for interacting with the paste server.
 * Note: Server URLs must include protocol (http:// or https://).
 * If protocol is not provided, https:// will be used by default.
 */

interface UploadOptions {
  expiry?: string;
  oneshot?: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function uploadText(
  text: string,
  serverUrl: string,
  authToken?: string,
  options: UploadOptions = {}
) {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  // For React Native, we need to pass the text content directly
  formData.append('file', {
    uri: 'text.txt',
    type: 'text/plain',
    name: 'text.txt',
    string: text // This will be the actual text content
  } as any);

  const headers: Record<string, string> = {
    'Accept': '*/*',
    "Accept-Encoding": "identity"
  };

  if (authToken) {
    headers['Authorization'] = authToken;
  }

  if (options.expiry) {
    headers['expire'] = options.expiry;
  }

  // Log request details for debugging
  console.log('Making request to:', serverUrl);
  
  try {
    // Ensure URL is properly formatted
    const url = serverUrl.replace(/^http:\/\//, 'https://');
    const finalUrl = url.startsWith('https://') ? url : `https://${url}`;
    
    console.log('Final URL:', finalUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 10000; // 10 second timeout
      
      xhr.onload = function() {
        clearTimeout(timeoutId);
        const responseText = xhr.responseText;
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseText);
        } else {
          console.error('Server response:', xhr.status, responseText);
          reject(new ApiError(
            `Upload failed: ${responseText || xhr.statusText}`,
            xhr.status
          ));
        }
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('XHR error:', xhr);
        reject(new ApiError('Unable to connect to server. Please check your internet connection.'));
      };
      
      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        reject(new ApiError('Request timed out after 10 seconds'));
      };
      
      xhr.open('POST', finalUrl, true);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Failed to upload text:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out after 10 seconds');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError('Unable to connect to server. Please check your internet connection.');
      }
      // Pass through the original error message for better debugging
      throw new ApiError(error.message);
    }
    
    // Handle unknown error types
    throw new ApiError('Unknown network error');
  }
}

export async function uploadFile(
  uri: string,
  serverUrl: string,
  authToken?: string,
  options: UploadOptions = {}
) {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  const filename = uri.split('/').pop() || 'file';
  
  // For React Native, we need to pass the uri as an object
  const fileData = {
    uri,
    type: 'application/octet-stream',
    name: filename
  };
  
  formData.append(options.oneshot ? 'oneshot' : 'file', fileData as any);

  const headers: Record<string, string> = {
    'Accept': '*/*'
  };

  if (authToken) {
    headers['Authorization'] = authToken;
  }

  if (options.expiry) {
    headers['expire'] = options.expiry;
  }

  // Log request details for debugging
  console.log('Making file upload request to:', serverUrl);
  
  try {
    // Ensure URL is properly formatted
    const url = serverUrl.replace(/^http:\/\//, 'https://');
    const finalUrl = url.startsWith('https://') ? url : `https://${url}`;
        
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 10000; // 10 second timeout
      
      xhr.onload = function() {
        clearTimeout(timeoutId);
        const responseText = xhr.responseText;
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseText);
        } else {
          console.error('Server response:', xhr.status, responseText);
          reject(new ApiError(
            `Upload failed: ${responseText || xhr.statusText}`,
            xhr.status
          ));
        }
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('XHR error:', xhr.statusText);
        reject(new ApiError('Unable to connect to server. Please check your internet connection.'));
      };
      
      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        reject(new ApiError('Request timed out after 10 seconds'));
      };
      
      xhr.open('POST', finalUrl, true);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out after 10 seconds');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError('Unable to connect to server. Please check your internet connection.');
      }
      // Pass through the original error message for better debugging
      throw new ApiError(error.message);
    }
    
    // Handle unknown error types
    throw new ApiError('Unknown network error');
  }
}

export async function shortenUrl(
  url: string,
  serverUrl: string,
  authToken?: string
) {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  formData.append('url', url);

  try {
    // Ensure URL is properly formatted
    const url = serverUrl.replace(/^http:\/\//, 'https://');
    const finalUrl = url.startsWith('https://') ? url : `https://${url}`;
    
    // Log request details for debugging
    console.log('Making URL shortening request to:', finalUrl);
    console.log('URL to shorten:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 10000; // 10 second timeout
      
      xhr.onload = function() {
        clearTimeout(timeoutId);
        const responseText = xhr.responseText;
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseText);
        } else {
          console.error('Server response:', xhr.status, responseText);
          reject(new ApiError(
            `URL shortening failed: ${responseText || xhr.statusText}`,
            xhr.status
          ));
        }
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('XHR error:', xhr.statusText);
        reject(new ApiError('Unable to connect to server. Please check your internet connection.'));
      };
      
      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        reject(new ApiError('Request timed out after 10 seconds'));
      };
      
      xhr.open('POST', finalUrl, true);
      
      // Set headers
      xhr.setRequestHeader('Accept', '*/*');
      if (authToken) {
        xhr.setRequestHeader('Authorization', authToken);
      }
      
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Failed to shorten URL:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out after 10 seconds');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError('Unable to connect to server. Please check your internet connection.');
      }
      // Pass through the original error message for better debugging
      throw new ApiError(error.message);
    }
    
    // Handle unknown error types
    throw new ApiError('Unknown network error');
  }
}

export async function listUploads(
  serverUrl: string,
  authToken?: string
) {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  try {
    // Ensure URL is properly formatted
    const url = serverUrl.replace(/^http:\/\//, 'https://');
    const finalUrl = `${url.startsWith('https://') ? url : `https://${url}`}/list`;
    
    console.log('Making list request to:', finalUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return new Promise<{file_name: string, file_size: number, expires_at_utc: string | null}[]>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 10000; // 10 second timeout
      
      xhr.onload = function() {
        clearTimeout(timeoutId);
        const responseText = xhr.responseText;
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(responseText);
            resolve(data);
          } catch (e) {
            reject(new ApiError('Invalid JSON response from server'));
          }
        } else {
          console.error('Server response:', xhr.status, responseText);
          if (xhr.status === 404) {
            reject(new ApiError('Make sure expose_list is set to true in your server config'));
          }
          reject(new ApiError(
            `List request failed: ${responseText || xhr.statusText}`,
            xhr.status
          ));
        }
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('XHR error:', xhr.statusText);
        reject(new ApiError('Unable to connect to server. Please check your internet connection.'));
      };
      
      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        reject(new ApiError('Request timed out after 10 seconds'));
      };
      
      xhr.open('GET', finalUrl, true);
      
      // Set headers
      xhr.setRequestHeader('Accept', '*/*');
      if (authToken) {
        xhr.setRequestHeader('Authorization', authToken);
      }
      
      xhr.send();
    });
  } catch (error) {
    console.error('Failed to list uploads:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out after 10 seconds');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError('Unable to connect to server. Please check your internet connection.');
      }
      // Pass through the original error message for better debugging
      throw new ApiError(error.message);
    }
    
    // Handle unknown error types
    throw new ApiError('Unknown network error');
  }
}

export async function deleteFile(
  fileName: string,
  serverUrl: string,
  deleteToken: string
) {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  try {
    // Ensure URL is properly formatted
    const url = serverUrl.replace(/^http:\/\//, 'https://');
    const finalUrl = `${url.startsWith('https://') ? url : `https://${url}`}/${fileName}`;
    
    console.log('Making delete request to:', finalUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 10000; // 10 second timeout
      
      xhr.onload = function() {
        clearTimeout(timeoutId);
        const responseText = xhr.responseText;
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          console.error('Server response:', xhr.status, responseText);
          if (xhr.status === 404) {
            reject(new ApiError('Make sure delete_token is set in your server config'));
          }
          reject(new ApiError(
            `Delete failed: ${responseText || xhr.statusText}`,
            xhr.status
          ));
        }
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('XHR error:', xhr.statusText);
        reject(new ApiError('Unable to connect to server. Please check your internet connection.'));
      };
      
      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        reject(new ApiError('Request timed out after 10 seconds'));
      };
      
      xhr.open('DELETE', finalUrl, true);
      
      // Set headers
      xhr.setRequestHeader('Accept', '*/*');
      xhr.setRequestHeader('Authorization', deleteToken);
      
      
      xhr.send();
    });
  } catch (error) {
    console.error('Failed to delete file:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out after 10 seconds');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError('Unable to connect to server. Please check your internet connection.');
      }
      // Pass through the original error message for better debugging
      throw new ApiError(error.message);
    }
    
    // Handle unknown error types
    throw new ApiError('Unknown network error');
  }
}

export async function uploadFromRemoteUrl(
  remoteUrl: string,
  serverUrl: string,
  authToken?: string,
  options: UploadOptions = {}
) {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  formData.append('remote', remoteUrl);

  const headers: Record<string, string> = {
    'Accept': '*/*'
  };

  if (authToken) {
    headers['Authorization'] = authToken;
  }

  if (options.expiry) {
    headers['expire'] = options.expiry;
  }

  try {
    // Ensure URL is properly formatted
    const url = serverUrl.replace(/^http:\/\//, 'https://');
    const finalUrl = url.startsWith('https://') ? url : `https://${url}`;
    
    // Log request details for debugging
    console.log('Making remote upload request to:', finalUrl);
    console.log('Remote URL to fetch:', remoteUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 10000; // 10 second timeout
      
      xhr.onload = function() {
        clearTimeout(timeoutId);
        const responseText = xhr.responseText;
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseText);
        } else {
          console.error('Server response:', xhr.status, responseText);
          reject(new ApiError(
            `Remote upload failed: ${responseText || xhr.statusText}`,
            xhr.status
          ));
        }
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('XHR error:', xhr.statusText);
        reject(new ApiError('Unable to connect to server. Please check your internet connection.'));
      };
      
      xhr.ontimeout = function() {
        clearTimeout(timeoutId);
        reject(new ApiError('Request timed out after 10 seconds'));
      };
      
      xhr.open('POST', finalUrl, true);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Failed to upload from remote URL:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle fetch errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out after 10 seconds');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError('Unable to connect to server. Please check your internet connection.');
      }
      // Pass through the original error message for better debugging
      throw new ApiError(error.message);
    }
    
    // Handle unknown error types
    throw new ApiError('Unknown network error');
  }
}
