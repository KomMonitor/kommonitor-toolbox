import type { LegendClass } from '../../classification';
import { formatDe } from '../indicator-bar-chart/indicator-bar-chart.types';

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

/**
 * Read every timestamped (`DATE_*`) value from a feature's properties as a list of
 * finite numbers. Used to classify across the whole timeseries instead of a single date.
 */
export function allValuesOf(properties: Record<string, unknown>): number[] {
  return Object.keys(properties)
    .filter((key) => key.startsWith(DATE_PREFIX))
    .map((key) => {
      const raw = properties[key];
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
      return parsed;
    })
    .filter((value) => Number.isFinite(value));
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
 * Human-readable value range of a legend class: `"< upper"` for the open-ended first
 * class, `"≥ lower"` for the open-ended last class, otherwise `"lower – upper"`.
 */
export function legendLabel(entry: LegendClass): string {
  if (entry.lower === null) {
    return `< ${formatDe(entry.upper ?? 0)}`;
  }
  if (entry.upper === null) {
    return `≥ ${formatDe(entry.lower)}`;
  }
  return `${formatDe(entry.lower)} – ${formatDe(entry.upper)}`;
}
