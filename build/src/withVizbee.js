"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
// iOS Plugins
const add_pod_source_1 = __importDefault(require("./ios_plugins/add-pod-source"));
const add_entitlements_1 = __importDefault(require("./ios_plugins/add-entitlements"));
const add_fonts_1 = __importDefault(require("./ios_plugins/add-fonts"));
const modify_info_plist_1 = __importDefault(require("./ios_plugins/modify-info-plist"));
const add_vizbee_styles_file_1 = __importDefault(require("./ios_plugins/add-vizbee-styles-file"));
const update_style_on_theme_change_1 = __importDefault(require("./ios_plugins/update-style-on-theme-change"));
const initialize_vizbee_1 = __importDefault(require("./ios_plugins/initialize-vizbee"));
// // Android Plugins
const add_maven_url_1 = __importDefault(require("./android_plugins/add-maven-url"));
const add_fonts_2 = __importDefault(require("./android_plugins/add-fonts"));
const add_remote_activity_1 = __importDefault(require("./android_plugins/add-remote-activity"));
const add_clear_text_traffic_1 = __importDefault(require("./android_plugins/add-clear-text-traffic"));
const add_cast_options_provider_1 = __importDefault(require("./android_plugins/add-cast-options-provider"));
const add_vizbee_styles_xml_1 = __importDefault(require("./android_plugins/add-vizbee-styles-xml"));
const copy_color_and_style_xml_1 = __importDefault(require("./android_plugins/copy-color-and-style-xml"));
const initialize_vizbee_2 = __importDefault(require("./android_plugins/initialize-vizbee"));
/**
 * Apply iOS-specific Vizbee plugins
 * @param config - The Expo config
 * @param props - Plugin options
 * @returns Modified config
 */
const withVizbeeIosPlugins = (config, props) => {
    if (!props.ios) {
        props.ios = {};
    }
    config = (0, add_pod_source_1.default)(config);
    config = (0, add_entitlements_1.default)(config);
    config = (0, add_fonts_1.default)(config, {
        fontFolder: props.fontFolder,
        target: props.ios.target,
    });
    config = (0, modify_info_plist_1.default)(config, {
        description: props.ios.description,
        receiverAppId: props.chromecastAppId,
    });
    config = (0, add_vizbee_styles_file_1.default)(config, {
        target: props.ios.target,
    });
    config = (0, update_style_on_theme_change_1.default)(config, {
        hasLayoutConfig: props.layoutConfigFilePath ? true : false,
        language: props.ios.language,
    });
    config = (0, initialize_vizbee_1.default)(config, {
        vizbeeAppId: props.vizbeeAppId,
        layoutConfigFilePath: props.layoutConfigFilePath,
        language: props.ios.language,
    });
    return config;
};
/**
 * Apply Android-specific Vizbee plugins
 * @param config - The Expo config
 * @param props - Plugin options
 * @returns Modified config
 */
const withVizbeeAndroidPlugins = (config, props) => {
    if (!props.android) {
        props.android = {};
    }
    config = (0, add_maven_url_1.default)(config);
    config = (0, add_fonts_2.default)(config, {
        fontFolder: props.fontFolder,
    });
    config = (0, add_remote_activity_1.default)(config, {
        vizbeeAppId: props.vizbeeAppId,
    });
    config = (0, add_clear_text_traffic_1.default)(config);
    config = (0, add_cast_options_provider_1.default)(config, {
        chromecastAppId: props.chromecastAppId,
        language: props.android.language,
    });
    config = (0, add_vizbee_styles_xml_1.default)(config);
    config = (0, copy_color_and_style_xml_1.default)(config);
    config = (0, initialize_vizbee_2.default)(config, {
        vizbeeAppId: props.vizbeeAppId,
        layoutConfigFilePath: props.layoutConfigFilePath,
    });
    return config;
};
/**
 * Apply Vizbee plugins to both iOS and Android
 * @param config - The Expo config
 * @param props - Plugin options
 * @returns Modified config
 */
const withVizbee = (config, props) => {
    config = withVizbeeIosPlugins(config, props);
    config = withVizbeeAndroidPlugins(config, props);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withVizbee, "withVizbee", "1.0.0");
