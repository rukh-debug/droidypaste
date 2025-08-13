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

const formatUrl = (serverUrl: string) => {
  const url = serverUrl.replace(/^http:\/\//, 'https://');
  return url.startsWith('https://') ? url : `https://${url}`;
};

const handleApiError = (error: any): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new ApiError('Request timed out after 10 seconds');
    }
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message === 'Network request failed')) {
      return new ApiError('Unable to connect to server. Please check your internet connection.');
    }
    return new ApiError(error.message);
  }

  return new ApiError('Unknown network error');
};

export async function uploadText(
  text: string,
  serverUrl: string,
  authToken?: string,
  options: UploadOptions = {}
): Promise<string> {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  const textData = {
    uri: 'text.txt',
    type: 'text/plain',
    name: 'text.txt',
    string: text
  };
  formData.append(options.oneshot ? 'oneshot' : 'file', textData as any);

  const headers: Record<string, string> = {
    'Accept': '*/*',
    "Accept-Encoding": "identity"
  };
  if (authToken) headers['Authorization'] = authToken;
  if (options.expiry) headers['expire'] = options.expiry;

  console.log('Making request to:', serverUrl);

  try {
    const finalUrl = formatUrl(serverUrl);
    console.log('Final URL:', finalUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    if (response.ok) {
      return responseText;
    } else {
      console.error('Server response:', response.status, responseText);
      throw new ApiError(`Upload failed: ${responseText || response.statusText}`, response.status);
    }
  } catch (error) {
    console.error('Failed to upload text:', error);
    throw handleApiError(error);
  }
}

export async function uploadFile(
  uri: string,
  serverUrl: string,
  authToken?: string,
  options: UploadOptions = {}
): Promise<string> {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  const filename = uri.split('/').pop() || 'file';
  const fileData = { uri, type: 'application/octet-stream', name: filename };
  formData.append(options.oneshot ? 'oneshot' : 'file', fileData as any);

  const headers: Record<string, string> = { 'Accept': '*/*' };
  if (authToken) headers['Authorization'] = authToken;
  if (options.expiry) headers['expire'] = options.expiry;

  console.log('Making file upload request to:', serverUrl);

  try {
    const finalUrl = formatUrl(serverUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    if (response.ok) {
      return responseText;
    } else {
      console.error('Server response:', response.status, responseText);
      throw new ApiError(`Upload failed: ${responseText || response.statusText}`, response.status);
    }
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw handleApiError(error);
  }
}

export async function shortenUrl(
  urlToShorten: string,
  serverUrl: string,
  authToken?: string
): Promise<string> {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  formData.append('url', urlToShorten);

  const headers: Record<string, string> = { 'Accept': '*/*' };
  if (authToken) headers['Authorization'] = authToken;

  console.log('Making URL shortening request to:', serverUrl);
  console.log('URL to shorten:', urlToShorten);

  try {
    const finalUrl = formatUrl(serverUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    if (response.ok) {
      return responseText;
    } else {
      console.error('Server response:', response.status, responseText);
      throw new ApiError(`URL shortening failed: ${responseText || response.statusText}`, response.status);
    }
  } catch (error) {
    console.error('Failed to shorten URL:', error);
    throw handleApiError(error);
  }
}

export async function listUploads(
  serverUrl: string,
  authToken?: string
): Promise<{ file_name: string; file_size: number; expires_at_utc: string | null }[]> {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const headers: Record<string, string> = { 'Accept': '*/*' };
  if (authToken) headers['Authorization'] = authToken;

  console.log('Making list request to:', serverUrl);

  try {
    const finalUrl = `${formatUrl(serverUrl)}/list`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const responseText = await response.text();
      try {
        return JSON.parse(responseText);
      } catch (e) {
        throw new ApiError('Invalid JSON response from server');
      }
    } else {
      if (response.status === 404) {
        throw new ApiError('Make sure expose_list is set to true in your server config', 404);
      }
      const responseText = await response.text();
      console.error('Server response:', response.status, responseText);
      throw new ApiError(`List request failed: ${responseText || response.statusText}`, response.status);
    }
  } catch (error) {
    console.error('Failed to list uploads:', error);
    throw handleApiError(error);
  }
}

export async function deleteFile(
  fileName: string,
  serverUrl: string,
  deleteToken: string
): Promise<void> {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const headers: Record<string, string> = {
    'Accept': '*/*',
    'Authorization': deleteToken,
  };

  console.log('Making delete request to:', `${serverUrl}/${fileName}`);

  try {
    const finalUrl = `${formatUrl(serverUrl)}/${fileName}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(finalUrl, {
      method: 'DELETE',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError('Make sure delete_token is set in your server config', 404);
      }
      const responseText = await response.text();
      console.error('Server response:', response.status, responseText);
      throw new ApiError(`Delete failed: ${responseText || response.statusText}`, response.status);
    }
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw handleApiError(error);
  }
}

export async function uploadFromRemoteUrl(
  remoteUrl: string,
  serverUrl: string,
  authToken?: string,
  options: UploadOptions = {}
): Promise<string> {
  if (!serverUrl) {
    throw new ApiError('Server URL must be configured');
  }

  const formData = new FormData();
  formData.append(options.oneshot ? 'oneshot_url' : 'remote', remoteUrl);

  const headers: Record<string, string> = { 'Accept': '*/*' };
  if (authToken) headers['Authorization'] = authToken;
  if (options.expiry) headers['expire'] = options.expiry;

  console.log('Making remote upload request to:', serverUrl, headers, formData);
  console.log('Remote URL to fetch:', remoteUrl);

  try {
    const finalUrl = formatUrl(serverUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    if (response.ok) {
      return responseText;
    } else {
      console.error('Server response:', response.status, responseText);
      throw new ApiError(`Remote upload failed: ${responseText || response.statusText}`, response.status);
    }
  } catch (error) {
    console.error('Failed to upload from remote URL:', error);
    throw handleApiError(error);
  }
}
