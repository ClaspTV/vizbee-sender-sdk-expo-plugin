const { withMainApplication } = require("@expo/config-plugins");
const fs = require("fs");

/**
 * Adds Vizbee initialization line to MainApplication's onCreate method.
 * @param {Object} config Expo config object.
 * @param {Object} options Options object containing parameters like vizbeeAppId and layoutConfigFilePath.
 */
const withVizbeeInitialization = (
  config,
  { vizbeeAppId, layoutConfigFilePath }
) => {
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
      layoutConfig
    );
    return config;
  });

  return config;
};

/**
 * Adds the Vizbee initialization line to MainApplication.java or MainApplication.kt.
 * @param {string} mainApplicationContents Contents of MainApplication file as string.
 * @param {string} vizbeeAppId Vizbee application ID.
 * @param {Object|null} layoutConfig Layout configuration object.
 * @returns {string} Updated contents of MainApplication file.
 */
function addVizbeeInitialization(
  mainApplicationContents,
  vizbeeAppId,
  layoutConfig
) {
  const VIZBEE_INITIALIZATION_LINE = layoutConfig
    ? `VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}",
    new org.json.JSONObject(${JSON.stringify(layoutConfig)})
);`
    : `VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}"
);`;

  // For Java and Kotlin, look for super.onCreate() and insert the initialization line after it
  const javaSuperOnCreateMatch = mainApplicationContents.match(
    /super\.onCreate\(.*\);\n/
  );
  const kotlinSuperOnCreateMatch = mainApplicationContents.match(
    /super\.onCreate\(.*\)\n/
  );
  var importLine = "";

  if (javaSuperOnCreateMatch) {
    importLine = "import tv.vizbee.rnsender.VizbeeBootstrap;";

    const superOnCreateIndex =
      javaSuperOnCreateMatch.index + javaSuperOnCreateMatch[0].length;
    mainApplicationContents =
      mainApplicationContents.slice(0, superOnCreateIndex) +
      VIZBEE_INITIALIZATION_LINE +
      "\n" +
      mainApplicationContents.slice(superOnCreateIndex);
  } else if (kotlinSuperOnCreateMatch) {
    importLine = "import tv.vizbee.rnsender.VizbeeBootstrap";

    const superOnCreateIndex =
      kotlinSuperOnCreateMatch.index + kotlinSuperOnCreateMatch[0].length;
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

  // Add import statement if not already present
  if (!mainApplicationContents.includes(importLine)) {
    console.log("packageDeclarationMatch");
    const packageDeclarationMatch =
      mainApplicationContents.match(/package\s+[\w\.]+;?/);

    if (packageDeclarationMatch) {
      console.log("packageDeclarationIndex");
      const packageDeclarationIndex =
        packageDeclarationMatch.index + packageDeclarationMatch[0].length;
      mainApplicationContents =
        mainApplicationContents.slice(0, packageDeclarationIndex) +
        "\n\n" +
        importLine +
        "\n" +
        mainApplicationContents.slice(packageDeclarationIndex);
    }
  }

  return mainApplicationContents;
}

module.exports = withVizbeeInitialization;
