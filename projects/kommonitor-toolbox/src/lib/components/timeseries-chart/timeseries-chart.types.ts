export interface TimeseriesBaseDataset {
  /** Display name shown in legend and tooltip */
  label: string;
  /** Data values for the center/main line */
  data: number[];
  /** Line and point color */
  color?: string;
  /** ECharts symbol type, e.g. 'circle', 'rect', 'triangle', 'diamond', 'none' */
  symbol?: string;
  /** Show min/max mark points (default: true) */
  showMinMaxIndicator?: boolean;
  /** Show average mark line (default: true) */
  showMeanLine?: boolean;
}

export interface TimeseriesLineDataset extends TimeseriesBaseDataset {
  type: 'line';
}

export interface TimeseriesIntervalDataset extends TimeseriesBaseDataset {
  type: 'interval';
  /** Lower bound of the interval */
  lower: number[];
  /** Upper bound of the interval */
  upper: number[];
}

export type TimeseriesDataset = TimeseriesLineDataset | TimeseriesIntervalDataset;

export interface TimeseriesData {
  labels: string[];
  datasets: TimeseriesDataset[];
}
