import { Component, Input, OnChanges } from '@angular/core';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

export interface TimeseriesDataset {
  label: string;
  data: number[];
}

export interface TimeseriesData {
  labels: string[];
  datasets: TimeseriesDataset[];
}

@Component({
  selector: 'lib-timeseries-chart',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <div
      echarts
      [options]="chartOptions"
      style="width: 100%; height: 400px;"
    ></div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TimeseriesChartComponent implements OnChanges {
  @Input() data: TimeseriesData = { labels: [], datasets: [] };

  chartOptions: EChartsOption = {};

  ngOnChanges(): void {
    this.buildChartOptions();
  }

  private buildChartOptions(): void {
    this.chartOptions = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: this.data.datasets.map((ds) => ds.label),
      },
      xAxis: {
        type: 'category',
        data: this.data.labels,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
      },
      series: this.data.datasets.map((ds) => ({
        name: ds.label,
        type: 'line',
        data: ds.data,
        smooth: true,
        markPoint: {
          data: [
            { type: 'max', name: 'Maximum' },
            { type: 'min', name: 'Minimum' },
          ],
        },
        markLine: {
          data: [{ type: 'average', name: 'Durchschnitt' }],
        },
      })),
    };
  }
}
