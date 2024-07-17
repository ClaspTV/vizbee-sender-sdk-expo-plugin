const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const PATH = {
  stylesXmlPaths: {
    values: "/vizbee_resources/android/light/styles.xml",
    valuesNight: "./vizbee_resources/android/dark/styles.xml",
  },
  colorsXmlPaths: {
    values: "./vizbee_resources/android/light/colors.xml",
    valuesNight: "./vizbee_resources/android/dark/colors.xml",
  },
};

const createEmptyXml = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const builder = new xml2js.Builder();
  const emptyXml = builder.buildObject({ resources: {} });
  fs.writeFileSync(filePath, emptyXml);
};

const mergeXmlFiles = async (existingFilePath, newFilePath) => {
  console.log(newFilePath);
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

  if (!existingJson.resources) {
    existingJson.resources = {};
  }
  if (!existingJson.resources.style) {
    existingJson.resources.style = [];
  }
  if (!existingJson.resources.color) {
    existingJson.resources.color = [];
  }
  if (!newJson.resources) {
    return;
  }

  const mergeResources = (existing, toMerge) => {
    toMerge.forEach((item) => {
      const existingItemIndex = existing.findIndex((exItem) => {
        return JSON.stringify(exItem.$) === JSON.stringify(item.$);
      });
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

const withCopyColorAndStyleXml = (config) => {
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
      await mergeXmlFiles(
        path.join(valuesNightDir, "styles.xml"),
        path.join(
          config.modRequest.projectRoot,
          PATH.stylesXmlPaths.valuesNight
        )
      );
      await mergeXmlFiles(
        path.join(valuesDir, "colors.xml"),
        path.join(config.modRequest.projectRoot, PATH.colorsXmlPaths.values)
      );
      await mergeXmlFiles(
        path.join(valuesNightDir, "colors.xml"),
        path.join(
          config.modRequest.projectRoot,
          PATH.colorsXmlPaths.valuesNight
        )
      );

      return config;
    },
  ]);
};

module.exports = withCopyColorAndStyleXml;
