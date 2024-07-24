import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import xml2js from "xml2js";
import { log } from "../helper";

/**
 * Ensures that the network security config is defined in the Android manifest.
 * @param androidManifest - The Android manifest object.
 * @returns The modified Android manifest object.
 * @throws Will throw an error if the application array or MainApplication is not found in the manifest.
 */
function ensureNetworkSecurityConfig(androidManifest: any): any {
  const { manifest } = androidManifest;

  if (!Array.isArray(manifest.application)) {
    throw new Error(
      "configureAndroidManifest: No application array in manifest?"
    );
  }

  const application: { $: { [key: string]: any } } = manifest.application.find(
    (item: { $: { [key: string]: any } }) =>
      item.$ && item.$["android:name"] === ".MainApplication"
  );
  if (!application) {
    throw new Error("configureAndroidManifest: No .MainApplication?");
  }

  const networkSecurityConfigAttribute = "android:networkSecurityConfig";
  const networkSecurityConfigPath = "@xml/network_security_config";

  // Check if network security config is already defined
  if (
    !Object.prototype.hasOwnProperty.call(
      application.$,
      networkSecurityConfigAttribute
    )
  ) {
    application.$[networkSecurityConfigAttribute] = networkSecurityConfigPath;
    log("Added networkSecurityConfig attribute to MainApplication.");
  } else {
    log("networkSecurityConfig attribute already exists in MainApplication.");
  }

  return androidManifest;
}

/**
 * Ensures that the network_security_config.xml file exists and is properly configured.
 * @param projectRoot - The root directory of the project.
 */
async function ensureNetworkSecurityConfigXML(
  projectRoot: string
): Promise<void> {
  const networkSecurityConfigPath = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "main",
    "res",
    "xml",
    "network_security_config.xml"
  );
  const configXML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true"/>
</network-security-config>`;

  if (fs.existsSync(networkSecurityConfigPath)) {
    // Read existing XML content
    const content = fs.readFileSync(networkSecurityConfigPath, "utf8");
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();

    const xml = await parser.parseStringPromise(content);

    if (
      !xml["network-security-config"]["base-config"][0]["$"]
        .cleartextTrafficPermitted ||
      xml["network-security-config"]["base-config"][0]["$"]
        .cleartextTrafficPermitted !== "true"
    ) {
      xml["network-security-config"]["base-config"][0][
        "$"
      ].cleartextTrafficPermitted = "true";
      const updatedContent = builder.buildObject(xml);
      fs.writeFileSync(networkSecurityConfigPath, updatedContent);
      log("Updated network_security_config.xml to permit cleartext traffic.");
    } else {
      log("network_security_config.xml already permits cleartext traffic.");
    }
  } else {
    // Create new network_security_config.xml with the desired content
    fs.mkdirSync(path.dirname(networkSecurityConfigPath), { recursive: true });
    fs.writeFileSync(networkSecurityConfigPath, configXML);
    log("Created new network_security_config.xml to permit cleartext traffic.");
  }
}

/**
 * Comments out the cleartext traffic setting in the debug Android manifest.
 * @param projectRoot - The root directory of the project.
 */
async function commentOutCleartextTrafficInDebugManifest(
  projectRoot: string
): Promise<void> {
  const debugManifestPath = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "debug",
    "AndroidManifest.xml"
  );

  if (fs.existsSync(debugManifestPath)) {
    let content = fs.readFileSync(debugManifestPath, "utf8");

    const lineToComment =
      '<application android:usesCleartextTraffic="true" tools:targetApi="28" tools:ignore="GoogleAppIndexingWarning" tools:replace="android:usesCleartextTraffic" />';

    if (content.includes(lineToComment)) {
      content = content.replace(lineToComment, `<!-- ${lineToComment} -->`);
      fs.writeFileSync(debugManifestPath, content, "utf8");
    } else {
      log(
        "Cleartext traffic setting already commented out in debug AndroidManifest.xml."
      );
    }
  } else {
    log("Debug AndroidManifest.xml does not exist.");
  }
}

/**
 * A config plugin to ensure the network security config is properly set up for an Android project.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withNetworkSecurityConfig: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = ensureNetworkSecurityConfig(config.modResults);

    await ensureNetworkSecurityConfigXML(config.modRequest.projectRoot);

    await commentOutCleartextTrafficInDebugManifest(
      config.modRequest.projectRoot
    );

    return config;
  });
};

export default withNetworkSecurityConfig;
