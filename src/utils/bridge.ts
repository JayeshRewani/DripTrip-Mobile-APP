import { isStoreHost } from './navigation';

/**
 * One-way, read-only messages from storefront pages to native UI.
 * Nothing here grants a page any native capability: the app only reads a cart
 * count and whether the back press closed a theme overlay.
 */
export type BridgeMessage =
  | { type: 'cart'; count: number }
  | { type: 'back'; handled: boolean };

export function parseBridgeMessage(
  sourceUrl: string | undefined,
  data: string,
): BridgeMessage | null {
  if (!sourceUrl) return null;
  let hostname: string;
  try {
    hostname = new URL(sourceUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!isStoreHost(hostname) || data.length > 200) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const msg = parsed as Record<string, unknown>;

  if (
    msg.type === 'cart' &&
    typeof msg.count === 'number' &&
    Number.isInteger(msg.count) &&
    msg.count >= 0 &&
    msg.count < 10000
  ) {
    return { type: 'cart', count: msg.count };
  }
  if (msg.type === 'back' && typeof msg.handled === 'boolean') {
    return { type: 'back', handled: msg.handled };
  }
  return null;
}

/**
 * Runs after each storefront page load. Reports the cart item count and
 * refreshes it whenever the theme calls the Shopify cart AJAX API.
 *
 * Also hides the Clevercat "Login with Google" button: Google refuses OAuth
 * inside embedded WebViews, and the popup would sign the customer in to the
 * system browser instead of the app. Email/password login is unaffected.
 */
export const CART_WATCH_SCRIPT = `
(function () {
  var host = location.hostname.toLowerCase();
  if (host !== 'driptrip.in' && host !== 'www.driptrip.in') return;
  if (!document.getElementById('driptrip-app-style')) {
    var style = document.createElement('style');
    style.id = 'driptrip-app-style';
    style.textContent = '.clevercat-auth__google-btn-wrapper{display:none!important}';
    (document.head || document.documentElement).appendChild(style);
  }
  if (window.__driptripCartWatch) { window.__driptripCartWatch(); return; }
  function post(count) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cart', count: count }));
    }
  }
  function refresh() {
    fetch('/cart.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cart) { if (cart && typeof cart.item_count === 'number') post(cart.item_count); })
      .catch(function () {});
  }
  window.__driptripCartWatch = refresh;
  var originalFetch = window.fetch;
  window.fetch = function (input) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var result = originalFetch.apply(this, arguments);
    if (/\\/cart\\/(add|change|update|clear)/.test(url)) {
      result.then(function () { setTimeout(refresh, 150); }).catch(function () {});
    }
    return result;
  };
  refresh();
})();
true;
`;

/**
 * Closes an open theme overlay (cart drawer, menu drawer, search, modal)
 * and reports whether one was closed so native back can decide what to do.
 */
export const BACK_PRESS_SCRIPT = `
(function () {
  var handled = false;
  try {
    var cart = document.querySelector('cart-drawer.active');
    if (cart && typeof cart.close === 'function') { cart.close(); handled = true; }
    if (!handled && document.querySelector('#cart-notification.active')) {
      var note = document.querySelector('cart-notification');
      if (note && typeof note.close === 'function') { note.close(); handled = true; }
    }
    if (!handled) {
      var menu = document.querySelector('header-drawer details.menu-opening, menu-drawer details.menu-opening');
      var menuHost = menu && menu.closest('header-drawer, menu-drawer');
      if (menuHost && typeof menuHost.closeMenuDrawer === 'function') {
        menuHost.closeMenuDrawer(new Event('close'));
        handled = true;
      }
    }
    if (!handled) {
      var details = document.querySelector('details-modal details[open]');
      var detailsHost = details && details.closest('details-modal');
      if (detailsHost && typeof detailsHost.close === 'function') { detailsHost.close(false); handled = true; }
    }
    if (!handled) {
      var dialog = document.querySelector('modal-dialog[open]');
      if (dialog && typeof dialog.hide === 'function') { dialog.hide(); handled = true; }
    }
  } catch (e) {}
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'back', handled: handled }));
  }
})();
true;
`;
