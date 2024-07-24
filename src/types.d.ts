export interface VizbeePluginOptions {
  fontFolder?: string;
  vizbeeAppId: string;
  chromecastAppId: string;
  layoutConfigFilePath?: string;
  ios?: {
    target?: string;
    lnaPermissionText?: string;
    language?: "objcpp" | "swift";
    googleCastVersion?: string;
    addGoogleCastToPods?: boolean;
  };
  android?: {
    language?: "kotlin" | "java";
    nativeSdkVersion?: string;
  };
}
