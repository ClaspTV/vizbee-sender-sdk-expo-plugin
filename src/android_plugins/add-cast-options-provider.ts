import {
  ConfigPlugin,
  withAndroidManifest,
  withMainApplication,
  withAppBuildGradle,
} from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import { log } from "../helper";
import { LOCK_SCREEN_ACTION_BUTTON } from "../types";

/**
 * Generates the content for the CastOptionsProvider class in Java or Kotlin.
 * @param chromecastAppId - The Chromecast application ID.
 * @param packageName - The package name of the Android app.
 * @param lockScreenControls - Optional settings for lock screen controls.
 * @returns The content for the CastOptionsProvider class in Java or Kotlin.
 */
const getCastProviderContent = (
  chromecastAppId: string,
  packageName: string,
  lockScreenControls?: {
    buttonActions?: LOCK_SCREEN_ACTION_BUTTON[];
    skipInMs?: number | null;
  }
) => {
  let buttonActions = [
    LOCK_SCREEN_ACTION_BUTTON.ACTION_TOGGLE_PLAYBACK,
    LOCK_SCREEN_ACTION_BUTTON.ACTION_STOP_CASTING,
  ];
  let skipInMs = 30000;
  if (lockScreenControls) {
    if (lockScreenControls.buttonActions) {
      buttonActions = lockScreenControls.buttonActions;
    }
    if (lockScreenControls.skipInMs) {
      skipInMs = lockScreenControls.skipInMs;
    }
  }
  const buttonActionsStr = buttonActions
    .map((action) => `${action}`)
    .join(", ");

  const skipInMsStr = `${skipInMs}L`;

  return {
    java: {
      true: `
package ${packageName};

import android.content.Context;
import com.google.android.gms.cast.LaunchOptions;
import com.google.android.gms.cast.framework.CastOptions;
import com.google.android.gms.cast.framework.OptionsProvider;
import com.google.android.gms.cast.framework.SessionProvider;
import com.google.android.gms.cast.framework.media.MediaIntentReceiver;
import com.google.android.gms.cast.framework.media.NotificationOptions;
import com.google.android.gms.cast.framework.media.CastMediaOptions;
import tv.vizbee.api.RemoteActivity;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class CastOptionsProvider implements OptionsProvider {

    @Override
    public CastOptions getCastOptions(Context context) {
        ${
          buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_FORWARD) ||
          buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_REWIND)
            ? `List<String> buttonActions = new ArrayList<>(Arrays.asList(
            ${buttonActionsStr}
        ));

        int[] compatButtonActionsIndices = {1, 3};`
            : ""
        }
        long skipInMs = ${skipInMsStr};

        NotificationOptions notificationOptions = new NotificationOptions.Builder()
        ${
          buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_FORWARD) ||
          buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_REWIND)
            ? `.setActions(buttonActions, compatButtonActionsIndices)`
            : ""
        }    .setSkipStepMs(skipInMs)
            .setTargetActivityClassName(RemoteActivity.class.getName())
            .build();

        CastMediaOptions mediaOptions = new CastMediaOptions.Builder()
            .setNotificationOptions(notificationOptions)
            .build();

        LaunchOptions launchOptions = new LaunchOptions.Builder()
            .setAndroidReceiverCompatible(true)
            .build();

        return new CastOptions.Builder()
            .setReceiverApplicationId("${chromecastAppId}")
            .setCastMediaOptions(mediaOptions)
            .setLaunchOptions(launchOptions)
            .build();
    }

    @Override
    public List<SessionProvider> getAdditionalSessionProviders(Context context) {
        return null;
    }
}`,
      false: `
package ${packageName};

import android.content.Context;
import com.google.android.gms.cast.LaunchOptions;
import com.google.android.gms.cast.framework.CastOptions;
import com.google.android.gms.cast.framework.OptionsProvider;
import com.google.android.gms.cast.framework.SessionProvider;

import java.util.List;

public class CastOptionsProvider implements OptionsProvider {

    @Override
    public CastOptions getCastOptions(Context context) {
        LaunchOptions launchOptions = new LaunchOptions.Builder()
            .setAndroidReceiverCompatible(true)
            .build();

        return new CastOptions.Builder()
            .setReceiverApplicationId("${chromecastAppId}")
            .setLaunchOptions(launchOptions)
            .build();
    }

    @Override
    public List<SessionProvider> getAdditionalSessionProviders(Context context) {
        return null;
    }
}`,
    },
    kotlin: {
      true: `
package ${packageName}

import android.content.Context
import com.google.android.gms.cast.LaunchOptions
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider
import com.google.android.gms.cast.framework.media.*
import tv.vizbee.api.RemoteActivity

class CastOptionsProvider : OptionsProvider {

    override fun getCastOptions(context: Context): CastOptions {
      ${
        buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_FORWARD) ||
        buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_REWIND)
          ? `val buttonActions = arrayListOf(${buttonActionsStr})

        val compatButtonActionsIndices = intArrayOf(1, 3)`
          : ""
      }
        val skipInMs = ${skipInMsStr}

        val notificationOptions = NotificationOptions.Builder()
        ${
          buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_FORWARD) ||
          buttonActions.includes(LOCK_SCREEN_ACTION_BUTTON.ACTION_REWIND)
            ? `.setActions(buttonActions, compatButtonActionsIndices)`
            : ""
        }    .setSkipStepMs(skipInMs)
            .setTargetActivityClassName(RemoteActivity::class.java.name)
            .build()

        val mediaOptions = CastMediaOptions.Builder()
            .setNotificationOptions(notificationOptions)
            .build()

        val launchOptions = LaunchOptions.Builder()
            .setAndroidReceiverCompatible(true)
            .build()

        return CastOptions.Builder()
            .setReceiverApplicationId("${chromecastAppId}")
            .setCastMediaOptions(mediaOptions)
            .setLaunchOptions(launchOptions)
            .build()
    }

    override fun getAdditionalSessionProviders(context: Context): List<SessionProvider>? {
        return null
    }
}`,
      false: `
package ${packageName}

import android.content.Context
import com.google.android.gms.cast.LaunchOptions
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider

class CastOptionsProvider : OptionsProvider {

    override fun getCastOptions(context: Context): CastOptions {
        val launchOptions = LaunchOptions.Builder()
            .setAndroidReceiverCompatible(true)
            .build()

        return CastOptions.Builder()
            .setReceiverApplicationId("${chromecastAppId}")
            .setLaunchOptions(launchOptions)
            .build()
    }

    override fun getAdditionalSessionProviders(context: Context): List<SessionProvider>? {
        return null
    }
}`,
    },
  };
};

/**
 * A config plugin to add custom Cast options to an Android project.
 * @param config - The Expo config object.
 * @param options - Options for the plugin.
 * @param options.chromecastAppId - The Chromecast application ID.
 * @param options.nativeSdkVersion - The version of the Vizbee Android SDK to use (default: "6.5.5").
 * @param options.language - The programming language for the CastOptionsProvider class (either "kotlin" or "java", default: "kotlin").
 * @param options.lockScreenControls - Optional settings for lock screen controls, including button actions and skip interval.
 * @param options.enableLockScreenControl - Whether to enable lock screen controls (default: true).
 * @param options.enableLaunchOptions - Whether to enable launch options (default: true).
 * @returns The modified config object with custom Cast options.
 */
const withCustomCastOptions: ConfigPlugin<{
  chromecastAppId: string;
  nativeSdkVersion?: string;
  language?: "kotlin" | "java";
  lockScreenControls?: {
    buttonActions?: LOCK_SCREEN_ACTION_BUTTON[];
    skipInMs?: number | null;
  };
  enableLockScreenControl?: boolean;
  enableLaunchOptions?: boolean;
}> = (config, props) => {
  const {
    chromecastAppId,
    nativeSdkVersion = "6.5.5",
    language = "kotlin",
    lockScreenControls,
    enableLockScreenControl = true,
    enableLaunchOptions = true,
  } = props;

  if (!enableLaunchOptions) {
    if (enableLockScreenControl) {
      throw new Error(
        `Cannot have Lock Screen Control without Launch Options set to true.`
      );
    }
    return config;
  }

  if (!enableLockScreenControl && !enableLaunchOptions) {
    return config;
  }

  if (!chromecastAppId) {
    throw new Error(`Cannot find chromecastAppId in params; it is mandatory.`);
  }

  log("Adding custom Cast options with Chromecast App ID:", chromecastAppId);
  const packageName = config.android?.package;
  if (!packageName) {
    throw new Error("Cannot find the Android package name in the config.");
  }

  // Add meta-data to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    if (!Array.isArray(manifest.application)) {
      throw new Error(
        "configureAndroidManifest: No application array in manifest?"
      );
    }

    const application = manifest.application.find(
      (item) => item.$ && item.$["android:name"] === ".MainApplication"
    );
    if (!application) {
      throw new Error("configureAndroidManifest: No .MainApplication found.");
    }

    application["meta-data"] = application["meta-data"] || [];
    application["meta-data"].push({
      $: {
        "android:name":
          "com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME",
        "android:value": `${packageName}.CastOptionsProvider`,
      },
    });

    log("Added meta-data to AndroidManifest.xml for CastOptionsProvider.");
    return config;
  });

  // Add the Java or Kotlin class to the project
  config = withMainApplication(config, (config) => {
    const mainApplicationPath = path.join(
      config.modRequest.projectRoot,
      "android",
      "app",
      "src",
      "main",
      "java",
      ...packageName.split(".")
    );
    const castOptionsProviderPath = path.join(
      mainApplicationPath,
      `CastOptionsProvider.${language === "kotlin" ? "kt" : "java"}`
    );

    // Ensure the directory exists
    if (!fs.existsSync(mainApplicationPath)) {
      fs.mkdirSync(mainApplicationPath, { recursive: true });
    }

    // Write the CastOptionsProvider.java or CastOptionsProvider.kt file
    const castOptionsProviderContent =
      language === "kotlin"
        ? getCastProviderContent(
            chromecastAppId,
            packageName,
            lockScreenControls
          ).kotlin[`${enableLockScreenControl}`]
        : getCastProviderContent(
            chromecastAppId,
            packageName,
            lockScreenControls
          ).java[`${enableLockScreenControl}`];

    fs.writeFileSync(castOptionsProviderPath, castOptionsProviderContent);
    log(`Created ${castOptionsProviderPath} for CastOptionsProvider.`);

    return config;
  });

  // Add dependency to build.gradle
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    const dependency = `implementation "tv.vizbee:android-sender-sdk:${nativeSdkVersion}"`;

    if (!buildGradle.includes(dependency)) {
      const pattern = /dependencies\s*{[^}]*}/;
      const match = buildGradle.match(pattern);

      if (match) {
        const updatedDependencies = match[0].replace(
          "{",
          `{\n\n    ${dependency}\n`
        );
        config.modResults.contents = buildGradle.replace(
          pattern,
          updatedDependencies
        );
      } else {
        // If no dependencies block is found, append the whole block
        config.modResults.contents += `\ndependencies {\n    ${dependency}\n}\n`;
      }
      log("Added play-services-cast-framework dependency to build.gradle.");
    } else {
      log(
        "play-services-cast-framework dependency already exists in build.gradle."
      );
    }

    return config;
  });

  return config;
};

export default withCustomCastOptions;
