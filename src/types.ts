export enum LOCK_SCREEN_ACTION_BUTTON {
  ACTION_REWIND = "MediaIntentReceiver.ACTION_REWIND",
  ACTION_TOGGLE_PLAYBACK = "MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK",
  ACTION_FORWARD = "MediaIntentReceiver.ACTION_FORWARD",
  ACTION_STOP_CASTING = "MediaIntentReceiver.ACTION_STOP_CASTING",
}

export interface VizbeePluginOptions {
  fontFolder?: string;
  vizbeeAppId: string;
  chromecastAppId: string;
  layoutConfigFilePath?: string;
  ios?: VizbeePluginIosOptions;
  android?: VizbeePluginAndroidOptions;
}

export interface VizbeePluginAndroidOptions {
  language?: "kotlin" | "java";
  nativeSdkVersion?: string;
  lockScreenControls?: {
    buttonActions?: string[];
    skipInMs?: number;
  };
  enableLockScreenControl?: boolean;
  enableLaunchOptions?: boolean;
}

export interface VizbeePluginIosOptions {
  target?: string;
  lnaPermissionText?: string;
  language?: "objcpp" | "swift";
  googleCastVersion?: string;
  addGoogleCastToPods?: boolean;
}
