import { ConfigPlugin, withMainApplication } from "@expo/config-plugins";
import fs from "fs";

/**
 * Adds Vizbee initialization line to MainApplication's onCreate method.
 *
 * This config plugin modifies the MainApplication.java or MainApplication.kt file
 * to include Vizbee initialization. It supports optional configuration for layout
 * and lock screen controls.
 *
 * @param config - Expo config object.
 * @param options - Options object containing parameters like vizbeeAppId, layoutConfigFilePath, language, and enableLockScreenControl.
 * @param options.vizbeeAppId - The application ID for Vizbee.
 * @param options.layoutConfigFilePath - Optional path to the layout configuration file.
 * @param options.language - The language of the MainApplication file ("kotlin" or "java"). Default is "kotlin".
 * @param options.enableLockScreenControl - Boolean flag to enable lock screen controls. Default is true.
 * @returns The modified config object.
 */
const withVizbeeInitialization: ConfigPlugin<{
  vizbeeAppId: string;
  layoutConfigFilePath?: string;
  language?: "kotlin" | "java";
  enableLockScreenControl?: boolean;
}> = (
  config,
  {
    vizbeeAppId,
    layoutConfigFilePath,
    language = "kotlin",
    enableLockScreenControl = true,
  }
) => {
  if (!vizbeeAppId) {
    throw new Error(`Cannot find vizbeeAppId in params, it is mandatory`);
  }

  config = withMainApplication(config, (config) => {
    let layoutConfig = null;

    if (layoutConfigFilePath) {
      if (fs.existsSync(layoutConfigFilePath)) {
        const fileContents = fs.readFileSync(layoutConfigFilePath, "utf8");
        layoutConfig = JSON.parse(fileContents);
      } else {
        throw new Error(
          `Could not find layout config file at path: ${layoutConfigFilePath}`
        );
      }
    }

    config.modResults.contents = addVizbeeInitialization(
      config.modResults.contents,
      vizbeeAppId,
      layoutConfig,
      language,
      enableLockScreenControl
    );
    return config;
  });

  return config;
};

/**
 * Adds the Vizbee initialization line to MainApplication.java or MainApplication.kt.
 *
 * This function injects the necessary initialization code for Vizbee into the MainApplication
 * file. It supports both Java and Kotlin, and can optionally include layout configuration and
 * lock screen control initialization.
 *
 * @param mainApplicationContents - Contents of MainApplication file as string.
 * @param vizbeeAppId - Vizbee application ID.
 * @param layoutConfig - Optional layout configuration object.
 * @param language - Language of the file ("kotlin" or "java").
 * @param enableLockScreenControl - Boolean flag to enable lock screen controls.
 * @returns Updated contents of MainApplication file.
 */
function addVizbeeInitialization(
  mainApplicationContents: string,
  vizbeeAppId: string,
  layoutConfig: object | null,
  language: "kotlin" | "java",
  enableLockScreenControl: boolean
): string {
  // Prepare the initialization line based on the provided layoutConfig and language
  let VIZBEE_INITIALIZATION_LINE = layoutConfig
    ? `    VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}",
    ${language === "kotlin" ? `JSONObject("""${JSON.stringify(layoutConfig)}""".trimIndent())` : `new JSONObject(${JSON.stringify(layoutConfig)})`}
    );`
    : `    VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}"
    );`;

  // For Java and Kotlin, look for super.onCreate() and insert the initialization line after it
  const superOnCreateMatch =
    language === "java"
      ? mainApplicationContents.match(/super\.onCreate\(.*\);\n/)
      : mainApplicationContents.match(/super\.onCreate\(.*\)\n/);

  // Prepare import statements
  let importLines = layoutConfig
    ? language === "java"
      ? "import tv.vizbee.rnsender.VizbeeBootstrap;\nimport org.json.JSONObject;"
      : "import tv.vizbee.rnsender.VizbeeBootstrap\nimport org.json.JSONObject"
    : language === "java"
      ? "import tv.vizbee.rnsender.VizbeeBootstrap;"
      : "import tv.vizbee.rnsender.VizbeeBootstrap";

  // If lock screen control is enabled, add the necessary initialization and imports
  if (enableLockScreenControl) {
    importLines +=
      language === "java"
        ? "\nimport tv.vizbee.api.VizbeeContext;\nimport com.google.android.gms.cast.framework.CastContext;\nimport android.util.Log;"
        : "\nimport tv.vizbee.api.VizbeeContext\nimport com.google.android.gms.cast.framework.CastContext\nimport android.util.Log";

    VIZBEE_INITIALIZATION_LINE =
      language === "java"
        ? `    /*
    * Initialize CastContext to display cast notification when casting to Chromecast devices.
    * It is important to add a try-catch block to avoid crashes due to incorrect Google Play Services on the device
    */
    try {
        CastContext.getSharedInstance(this.getApplicationContext());
    } catch (Exception e) {
        Log.e("VizbeeWrapper", "Exception while initializing CastContext:", e);
    }
`
        : `    /*
    * Initialize CastContext to display cast notification when casting to Chromecast devices.
    * It is important to add a try-catch block to avoid crashes due to incorrect Google Play Services on the device
    */
    try {
        CastContext.getSharedInstance(this.applicationContext)
    } catch (e: Exception){
        Log.e("VizbeeWrapper", "Exception while initializing CastContext:", e)
    }
` +
          "\n\n" +
          VIZBEE_INITIALIZATION_LINE;
  }

  // Insert the initialization line after the super.onCreate() call
  if (superOnCreateMatch?.index) {
    const superOnCreateIndex =
      superOnCreateMatch.index + superOnCreateMatch[0].length;
    mainApplicationContents =
      mainApplicationContents.slice(0, superOnCreateIndex) +
      "\n" +
      VIZBEE_INITIALIZATION_LINE +
      "\n\n" +
      mainApplicationContents.slice(superOnCreateIndex);
  } else {
    throw new Error(
      `Could not find super.onCreate() method call in MainApplication contents.`
    );
  }

  // Add import statements if not already present
  if (!mainApplicationContents.includes(importLines)) {
    const packageDeclarationMatch =
      mainApplicationContents.match(/package\s+[\w.]+;?/);

    if (packageDeclarationMatch) {
      const packageDeclarationIndex =
        packageDeclarationMatch.index! + packageDeclarationMatch[0].length;
      mainApplicationContents =
        mainApplicationContents.slice(0, packageDeclarationIndex) +
        "\n\n" +
        importLines +
        mainApplicationContents.slice(packageDeclarationIndex);
    }
  }

  return mainApplicationContents;
}

export default withVizbeeInitialization;
