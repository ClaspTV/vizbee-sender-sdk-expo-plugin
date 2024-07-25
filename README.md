# Vizbee Expo Sender SDK Plugin

The Vizbee Expo plugin allows you to integrate the `react-native-vizbee-sender-sdk` seamlessly into your Expo managed workflow.

## Installation

### Expo

```bash
npx expo install vizbee-expo-sender-sdk-plugin
```

### NPM

```bash
npm install vizbee-expo-sender-sdk-plugin
```

### Yarn

```bash
yarn add vizbee-expo-sender-sdk-plugin
```

### Expo

For Expo managed projects, add the following to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      "vizbee-expo-sender-sdk-plugin",
      {
        "fontFolder": "./assets/fonts",
        "vizbeeAppId": "your-vizbee-app-id",
        "chromecastAppId": "your-chromecast-app-id",
        "layoutConfigFilePath": "./path/to/layoutConfig.json",
        "ios": {
          "lnaPermissionText": "Custom description for iOS Local Area Network permission.",
          "googleCastVersion": "Version of the `google-cast-sdk-no-bluetooth-dynamic` to be added",
          "addGoogleCastToPods": "Boolean to determine should `google-cast-sdk-no-bluetooth-dynamic` be added to podfile"
        },
        "android": {
          "nativeSdkVersion": "Native Vizbee SDK version to be added"
        }
      }
    ]
  }

```

## Configuration

### Plugin Options

The plugin supports the following configuration options:

| Option                   | Description                                                                         | Default Value                                                                                 | Mandatory/Optional |
| ------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------ |
| vizbeeAppId              | The Vizbee application ID used for initialization. Can be found in Vizbee console.  | N/A                                                                                           | Mandatory          |
| chromecastAppId          | The Chromecast application ID for your application. Can be found in Vizbee console. | N/A                                                                                           | Mandatory          |
| layoutConfigFilePath     | Path to the layout configuration file. In most cases not needed.                    | undefined                                                                                     | Optional           |
| fontFolder               | Path to the folder containing font files used by Vizbee.                            | ${projectRoot}/assets/fonts                                                                   | Optional           |
| ios.lnaPermissionText    | Description for iOS Local Area Network permission to be added to info.plist file.   | ${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network. | Optional           |
| ios.googleCastVersion    | Version of Google Cast SDK to be added to the iOS project.                          | 4.8.0                                                                                         | Optional           |
| ios.addGoogleCastToPods  | Boolean value to indicate the adding of Google Cast SDK to iOS project.             | true                                                                                          | Optional           |
| android.nativeSdkVersion | Native SDK version to be used for the Android project.                              | 6.5.5                                                                                         | Optional           |

## Resource Files

To support light and dark themes, and ensure proper styling, the following folder structure and files need to be added to your project. Some files are mandatory, while others are optional.

### Folder Structure

```scss
PROJECT_ROOT/
├── vizbee_resources/
      │   ├── android/
      │   │   ├── values/
      │   │   │   ├── vizbee.xml         (Mandatory)
      │   │   │   ├── colors.xml         (Optional)
      │   │   │   ├── styles.xml         (Optional)
      │   │   ├── values-night/
      │   │   │   ├── vizbee.xml         (Optional)
      │   │   │   ├── colors.xml         (Optional)
      │   │   │   ├── styles.xml         (Optional)
      │	  ├── ios/
      │   │   ├── VizbeeStyles.swift     (Mandatory)
```

### Notes:

- **Mandatory**: The `VizbeeStyles.swift` file must be added to the specified path for iOS.
- **Mandatory**: The `vizbee.xml` file in the `values` folder is required for Android.
- **Optional**: The files in the `values-night` and `values` folders (`colors.xml`, `styles.xml`, and `vizbee.xml` in `values-night`) are optional. They are used for light and dark theme support and will be added to the project by the plugin if present. If they are not present, they will not be added.

**Ensure the files are added to the correct paths mentioned above.**

## Additional Information

- **Compatibility**: This plugin is supported with Expo 50 and above.
- **Issues**: [Report issues](https://github.com/ClaspTV/vizbee-expo-sender-sdk-plugin/issues)

# Vizbee Expo Sender SDK Plugin

The Vizbee Expo plugin allows you to integrate the `react-native-vizbee-sender-sdk` seamlessly into your Expo managed workflow.

## Installation

### Expo

```bash
npx expo install vizbee-expo-sender-sdk-plugin
```

### NPM

```bash
npm install vizbee-expo-sender-sdk-plugin
```

### Yarn

```bash
yarn add vizbee-expo-sender-sdk-plugin
```

### Expo

For Expo managed projects, add the following to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      "vizbee-expo-sender-sdk-plugin",
      {
        "fontFolder": "./assets/fonts",
        "vizbeeAppId": "your-vizbee-app-id",
        "chromecastAppId": "your-chromecast-app-id",
        "layoutConfigFilePath": "./path/to/layoutConfig.json",
        "ios": {
          "lnaPermissionText": "Custom description for iOS Local Area Network permission.",
          "googleCastVersion": "Version of the `google-cast-sdk-no-bluetooth-dynamic` to be added",
          "addGoogleCastToPods": "Boolean to determine should `google-cast-sdk-no-bluetooth-dynamic` be added to podfile"
        },
        "android": {
          "nativeSdkVersion": "Native Vizbee SDK version to be added",
          "enableLockScreenControl": "This will help enable lock screen control on android mobile",
          "enableLaunchOptions": "This will help enable launch options if enableLockScreenControl is true this should be true as well",
          "lockScreenControls": {
            "buttonActions": "Actions to be shown on lock screen",
            "skipInMs": "seek time in milliseconds for rewind and forward"
          }
        }
      }
    ]
  }
}
```

## Configuration

### Plugin Options

The plugin supports the following configuration options:

| Option                                   | Description                                                                                          | Default Value                                                                                 | Mandatory/Optional |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------ |
| vizbeeAppId                              | The Vizbee application ID used for initialization. Can be found in Vizbee console.                   | N/A                                                                                           | Mandatory          |
| chromecastAppId                          | The Chromecast application ID for your application. Can be found in Vizbee console.                  | N/A                                                                                           | Mandatory          |
| layoutConfigFilePath                     | Path to the layout configuration file. In most cases not needed.                                     | undefined                                                                                     | Optional           |
| fontFolder                               | Path to the folder containing font files used by Vizbee.                                             | ${projectRoot}/assets/fonts                                                                   | Optional           |
| ios.lnaPermissionText                    | Description for iOS Local Area Network permission to be added to info.plist file.                    | ${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network. | Optional           |
| ios.googleCastVersion                    | Version of Google Cast SDK to be added to the iOS project.                                           | 4.8.0                                                                                         | Optional           |
| ios.addGoogleCastToPods                  | Boolean value to indicate the adding of Google Cast SDK to iOS project.                              | true                                                                                          | Optional           |
| android.nativeSdkVersion                 | Native SDK version to be used for the Android project.                                               | 6.5.5                                                                                         | Optional           |
| android.enableLockScreenControl          | Boolean value to enable lock screen controls.                                                        | true                                                                                          | Optional           |
| android.enableLaunchOptions              | Boolean value to enable launch options.                                                              | true                                                                                          | Optional           |
| android.lockScreenControls.buttonActions | Array of lock screen button actions. Available options: ["togglePlay", "stop", "forward", "rewind"]. | ["togglePlay", "stop"]                                                                        | Optional           |
| android.lockScreenControls.skipInMs      | Amount of time to seek (in milliseconds) for rewind ans forward for lock screen controls             | 30000                                                                                         | Optional           |

## Resource Files

To support light and dark themes, and ensure proper styling, the following folder structure and files need to be added to your project. Some files are mandatory, while others are optional.

### Folder Structure

```scss
PROJECT_ROOT/
├── vizbee_resources/
      │   ├── android/
      │   │   ├── values/
      │   │   │   ├── vizbee.xml         (Mandatory)
      │   │   │   ├── colors.xml         (Optional)
      │   │   │   ├── styles.xml         (Optional)
      │   │   ├── values-night/
      │   │   │   ├── vizbee.xml         (Optional)
      │   │   │   ├── colors.xml         (Optional)
      │   │   │   ├── styles.xml         (Optional)
      │   ├── ios/
      │   │   ├── VizbeeStyles.swift     (Mandatory)

```

### Notes:

- **Mandatory**: The `VizbeeStyles.swift` file must be added to the specified path for iOS.
- **Mandatory**: The `vizbee.xml` file in the `values` folder is required for Android.
- **Optional**: The files in the `values-night` and `values` folders (`colors.xml`, `styles.xml`, and `vizbee.xml` in `values-night`) are optional. They are used for light and dark theme support and will be added to the project by the plugin if present. If they are not present, they will not be added.

**Ensure the files are added to the correct paths mentioned above.**

## Additional Information

- **Compatibility**: This plugin is supported with Expo 50 and above.
- **Issues**: [Report issues](https://github.com/ClaspTV/vizbee-expo-sender-sdk-plugin/issues)
