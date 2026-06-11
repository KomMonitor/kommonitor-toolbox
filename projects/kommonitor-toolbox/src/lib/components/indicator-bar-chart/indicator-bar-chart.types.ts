import type { IndicatorFeatureTimeseries } from '../../services/indicators/indicator';

/** A single feature reduced to its name and the value at a chosen timestamp. */
export interface FeatureValue {
  name: string;
  value: number;
}

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
 * Collect every finite value across the whole timeseries of all features. Used to
 * classify over the entire timeseries instead of a single timestamp.
 */
export function allTimeseriesValues(features: IndicatorFeatureTimeseries[]): number[] {
  return features
    .flatMap((feature) => feature.values.map((entry) => entry.value))
    .filter((value): value is number => value !== null && Number.isFinite(value));
}
