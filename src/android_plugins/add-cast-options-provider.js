const {
  withAndroidManifest,
  withMainApplication,
  withAppBuildGradle,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withCustomCastOptions = (
  config,
  { chromecastAppId, language = "kotlin" }
) => {
  if (!chromecastAppId) {
    throw new Error(`Cannot find chromecastAppId in params it is mandatory`);
  }

  const packageName = config.android.package;
  // Add meta-data to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    if (!Array.isArray(manifest.application)) {
      throw new Error(
        "configureAndroidManifest: No application array in manifest?"
      );
      return config;
    }

    const application = manifest.application.find(
      (item) => item.$ && item.$["android:name"] === ".MainApplication"
    );
    if (!application) {
      throw new Error("configureAndroidManifest: No .MainApplication?");
    }

    application["meta-data"] = application["meta-data"] || [];
    application["meta-data"].push({
      $: {
        "android:name":
          "com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME",
        "android:value": `${packageName}.CastOptionsProvider`,
      },
    });
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
    fs.writeFileSync(castOptionsProviderPath, castOptionsProviderContent);

    return config;
  });

  // Add dependency to build.gradle
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    const dependency = `implementation 'com.google.android.gms:play-services-cast-framework:21.5.0'`;

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
    }

    return config;
  });

  return config;
};

module.exports = withCustomCastOptions;
