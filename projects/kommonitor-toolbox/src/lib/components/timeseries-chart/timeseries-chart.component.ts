import { Component, computed, input } from '@angular/core';
import type {
  EChartsOption,
  GridComponentOption,
  LegendComponentOption,
  SeriesOption,
} from 'echarts';
import * as echarts from 'echarts';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type {
  TimeseriesBaseDataset,
  TimeseriesData,
  TimeseriesIntervalDataset,
} from './timeseries-chart.types';

export type { GridComponentOption, LegendComponentOption } from 'echarts';

export type {
  TimeseriesData,
  TimeseriesDataset,
  TimeseriesIntervalDataset,
  TimeseriesLineDataset,
} from './timeseries-chart.types';

const BAND_OPACITY = 0.35;
const X_AXIS_NAME_GAP = 24;
const Y_AXIS_NAME_GAP = 40;

const GRID_PADDING = 20;
const GRID_RIGHT_PADDING = 32;
const GRID_PADDING_LEGEND = 32;
const GRID_PADDING_AXIS_LABEL = 32;

const DEFAULT_LEGEND_CONFIG: LegendComponentOption = {
  show: true,
  orient: 'horizontal',
  bottom: 0,
};

@Component({
  selector: 'lib-timeseries-chart',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `<div echarts [options]="chartOptions()" style="width: 100%; height: 100%;"></div>`,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class TimeseriesChartComponent {
  readonly data = input<TimeseriesData>({ labels: [], datasets: [] });
  readonly xAxisLabel = input('');
  readonly yAxisLabel = input('');
  readonly scaleToData = input(false);
  readonly legendConfig = input<LegendComponentOption>(DEFAULT_LEGEND_CONFIG);
  readonly gridConfig = input<GridComponentOption>({});

  /** ECharts options, recomputed whenever any input signal changes. */
  readonly chartOptions = computed<EChartsOption>(() => this.buildChartOptions());

  private buildChartOptions(): EChartsOption {
    const series: SeriesOption[] = [];
    const legendData: string[] = [];

    for (const ds of this.data().datasets) {
      legendData.push(ds.label);
      if (ds.type === 'interval') {
        series.push(...this.buildIntervalSeries(ds));
      } else {
        series.push(this.buildLineSeries(ds));
      }
    }

    return {
      grid: this.buildGrid(),
      tooltip: { trigger: 'axis', formatter: this.buildTooltipFormatter() },
      legend: { ...this.legendConfig(), data: legendData },
      xAxis: this.buildXAxis(),
      yAxis: this.buildYAxis(),
      series,
    };
  }

  private buildIntervalSeries(ds: TimeseriesIntervalDataset): SeriesOption[] {
    const stackId = `__band__${ds.label}`;
    const color = ds.color ?? '#aaaaaa';

    return [
      // Invisible lower bound
      {
        name: `${ds.label}__lower`,
        type: 'line',
        data: ds.lower,
        stack: stackId,
        symbol: 'none',
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        tooltip: { show: false },
      },
      // Band height (upper – lower)
      {
        name: `${ds.label}__upper`,
        type: 'line',
        data: ds.upper.map((u, i) => +(u - ds.lower[i]).toFixed(4)),
        stack: stackId,
        symbol: 'none',
        lineStyle: { opacity: 0 },
        areaStyle: { color, opacity: BAND_OPACITY },
        tooltip: { show: false },
      },
      this.buildLineSeries(ds),
    ];
  }

  private buildLineSeries(ds: TimeseriesBaseDataset): SeriesOption {
    return {
      name: ds.label,
      type: 'line',
      data: ds.data,
      smooth: true,
      symbol: ds.symbol ?? 'emptyCircle',
      ...this.colorStyle(ds.color),
      ...this.markPointStyle(ds.showMinMaxIndicator),
      ...this.markLineStyle(ds.showMeanLine),
    };
  }

  private buildTooltipFormatter(): (params: unknown) => string {
    return (params: unknown) => {
      const list = (Array.isArray(params) ? params : [params]) as {
        seriesName: string;
        marker: string;
        data: number;
      }[];
      return list
        .filter((p) => !p.seriesName.includes('__'))
        .map((p) => `${p.marker} ${p.seriesName}: ${p.data}`)
        .join('<br/>');
    };
  }

  private buildGrid(): EChartsOption['grid'] {
    const hasLegend = this.legendConfig().show !== false;
    return {
      containLabel: true,
      left: this.yAxisLabel() ? GRID_PADDING_AXIS_LABEL : GRID_PADDING,
      right: GRID_RIGHT_PADDING,
      top: GRID_PADDING,
      bottom:
        (hasLegend ? GRID_PADDING_LEGEND : GRID_PADDING) +
        (this.xAxisLabel() ? GRID_PADDING_AXIS_LABEL : 0),
      ...this.gridConfig(),
    };
  }

  private buildXAxis(): EChartsOption['xAxis'] {
    const xAxisLabel = this.xAxisLabel();
    return {
      type: 'category',
      data: this.data().labels,
      boundaryGap: false,
      ...(xAxisLabel ? { name: xAxisLabel, nameLocation: 'middle', nameGap: X_AXIS_NAME_GAP } : {}),
    };
  }

  private buildYAxis(): EChartsOption['yAxis'] {
    const yAxisLabel = this.yAxisLabel();
    return {
      type: 'value',
      ...(this.scaleToData() ? { scale: true } : {}),
      ...(yAxisLabel ? { name: yAxisLabel, nameLocation: 'middle', nameGap: Y_AXIS_NAME_GAP } : {}),
    };
  }

  private colorStyle(color?: string) {
    return color ? { itemStyle: { color }, lineStyle: { color } } : {};
  }

  private markPointStyle(show?: boolean) {
    return show === true
      ? {
          markPoint: {
            data: [
              { type: 'max' as const, name: 'Maximum' },
              { type: 'min' as const, name: 'Minimum' },
            ],
          },
        }
      : {};
  }

  private markLineStyle(show?: boolean) {
    return show === true
      ? { markLine: { data: [{ type: 'average' as const, name: 'Durchschnitt' }] } }
      : {};
  }
}
