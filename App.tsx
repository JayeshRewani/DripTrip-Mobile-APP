import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MoreSheet } from './src/components/MoreSheet';
import { NotificationPrompt } from './src/components/NotificationPrompt';
import { StoreWebView, type StoreWebViewHandle } from './src/components/StoreWebView';
import { TabBar, type TabKey } from './src/components/TabBar';
import { STORE_LINKS, STORE_URL } from './src/config/store';
import {
  enablePush,
  hasCompletedSoftAsk,
  initPushNotifications,
  isPushConfigured,
  markSoftAskDone,
  setNotificationOpenHandler,
} from './src/notifications/onesignal';
import { isCheckoutFlow, isStorePage } from './src/utils/navigation';

function tabForUrl(url: string): TabKey | null {
  if (!isStorePage(url)) return null;
  const path = new URL(url).pathname;
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/collections') || path.startsWith('/products')) return 'shop';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/cart')) return 'cart';
  if (path.startsWith('/account')) return 'more';
  return null;
}

function App() {
  const webRef = useRef<StoreWebViewHandle>(null);
  const pendingUrl = useRef<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(STORE_URL);
  const [cartCount, setCartCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [softAskVisible, setSoftAskVisible] = useState(false);
  const [webReady, setWebReady] = useState(false);

  const navigate = useCallback((url: string) => {
    if (!webRef.current) {
      pendingUrl.current = url;
      return;
    }
    webRef.current.navigate(url);
  }, []);

  const onWebReady = useCallback(() => {
    setWebReady(true);
    if (pendingUrl.current) {
      const url = pendingUrl.current;
      pendingUrl.current = null;
      webRef.current?.navigate(url);
    }
  }, []);

  useEffect(() => {
    initPushNotifications();
    setNotificationOpenHandler(url => navigate(url));
    return () => setNotificationOpenHandler(null);
  }, [navigate]);

  useEffect(() => {
    if (!isPushConfigured()) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      hasCompletedSoftAsk().then(done => {
        if (!cancelled && !done) {
          setSoftAskVisible(true);
        }
      });
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleTab = useCallback(
    (tab: TabKey) => {
      if (tab === 'more') {
        setMoreOpen(true);
        return;
      }
      navigate(STORE_LINKS[tab]);
    },
    [navigate],
  );

  const onAllowNotifications = useCallback(async () => {
    setSoftAskVisible(false);
    await enablePush();
  }, []);

  const onNotNowNotifications = useCallback(async () => {
    setSoftAskVisible(false);
    await markSoftAskDone();
  }, []);

  const showTabs = !keyboardVisible && !isCheckoutFlow(currentUrl);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <StoreWebView
          ref={webRef}
          onUrlChange={setCurrentUrl}
          onCartCount={setCartCount}
          onReady={onWebReady}
        />
        {showTabs ? (
          <TabBar active={tabForUrl(currentUrl)} cartCount={cartCount} onSelect={handleTab} />
        ) : null}
        <MoreSheet
          visible={moreOpen}
          currentUrl={currentUrl}
          onClose={() => setMoreOpen(false)}
          onNavigate={navigate}
        />
        <NotificationPrompt
          visible={softAskVisible && webReady}
          onAllow={onAllowNotifications}
          onNotNow={onNotNowNotifications}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
});

export default App;
