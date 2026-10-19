/**
 * Storefront configuration for the DripTrip WebView wrapper.
 * The live Shopify storefront remains the source of truth.
 */

export const STORE_URL = 'https://www.driptrip.in';
export const STORE_DISPLAY_NAME = 'DripTrip';

/** Keep in sync with versionName in android/app/build.gradle and MARKETING_VERSION on iOS. */
export const APP_VERSION = '1.0.2';

/** Store pages reachable from native UI (tab bar / More sheet). */
export const STORE_LINKS = {
  home: `${STORE_URL}/`,
  shop: `${STORE_URL}/collections/all`,
  search: `${STORE_URL}/search`,
  cart: `${STORE_URL}/cart`,
  account: `${STORE_URL}/account`,
  login: `${STORE_URL}/account/login`,
  privacy: `${STORE_URL}/policies/privacy-policy`,
  terms: `${STORE_URL}/policies/terms-of-service`,
  refund: `${STORE_URL}/policies/refund-policy`,
  shipping: `${STORE_URL}/policies/shipping-policy`,
  contact: `${STORE_URL}/policies/contact-information`,
} as const;

export const SUPPORT_EMAIL = 'Veejay@driptrip.in';
export const SUPPORT_PHONE = '+918847224835';

/**
 * OneSignal App ID (public client id, not a secret).
 * Leave empty until you create the OneSignal app — the SDK stays inactive.
 * Paste the ID from OneSignal → Settings → Keys & IDs. See docs/PUSH_NOTIFICATIONS.md.
 */
export const ONESIGNAL_APP_ID: string = '';

/** Primary storefront hosts (apex + www). */
export const STORE_HOSTS = ['driptrip.in', 'www.driptrip.in'] as const;

/**
 * Host suffixes kept inside the WebView for Shopify checkout,
 * customer accounts, Shop Pay, and common payment-provider redirects.
 * Unrelated hosts open in the system browser.
 */
export const TRUSTED_HOST_SUFFIXES = [
  // Storefront
  'driptrip.in',
  // Shopify core / checkout / CDN navigations
  'myshopify.com',
  'shopify.com',
  'shopifycs.com',
  'shop.app',
  'shopifysvc.com',
  'shopifycloud.com',
  'shopifycdn.com',
  'shopifyinc.com',
  // Customer accounts (new + classic)
  'account.shopify.com',
  // Common payment / wallet redirects used by Shopify checkouts
  'paypal.com',
  'paypalobjects.com',
  'stripe.com',
  'stripe.network',
  'razorpay.com',
  'razorpay.in',
  'payu.in',
  'payumoney.com',
  'cashfree.com',
  'phonepe.com',
  'gpay.com',
  'google.com', // Google Pay / 3DS frames occasionally host here
  'payments.google.com',
  'checkout.google.com',
  'pay.google.com',
  'apple.com',
  'klarna.com',
  'afterpay.com',
  'affirm.com',
] as const;

/** Schemes handled natively instead of inside the WebView. */
export const NATIVE_SCHEMES = ['tel', 'mailto', 'sms', 'geo'] as const;

/** Schemes that are never allowed to navigate. */
export const BLOCKED_SCHEMES = ['javascript', 'data', 'file', 'blob'] as const;
