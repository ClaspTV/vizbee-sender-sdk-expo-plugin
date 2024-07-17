const { withAndroidManifest, withMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

function ensureNetworkSecurityConfig(androidManifest) {
  const { manifest } = androidManifest;

  if (!Array.isArray(manifest.application)) {
    throw new Error(
      "configureAndroidManifest: No application array in manifest?"
    );
  }

  const application = manifest.application.find(
    (item) => item.$ && item.$["android:name"] === ".MainApplication"
  );
  if (!application) {
    throw new Error("configureAndroidManifest: No .MainApplication?");
  }
  const networkSecurityConfigAttribute = "android:networkSecurityConfig";
  const networkSecurityConfigPath = "@xml/network_security_config";

  // Check if network security config is already defined
  if (!application.$.hasOwnProperty(networkSecurityConfigAttribute)) {
    application.$[networkSecurityConfigAttribute] = networkSecurityConfigPath;
  }
  return androidManifest;
}

async function ensureNetworkSecurityConfigXML(projectRoot) {
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
    }
  } else {
    // Create new network_security_config.xml with the desired content
    fs.mkdirSync(path.dirname(networkSecurityConfigPath), { recursive: true });
    fs.writeFileSync(networkSecurityConfigPath, configXML);
  }
}

async function commentOutCleartextTrafficInDebugManifest(projectRoot) {
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
    }
  }
}

const withNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = ensureNetworkSecurityConfig(config.modResults);
    ensureNetworkSecurityConfigXML(config.modRequest.projectRoot);
    commentOutCleartextTrafficInDebugManifest(config.modRequest.projectRoot);
    return config;
  });
};

module.exports = withNetworkSecurityConfig;
