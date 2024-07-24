import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins";
import { AndroidManifest } from "@expo/config-plugins/build/android/Manifest";
import { log } from "../helper";

// Type definition for the Vizbee plugin options
type VizbeePluginOptions = {
  vizbeeAppId: string;
};

/**
 * Configures the AndroidManifest to include the Vizbee activity.
 * @param androidManifest - The current AndroidManifest object.
 * @param vizbeeAppId - The Vizbee application ID.
 * @returns The modified AndroidManifest object.
 */
async function configureAndroidManifest(
  androidManifest: AndroidManifest,
  vizbeeAppId: string
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

  application.activity = application.activity || [];

  // Append the vizbeeActivity XML to the activities
  application.activity.push(vizbeeActivity);

  log("Vizbee activity added successfully");

  return androidManifest;
}

/**
 * A config plugin to add Vizbee activity to the AndroidManifest.
 * @param config - The Expo config object.
 * @param options - The Vizbee plugin options.
 * @returns The modified config object.
 */
const withVizbeeAndroidManifest: ConfigPlugin<VizbeePluginOptions> = (
  config,
  { vizbeeAppId }
) => {
  if (!vizbeeAppId) {
    throw new Error("Cannot find vizbeeAppId in params it is mandatory");
  }

  log("Configuring AndroidManifest with Vizbee app ID:", vizbeeAppId);

  return withAndroidManifest(config, async (config) => {
    config.modResults = await configureAndroidManifest(
      config.modResults,
      vizbeeAppId
    );
    return config;
  });
};

export default withVizbeeAndroidManifest;
