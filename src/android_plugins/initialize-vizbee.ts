import { ConfigPlugin, withMainApplication } from "@expo/config-plugins";
import fs from "fs";

/**
 * Adds Vizbee initialization line to MainApplication's onCreate method.
 * @param config - Expo config object.
 * @param options - Options object containing parameters like vizbeeAppId and layoutConfigFilePath.
 * @returns The modified config object.
 */
const withVizbeeInitialization: ConfigPlugin<{
  vizbeeAppId: string;
  layoutConfigFilePath?: string;
  language?: "kotlin" | "java";
}> = (config, { vizbeeAppId, layoutConfigFilePath, language = "kotlin" }) => {
  if (!vizbeeAppId) {
    throw new Error(`Cannot find vizbeeAppId in params it is mandatory`);
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
      language
    );
    return config;
  });

  return config;
};

/**
 * Adds the Vizbee initialization line to MainApplication.java or MainApplication.kt.
 * @param mainApplicationContents - Contents of MainApplication file as string.
 * @param vizbeeAppId - Vizbee application ID.
 * @param layoutConfig - Layout configuration object.
 * @param language - Language of the file ("kotlin" or "java").
 * @returns Updated contents of MainApplication file.
 */
function addVizbeeInitialization(
  mainApplicationContents: string,
  vizbeeAppId: string,
  layoutConfig: object | null,
  language: "kotlin" | "java"
): string {
  const VIZBEE_INITIALIZATION_LINE = layoutConfig
    ? `VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}",
    ${language === "kotlin" ? 'JSONObject("""' + JSON.stringify(layoutConfig) + '""".trimIndent())' : `new JSONObject(${JSON.stringify(layoutConfig)})`}
);`
    : `VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}"
);`;

  // For Java and Kotlin, look for super.onCreate() and insert the initialization line after it
  const superOnCreateMatch =
    language === "java"
      ? mainApplicationContents.match(/super\.onCreate\(.*\);\n/)
      : mainApplicationContents.match(/super\.onCreate\(.*\)\n/);

  const importLines = layoutConfig
    ? language === "java"
      ? "import tv.vizbee.rnsender.VizbeeBootstrap;\nimport org.json.JSONObject;"
      : "import tv.vizbee.rnsender.VizbeeBootstrap\nimport org.json.JSONObject"
    : language === "java"
      ? "import tv.vizbee.rnsender.VizbeeBootstrap;"
      : "import tv.vizbee.rnsender.VizbeeBootstrap";

  if (superOnCreateMatch?.index) {
    const superOnCreateIndex =
      superOnCreateMatch.index + superOnCreateMatch[0].length;
    mainApplicationContents =
      mainApplicationContents.slice(0, superOnCreateIndex) +
      VIZBEE_INITIALIZATION_LINE +
      "\n" +
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
        "\n" +
        mainApplicationContents.slice(packageDeclarationIndex);
    }
  }

  return mainApplicationContents;
}

export default withVizbeeInitialization;
