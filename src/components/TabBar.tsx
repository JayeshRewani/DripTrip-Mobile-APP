import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CartIcon, HomeIcon, MoreIcon, SearchIcon, ShopIcon } from './TabIcons';

export type TabKey = 'home' | 'shop' | 'search' | 'cart' | 'more';

type Props = {
  active: TabKey | null;
  cartCount: number;
  onSelect: (tab: TabKey) => void;
};

const TABS: { key: TabKey; label: string; Icon: ComponentType<{ color: string }> }[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'shop', label: 'Shop', Icon: ShopIcon },
  { key: 'search', label: 'Search', Icon: SearchIcon },
  { key: 'cart', label: 'Cart', Icon: CartIcon },
  { key: 'more', label: 'Account', Icon: MoreIcon },
];

const ACTIVE = '#111111';
const INACTIVE = '#8A8A8A';

export function TabBar({ active, cartCount, onSelect }: Props) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {TABS.map(({ key, label, Icon }) => {
        const selected = active === key;
        const color = selected ? ACTIVE : INACTIVE;
        const badge = key === 'cart' && cartCount > 0 ? (cartCount > 99 ? '99+' : String(cartCount)) : null;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={badge ? `${label}, ${cartCount} items` : label}
            onPress={() => onSelect(key)}
            style={styles.tab}
            android_ripple={{ color: '#E6E6E3', borderless: true }}
          >
            <View>
              <Icon color={color} />
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9D9D6',
    paddingTop: 6,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
