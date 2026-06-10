import { hexToRgb, lerp, rgb } from './color';

/** A named color ramp offered for choropleth/bar coloring. */
export interface ColorPalette {
  id: string;
  /** Human-readable name. */
  name: string;
  /** Sequential ramp (low→high) or diverging ramp (around a midpoint). */
  type: 'sequential' | 'diverging';
  /** Ordered support colors (hex) the discrete class colors are sampled from. */
  colors: string[];
}

/**
 * Curated, dependency-free set of color ramps (ColorBrewer-style). Each palette
 * stores a handful of support colors; {@link paletteColors} samples the concrete
 * per-class colors from them.
 */
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'BuPu',
    name: 'Blau–Lila',
    type: 'sequential',
    colors: ['#edf8fb', '#bfd3e6', '#9ebcda', '#8c96c6', '#8856a7', '#810f7c'],
  },
  {
    id: 'Blues',
    name: 'Blautöne',
    type: 'sequential',
    colors: ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'],
  },
  {
    id: 'Greens',
    name: 'Grüntöne',
    type: 'sequential',
    colors: ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#31a354', '#006d2c'],
  },
  {
    id: 'Purples',
    name: 'Lilatöne',
    type: 'sequential',
    colors: ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8', '#756bb1', '#54278f'],
  },
  {
    id: 'YlOrRd',
    name: 'Gelb–Orange–Rot',
    type: 'sequential',
    colors: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'],
  },
  {
    id: 'RdBu',
    name: 'Rot–Blau (divergierend)',
    type: 'diverging',
    colors: ['#b2182b', '#ef8a62', '#fddbc7', '#d1e5f0', '#67a9cf', '#2166ac'],
  },
];

/** Id of the palette selected by default (matches the reference design). */
export const DEFAULT_PALETTE_ID = COLOR_PALETTES[0].id;

/** Look up a palette by id, falling back to the default palette. */
export function paletteById(id: string): ColorPalette {
  return COLOR_PALETTES.find((palette) => palette.id === id) ?? COLOR_PALETTES[0];
}

/**
 * Derive `count` discrete class colors from a palette by sampling its support
 * colors evenly and interpolating in RGB. Returns `rgb(...)` strings (lowest
 * class first).
 */
export function paletteColors(palette: ColorPalette, count: number): string[] {
  const stops = palette.colors.map(hexToRgb);
  if (count <= 0 || stops.length === 0) {
    return [];
  }
  if (count === 1) {
    return [rgb(stops[stops.length - 1])];
  }

  const segments = stops.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const t = (i / (count - 1)) * segments;
    const segment = Math.min(Math.floor(t), segments - 1);
    const localT = t - segment;
    const from = stops[segment];
    const to = stops[segment + 1];
    return rgb([
      lerp(from[0], to[0], localT),
      lerp(from[1], to[1], localT),
      lerp(from[2], to[2], localT),
    ]);
  });
}
