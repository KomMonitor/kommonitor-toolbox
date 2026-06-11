import { classIndexOf, ClassificationMethod, computeBreaks } from './breaks';
import { DEFAULT_PALETTE_ID, paletteById, paletteColors } from './palettes';

/**
 * User-chosen coloring of an indicator: which palette, how the values are
 * grouped into classes, and how many.
 */
export interface ClassificationConfig {
  /** Id of the selected color palette. */
  paletteId: string;
  /** How class breaks are computed. */
  method: ClassificationMethod;
  /** Number of classes (typically 2–9). */
  numberOfClasses: number;
  /** Classify over the whole timeseries instead of the single timestamp. */
  classifyAcrossTimeseries: boolean;
  /** Manually entered inner breaks; only used when `method === 'manual'`. */
  breaks?: number[];
}

/** A single legend entry: the class color and its (open-ended) value range. */
export interface LegendClass {
  color: string;
  /** Lower bound, or `null` for the open-ended first class. */
  lower: number | null;
  /** Upper bound, or `null` for the open-ended last class. */
  upper: number | null;
}

/** Result of classifying a set of values: breaks, class colors and a lookup. */
export interface Classification {
  /** Ascending inner class boundaries (`numberOfClasses - 1` entries). */
  breaks: number[];
  /** One color per class (lowest class first). */
  colors: string[];
  /** Resolve the class color for a single value. */
  colorFor(value: number | null): string;
}

/** Color used for features without a numeric value. */
export const NO_DATA_COLOR = 'rgba(0, 0, 0, 0.05)';

/** Default coloring applied to a freshly created visualization. */
export const DEFAULT_CLASSIFICATION: ClassificationConfig = {
  paletteId: DEFAULT_PALETTE_ID,
  method: 'equalInterval',
  numberOfClasses: 5,
  classifyAcrossTimeseries: true,
};

/**
 * Classify the given values according to `config`: compute the class breaks and
 * the matching palette colors, and expose a value→color lookup for rendering.
 */
export function classify(values: number[], config: ClassificationConfig): Classification {
  const breaks = computeBreaks(values, config.method, config.numberOfClasses, config.breaks);
  const colors = paletteColors(paletteById(config.paletteId), config.numberOfClasses);

  const colorFor = (value: number | null): string => {
    if (value === null || !Number.isFinite(value)) {
      return NO_DATA_COLOR;
    }
    const index = Math.min(colors.length - 1, classIndexOf(value, breaks));
    return colors[index] ?? NO_DATA_COLOR;
  };

  return { breaks, colors, colorFor };
}

/** Build legend entries (color + value range) from class breaks and colors. */
export function discreteLegend(breaks: number[], colors: string[]): LegendClass[] {
  return colors.map((color, i) => ({
    color,
    lower: i === 0 ? null : breaks[i - 1],
    upper: i === colors.length - 1 ? null : breaks[i],
  }));
}

/** Default legend number formatter: German locale with two fraction digits. */
function defaultLegendFormat(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Human-readable value range of a legend class: `"< upper"` for the open-ended first
 * class, `"≥ lower"` for the open-ended last class, otherwise `"lower – upper"`.
 * Pass `format` to control number formatting (defaults to a German two-digit format).
 */
export function legendLabel(
  entry: LegendClass,
  format: (value: number) => string = defaultLegendFormat,
): string {
  if (entry.lower === null) {
    return `< ${format(entry.upper ?? 0)}`;
  }
  if (entry.upper === null) {
    return `≥ ${format(entry.lower)}`;
  }
  return `${format(entry.lower)} – ${format(entry.upper)}`;
}
