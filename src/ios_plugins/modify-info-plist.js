const { withInfoPlist } = require("@expo/config-plugins");

const withModifyInfoPlist = (
  config,
  {
    description = "${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.",
    receiverAppId = null,
  }
) => {
  // iOS: Modify Info.plist to add Bonjour services and LNA description

  config = withInfoPlist(config, (config) => {
    const bonjourServices = [
      "_googlecast._tcp",
      "_amzn-wplay._tcp",
      "_viziocast._tcp",
    ];
    if (receiverAppId) {
      bonjourServices.push(`${receiverAppId}._googlecast._tcp`);
    }

    config.modResults["Bonjour services"] = bonjourServices;
    config.modResults.NSLocalNetworkUsageDescription = description;
    return config;
  });

  return config;
};

module.exports = withModifyInfoPlist;
