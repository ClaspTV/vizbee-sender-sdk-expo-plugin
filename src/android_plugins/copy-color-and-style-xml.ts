import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import xml2js from "xml2js";
import { log } from "../helper";

// Define paths to XML files
const PATH = {
  stylesXmlPaths: {
    values: "/vizbee_resources/android/values/styles.xml",
    valuesNight: "./vizbee_resources/android/values-night/styles.xml",
  },
  colorsXmlPaths: {
    values: "./vizbee_resources/android/values/colors.xml",
    valuesNight: "./vizbee_resources/android/values-night/colors.xml",
  },
};

/**
 * Creates an empty XML file at the specified path.
 * @param filePath - Path to the XML file to create.
 */
const createEmptyXml = (filePath: string): void => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const builder = new xml2js.Builder();
  const emptyXml = builder.buildObject({ resources: {} });
  fs.writeFileSync(filePath, emptyXml);
};

/**
 * Merges two XML files into one, merging styles and colors.
 * @param existingFilePath - Path to the existing XML file.
 * @param newFilePath - Path to the new XML file to merge.
 */
const mergeXmlFiles = async (
  existingFilePath: string,
  newFilePath: string
): Promise<void> => {
  if (!fs.existsSync(newFilePath)) {
    return;
  }

  if (!fs.existsSync(existingFilePath)) {
    createEmptyXml(existingFilePath);
  }

  const existingXml = fs.readFileSync(existingFilePath, "utf8");
  const newXml = fs.readFileSync(newFilePath, "utf8");

  const existingJson = await xml2js.parseStringPromise(existingXml);
  const newJson = await xml2js.parseStringPromise(newXml);

  // Ensure resources and arrays exist
  existingJson.resources = existingJson.resources || {};
  existingJson.resources.style = existingJson.resources.style || [];
  existingJson.resources.color = existingJson.resources.color || [];

  // Function to merge resources
  const mergeResources = (existing: any[], toMerge: any[]) => {
    toMerge.forEach((item) => {
      const existingItemIndex = existing.findIndex(
        (exItem) => JSON.stringify(exItem.$) === JSON.stringify(item.$)
      );
      if (existingItemIndex === -1) {
        existing.push(item);
      }
    });
  };

  mergeResources(existingJson.resources.style, newJson.resources.style || []);
  mergeResources(existingJson.resources.color, newJson.resources.color || []);

  const builder = new xml2js.Builder();
  const mergedXml = builder.buildObject(existingJson);

  fs.writeFileSync(existingFilePath, mergedXml);
};

/**
 * A config plugin that copies and merges colors.xml and styles.xml files into Android project.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withCopyColorAndStyleXml: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const valuesDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "values"
      );
      const valuesNightDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "values-night"
      );

      await mergeXmlFiles(
        path.join(valuesDir, "styles.xml"),
        path.join(config.modRequest.projectRoot, PATH.stylesXmlPaths.values)
      );
      log(`Merged styles.xml for Android project.`);

      await mergeXmlFiles(
        path.join(valuesNightDir, "styles.xml"),
        path.join(
          config.modRequest.projectRoot,
          PATH.stylesXmlPaths.valuesNight
        )
      );
      log(`Merged styles.xml for Android project (night mode).`);

      await mergeXmlFiles(
        path.join(valuesDir, "colors.xml"),
        path.join(config.modRequest.projectRoot, PATH.colorsXmlPaths.values)
      );
      log(`Merged colors.xml for Android project.`);

      await mergeXmlFiles(
        path.join(valuesNightDir, "colors.xml"),
        path.join(
          config.modRequest.projectRoot,
          PATH.colorsXmlPaths.valuesNight
        )
      );
      log(`Merged colors.xml for Android project (night mode).`);

      return config;
    },
  ]);
};

export default withCopyColorAndStyleXml;
