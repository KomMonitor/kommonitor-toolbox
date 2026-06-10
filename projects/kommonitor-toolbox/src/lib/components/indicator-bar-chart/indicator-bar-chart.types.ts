import type { IndicatorFeatureTimeseries } from '../../services/indicators/indicator';

/** A single feature reduced to its name and the value at a chosen timestamp. */
export interface FeatureValue {
  name: string;
  value: number;
}

/** Colour stops the gradient is interpolated across, matching the KomMonitor bar styling. */
export const GRADIENT_STOPS: readonly (readonly [number, number, number])[] = [
  [160, 216, 180], // light green  #a0d8b4
  [63, 182, 198], // teal         #3fb6c6
  [91, 111, 181], // blue         #5b6fb5
  [91, 79, 158], // purple        #5b4f9e
];

/** Format a number using German locale with two fraction digits (e.g. 7.27 → "7,27"). */
export function formatDe(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Extract the (name, value) pair for the given timestamp from each feature, dropping
 * features without a numeric value, then sort ascending by value.
 */
export function toSortedFeatureValues(
  features: IndicatorFeatureTimeseries[],
  timestamp: string,
): FeatureValue[] {
  return features
    .map((feature) => ({
      name: feature.name ?? feature.id,
      value: feature.values.find((v) => v.date === timestamp)?.value ?? null,
    }))
    .filter((entry): entry is FeatureValue => entry.value !== null)
    .sort((a, b) => a.value - b.value);
}

/** Arithmetic mean of the given values, or 0 for an empty array. */
export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Build a per-bar colour gradient of the requested length by interpolating in RGB
 * across {@link GRADIENT_STOPS}. With one bar per index the array maps 1:1 to the
 * (value-sorted) bars, producing a green→teal→blue→purple ramp.
 */
export function buildGradient(count: number): string[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [rgb(GRADIENT_STOPS[0])];
  }

  const segments = GRADIENT_STOPS.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const t = (i / (count - 1)) * segments;
    const segment = Math.min(Math.floor(t), segments - 1);
    const localT = t - segment;
    const from = GRADIENT_STOPS[segment];
    const to = GRADIENT_STOPS[segment + 1];
    return rgb([
      lerp(from[0], to[0], localT),
      lerp(from[1], to[1], localT),
      lerp(from[2], to[2], localT),
    ]);
  });
}

function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

function rgb([r, g, b]: readonly [number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}
