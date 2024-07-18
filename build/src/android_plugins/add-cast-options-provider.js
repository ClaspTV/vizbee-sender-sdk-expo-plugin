"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helper_1 = require("../helper");
/**
 * A config plugin to add custom Cast options to an Android project.
 * @param config - The Expo config object.
 * @param options - Options for the plugin.
 * @param options.chromecastAppId - The Chromecast application ID.
 * @param options.language - The programming language for the CastOptionsProvider class (either "kotlin" or "java").
 * @returns The modified config object.
 */
const withCustomCastOptions = (config, { chromecastAppId, language = "kotlin" }) => {
    var _a;
    if (!chromecastAppId) {
        throw new Error(`Cannot find chromecastAppId in params; it is mandatory.`);
    }
    (0, helper_1.log)("Adding custom Cast options with Chromecast App ID:", chromecastAppId);
    const packageName = (_a = config.android) === null || _a === void 0 ? void 0 : _a.package;
    if (!packageName) {
        throw new Error("Cannot find the Android package name in the config.");
    }
    // Add meta-data to AndroidManifest.xml
    config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        const { manifest } = config.modResults;
        if (!Array.isArray(manifest.application)) {
            throw new Error("configureAndroidManifest: No application array in manifest?");
        }
        const application = manifest.application.find((item) => item.$ && item.$["android:name"] === ".MainApplication");
        if (!application) {
            throw new Error("configureAndroidManifest: No .MainApplication found.");
        }
        application["meta-data"] = application["meta-data"] || [];
        application["meta-data"].push({
            $: {
                "android:name": "com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME",
                "android:value": `${packageName}.CastOptionsProvider`,
            },
        });
        (0, helper_1.log)("Added meta-data to AndroidManifest.xml for CastOptionsProvider.");
        return config;
    });
    // Add the Java or Kotlin class to the project
    config = (0, config_plugins_1.withMainApplication)(config, (config) => {
        const mainApplicationPath = path_1.default.join(config.modRequest.projectRoot, "android", "app", "src", "main", "java", ...packageName.split("."));
        const castOptionsProviderPath = path_1.default.join(mainApplicationPath, `CastOptionsProvider.${language === "kotlin" ? "kt" : "java"}`);
        // Ensure the directory exists
        if (!fs_1.default.existsSync(mainApplicationPath)) {
            fs_1.default.mkdirSync(mainApplicationPath, { recursive: true });
        }
        // Write the CastOptionsProvider.java or CastOptionsProvider.kt file
        const castOptionsProviderContent = language === "kotlin"
            ? `
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
}
`
            : `
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
}
`;
        fs_1.default.writeFileSync(castOptionsProviderPath, castOptionsProviderContent);
        (0, helper_1.log)(`Created ${castOptionsProviderPath} for CastOptionsProvider.`);
        return config;
    });
    // Add dependency to build.gradle
    config = (0, config_plugins_1.withAppBuildGradle)(config, (config) => {
        const buildGradle = config.modResults.contents;
        const dependency = `implementation 'com.google.android.gms:play-services-cast-framework:21.5.0'`;
        if (!buildGradle.includes(dependency)) {
            const pattern = /dependencies\s*{[^}]*}/;
            const match = buildGradle.match(pattern);
            if (match) {
                const updatedDependencies = match[0].replace("{", `{\n\n    ${dependency}\n`);
                config.modResults.contents = buildGradle.replace(pattern, updatedDependencies);
            }
            else {
                // If no dependencies block is found, append the whole block
                config.modResults.contents += `\ndependencies {\n    ${dependency}\n}\n`;
            }
            (0, helper_1.log)("Added play-services-cast-framework dependency to build.gradle.");
        }
        else {
            (0, helper_1.log)("play-services-cast-framework dependency already exists in build.gradle.");
        }
        return config;
    });
    return config;
};
exports.default = withCustomCastOptions;
