# DroidyPaste

![alt text](/src/assets/images/icon.png)

A modern Android application for text sharing, file sharing and URL shortening service based on [rustypaste](https://github.com/orhun/rustypaste). Built with React Native and Expo.

## Features

- Server URL and auth token configuration
- Text sharing and uploads
- File uploads with optional expiry
- URL shortening
- Remote file uploads
- One-shot file and URL functionality
- Upload result notifications
- Automatic clipboard copying
- Secure credential storage
- Material Design UI
- Light and dark theme support

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Follow the Expo CLI instructions to run on your desired platform

## Configuration

1. Open the app settings
2. Enter your RustyPaste server URL
3. Enter your authentication token
4. Save the settings

## Usage

### Text Upload
1. Enter text in the text area
2. Choose between regular upload or one-shot
3. Tap the upload button
4. The result URL will be copied to clipboard and shown in a notification

### File Upload
1. Tap "Upload File" or "Upload Image"
2. Select a file from your device
3. Optionally set an expiry time
4. The file will be uploaded and the URL copied to clipboard

### URL Operations
1. Enter a URL in the input field
2. Choose between:
   - Shorten URL: Creates a short link
   - Upload Remote: Downloads and hosts the remote file


### Building for Production

1. Configure app.json with your production settings
2. Build for Android:
```bash
eas build --platform android
```

3. Build for iOS:
```bash
eas build --platform ios
```

## Security

- Credentials are stored securely using expo-secure-store
- Network requests are made over HTTPS
- File access permissions are requested only when needed
- Sensitive data is not logged or stored in plain text

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
