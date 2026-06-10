/** Round-and-clamp linear interpolation between two channel values. */
export function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

/** Format an RGB triple as a CSS `rgb(r, g, b)` string. */
export function rgb([r, g, b]: readonly [number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Parse a `#rrggbb` (or `#rgb`) hex color into an RGB triple. */
export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
