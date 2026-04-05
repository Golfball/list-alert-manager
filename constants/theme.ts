/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: "#0f172a",
    textSecondary: "#334155",
    background: "#eef2f7",
    surface: "#ffffff",
    border: "#94a3b8",
    tint: "#2563eb",
    icon: "#64748b",
    tabIconDefault: "#94a3b8",
    tabIconSelected: "#2563eb",
    danger: "#ef4444",
    muted: "#64748b",
    card: "#ffffff",
    header: "#e2e8f0",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#151718",
    surface: "#1f232a",
    border: "#2d3139",
    tint: "#ffffff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#ffffff",
    danger: "#f87171",
    card: "#1a1d23",        // dark
    muted: "#9ca3af",       // dark
    header: "#1f232a",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const PRESET_COLORS = [
  "#ff0000", // red
  "#ff7a00", // orange
  "#ffd400", // yellow
  "#00ff00", // green
  "#00ffff", // cyan
  "#007bff", // blue
  "#8b5cf6", // purple
  "#ff00ff", // magenta
];

export default Colors;
