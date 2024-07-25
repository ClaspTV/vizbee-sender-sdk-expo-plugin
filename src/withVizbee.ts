import { ConfigPlugin, createRunOncePlugin } from "@expo/config-plugins";
import {
  LOCK_SCREEN_ACTION_BUTTON,
  VizbeePluginAndroidOptions,
  VizbeePluginOptions,
} from "./types";

// iOS Plugins
import withPluginAddPodSource from "./ios_plugins/add-pod-source";
import withPluginAddEntitlements from "./ios_plugins/add-entitlements";
import withPluginAddFontsIos from "./ios_plugins/add-fonts";
import withPluginModifyInfoPlist from "./ios_plugins/modify-info-plist";
import withPluginAddIosStyleFiles from "./ios_plugins/add-vizbee-styles-file";
import withPluginUpdateStyleOnThemeChange from "./ios_plugins/update-style-on-theme-change";
import withPluginInitializeVizbeeIos from "./ios_plugins/initialize-vizbee";
import withPluginAddGoogleCast from "./ios_plugins/add-google-cast-podfile";

// Android Plugins
import withPluginAddMavenUrl from "./android_plugins/add-maven-url";
import withPluginAddFontsAndroid from "./android_plugins/add-fonts";
import withPluginAddRemoteActivity from "./android_plugins/add-remote-activity";
import withPluginAddClearTextTraffic from "./android_plugins/add-clear-text-traffic";
import withPluginAddCastOptionsProvider from "./android_plugins/add-cast-options-provider";
import withPluginAddAndroidStyleFiles from "./android_plugins/add-vizbee-styles-xml";
import withPluginCopyColorAndStyleFiles from "./android_plugins/copy-color-and-style-xml";
import withPluginInitializeVizbeeAndroid from "./android_plugins/initialize-vizbee";

/**
 * Retrieves lock screen controls if they are present in the configuration.
 * @param android - Android-specific Vizbee plugin options
 * @returns An object containing lockScreenButtonActions and skipInMs if applicable
 */
const getLockScreenControlsIfPresent = (
  android: VizbeePluginAndroidOptions
) => {
  let lockScreenButtonActions: LOCK_SCREEN_ACTION_BUTTON[] | undefined =
    undefined;
  let skipInMs: number | undefined = undefined;

  if (android.enableLockScreenControl) {
    if (!android.lockScreenControls) {
      return { lockScreenButtonActions, skipInMs };
    }

    if (android.lockScreenControls["skipInMs"]) {
      skipInMs = android.lockScreenControls.skipInMs || 0;
    }

    if (!android.lockScreenControls.buttonActions) {
      return { lockScreenButtonActions, skipInMs };
    }
    if (android.lockScreenControls.buttonActions.length === 0) {
      return { lockScreenButtonActions, skipInMs };
    }

    lockScreenButtonActions = [];

    if (android.lockScreenControls.buttonActions.indexOf("forward") > -1) {
      lockScreenButtonActions.push(LOCK_SCREEN_ACTION_BUTTON.ACTION_FORWARD);
    }
    if (android.lockScreenControls.buttonActions.indexOf("rewind") > -1) {
      lockScreenButtonActions.push(LOCK_SCREEN_ACTION_BUTTON.ACTION_REWIND);
    }
    if (android.lockScreenControls.buttonActions.indexOf("togglePlay") > -1) {
      lockScreenButtonActions.push(
        LOCK_SCREEN_ACTION_BUTTON.ACTION_TOGGLE_PLAYBACK
      );
    }
    if (android.lockScreenControls.buttonActions.indexOf("stop") > -1) {
      lockScreenButtonActions.push(
        LOCK_SCREEN_ACTION_BUTTON.ACTION_STOP_CASTING
      );
    }
  }

  return { lockScreenButtonActions, skipInMs };
};

/**
 * Apply iOS-specific Vizbee plugins to the Expo config.
 * @param config - The Expo config object
 * @param props - Plugin options including iOS-specific configurations
 * @returns Modified Expo config object with iOS-specific plugins applied
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
    hasLayoutConfig: !!props.layoutConfigFilePath,
    language: props.ios.language,
  });
  config = withPluginInitializeVizbeeIos(config, {
    vizbeeAppId: props.vizbeeAppId,
    layoutConfigFilePath: props.layoutConfigFilePath,
    language: props.ios.language,
  });
  if (props.ios.addGoogleCastToPods ?? true) {
    config = withPluginAddGoogleCast(config, {
      googleCastVersion: props.ios.googleCastVersion,
    });
  }

  return config;
};

/**
 * Apply Android-specific Vizbee plugins to the Expo config.
 * @param config - The Expo config object
 * @param props - Plugin options including Android-specific configurations
 * @returns Modified Expo config object with Android-specific plugins applied
 */
const withVizbeeAndroidPlugins: ConfigPlugin<VizbeePluginOptions> = (
  config,
  props
) => {
  if (!props.android) {
    props.android = {};
  }

  const { lockScreenButtonActions, skipInMs } = getLockScreenControlsIfPresent(
    props.android
  );

  config = withPluginAddMavenUrl(config);
  config = withPluginAddFontsAndroid(config, {
    fontFolder: props.fontFolder,
  });
  config = withPluginAddRemoteActivity(config, {
    vizbeeAppId: props.vizbeeAppId,
    enableLockScreenControl: props.android.enableLockScreenControl,
  });
  config = withPluginAddClearTextTraffic(config);
  config = withPluginAddCastOptionsProvider(config, {
    chromecastAppId: props.chromecastAppId,
    language: props.android.language,
    nativeSdkVersion: props.android.nativeSdkVersion,
    enableLaunchOptions: props.android.enableLaunchOptions,
    enableLockScreenControl: props.android.enableLockScreenControl,
    lockScreenControls: {
      skipInMs: skipInMs,
      buttonActions: lockScreenButtonActions,
    },
  });
  config = withPluginAddAndroidStyleFiles(config);
  config = withPluginCopyColorAndStyleFiles(config);
  config = withPluginInitializeVizbeeAndroid(config, {
    vizbeeAppId: props.vizbeeAppId,
    layoutConfigFilePath: props.layoutConfigFilePath,
    language: props.android.language,
    enableLockScreenControl: props.android.enableLockScreenControl,
  });

  return config;
};

/**
 * Apply Vizbee plugins to both iOS and Android platforms.
 * @param config - The Expo config object
 * @param props - Plugin options including platform-specific configurations
 * @returns Modified Expo config object with both iOS and Android plugins applied
 */
const withVizbee: ConfigPlugin<VizbeePluginOptions> = (config, props) => {
  config = withVizbeeIosPlugins(config, props);
  config = withVizbeeAndroidPlugins(config, props);
  return config;
};

// Export a run-once plugin configuration for Vizbee
export default createRunOncePlugin(withVizbee, "withVizbee", "1.0.0");
