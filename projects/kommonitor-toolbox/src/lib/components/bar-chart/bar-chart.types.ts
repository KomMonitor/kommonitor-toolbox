export interface BarChartDataset {
  /** Display name shown in legend and tooltip */
  label: string;
  /** Data values aligned to the labels array of BarChartData */
  data: number[];
  /** Bar fill color – either a single color for all bars or an array that is cycled per bar */
  color?: string | string[];
  /** Show average mark line for this dataset (default: false) */
  showMeanLine?: boolean;
}

/** Position of the reference line's label relative to the line. */
export type BarChartReferenceLabelPosition =
  | 'start'
  | 'middle'
  | 'end'
  | 'insideStartTop'
  | 'insideStartBottom'
  | 'insideMiddleTop'
  | 'insideMiddleBottom'
  | 'insideEndTop'
  | 'insideEndBottom';

export interface BarChartReferenceValue {
  /** The numeric threshold or target value */
  value: number;
  /** Optional label shown next to the reference line */
  label?: string;
  /** Where the label sits along the reference line (default: ECharts default, 'end') */
  labelPosition?: BarChartReferenceLabelPosition;
}

export interface BarChartData {
  /** Category labels (X-axis in vertical orientation, Y-axis in horizontal orientation) */
  labels: string[];
  datasets: BarChartDataset[];
}
