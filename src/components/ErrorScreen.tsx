import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STORE_DISPLAY_NAME } from '../config/store';

type Props = {
  title?: string;
  message?: string;
  onRetry: () => void;
};

export function ErrorScreen({
  title = 'Something went wrong',
  message = 'Unable to reach the DripTrip store. Check your connection and try again.',
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{STORE_DISPLAY_NAME}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry loading the store"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 20,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#111111',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
