import { allValuesOf, valueAt } from './indicator-map.types';

describe('indicator-map helpers', () => {
  describe('valueAt', () => {
    it('reads the numeric value at the given timestamp', () => {
      expect(valueAt({ DATE_2024: 5.2 }, '2024')).toBe(5.2);
    });

    it('parses a numeric string value', () => {
      expect(valueAt({ DATE_2024: '8.96' }, '2024')).toBe(8.96);
    });

    it('returns null for a missing or non-numeric value', () => {
      expect(valueAt({}, '2024')).toBeNull();
      expect(valueAt({ DATE_2024: 'n/a' }, '2024')).toBeNull();
    });
  });

  describe('allValuesOf', () => {
    it('collects every finite DATE_* value, ignoring other properties', () => {
      const values = allValuesOf({
        ID: '1',
        NAME: 'Altstadt',
        DATE_2022: 4,
        DATE_2023: '5',
        DATE_2024: 6,
      });
      expect(values).toEqual([4, 5, 6]);
    });

    it('drops non-numeric DATE_* values', () => {
      expect(allValuesOf({ DATE_2024: 'n/a', DATE_2023: 3 })).toEqual([3]);
    });

    it('returns an empty array when there are no DATE_* values', () => {
      expect(allValuesOf({ ID: '1' })).toEqual([]);
    });
  });
});
