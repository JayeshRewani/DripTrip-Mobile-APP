import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { STORE_DISPLAY_NAME } from '../config/store';

type Props = {
  visible: boolean;
};

export function LoadingOverlay({ visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={styles.brand}>{STORE_DISPLAY_NAME}</Text>
      <ActivityIndicator size="large" color="#111111" style={styles.spinner} />
      <Text style={styles.caption}>Loading store…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  brand: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#111111',
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 12,
  },
  caption: {
    fontSize: 14,
    color: '#555555',
  },
});
