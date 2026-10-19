/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(async () => ({
      isConnected: true,
      isInternetReachable: true,
    })),
    addEventListener: jest.fn(() => () => {}),
  },
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, Path: View, Circle: View };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
  },
}));

jest.mock('react-native-onesignal', () => ({
  LogLevel: { Verbose: 6 },
  OneSignal: {
    initialize: jest.fn(),
    Debug: { setLogLevel: jest.fn() },
    Notifications: {
      addEventListener: jest.fn(),
      requestPermission: jest.fn(async () => false),
      getPermissionAsync: jest.fn(async () => false),
      canRequestPermission: jest.fn(async () => true),
    },
    User: {
      pushSubscription: {
        optIn: jest.fn(),
        optOut: jest.fn(),
        getOptedInAsync: jest.fn(async () => false),
      },
    },
  },
}));

import App from '../App';

test(
  'renders the store and native tab bar',
  async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<App />);
    });
    const labels = tree!.root
      .findAll(node => typeof node.type === 'string' && node.props.accessibilityRole === 'tab')
      .map(node => node.props.accessibilityLabel);
    expect(labels).toEqual(['Home', 'Shop', 'Search', 'Cart', 'Account']);
    await ReactTestRenderer.act(() => {
      tree!.unmount();
    });
  },
  20000,
);
