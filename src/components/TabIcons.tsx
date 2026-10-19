import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = { color: string; size?: number };

const stroke = { strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

export function HomeIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" stroke={color} {...stroke} />
    </Svg>
  );
}

export function ShopIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke={color} {...stroke} />
    </Svg>
  );
}

export function SearchIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={6.5} stroke={color} {...stroke} />
      <Path d="m16 16 4.5 4.5" stroke={color} {...stroke} />
    </Svg>
  );
}

export function CartIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" stroke={color} {...stroke} />
      <Path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke={color} {...stroke} />
    </Svg>
  );
}

export function MoreIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={3.5} stroke={color} {...stroke} />
      <Path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" stroke={color} {...stroke} />
    </Svg>
  );
}
