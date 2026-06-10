import { classIndexOf, computeBreaks } from './breaks';
import { classify, discreteLegend } from './classify';
import { COLOR_PALETTES, paletteById, paletteColors } from './palettes';
import { hexToRgb } from './color';

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe('classification', () => {
  describe('computeBreaks', () => {
    it('returns numberOfClasses - 1 inner breaks for equal interval', () => {
      const breaks = computeBreaks(VALUES, 'equalInterval', 5);
      expect(breaks).toHaveLength(4);
      expect(breaks).toEqual([2.8, 4.6, 6.4, 8.2]);
    });

    it('returns ascending breaks for quantile', () => {
      const breaks = computeBreaks(VALUES, 'quantile', 4);
      expect(breaks).toHaveLength(3);
      expect([...breaks].sort((a, b) => a - b)).toEqual(breaks);
    });

    it('returns ascending breaks for jenks', () => {
      const breaks = computeBreaks([1, 1, 2, 12, 13, 14, 40, 41, 42], 'jenks', 3);
      expect(breaks).toHaveLength(2);
      expect([...breaks].sort((a, b) => a - b)).toEqual(breaks);
    });

    it('centers std-deviation breaks around the mean', () => {
      const breaks = computeBreaks(VALUES, 'stdDeviation', 3);
      expect(breaks).toHaveLength(2);
      const mean = VALUES.reduce((s, v) => s + v, 0) / VALUES.length;
      expect((breaks[0] + breaks[1]) / 2).toBeCloseTo(mean, 6);
    });

    it('sorts and sanitizes manual breaks', () => {
      const breaks = computeBreaks(VALUES, 'manual', 4, [7, NaN, 2, 5]);
      expect(breaks).toEqual([2, 5, 7]);
    });

    it('returns an empty array when there are no finite values', () => {
      expect(computeBreaks([], 'equalInterval', 5)).toEqual([]);
    });
  });

  describe('classIndexOf', () => {
    const breaks = [2.8, 4.6, 6.4, 8.2];

    it('maps values below the first break to class 0', () => {
      expect(classIndexOf(1, breaks)).toBe(0);
    });

    it('maps values above the last break to the last class', () => {
      expect(classIndexOf(10, breaks)).toBe(4);
    });

    it('maps a mid value to the matching class', () => {
      expect(classIndexOf(5, breaks)).toBe(2);
    });
  });

  describe('paletteColors', () => {
    it('produces one rgb() color per class', () => {
      const colors = paletteColors(paletteById('Blues'), 5);
      expect(colors).toHaveLength(5);
      expect(colors.every((c) => /^rgb\(\d+, \d+, \d+\)$/.test(c))).toBe(true);
    });

    it('returns an empty array for a non-positive count', () => {
      expect(paletteColors(COLOR_PALETTES[0], 0)).toEqual([]);
    });
  });

  describe('hexToRgb', () => {
    it('parses a six-digit hex color', () => {
      expect(hexToRgb('#3182bd')).toEqual([49, 130, 189]);
    });
  });

  describe('classify', () => {
    it('returns breaks, colors and a working value→color lookup', () => {
      const result = classify(VALUES, {
        paletteId: 'Blues',
        method: 'equalInterval',
        numberOfClasses: 5,
        classifyAcrossTimeseries: true,
      });
      expect(result.breaks).toHaveLength(4);
      expect(result.colors).toHaveLength(5);
      expect(result.colorFor(1)).toBe(result.colors[0]);
      expect(result.colorFor(10)).toBe(result.colors[4]);
    });

    it('returns the no-data color for null/non-finite values', () => {
      const result = classify(VALUES, {
        paletteId: 'Blues',
        method: 'equalInterval',
        numberOfClasses: 5,
        classifyAcrossTimeseries: true,
      });
      expect(result.colorFor(null)).toContain('rgba');
    });
  });

  describe('discreteLegend', () => {
    it('builds open-ended first and last classes', () => {
      const legend = discreteLegend([2.8, 4.6, 6.4, 8.2], paletteColors(paletteById('Blues'), 5));
      expect(legend).toHaveLength(5);
      expect(legend[0].lower).toBeNull();
      expect(legend[4].upper).toBeNull();
      expect(legend[1]).toEqual({ color: legend[1].color, lower: 2.8, upper: 4.6 });
    });
  });
});
