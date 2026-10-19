jest.mock('react-native-onesignal', () => ({
  LogLevel: { Verbose: 6 },
  OneSignal: {
    initialize: jest.fn(),
    Debug: { setLogLevel: jest.fn() },
    Notifications: { addEventListener: jest.fn() },
    User: { pushSubscription: {} },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
  },
}));

import { extractNotificationUrl } from '../src/notifications/onesignal';

describe('extractNotificationUrl', () => {
  it('prefers launchURL on trusted store hosts', () => {
    expect(
      extractNotificationUrl({
        notification: { launchURL: 'https://www.driptrip.in/collections/all' },
      }),
    ).toBe('https://www.driptrip.in/collections/all');
  });

  it('reads url from additionalData', () => {
    expect(
      extractNotificationUrl({
        notification: {
          additionalData: { url: 'https://www.driptrip.in/products/x' },
        },
      }),
    ).toBe('https://www.driptrip.in/products/x');
  });

  it('accepts click result url', () => {
    expect(
      extractNotificationUrl({
        result: { url: 'https://driptrip.in/cart' },
        notification: {},
      }),
    ).toBe('https://driptrip.in/cart');
  });

  it('rejects untrusted hosts', () => {
    expect(
      extractNotificationUrl({
        notification: { launchURL: 'https://evil.example.com/phish' },
      }),
    ).toBeNull();
  });

  it('rejects non-https schemes', () => {
    expect(
      extractNotificationUrl({
        notification: { launchURL: 'javascript:alert(1)' },
      }),
    ).toBeNull();
  });
});
