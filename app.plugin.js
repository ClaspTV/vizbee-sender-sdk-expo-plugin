const { createRunOncePlugin } = require("@expo/config-plugins");

// iOS Plugins
const withPluginAddPodSource = require("./src/ios_plugins/add-pod-source");
const withPluginAddEntitlements = require("./src/ios_plugins/add-entitlements");
const withPluginAddFontsIos = require("./src/ios_plugins/add-fonts");
const withPluginModifyInfoPlist = require("./src/ios_plugins/modify-info-plist");
const withPluginAddIosStyleFiles = require("./src/ios_plugins/add-vizbee-styles-file");
const withPluginUpdateStyleOnThemeChange = require("./src/ios_plugins/update-style-on-theme-change");
const withPluginInitializeVizbeeIos = require("./src/ios_plugins/initialize-vizbee");

// Android Plugins
const withPluginAddMavenUrl = require("./src/android_plugins/add-maven-url");
const withPluginAddFontsAndroid = require("./src/android_plugins/add-fonts");
const withPluginAddRemoteActivity = require("./src/android_plugins/add-remote-activity");
const withPluginAddClearTextTraffic = require("./src/android_plugins/add-clear-text-traffic");
const withPluginAddCastOptionsProvider = require("./src/android_plugins/add-cast-options-provider");
const withPluginAddAndroidStyleFiles = require("./src/android_plugins/add-vizbee-styles-xml");
const withPluginCopyColorAndStyleFiles = require("./src/android_plugins/copy-color-and-style-xml");
const withPluginInitializeVizbeeAndroid = require("./src/android_plugins/initialize-vizbee");

function withVizbeeIosPlugins(config, options) {
  if (!options.ios) {
    options.ios = {};
  }
  // Apply each plugin
  config = withPluginAddPodSource(config);
  config = withPluginAddEntitlements(config);
  config = withPluginAddFontsIos(config, {
    fontFolder: options.fontFolder,
    target: options.ios.target,
  });
  config = withPluginModifyInfoPlist(config, {
    description: options.ios.description,
    receiverAppId: options.chromecastAppId,
  });
  config = withPluginAddIosStyleFiles(config, {
    target: options.ios.target,
  });
  config = withPluginUpdateStyleOnThemeChange(config, {
    hasLayoutConfig: options.ios.hasLayoutConfig,
    language: options.ios.language,
  });
  config = withPluginInitializeVizbeeIos(config, {
    theme: options.ios.theme,
    vizbeeAppId: options.vizbeeAppId,
    layoutConfigFilePath: options.ios.layoutConfigFilePath,
    language: options.ios.language,
  });

  return config;
}

function withVizbeeAndroidPlugins(config, options) {
  if (!options.android) {
    options.android = {};
  }
  // Apply each plugin
  config = withPluginAddMavenUrl(config);
  config = withPluginAddFontsAndroid(config, {
    fontFolder: options.fontFolder,
  });
  config = withPluginAddRemoteActivity(config, {
    vizbeeAppId: options.vizbeeAppId,
  });
  config = withPluginAddClearTextTraffic(config);
  config = withPluginAddCastOptionsProvider(config, {
    chromecastAppId: options.chromecastAppId,
    packageName: options.android.packageName,
    language: options.android.language,
  });
  config = withPluginAddAndroidStyleFiles(config);
  config = withPluginCopyColorAndStyleFiles(config);
  config = withPluginInitializeVizbeeAndroid(config, {
    vizbeeAppId: options.vizbeeAppId,
    layoutConfigFilePath: options.android.layoutConfigFilePath,
  });
  return config;
}

function withVizbee(config, options) {
  config = withVizbeeIosPlugins(config, options);
  config = withVizbeeAndroidPlugins(config, options);
  return config;
}

module.exports = createRunOncePlugin(withVizbee, "withVizbee", "1.0.0");
