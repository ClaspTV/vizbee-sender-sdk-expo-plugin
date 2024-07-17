const { withAndroidManifest } = require("@expo/config-plugins");

async function configureAndroidManifest(androidManifest, vizbeeAppId) {
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

  // Define the new activity node to be added
  const vizbeeActivity = {
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

  return androidManifest;
}

const withVizbeeAndroidManifest = (config, { vizbeeAppId }) => {
  if (!vizbeeAppId) {
    throw new Error(`Cannot find vizbeeAppId in params it is mandatory`);
  }

  return withAndroidManifest(config, async (config) => {
    config.modResults = await configureAndroidManifest(
      config.modResults,
      vizbeeAppId
    );
    return config;
  });
};

module.exports = withVizbeeAndroidManifest;
