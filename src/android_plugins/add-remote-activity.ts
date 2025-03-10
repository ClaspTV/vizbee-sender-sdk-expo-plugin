import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins";
import { AndroidManifest } from "@expo/config-plugins/build/android/Manifest";
import { log } from "../helper";

/**
 * Configures the AndroidManifest to include the Vizbee activity and optional permission.
 *
 * This function modifies the AndroidManifest object to add the Vizbee activity
 * with the specified configurations and optionally adds the foreground service
 * media playback permission based on the enableLockScreenControl flag.
 *
 * @param androidManifest - The current AndroidManifest object.
 * @param vizbeeAppId - The Vizbee application ID.
 * @param enableLockScreenControl - Boolean flag to enable lock screen controls.
 * @param packageName - The package name of the application (optional).
 * @returns The modified AndroidManifest object.
 */
async function configureAndroidManifest(
  androidManifest: AndroidManifest,
  vizbeeAppId: string,
  enableLockScreenControl: boolean,
  packageName?: string
): Promise<AndroidManifest> {
  const { manifest } = androidManifest;

  if (!Array.isArray(manifest.application)) {
    throw new Error(
      "configureAndroidManifest: No application array in manifest?"
    );
  }

  const application = manifest.application.find(
    (item) => item.$ && item.$["android:name"] === ".MainApplication"
  );
  if (!application) {
    throw new Error("configureAndroidManifest: No .MainApplication?");
  }

  log("Adding Vizbee activity to AndroidManifest");

  // Define the new activity node to be added
  const vizbeeActivity: any = {
    $: {
      "android:name": "tv.vizbee.api.RemoteActivity",
      "android:exported": "true",
      "android:launchMode": "singleTop",
      "android:theme": "@style/Theme.Vizbee.Custom",
    },
    "intent-filter": [
      {
        action: { $: { "android:name": "android.intent.action.VIEW" } },
        category: [
          { $: { "android:name": "android.intent.category.BROWSABLE" } },
          { $: { "android:name": "android.intent.category.DEFAULT" } },
        ],
        data: { $: { "android:scheme": vizbeeAppId, "android:host": "video" } },
      },
    ],
  };

  if (enableLockScreenControl && vizbeeActivity && packageName) {
    let metadata = [];
    if (vizbeeActivity["meta-data"]) {
      metadata = vizbeeActivity["meta-data"];
    }
    metadata.push({
      $: {
        "android:name": "android.support.PARENT_ACTIVITY",
        "android:value": `${packageName}.MainActivity`,
      },
    });
    vizbeeActivity["meta-data"] = metadata;
  }

  application.activity = application.activity || [];

  // Append the vizbeeActivity XML to the activities
  application.activity.push(vizbeeActivity);

  // Add permission for foreground service media playback if needed
  if (enableLockScreenControl) {
    const usesPermission = manifest["uses-permission"] || [];
    if (
      !usesPermission.some(
        (perm: any) =>
          perm.$["android:name"] ===
          "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
      )
    ) {
      usesPermission.push({
        $: {
          "android:name":
            "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        },
      });
      manifest["uses-permission"] = usesPermission;
    }
  }

  log("Vizbee activity and permissions added successfully");

  return androidManifest;
}

/**
 * A config plugin to add Vizbee activity and optional permission to the AndroidManifest.
 *
 * This plugin modifies the Expo configuration to include Vizbee initialization
 * and optionally adds permission for foreground service media playback.
 *
 * @param config - The Expo config object.
 * @param options - The Vizbee plugin options.
 * @param options.vizbeeAppId - The Vizbee application ID.
 * @param options.enableLockScreenControl - Boolean flag to enable lock screen controls. Default is true.
 * @returns The modified config object.
 */
const withVizbeeAndroidManifest: ConfigPlugin<{
  vizbeeAppId: string;
  enableLockScreenControl?: boolean;
}> = (config, { vizbeeAppId, enableLockScreenControl = true }) => {
  if (!vizbeeAppId) {
    throw new Error("Cannot find vizbeeAppId in params, it is mandatory");
  }

  log("Configuring AndroidManifest with Vizbee app ID:", vizbeeAppId);

  return withAndroidManifest(config, async (config) => {
    config.modResults = await configureAndroidManifest(
      config.modResults,
      vizbeeAppId,
      enableLockScreenControl,
      config.android?.package
    );
    return config;
  });
};

export default withVizbeeAndroidManifest;
