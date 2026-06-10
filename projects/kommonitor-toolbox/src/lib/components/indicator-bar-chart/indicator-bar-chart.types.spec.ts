import type { IndicatorFeatureTimeseries } from '../../services/indicators/indicator';
import {
  average,
  buildGradient,
  formatDe,
  toSortedFeatureValues,
} from './indicator-bar-chart.types';

function feature(
  id: string,
  name: string | null,
  values: { date: string; value: number | null }[],
): IndicatorFeatureTimeseries {
  return { id, name, validStartDate: null, validEndDate: null, arisenFrom: null, values };
}

describe('indicator-bar-chart helpers', () => {
  describe('formatDe', () => {
    it('formats with a comma decimal separator and two fraction digits', () => {
      expect(formatDe(7.27)).toBe('7,27');
      expect(formatDe(5)).toBe('5,00');
    });
  });

  describe('average', () => {
    it('returns the arithmetic mean', () => {
      expect(average([2, 4, 6])).toBe(4);
    });

    it('returns 0 for an empty array', () => {
      expect(average([])).toBe(0);
    });
  });

  describe('buildGradient', () => {
    it('returns one colour per bar', () => {
      expect(buildGradient(9)).toHaveLength(9);
    });

    it('returns an empty array for a non-positive count', () => {
      expect(buildGradient(0)).toEqual([]);
    });

    it('produces rgb() colour strings', () => {
      expect(buildGradient(3).every((c) => /^rgb\(\d+, \d+, \d+\)$/.test(c))).toBe(true);
    });
  });

  describe('toSortedFeatureValues', () => {
    const features = [
      feature('a', 'A', [{ date: '2024-12-31', value: 9 }]),
      feature('b', 'B', [{ date: '2024-12-31', value: 3 }]),
      feature('c', 'C', [{ date: '2024-12-31', value: 6 }]),
    ];

    it('extracts the value for the given timestamp and sorts ascending', () => {
      expect(toSortedFeatureValues(features, '2024-12-31')).toEqual([
        { name: 'B', value: 3 },
        { name: 'C', value: 6 },
        { name: 'A', value: 9 },
      ]);
    });

    it('drops features with a null or missing value at the timestamp', () => {
      const withGaps = [
        feature('a', 'A', [{ date: '2024-12-31', value: null }]),
        feature('b', 'B', [{ date: '2023-12-31', value: 5 }]),
        feature('c', 'C', [{ date: '2024-12-31', value: 7 }]),
      ];
      expect(toSortedFeatureValues(withGaps, '2024-12-31')).toEqual([{ name: 'C', value: 7 }]);
    });

    it('falls back to the feature id when the name is null', () => {
      const unnamed = [feature('feature-id', null, [{ date: '2024-12-31', value: 1 }])];
      expect(toSortedFeatureValues(unnamed, '2024-12-31')).toEqual([
        { name: 'feature-id', value: 1 },
      ]);
    });
  });
});
