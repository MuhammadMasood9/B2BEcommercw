/**
 * Light-theme utilities for color manipulation and accessibility checks.
 * The helpers are intentionally scoped to the single light theme we support.
 */

export function hexToHsl(hex: string): [number, number, number] {
  let normalized = hex.replace('#', '');

  if (normalized.length === 3) {
    normalized = normalized.split('').map((char) => char + char).join('');
  }

  if (normalized.length !== 6) {
    return [0, 0, 0];
  }

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [Math.round(h * 360) || 0, Math.round(s * 100) || 0, Math.round(l * 100) || 0];
}

export function hslToHex(h: number, s: number, l: number): string {
  let hue = h / 360;
  let saturation = s / 100;
  let lightness = l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (saturation === 0) {
    r = g = b = lightness;
  } else {
    const q =
      lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;

    r = hue2rgb(p, q, hue + 1 / 3);
    g = hue2rgb(p, q, hue);
    b = hue2rgb(p, q, hue - 1 / 3);
  }

  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, l + amount));
}

export function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

export function getColorLuminance(hex: string): number {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return 0;

  const [r, g, b] = [match[1], match[2], match[3]]
    .map((part) => parseInt(part, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getColorLuminance(color1);
  const l2 = getColorLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function isValidContrastRatio(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

export function getAccessibleTextColor(background: string): string {
  const whiteContrast = getContrastRatio('#FFFFFF', background);
  const blackContrast = getContrastRatio('#000000', background);

  if (whiteContrast >= 4.5 && whiteContrast >= blackContrast) {
    return '#FFFFFF';
  }

  if (blackContrast >= 4.5) {
    return '#000000';
  }

  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

export function generateColorScale(baseColor: string): Record<string, string> {
  const [h, s] = hexToHsl(baseColor);

  return {
    '50': hslToHex(h, s, 95),
    '100': hslToHex(h, s, 90),
    '200': hslToHex(h, s, 80),
    '300': hslToHex(h, s, 70),
    '400': hslToHex(h, s, 60),
    '500': baseColor,
    '600': hslToHex(h, s, 40),
    '700': hslToHex(h, s, 30),
    '800': hslToHex(h, s, 20),
    '900': hslToHex(h, s, 10),
  };
}

export function adjustColorForTheme(color: string): string {
  return color;
}

export function validateThemeColors(colors: Record<string, string>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const required = ['primary', 'secondary', 'background', 'foreground', 'accent', 'muted'] as const;

  required.forEach((token) => {
    if (!colors[token]) {
      errors.push(`Missing required color: ${token}`);
    }
  });

  if (colors.background && colors.foreground) {
    const contrast = getContrastRatio(colors.foreground, colors.background);
    if (contrast < 4.5) {
      errors.push(
        `Insufficient contrast between foreground (${colors.foreground}) and background (${colors.background})`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const themeUtils = {
  hexToHsl,
  hslToHex,
  lighten,
  darken,
  getColorLuminance,
  getContrastRatio,
  isValidContrastRatio,
  getAccessibleTextColor,
  generateColorScale,
  adjustColorForTheme,
  validateThemeColors,
};

export default themeUtils;

