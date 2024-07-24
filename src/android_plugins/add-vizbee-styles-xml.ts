import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import { log } from "../helper";

/**
 * Copies theme files to the Android project's 'values' and 'values-night' folders.
 * @param projectRoot - Root path of the Android project.
 * @param lightThemeFilePath - Path to the light theme file (vizbee.xml).
 * @param darkThemeFilePath - Path to the dark theme file (vizbee.xml).
 * @throws Error if the lightThemeFilePath or darkThemeFilePath is not found.
 */
function addThemeFiles(
  projectRoot: string,
  lightThemeFilePath: string,
  darkThemeFilePath: string
): void {
  const androidResPath = path.join(projectRoot, "app", "src", "main", "res");
  const valuesPath = path.join(androidResPath, "values");
  const valuesNightPath = path.join(androidResPath, "values-night");

  // Check conditions and throw errors as needed
  if (!fs.existsSync(lightThemeFilePath)) {
    throw new Error(
      `Unable to find vizbee.xml inside Project Root folder: ${lightThemeFilePath}`
    );
  }

  // Ensure 'values' folder exists
  if (!fs.existsSync(valuesPath)) {
    fs.mkdirSync(valuesPath, { recursive: true });
  }

  // Copy lightThemeFilePath to 'values' folder
  const lightThemeFileName = path.basename(lightThemeFilePath);
  const targetLightThemePath = path.join(valuesPath, lightThemeFileName);
  fs.copyFileSync(lightThemeFilePath, targetLightThemePath);
  log(`Copied ${lightThemeFileName} to ${valuesPath}`);

  // Ensure 'values-night' folder exists if darkThemeFilePath is provided
  if (darkThemeFilePath && !fs.existsSync(valuesNightPath)) {
    fs.mkdirSync(valuesNightPath, { recursive: true });
  }

  if (darkThemeFilePath && fs.existsSync(darkThemeFilePath)) {
    // Copy darkThemeFilePath to 'values-night' folder
    const darkThemeFileName = path.basename(darkThemeFilePath);
    const targetDarkThemePath = path.join(valuesNightPath, darkThemeFileName);
    fs.copyFileSync(darkThemeFilePath, targetDarkThemePath);
    log(`Copied ${darkThemeFileName} to ${valuesNightPath}`);
  }
}

/**
 * A config plugin that adds theme files to the Android project.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withThemeFiles: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;

      try {
        addThemeFiles(
          projectRoot,
          `${config.modRequest.projectRoot}/vizbee_resources/android/values/vizbee.xml`,
          `${config.modRequest.projectRoot}/vizbee_resources/android/values-night/vizbee.xml`
        );
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to add theme files: ${error.message}`);
        } else {
          throw new Error(`Failed to add theme files: ${String(error)}`);
        }
      }

      return config;
    },
  ]);
};

export default withThemeFiles;
