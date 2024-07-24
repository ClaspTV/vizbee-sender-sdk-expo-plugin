import { ConfigPlugin, withInfoPlist } from "@expo/config-plugins";
import { log } from "../helper";

interface ModifyInfoPlistProps {
  description?: string;
  receiverAppId?: string | null;
}

/**
 * A config plugin that modifies the Info.plist to add Bonjour services and a local network usage description.
 * @param config - The Expo config object.
 * @param props - The properties to customize the modification.
 * @param props.description - The description for local network usage.
 * @param props.receiverAppId - The optional receiver app ID for custom Bonjour service.
 * @returns The modified config object.
 */
const withModifyInfoPlist: ConfigPlugin<ModifyInfoPlistProps> = (
  config,
  {
    description = "${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.",
    receiverAppId = null,
  }
) => {
  // iOS: Modify Info.plist to add Bonjour services and local network usage description

  log("Starting withModifyInfoPlist with description:", description);

  config = withInfoPlist(config, (config) => {
    log("Modifying Info.plist");

    const bonjourServices = [
      "_googlecast._tcp",
      "_amzn-wplay._tcp",
      "_viziocast._tcp",
    ];

    if (receiverAppId) {
      log("Adding custom Bonjour service for receiverAppId:", receiverAppId);
      bonjourServices.push(`_${receiverAppId}._googlecast._tcp`);
    }

    config.modResults["Bonjour services"] = bonjourServices;
    log("Bonjour services set to:", bonjourServices);

    config.modResults.NSLocalNetworkUsageDescription = description;
    log("NSLocalNetworkUsageDescription set to:", description);

    return config;
  });

  return config;
};

export default withModifyInfoPlist;
