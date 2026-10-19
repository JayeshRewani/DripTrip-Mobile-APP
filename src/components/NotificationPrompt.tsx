import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STORE_DISPLAY_NAME } from '../config/store';

type Props = {
  visible: boolean;
  onAllow: () => void;
  onNotNow: () => void;
};

/**
 * Soft-ask before the system notification permission dialog.
 * Explains why DripTrip wants to send offers / updates (DPDP / Play expectation).
 */
export function NotificationPrompt({ visible, onAllow, onNotNow }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNotNow}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { marginBottom: insets.bottom + 24 }]}>
          <Text style={styles.brand}>{STORE_DISPLAY_NAME}</Text>
          <Text style={styles.title}>Stay updated</Text>
          <Text style={styles.body}>
            Get notified about new drops, sale offers, and order updates. You can turn
            notifications off anytime in Account.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Allow notifications"
            onPress={onAllow}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>Allow notifications</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Not now"
            onPress={onNotNow}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8A8A',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
    marginBottom: 24,
  },
  primary: {
    backgroundColor: '#111111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.75,
  },
});
