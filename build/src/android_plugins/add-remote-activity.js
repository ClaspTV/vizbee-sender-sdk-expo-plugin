"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const helper_1 = require("../helper");
/**
 * Configures the AndroidManifest to include the Vizbee activity.
 * @param androidManifest - The current AndroidManifest object.
 * @param vizbeeAppId - The Vizbee application ID.
 * @returns The modified AndroidManifest object.
 */
async function configureAndroidManifest(androidManifest, vizbeeAppId) {
    const { manifest } = androidManifest;
    if (!Array.isArray(manifest.application)) {
        throw new Error("configureAndroidManifest: No application array in manifest?");
    }
    const application = manifest.application.find((item) => item.$ && item.$["android:name"] === ".MainApplication");
    if (!application) {
        throw new Error("configureAndroidManifest: No .MainApplication?");
    }
    (0, helper_1.log)("Adding Vizbee activity to AndroidManifest");
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
    (0, helper_1.log)("Vizbee activity added successfully");
    return androidManifest;
}
/**
 * A config plugin to add Vizbee activity to the AndroidManifest.
 * @param config - The Expo config object.
 * @param options - The Vizbee plugin options.
 * @returns The modified config object.
 */
const withVizbeeAndroidManifest = (config, { vizbeeAppId }) => {
    if (!vizbeeAppId) {
        throw new Error("Cannot find vizbeeAppId in params it is mandatory");
    }
    (0, helper_1.log)("Configuring AndroidManifest with Vizbee app ID:", vizbeeAppId);
    return (0, config_plugins_1.withAndroidManifest)(config, async (config) => {
        config.modResults = await configureAndroidManifest(config.modResults, vizbeeAppId);
        return config;
    });
};
exports.default = withVizbeeAndroidManifest;
