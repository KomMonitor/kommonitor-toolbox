import { Component, Input, OnChanges } from '@angular/core';
import type { EChartsOption, LegendComponentOption, SeriesOption } from 'echarts';
import * as echarts from 'echarts';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type {
  TimeseriesBaseDataset,
  TimeseriesData,
  TimeseriesIntervalDataset,
} from './timeseries-chart.types';

export type { LegendComponentOption } from 'echarts';

export type {
  TimeseriesData,
  TimeseriesDataset,
  TimeseriesIntervalDataset,
  TimeseriesLineDataset,
} from './timeseries-chart.types';

const BAND_OPACITY = 0.35;
const X_AXIS_NAME_GAP = 30;
const Y_AXIS_NAME_GAP = 50;

const DEFAULT_LEGEND_CONFIG: LegendComponentOption = {
  show: true,
  orient: 'horizontal',
  bottom: 0,
};

@Component({
  selector: 'lib-timeseries-chart',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `<div echarts [options]="chartOptions" style="width: 100%; height: 100%;"></div>`,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class TimeseriesChartComponent implements OnChanges {
  @Input() data: TimeseriesData = { labels: [], datasets: [] };
  @Input() xAxisLabel = '';
  @Input() yAxisLabel = '';
  @Input() scaleToData = false;
  @Input() legendConfig: LegendComponentOption = DEFAULT_LEGEND_CONFIG;

  chartOptions: EChartsOption = {};

  ngOnChanges(): void {
    this.buildChartOptions();
  }

  private buildChartOptions(): void {
    const series: SeriesOption[] = [];
    const legendData: string[] = [];

    for (const ds of this.data.datasets) {
      legendData.push(ds.label);
      if (ds.type === 'interval') {
        series.push(...this.buildIntervalSeries(ds));
      } else {
        series.push(this.buildLineSeries(ds));
      }
    }

    this.chartOptions = {
      tooltip: { trigger: 'axis', formatter: this.buildTooltipFormatter() },
      legend: { ...this.legendConfig, data: legendData },
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

  private buildXAxis(): EChartsOption['xAxis'] {
    return {
      type: 'category',
      data: this.data.labels,
      boundaryGap: false,
      ...(this.xAxisLabel
        ? { name: this.xAxisLabel, nameLocation: 'middle', nameGap: X_AXIS_NAME_GAP }
        : {}),
    };
  }

  private buildYAxis(): EChartsOption['yAxis'] {
    return {
      type: 'value',
      ...(this.scaleToData ? { scale: true } : {}),
      ...(this.yAxisLabel
        ? { name: this.yAxisLabel, nameLocation: 'middle', nameGap: Y_AXIS_NAME_GAP }
        : {}),
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
