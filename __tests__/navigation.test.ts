import { STORE_URL } from '../src/config/store';
import { parseBridgeMessage } from '../src/utils/bridge';
import {
  classifyNavigation,
  isCheckoutFlow,
  isStorePage,
  resolveIntentUrl,
} from '../src/utils/navigation';

describe('store config', () => {
  it('points at the DripTrip storefront over HTTPS', () => {
    expect(STORE_URL).toBe('https://www.driptrip.in');
    expect(classifyNavigation(STORE_URL).action).toBe('allow');
  });
});

describe('https upgrade', () => {
  it('upgrades trusted http links instead of loading cleartext', () => {
    expect(classifyNavigation('http://www.driptrip.in/cart')).toEqual({
      action: 'upgradeHttps',
      url: 'https://www.driptrip.in/cart',
    });
  });

  it('sends untrusted http links to the browser', () => {
    expect(classifyNavigation('http://example.com/').action).toBe('openExternal');
  });
});

describe('page type', () => {
  it.each([
    ['https://www.driptrip.in/', true, false],
    ['https://www.driptrip.in/cart', true, false],
    ['https://www.driptrip.in/checkouts/cn/abc/en-in', false, true],
    ['https://www.driptrip.in/7012345/checkouts/abc', false, true],
    ['https://shopify.com/authentication/123/login', false, true],
    ['https://api.razorpay.com/v1/checkout', false, true],
    ['https://www.instagram.com/', false, false],
  ])('%s store=%s checkout=%s', (url, store, checkout) => {
    expect(isStorePage(url)).toBe(store);
    expect(isCheckoutFlow(url)).toBe(checkout);
  });
});

describe('parseBridgeMessage', () => {
  const store = 'https://www.driptrip.in/products/x';

  it('accepts valid cart and back messages from the storefront', () => {
    expect(parseBridgeMessage(store, '{"type":"cart","count":3}')).toEqual({ type: 'cart', count: 3 });
    expect(parseBridgeMessage(store, '{"type":"back","handled":true}')).toEqual({
      type: 'back',
      handled: true,
    });
  });

  it('ignores messages from other origins', () => {
    expect(parseBridgeMessage('https://evil.example.com/', '{"type":"cart","count":3}')).toBeNull();
    expect(parseBridgeMessage('https://api.razorpay.com/', '{"type":"back","handled":false}')).toBeNull();
    expect(parseBridgeMessage(undefined, '{"type":"cart","count":3}')).toBeNull();
  });

  it('ignores unknown or malformed payloads', () => {
    expect(parseBridgeMessage(store, '{"type":"openUrl","url":"x"}')).toBeNull();
    expect(parseBridgeMessage(store, '{"type":"cart","count":-1}')).toBeNull();
    expect(parseBridgeMessage(store, '{"type":"cart","count":"3"}')).toBeNull();
    expect(parseBridgeMessage(store, 'not json')).toBeNull();
  });
});

describe('classifyNavigation', () => {
  it.each([
    ['https://www.driptrip.in/products/x', 'allow'],
    ['https://driptrip.in/cart', 'allow'],
    ['https://www.driptrip.in/checkouts/cn/abc/en-in', 'allow'],
    ['https://www.driptrip.in/account/login', 'allow'],
    ['https://checkout.pci.shopifyinc.com/build/abc', 'allow'],
    ['https://shop.app/pay', 'allow'],
    ['https://foo.myshopify.com/checkouts/x', 'allow'],
    ['https://api.razorpay.com/v1/checkout', 'allow'],
    ['https://evil.example.com/phish', 'openExternal'],
    ['https://www.instagram.com/driptrip.in', 'openExternal'],
    ['tel:+911234567890', 'openNative'],
    ['mailto:hi@driptrip.in', 'openNative'],
    ['upi://pay?pa=merchant@upi&am=1', 'openNative'],
    ['intent://pay?pa=x#Intent;scheme=upi;package=com.phonepe.app;end', 'openNative'],
    ['javascript:alert(1)', 'block'],
    ['file:///etc/hosts', 'block'],
  ])('%s -> %s', (url, expected) => {
    expect(classifyNavigation(url).action).toBe(expected);
  });

  it('rejects look-alike hosts', () => {
    expect(classifyNavigation('https://driptrip.in.evil.com/').action).toBe('openExternal');
    expect(classifyNavigation('https://notdriptrip.in/').action).toBe('openExternal');
  });
});

describe('resolveIntentUrl', () => {
  it('passes normal URLs through', () => {
    expect(resolveIntentUrl('upi://pay?pa=a@b')).toEqual(['upi://pay?pa=a@b']);
  });

  it('converts intent:// to scheme URL, fallback and Play Store', () => {
    const url =
      'intent://pay?pa=a@b&am=10#Intent;scheme=upi;package=com.phonepe.app;' +
      'S.browser_fallback_url=https%3A%2F%2Fexample.com%2Ff;end';
    expect(resolveIntentUrl(url)).toEqual([
      'upi://pay?pa=a@b&am=10',
      'https://example.com/f',
      'market://details?id=com.phonepe.app',
    ]);
  });
});
