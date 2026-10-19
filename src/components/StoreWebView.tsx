import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewProgressEvent,
} from 'react-native-webview/lib/WebViewTypes';
import NetInfo from '@react-native-community/netinfo';
import { STORE_LINKS, STORE_URL } from '../config/store';
import {
  classifyNavigation,
  isStorePage,
  resolveIntentUrl,
} from '../utils/navigation';
import {
  BACK_PRESS_SCRIPT,
  CART_WATCH_SCRIPT,
  parseBridgeMessage,
} from '../utils/bridge';
import { ErrorScreen } from './ErrorScreen';
import { LoadingOverlay } from './LoadingOverlay';
import { PageSpinner } from './PageSpinner';
// RN 0.87 + react-native-webview 14 typings currently collapse props to `never`.
// Runtime API is unchanged; keep a typed escape hatch until upstream fixes land.
const WebView = RNWebView as any;

type WebViewRef = {
  goBack: () => void;
  reload: () => void;
  injectJavaScript: (script: string) => void;
};

export type StoreWebViewHandle = {
  navigate: (url: string) => void;
  reload: () => void;
};

type Props = {
  ref?: Ref<StoreWebViewHandle>;
  onUrlChange?: (url: string) => void;
  onCartCount?: (count: number) => void;
  onReady?: () => void;
};

const OFFLINE_MESSAGE =
  'No internet connection. Connect to Wi‑Fi or mobile data, then try again.';

// Theme overlays report back within a few ms; this only covers pages that never answer.
const BACK_SCRIPT_TIMEOUT_MS = 350;

// canOpenURL is skipped on purpose: on Android 11+ it returns false for any scheme
// not declared in <queries> (e.g. upi://), even when an app can handle it.
async function openExternally(url: string): Promise<void> {
  for (const candidate of resolveIntentUrl(url)) {
    try {
      await Linking.openURL(candidate);
      return;
    } catch {
      // try the next candidate
    }
  }
  const isPayment = /^(upi|intent|tez|phonepe|paytmmp|gpay|credpay):/i.test(url);
  Alert.alert(
    isPayment ? 'Payment app not found' : 'Unable to open link',
    isPayment
      ? 'Install a UPI app (Google Pay, PhonePe, Paytm…) or choose another payment method.'
      : 'This link could not be opened on your device.',
  );
}

const SUBFRAME_SAFE_SCHEMES = /^(https?|about|data|blob):/i;

function isOnline(state: { isConnected: boolean | null; isInternetReachable: boolean | null }) {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function StoreWebView({ ref, onUrlChange, onCartCount, onReady }: Props) {
  const webRef = useRef<WebViewRef>(null);
  const [sourceUrl, setSourceUrl] = useState<string>(STORE_URL);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const initialLoadDone = useRef(false);
  const canGoBackRef = useRef(false);
  const currentUrlRef = useRef<string>(STORE_URL);
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasErrorRef = useRef(false);
  hasErrorRef.current = hasError;

  const remount = useCallback((url: string) => {
    setHasError(false);
    setErrorMessage(undefined);
    setLoading(true);
    setPageLoading(false);
    initialLoadDone.current = false;
    setSourceUrl(url);
    setReloadKey(k => k + 1);
  }, []);

  const retry = useCallback(async () => {
    let online = true;
    try {
      online = isOnline(await NetInfo.fetch());
    } catch {
      // assume online and let the WebView report the real error
    }
    if (!online) {
      setHasError(true);
      setErrorMessage(OFFLINE_MESSAGE);
      setLoading(false);
      return;
    }
    remount(isStorePage(currentUrlRef.current) ? currentUrlRef.current : STORE_URL);
  }, [remount]);

  const navigate = useCallback(
    (url: string) => {
      if (hasErrorRef.current || !webRef.current) {
        remount(url);
        return;
      }
      webRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
    },
    [remount],
  );

  useImperativeHandle(ref, () => ({ navigate, reload: retry }), [navigate, retry]);

  const goBackOrExit = useCallback(() => {
    const current = currentUrlRef.current.split(/[?#]/)[0].replace(/\/$/, '');
    const onHome = current === STORE_URL;
    if (!onHome && canGoBackRef.current && webRef.current) {
      webRef.current.goBack();
      return;
    }
    if (!onHome && isStorePage(current)) {
      navigate(STORE_LINKS.home);
      return;
    }
    Alert.alert('Exit DripTrip?', 'Close the app and leave the store?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
    ]);
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (hasErrorRef.current) {
      if (canGoBackRef.current) {
        setHasError(false);
        webRef.current?.goBack();
      } else {
        goBackOrExit();
      }
      return true;
    }
    if (webRef.current && isStorePage(currentUrlRef.current)) {
      if (backTimer.current) {
        clearTimeout(backTimer.current);
      }
      backTimer.current = setTimeout(() => {
        backTimer.current = null;
        goBackOrExit();
      }, BACK_SCRIPT_TIMEOUT_MS);
      webRef.current.injectJavaScript(BACK_PRESS_SCRIPT);
      return true;
    }
    goBackOrExit();
    return true;
  }, [goBackOrExit]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [handleBack]);

  useEffect(
    () => () => {
      if (backTimer.current) {
        clearTimeout(backTimer.current);
      }
    },
    [],
  );

  // Connectivity: show a banner while offline and recover automatically when the
  // connection returns if the last load failed.
  useEffect(() => {
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = isOnline(state);
      setOffline(!online);
      if (online && wasOffline && hasErrorRef.current) {
        retry();
      }
      wasOffline = !online;
    });
    return unsubscribe;
  }, [retry]);

  // Lifecycle: on resume, refresh the cart badge (it may have changed on another
  // device) and retry a failed load.
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active') {
        return;
      }
      if (hasErrorRef.current) {
        retry();
      } else {
        webRef.current?.injectJavaScript(
          'window.__driptripCartWatch && window.__driptripCartWatch(); true;',
        );
      }
    });
    return () => sub.remove();
  }, [retry]);

  const handleShouldStart = useCallback((request: ShouldStartLoadRequest): boolean => {
    if (!request.url || request.url === 'about:blank') {
      return true;
    }

    // Iframes (Shopify card fields, reviews, videos, pixels) are part of the current page;
    // only top-level navigations are gated by the allowlist.
    if (request.isTopFrame === false && SUBFRAME_SAFE_SCHEMES.test(request.url)) {
      return true;
    }

    const decision = classifyNavigation(request.url);

    switch (decision.action) {
      case 'allow':
        return true;
      case 'upgradeHttps':
        webRef.current?.injectJavaScript(
          `window.location.href = ${JSON.stringify(decision.url)}; true;`,
        );
        return false;
      case 'block':
        return false;
      case 'openNative':
        openExternally(decision.url);
        return false;
      case 'openExternal':
        openExternally(request.url);
        return false;
      default:
        return false;
    }
  }, []);

  const handleOpenWindow = useCallback(
    (syntheticEvent: { nativeEvent: { targetUrl: string } }) => {
      const targetUrl = syntheticEvent.nativeEvent.targetUrl;
      const decision = classifyNavigation(targetUrl);
      if (decision.action === 'allow' || decision.action === 'upgradeHttps') {
        const url = decision.action === 'upgradeHttps' ? decision.url : targetUrl;
        webRef.current?.injectJavaScript(
          `window.location.href = ${JSON.stringify(url)}; true;`,
        );
        return;
      }
      if (decision.action === 'openNative' || decision.action === 'openExternal') {
        openExternally(decision.action === 'openNative' ? decision.url : targetUrl);
      }
    },
    [],
  );

  const handleNavChange = useCallback(
    (navState: WebViewNavigation) => {
      canGoBackRef.current = navState.canGoBack;
      if (navState.url && navState.url !== currentUrlRef.current) {
        currentUrlRef.current = navState.url;
        onUrlChange?.(navState.url);
      }
    },
    [onUrlChange],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseBridgeMessage(event.nativeEvent.url, event.nativeEvent.data);
      if (!message) {
        return;
      }
      if (message.type === 'cart') {
        onCartCount?.(message.count);
        return;
      }
      if (backTimer.current) {
        clearTimeout(backTimer.current);
        backTimer.current = null;
        if (!message.handled) {
          goBackOrExit();
        }
      }
    },
    [goBackOrExit, onCartCount],
  );

  const handleLoadEnd = useCallback(() => {
    setPageLoading(false);
    if (!hasErrorRef.current) {
      setLoading(false);
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        onReady?.();
      }
    }
  }, [onReady]);

  const handleError = useCallback((event: WebViewErrorEvent) => {
    const { description, code } = event.nativeEvent;
    setLoading(false);
    setPageLoading(false);
    setHasError(true);
    NetInfo.fetch()
      .then(state => {
        setErrorMessage(
          !isOnline(state)
            ? OFFLINE_MESSAGE
            : description
              ? `${description}${code != null ? ` (${code})` : ''}`
              : 'The storefront failed to load.',
        );
      })
      .catch(() => setErrorMessage('The storefront failed to load.'));
  }, []);

  const handleHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    const { statusCode, url } = event.nativeEvent;
    if (statusCode >= 500 && isStorePage(url)) {
      setLoading(false);
      setHasError(true);
      setErrorMessage(`The store is temporarily unavailable (HTTP ${statusCode}). Please try again.`);
    }
  }, []);

  const recoverFromCrash = useCallback(() => {
    remount(isStorePage(currentUrlRef.current) ? currentUrlRef.current : STORE_URL);
  }, [remount]);

  const showPageSpinner = pageLoading && initialLoadDone.current && !hasError;

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        ref={webRef}
        source={{ uri: sourceUrl }}
        style={styles.webview}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows
        injectedJavaScript={CART_WATCH_SCRIPT}
        onMessage={handleMessage}
        onOpenWindow={handleOpenWindow}
        onShouldStartLoadWithRequest={handleShouldStart}
        onNavigationStateChange={handleNavChange}
        onLoadStart={() => {
          setPageLoading(true);
          if (!initialLoadDone.current) {
            setLoading(true);
          }
        }}
        onLoadProgress={(event: WebViewProgressEvent) => {
          if (event.nativeEvent.progress >= 1) {
            setPageLoading(false);
          }
        }}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onRenderProcessGone={recoverFromCrash}
        onContentProcessDidTerminate={() => webRef.current?.reload()}
        startInLoadingState={false}
        originWhitelist={['https://*', 'http://*', 'about:blank']}
        setBuiltInZoomControls={false}
        scalesPageToFit
        nestedScrollEnabled
        keyboardDisplayRequiresUserAction={false}
        applicationNameForUserAgent="DripTripApp/1.0"
        webviewDebuggingEnabled={__DEV__}
      />

      <PageSpinner visible={showPageSpinner} />

      {offline && !hasError ? (
        <View style={styles.offlineBanner} accessibilityLiveRegion="polite">
          <Text style={styles.offlineText}>You're offline. Some pages may not load.</Text>
        </View>
      ) : null}

      <LoadingOverlay visible={loading && !hasError} />
      {hasError ? (
        <ErrorScreen
          title={errorMessage === OFFLINE_MESSAGE ? "You're offline" : undefined}
          message={errorMessage}
          onRetry={retry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  offlineBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111111',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 6,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
});
