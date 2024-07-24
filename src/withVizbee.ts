import { ConfigPlugin, createRunOncePlugin } from "@expo/config-plugins";
import { VizbeePluginOptions } from "./types";
import { log } from "./helper";

// iOS Plugins
import withPluginAddPodSource from "./ios_plugins/add-pod-source";
import withPluginAddEntitlements from "./ios_plugins/add-entitlements";
import withPluginAddFontsIos from "./ios_plugins/add-fonts";
import withPluginModifyInfoPlist from "./ios_plugins/modify-info-plist";
import withPluginAddIosStyleFiles from "./ios_plugins/add-vizbee-styles-file";
import withPluginUpdateStyleOnThemeChange from "./ios_plugins/update-style-on-theme-change";
import withPluginInitializeVizbeeIos from "./ios_plugins/initialize-vizbee";

// // Android Plugins
import withPluginAddMavenUrl from "./android_plugins/add-maven-url";
import withPluginAddFontsAndroid from "./android_plugins/add-fonts";
import withPluginAddRemoteActivity from "./android_plugins/add-remote-activity";
import withPluginAddClearTextTraffic from "./android_plugins/add-clear-text-traffic";
import withPluginAddCastOptionsProvider from "./android_plugins/add-cast-options-provider";
import withPluginAddAndroidStyleFiles from "./android_plugins/add-vizbee-styles-xml";
import withPluginCopyColorAndStyleFiles from "./android_plugins/copy-color-and-style-xml";
import withPluginInitializeVizbeeAndroid from "./android_plugins/initialize-vizbee";

/**
 * Apply iOS-specific Vizbee plugins
 * @param config - The Expo config
 * @param props - Plugin options
 * @returns Modified config
 */
const withVizbeeIosPlugins: ConfigPlugin<VizbeePluginOptions> = (
  config,
  props
) => {
  if (!props.ios) {
    props.ios = {};
  }

  config = withPluginAddPodSource(config);
  config = withPluginAddEntitlements(config);
  config = withPluginAddFontsIos(config, {
    fontFolder: props.fontFolder,
    target: props.ios.target,
  });
  config = withPluginModifyInfoPlist(config, {
    description: props.ios.lnaPermissionText,
    receiverAppId: props.chromecastAppId,
  });
  config = withPluginAddIosStyleFiles(config, {
    target: props.ios.target,
  });
  config = withPluginUpdateStyleOnThemeChange(config, {
    hasLayoutConfig: props.layoutConfigFilePath ? true : false,
    language: props.ios.language,
  });
  config = withPluginInitializeVizbeeIos(config, {
    vizbeeAppId: props.vizbeeAppId,
    layoutConfigFilePath: props.layoutConfigFilePath,
    language: props.ios.language,
  });

  return config;
};

/**
 * Apply Android-specific Vizbee plugins
 * @param config - The Expo config
 * @param props - Plugin options
 * @returns Modified config
 */
const withVizbeeAndroidPlugins: ConfigPlugin<VizbeePluginOptions> = (
  config,
  props
) => {
  if (!props.android) {
    props.android = {};
  }

  config = withPluginAddMavenUrl(config);
  config = withPluginAddFontsAndroid(config, {
    fontFolder: props.fontFolder,
  });
  config = withPluginAddRemoteActivity(config, {
    vizbeeAppId: props.vizbeeAppId,
  });
  config = withPluginAddClearTextTraffic(config);
  config = withPluginAddCastOptionsProvider(config, {
    chromecastAppId: props.chromecastAppId,
    language: props.android.language,
  });
  config = withPluginAddAndroidStyleFiles(config);
  config = withPluginCopyColorAndStyleFiles(config);
  config = withPluginInitializeVizbeeAndroid(config, {
    vizbeeAppId: props.vizbeeAppId,
    layoutConfigFilePath: props.layoutConfigFilePath,
    language: props.android.language,
  });

  return config;
};

/**
 * Apply Vizbee plugins to both iOS and Android
 * @param config - The Expo config
 * @param props - Plugin options
 * @returns Modified config
 */
const withVizbee: ConfigPlugin<VizbeePluginOptions> = (config, props) => {
  config = withVizbeeIosPlugins(config, props);
  config = withVizbeeAndroidPlugins(config, props);
  return config;
};

export default createRunOncePlugin(withVizbee, "withVizbee", "1.0.0");
