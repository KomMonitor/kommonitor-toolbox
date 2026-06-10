import { GRADIENT_STOPS } from '../indicator-bar-chart/indicator-bar-chart.types';

export { formatDe } from '../indicator-bar-chart/indicator-bar-chart.types';

/** Prefix under which timestamped indicator values are stored in the feature properties. */
const DATE_PREFIX = 'DATE_';

/** Lower/upper bound of a value range, used for the colour scale and legend. */
export interface ValueExtent {
  min: number;
  max: number;
}

/** Read the numeric indicator value at the given timestamp from a feature's properties. */
export function valueAt(properties: Record<string, unknown>, timestamp: string): number | null {
  const raw = properties[`${DATE_PREFIX}${timestamp}`];
  if (raw === null || raw === undefined) {
    return null;
  }
  const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
  return isNaN(parsed) ? null : parsed;
}

/** Human-readable name of a feature, falling back to its id. */
export function featureName(properties: Record<string, unknown>): string {
  const name = properties['NAME'];
  if (typeof name === 'string' && name.length > 0) {
    return name;
  }
  const id = properties['ID'] ?? properties['fid'];
  return id === undefined || id === null ? '' : String(id);
}

/** Min/max of the given values, or `{ min: 0, max: 0 }` for an empty array. */
export function extentOf(values: number[]): ValueExtent {
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Map a value to a colour by linearly interpolating across {@link GRADIENT_STOPS}
 * (green → teal → blue → purple) between `min` and `max`. Produces the choropleth
 * fill colour for a feature.
 */
export function colorForValue(value: number, min: number, max: number): string {
  const t = max > min ? (value - min) / (max - min) : 0;
  const segments = GRADIENT_STOPS.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * segments;
  const segment = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - segment;
  const from = GRADIENT_STOPS[segment];
  const to = GRADIENT_STOPS[segment + 1];
  return rgb([
    lerp(from[0], to[0], localT),
    lerp(from[1], to[1], localT),
    lerp(from[2], to[2], localT),
  ]);
}

/** CSS `linear-gradient(...)` value spanning all {@link GRADIENT_STOPS}, for the legend bar. */
export function legendGradientCss(): string {
  const stops = GRADIENT_STOPS.map((stop) => rgb(stop)).join(', ');
  return `linear-gradient(to right, ${stops})`;
}

function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

function rgb([r, g, b]: readonly [number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}
