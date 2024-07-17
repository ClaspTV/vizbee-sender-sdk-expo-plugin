const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function addThemeFiles(
  projectRoot,
  lightThemeFilePath,
  darkThemeFilePath
) {
  const androidResPath = path.join(projectRoot, "app", "src", "main", "res");
  const valuesPath = path.join(androidResPath, "values");
  const valuesNightPath = path.join(androidResPath, "values-night");

  // Check conditions and throw errors as needed
  if (!lightThemeFilePath) {
    throw new Error(
      "Unable to find vizbee.xml inside Project Root folder vizbee_resources->android->light"
    );
  }

  // Ensure 'values' folder exists
  if (!fs.existsSync(valuesPath) && fs.existsSync(lightThemeFilePath)) {
    fs.mkdirSync(valuesPath, { recursive: true });
  }

  if(fs.existsSync(lightThemeFilePath)){
     // Copy lightThemeFilePath to 'values' folder
     const lightThemeFileName = path.basename(lightThemeFilePath);
     const targetLightThemePath = path.join(valuesPath, lightThemeFileName);
     fs.copyFileSync(lightThemeFilePath, targetLightThemePath);
  }

  // Ensure 'values-night' folder exists if darkThemeFilePath is provided
  if (!fs.existsSync(valuesNightPath) && fs.existsSync(darkThemeFilePath)) {
    fs.mkdirSync(valuesNightPath, { recursive: true });
  }

  if(fs.existsSync(darkThemeFilePath)){
    // Copy darkThemeFilePath to 'values-night' folder
    const darkThemeFileName = path.basename(darkThemeFilePath);
    const targetDarkThemePath = path.join(valuesNightPath, darkThemeFileName);
    fs.copyFileSync(darkThemeFilePath, targetDarkThemePath);
  } 
}

const withThemeFiles = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;

      try {
        addThemeFiles(
          projectRoot,
          `${config.modRequest.projectRoot}/vizbee_resources/android/light/vizbee.xml`,
          `${config.modRequest.projectRoot}/vizbee_resources/android/dark/vizbee.xml`,
        );
      } catch (error) {
        throw new Error(`Failed to add theme files: ${error.message}`);
      }

      return config;
    },
  ]);
};

module.exports = withThemeFiles;
