# Vizbee Expo Sender SDK Plugin

The Vizbee Expo plugin allows you to integrate the react-native-vizbee-sender-sdk seamlessly into your Expo managed workflow. This plugin facilitates the use of Vizbee's sender SDK for discovering Cast-enabled devices on your WiFi network.

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

| Option               | Description                                                                                     | Default Value                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| vizbeeAppId          | (Mandatory) The Vizbee application ID used for initialization. Can be found in Vizbee console.  | N/A                                                                                           |
| chromecastAppId      | (Mandatory) The Chromecast application ID for your application. Can be found in Vizbee console. | N/A                                                                                           |
| layoutConfigFilePath | (Optional) Path to the layout configuration file. In most cases not needed                      | undefined                                                                                     |
| fontFolder           | (Optional) Path to the folder containing font files used by Vizbee.                             | ${projectRoot}/assets/fonts                                                                   |
| ios.description      | (Optional) Description for iOS Local Area Network permission to be added to info.plist file.    | ${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network. |

## Additional Information

- **Issues**: [Report issues](https://github.com/ClaspTV/vizbee-expo-sender-sdk-plugin/issues)
- **License**: MIT
