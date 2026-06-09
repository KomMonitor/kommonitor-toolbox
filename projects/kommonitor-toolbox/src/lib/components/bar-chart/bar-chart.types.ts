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

export interface BarChartReferenceValue {
  /** The numeric threshold or target value */
  value: number;
  /** Optional label shown next to the reference line */
  label?: string;
}

export interface BarChartData {
  /** Category labels (X-axis in vertical orientation, Y-axis in horizontal orientation) */
  labels: string[];
  datasets: BarChartDataset[];
}
