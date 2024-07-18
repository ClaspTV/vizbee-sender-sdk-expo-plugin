import { ConfigPlugin, withEntitlementsPlist } from "@expo/config-plugins";
import { log } from "../helper";

/**
 * A config plugin that modifies the entitlements plist to enable specific capabilities.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withCustomEntitlements: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, async (config) => {
    log("Modifying entitlements plist");

    // Modify entitlements as needed
    config.modResults["com.apple.developer.networking.multicast"] = true;
    config.modResults["com.apple.developer.networking.wifi-info"] = true;

    return config;
  });
};

export default withCustomEntitlements;
