import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  APP_VERSION,
  STORE_DISPLAY_NAME,
  STORE_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from '../config/store';
import {
  disablePush,
  enablePush,
  getPushOptedIn,
  isPushConfigured,
} from '../notifications/onesignal';

type Props = {
  visible: boolean;
  currentUrl: string;
  onClose: () => void;
  onNavigate: (url: string) => void;
};

type Row = { label: string; hint?: string; onPress: () => void; destructive?: boolean };

function openSafely(url: string) {
  Linking.openURL(url).catch(() =>
    Alert.alert('Unable to open', `Please contact us at ${SUPPORT_EMAIL}.`),
  );
}

export function requestAccountDeletion() {
  Alert.alert(
    'Delete your DripTrip account?',
    'We will email our support team to permanently delete your customer account and associated personal data. ' +
      'Order records we must keep for tax or legal reasons are retained only as long as required. ' +
      'Send the request from the email address linked to your account.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request deletion',
        style: 'destructive',
        onPress: () => {
          const subject = encodeURIComponent('Account deletion request');
          const body = encodeURIComponent(
            'Hi DripTrip team,\n\nPlease permanently delete my DripTrip customer account and associated personal data.\n\n' +
              'Account email: \nName: \n\nI understand this cannot be undone.\n\n(Sent from the DripTrip Android/iOS app)',
          );
          openSafely(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
        },
      },
    ],
  );
}

export function MoreSheet({ visible, currentUrl, onClose, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const pushReady = isPushConfigured();
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [toggling, setToggling] = useState(false);

  const refreshOptIn = useCallback(async () => {
    if (!pushReady) {
      setNotificationsOn(false);
      return;
    }
    setNotificationsOn(await getPushOptedIn());
  }, [pushReady]);

  useEffect(() => {
    if (visible) {
      refreshOptIn();
    }
  }, [visible, refreshOptIn]);

  const onToggleNotifications = useCallback(
    async (next: boolean) => {
      if (!pushReady || toggling) {
        return;
      }
      setToggling(true);
      try {
        if (next) {
          const ok = await enablePush();
          setNotificationsOn(ok);
          if (!ok) {
            Alert.alert(
              'Notifications blocked',
              'Enable notifications for DripTrip in your phone Settings, then try again.',
            );
          }
        } else {
          await disablePush();
          setNotificationsOn(false);
        }
      } finally {
        setToggling(false);
      }
    },
    [pushReady, toggling],
  );

  const go = (url: string) => () => {
    onClose();
    onNavigate(url);
  };

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Account',
      rows: [
        { label: 'My account & orders', onPress: go(STORE_LINKS.account) },
        { label: 'Sign in / create account', onPress: go(STORE_LINKS.login) },
        {
          label: 'Delete my account',
          hint: 'Request permanent deletion of your account and data',
          destructive: true,
          onPress: () => {
            onClose();
            requestAccountDeletion();
          },
        },
      ],
    },
    {
      title: 'Help',
      rows: [
        { label: `Email ${SUPPORT_EMAIL}`, onPress: () => openSafely(`mailto:${SUPPORT_EMAIL}`) },
        { label: 'Call customer support', onPress: () => openSafely(`tel:${SUPPORT_PHONE}`) },
        {
          label: 'Share this page',
          onPress: () => {
            onClose();
            Share.share({ message: currentUrl, url: currentUrl }).catch(() => {});
          },
        },
      ],
    },
    {
      title: 'Policies',
      rows: [
        { label: 'Privacy policy', onPress: go(STORE_LINKS.privacy) },
        { label: 'Terms of service', onPress: go(STORE_LINKS.terms) },
        { label: 'Refund policy', onPress: go(STORE_LINKS.refund) },
        { label: 'Shipping policy', onPress: go(STORE_LINKS.shipping) },
      ],
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.handle} />
        <ScrollView>
          {sections.map(section => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.rows.map(row => (
                <Pressable
                  key={row.label}
                  accessibilityRole="button"
                  onPress={row.onPress}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={[styles.rowLabel, row.destructive && styles.destructive]}>
                    {row.label}
                  </Text>
                  {row.hint ? <Text style={styles.rowHint}>{row.hint}</Text> : null}
                </Pressable>
              ))}
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.row}>
              <View style={styles.toggleCopy}>
                <Text style={styles.rowLabel}>Push notifications</Text>
                <Text style={styles.rowHint}>
                  {pushReady
                    ? 'Offers and updates from DripTrip'
                    : 'Not configured yet — add OneSignal App ID (see docs)'}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Push notifications"
                value={notificationsOn}
                onValueChange={onToggleNotifications}
                disabled={!pushReady || toggling}
                trackColor={{ false: '#D9D9D6', true: '#111111' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <Text style={styles.footer}>
            {STORE_DISPLAY_NAME} app v{APP_VERSION}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D6',
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEA',
  },
  toggleCopy: {
    flex: 1,
    paddingRight: 12,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLabel: {
    fontSize: 16,
    color: '#111111',
  },
  rowHint: {
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: 2,
  },
  destructive: {
    color: '#B3261E',
  },
  footer: {
    textAlign: 'center',
    color: '#8A8A8A',
    fontSize: 12,
    paddingVertical: 16,
  },
});
