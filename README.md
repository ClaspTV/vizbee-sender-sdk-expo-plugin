# Vizbee Expo Sender SDK Plugin

The Vizbee Expo plugin allows you to integrate the `react-native-vizbee-sender-sdk` seamlessly into your Expo managed workflow.

## Installation

### expo

```bash
npx expo install vizbee-expo-sender-sdk-plugin
```

### npm

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
          "description": "Custom description for iOS."
        }
      }
    ]
  }
}
```

## Configuration

### Plugin Options

The plugin supports the following configuration options:

| Option                | Description                                                                         | Default Value                                                                                 | Mandatory/Optional |
| --------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------ |
| vizbeeAppId           | The Vizbee application ID used for initialization. Can be found in Vizbee console.  | N/A                                                                                           | Mandatory          |
| chromecastAppId       | The Chromecast application ID for your application. Can be found in Vizbee console. | N/A                                                                                           | Mandatory          |
| layoutConfigFilePath  | Path to the layout configuration file. In most cases not needed.                    | undefined                                                                                     | Optional           |
| fontFolder            | Path to the folder containing font files used by Vizbee.                            | ${projectRoot}/assets/fonts                                                                   | Optional           |
| ios.lnaPermissionText | Description for iOS Local Area Network permission to be added to info.plist file.   | ${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network. | Optional           |

## Resource Files

To support light and dark themes, and ensure proper styling, the following folder structure and files need to be added to your project. Some files are mandatory, while others are optional.

### Folder Structure

```scss
PROJECT_ROOT├── vizbee_resources/
            │   ├── android/
			│   │   ├── values/
			│   │   │   ├── vizbee.xml         (Mandatory)
			│   │   │   ├── colors.xml         (Optional)
			│   │   │   ├── styles.xml         (Optional)
            │   │   ├── values-night/
            │   │   │   ├── vizbee.xml         (Optional)
            │   │   │   ├── colors.xml         (Optional)
            │   │   │   ├── styles.xml         (Optional)                  
			│	├── ios/
			│   │   ├── VizbeeStyles.swift     (Mandatory)
```

### Notes:

- **Mandatory**: The `VizbeeStyles.swift` file must be added to the specified path for iOS.
- **Mandatory**: The `vizbee.xml` file in the `values` folder is required.
- **Optional**: The files in the `values-night` and `values` folders (`colors.xml`, `styles.xml`, and `vizbee.xml` in `values-night`) are optional. They are used for light and dark theme support and will be added to the project by the plugin if present. If they are not present, they will not be added.

Ensure the files are added to the correct paths mentioned above.

## Additional Information

- **Issues**: [Report issues](https://github.com/ClaspTV/vizbee-expo-sender-sdk-plugin/issues)
- **License**: MIT
