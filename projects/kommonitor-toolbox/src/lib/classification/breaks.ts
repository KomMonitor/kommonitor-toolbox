/** Statistical method used to derive the class breaks of a choropleth/bar coloring. */
export type ClassificationMethod =
  | 'equalInterval'
  | 'quantile'
  | 'jenks'
  | 'stdDeviation'
  | 'manual';

/** All selectable classification methods (ids only; UI labels live in the consumer). */
export const CLASSIFICATION_METHODS: ClassificationMethod[] = [
  'equalInterval',
  'quantile',
  'jenks',
  'stdDeviation',
  'manual',
];

/** Lower/upper bounds for the number of classes. */
export const MIN_CLASSES = 2;
export const MAX_CLASSES = 9;

/**
 * Compute the inner class boundaries for the given values. The result has
 * `numberOfClasses - 1` ascending entries (the boundaries between adjacent
 * classes); use {@link classIndexOf} to map a value to its class.
 */
export function computeBreaks(
  values: number[],
  method: ClassificationMethod,
  numberOfClasses: number,
  manualBreaks?: number[],
): number[] {
  const classes = Math.max(MIN_CLASSES, Math.round(numberOfClasses));

  if (method === 'manual') {
    return sanitizeManualBreaks(manualBreaks);
  }

  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) {
    return [];
  }

  switch (method) {
    case 'quantile':
      return quantileBreaks(clean, classes);
    case 'jenks':
      return jenksBreaks(clean, classes);
    case 'stdDeviation':
      return stdDeviationBreaks(clean, classes);
    case 'equalInterval':
    default:
      return equalIntervalBreaks(clean, classes);
  }
}

/**
 * Index of the class a value falls into, given ascending inner `breaks`.
 * Ranges from 0 (below the first break) to `breaks.length` (the last class).
 */
export function classIndexOf(value: number, breaks: number[]): number {
  let index = 0;
  while (index < breaks.length && value > breaks[index]) {
    index++;
  }
  return index;
}

function sanitizeManualBreaks(manualBreaks?: number[]): number[] {
  return (manualBreaks ?? []).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
}

function equalIntervalBreaks(values: number[], classes: number): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / classes;
  return Array.from({ length: classes - 1 }, (_, i) => min + step * (i + 1));
}

function quantileBreaks(values: number[], classes: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  return Array.from({ length: classes - 1 }, (_, i) => {
    const position = (sorted.length * (i + 1)) / classes;
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(position)));
    return sorted[index];
  });
}

function stdDeviationBreaks(values: number[], classes: number): number[] {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const innerCount = classes - 1;
  // Place the inner boundaries symmetrically around the mean, one std apart.
  return Array.from({ length: innerCount }, (_, i) => mean + (i - (innerCount - 1) / 2) * std);
}

/**
 * Fisher–Jenks natural breaks. Returns the `classes - 1` inner boundaries.
 * Falls back to equal interval when there are fewer values than classes.
 */
function jenksBreaks(values: number[], classes: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n <= classes) {
    return equalIntervalBreaks(sorted, classes);
  }

  const lowerClass: number[][] = matrix(n + 1, classes + 1, 0);
  const variance: number[][] = matrix(n + 1, classes + 1, 0);

  for (let i = 1; i <= classes; i++) {
    lowerClass[1][i] = 1;
    variance[1][i] = 0;
    for (let j = 2; j <= n; j++) {
      variance[j][i] = Infinity;
    }
  }

  for (let l = 2; l <= n; l++) {
    let sum = 0;
    let sumSquares = 0;
    let count = 0;
    let value = 0;

    for (let m = 1; m <= l; m++) {
      const lower = l - m + 1;
      const val = sorted[lower - 1];
      count++;
      sum += val;
      sumSquares += val * val;
      value = sumSquares - (sum * sum) / count;
      const previous = lower - 1;
      if (previous !== 0) {
        for (let j = 2; j <= classes; j++) {
          if (variance[l][j] >= value + variance[previous][j - 1]) {
            lowerClass[l][j] = lower;
            variance[l][j] = value + variance[previous][j - 1];
          }
        }
      }
    }
    lowerClass[l][1] = 1;
    variance[l][1] = value;
  }

  const breaks: number[] = [];
  let k = n;
  for (let j = classes; j >= 2; j--) {
    const id = lowerClass[k][j] - 1;
    breaks.unshift(sorted[id]);
    k = lowerClass[k][j] - 1;
  }
  return breaks;
}

function matrix(rows: number, cols: number, fill: number): number[][] {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(fill));
}
