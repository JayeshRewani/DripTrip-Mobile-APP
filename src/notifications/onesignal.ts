import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { ONESIGNAL_APP_ID, STORE_URL } from '../config/store';
import { classifyNavigation, isTrustedHost } from '../utils/navigation';

type ClickEventLike = {
  result?: { url?: string };
  notification?: {
    launchURL?: string;
    additionalData?: object;
  };
};

const SOFT_ASK_KEY = '@driptrip/notif_soft_ask_done';

export type NotificationOpenHandler = (url: string) => void;

let initialized = false;
let openHandler: NotificationOpenHandler | null = null;

/** True when an App ID is configured (push can be initialized). */
export function isPushConfigured(): boolean {
  return Boolean(ONESIGNAL_APP_ID && ONESIGNAL_APP_ID.trim().length > 0);
}

/**
 * Extract a store or trusted HTTPS URL from a OneSignal notification click.
 * Prefers launchURL, then click result URL, then additionalData.url / launch_url.
 */
export function extractNotificationUrl(event: ClickEventLike): string | null {
  const candidates: Array<string | undefined> = [
    event.notification?.launchURL,
    event.result?.url,
  ];
  const data = event.notification?.additionalData as
    | Record<string, unknown>
    | undefined;
  if (data) {
    for (const key of ['url', 'launchURL', 'launch_url', 'deep_link']) {
      const value = data[key];
      if (typeof value === 'string') {
        candidates.push(value);
      }
    }
  }

  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') {
      continue;
    }
    const url = raw.trim();
    if (!/^https:\/\//i.test(url)) {
      continue;
    }
    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (!isTrustedHost(hostname)) {
      continue;
    }
    const decision = classifyNavigation(url);
    if (decision.action === 'allow' || decision.action === 'upgradeHttps') {
      return decision.action === 'upgradeHttps' ? decision.url : url;
    }
  }
  return null;
}

export function setNotificationOpenHandler(handler: NotificationOpenHandler | null) {
  openHandler = handler;
}

/**
 * Initialize OneSignal once. Safe to call when App ID is empty (no-op).
 * Register the click listener so taps can deep-link into the WebView.
 */
export function initPushNotifications(): void {
  if (initialized || !isPushConfigured()) {
    return;
  }
  initialized = true;

  if (__DEV__) {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  }

  OneSignal.initialize(ONESIGNAL_APP_ID.trim());

  OneSignal.Notifications.addEventListener('click', (event: ClickEventLike) => {
    const url = extractNotificationUrl(event) ?? STORE_URL;
    openHandler?.(url);
  });
}

export async function hasCompletedSoftAsk(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SOFT_ASK_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markSoftAskDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(SOFT_ASK_KEY, '1');
  } catch {
    // ignore storage failures
  }
}

/** System permission prompt (Android 13+ / iOS). */
export async function requestPushPermission(
  fallbackToSettings = false,
): Promise<boolean> {
  if (!isPushConfigured()) {
    return false;
  }
  try {
    return await OneSignal.Notifications.requestPermission(fallbackToSettings);
  } catch {
    return false;
  }
}

export async function getPushPermission(): Promise<boolean> {
  if (!isPushConfigured()) {
    return false;
  }
  try {
    return await OneSignal.Notifications.getPermissionAsync();
  } catch {
    return false;
  }
}

export async function getPushOptedIn(): Promise<boolean> {
  if (!isPushConfigured()) {
    return false;
  }
  try {
    const permission = await OneSignal.Notifications.getPermissionAsync();
    const optedIn = await OneSignal.User.pushSubscription.getOptedInAsync();
    return Boolean(permission && optedIn);
  } catch {
    return false;
  }
}

/** Opt into push after permission is granted (Account toggle ON). */
export async function enablePush(): Promise<boolean> {
  if (!isPushConfigured()) {
    return false;
  }
  const granted = await requestPushPermission(true);
  if (granted) {
    OneSignal.User.pushSubscription.optIn();
  }
  await markSoftAskDone();
  return granted;
}

/** Opt out of OneSignal push (Account toggle OFF). Permission may still be on in system settings. */
export async function disablePush(): Promise<void> {
  if (!isPushConfigured()) {
    return;
  }
  OneSignal.User.pushSubscription.optOut();
  await markSoftAskDone();
}
