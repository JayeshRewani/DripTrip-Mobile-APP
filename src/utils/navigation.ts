import {
  BLOCKED_SCHEMES,
  NATIVE_SCHEMES,
  STORE_HOSTS,
  TRUSTED_HOST_SUFFIXES,
} from '../config/store';

export type NavigationDecision =
  | { action: 'allow' }
  | { action: 'openExternal' }
  | { action: 'openNative'; url: string }
  | { action: 'upgradeHttps'; url: string }
  | { action: 'block' };

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getScheme(url: string): string | null {
  try {
    const scheme = new URL(url).protocol.replace(':', '').toLowerCase();
    return scheme || null;
  } catch {
    // Relative or malformed — treat as in-app when WebView already resolved it.
    return null;
  }
}

export function isStoreHost(hostname: string): boolean {
  return STORE_HOSTS.some((host) => hostname === host);
}

export function isTrustedHost(hostname: string): boolean {
  if (isStoreHost(hostname)) return true;
  return TRUSTED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

/**
 * Decide how a navigation request should be handled.
 * Keep storefront + Shopify checkout/payment flows in-WebView.
 * Open unrelated https links externally. Handle tel/mailto natively.
 */
export function classifyNavigation(url: string): NavigationDecision {
  if (!url || url === 'about:blank') {
    return { action: 'allow' };
  }

  // Ignore fragment-only / empty SPA noise
  if (url.startsWith('#')) {
    return { action: 'allow' };
  }

  const scheme = getScheme(url);

  if (scheme && (BLOCKED_SCHEMES as readonly string[]).includes(scheme)) {
    return { action: 'block' };
  }

  if (scheme && (NATIVE_SCHEMES as readonly string[]).includes(scheme)) {
    return { action: 'openNative', url };
  }

  // Intent / custom app schemes → system handler when possible
  if (scheme && scheme !== 'http' && scheme !== 'https') {
    return { action: 'openNative', url };
  }

  const hostname = getHostname(url);
  if (!hostname) {
    return { action: 'allow' };
  }

  if (isTrustedHost(hostname)) {
    // Cleartext is disabled app-wide; keep trusted links working over HTTPS.
    if (scheme === 'http') {
      return { action: 'upgradeHttps', url: `https://${url.slice('http://'.length)}` };
    }
    return { action: 'allow' };
  }

  return { action: 'openExternal' };
}

/** True for pages on the DripTrip storefront itself (not checkout or third parties). */
export function isStorePage(url: string | undefined): boolean {
  if (!url) return false;
  const hostname = getHostname(url);
  if (!hostname || !isStoreHost(hostname)) return false;
  return !/^\/(checkouts|\d+\/checkouts)\//.test(new URL(url).pathname);
}

/** Checkout / payment pages where native chrome should stay out of the way. */
export function isCheckoutFlow(url: string | undefined): boolean {
  if (!url) return false;
  const hostname = getHostname(url);
  if (!hostname) return false;
  if (isStoreHost(hostname)) {
    return /^\/(checkouts|\d+\/checkouts|\d+\/orders)\//.test(new URL(url).pathname);
  }
  return isTrustedHost(hostname);
}

/**
 * Converts an Android `intent://` URL (used by UPI apps and some payment pages)
 * into URLs that `Linking.openURL` can launch, in order of preference.
 */
export function resolveIntentUrl(url: string): string[] {
  if (!url.startsWith('intent://')) {
    return [url];
  }
  const hashIndex = url.indexOf('#Intent;');
  const body = url.slice('intent://'.length, hashIndex === -1 ? undefined : hashIndex);
  const extras = hashIndex === -1 ? '' : url.slice(hashIndex + '#Intent;'.length);

  const params: Record<string, string> = {};
  for (const part of extras.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      params[part.slice(0, eq)] = decodeURIComponent(part.slice(eq + 1));
    }
  }

  const candidates: string[] = [];
  if (params.scheme) {
    candidates.push(`${params.scheme}://${body}`);
  }
  const fallback = params['S.browser_fallback_url'];
  if (fallback && /^https?:\/\//i.test(fallback)) {
    candidates.push(fallback);
  }
  if (params.package) {
    candidates.push(`market://details?id=${params.package}`);
  }
  return candidates;
}
