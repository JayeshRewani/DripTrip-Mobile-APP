import { ActivityIndicator, StyleSheet, View } from 'react-native';

/** Floating spinner shown at the top while a new page loads (after the first load). */
export function PageSpinner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityLabel="Loading page">
      <View style={styles.circle}>
        <ActivityIndicator size="small" color="#111111" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 8,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
