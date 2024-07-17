const { withEntitlementsPlist } = require("@expo/config-plugins");

module.exports = (config) => {
  return withEntitlementsPlist(config, async (config) => {
    config.modResults["com.apple.developer.networking.multicast"] = true;
    config.modResults["com.apple.developer.networking.wifi-info"] = true;
    return config;
  });
};
