import { Component, Input, OnChanges } from '@angular/core';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { BarChartData, BarChartDataset, BarChartReferenceValue } from './bar-chart.types';

export type { BarChartData, BarChartDataset, BarChartReferenceValue } from './bar-chart.types';

const CATEGORY_AXIS_NAME_GAP = 30;
const VALUE_AXIS_NAME_GAP = 50;
const HOVER_BORDER_COLOR = '#00fff2';
const HOVER_BORDER_WIDTH = 4;

@Component({
  selector: 'lib-bar-chart',
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
export class BarChartComponent implements OnChanges {
  /** Chart data: category labels and one or more datasets */
  @Input() data: BarChartData = { labels: [], datasets: [] };
  /** Label for the category axis (X in vertical, Y in horizontal orientation) */
  @Input() xAxisLabel = '';
  /** Label for the value axis (Y in vertical, X in horizontal orientation) */
  @Input() yAxisLabel = '';
  /** Bar orientation: 'vertical' renders columns, 'horizontal' renders bars */
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  /** Stack multiple datasets on top of each other instead of grouping them side-by-side */
  @Input() stacked = false;
  /** Start the value axis at the data minimum instead of zero */
  @Input() scaleToData = false;
  /** Show the numeric value as a label on each bar */
  @Input() showValueLabels = false;
  /** Draw a fixed reference line (e.g. a target or threshold value) */
  @Input() referenceValue?: BarChartReferenceValue;
  /** Show or hide the chart legend */
  @Input() showLegend = true;

  chartOptions: EChartsOption = {};

  ngOnChanges(): void {
    this.buildChartOptions();
  }

  private buildChartOptions(): void {
    const isHorizontal = this.orientation === 'horizontal';
    const legendData = this.data.datasets.map((ds) => ds.label);
    const series = this.data.datasets.map((ds, i) =>
      this.buildBarSeries(ds, isHorizontal, i === 0),
    );

    const categoryAxis = this.buildCategoryAxisConfig();
    const valueAxis = this.buildValueAxisConfig();

    this.chartOptions = {
      tooltip: { trigger: 'item' },
      legend: { data: legendData, show: this.showLegend },
      xAxis: isHorizontal ? valueAxis : categoryAxis,
      yAxis: isHorizontal ? categoryAxis : valueAxis,
      series,
    };
  }

  private buildBarSeries(ds: BarChartDataset, isHorizontal: boolean, isFirst: boolean) {
    const markLineData: object[] = [];

    if (ds.showMeanLine) {
      markLineData.push({ type: 'average', name: 'Durchschnitt' });
    }

    if (isFirst && this.referenceValue) {
      markLineData.push({
        ...(isHorizontal
          ? { xAxis: this.referenceValue.value }
          : { yAxis: this.referenceValue.value }),
        name: this.referenceValue.label ?? 'Referenz',
        label: { formatter: this.referenceValue.label ?? 'Referenz' },
      });
    }

    return {
      name: ds.label,
      type: 'bar' as const,
      data: ds.data,
      stack: this.stacked ? 'total' : undefined,
      label: this.showValueLabels
        ? { show: true, position: isHorizontal ? ('right' as const) : ('top' as const) }
        : undefined,
      ...(ds.color ? { itemStyle: { color: this.resolveColor(ds.color) } } : {}),
      emphasis: {
        itemStyle: {
          borderColor: HOVER_BORDER_COLOR,
          borderWidth: HOVER_BORDER_WIDTH,
        },
      },
      ...(markLineData.length ? { markLine: { data: markLineData } } : {}),
    };
  }

  private buildCategoryAxisConfig() {
    const label = this.orientation === 'horizontal' ? this.yAxisLabel : this.xAxisLabel;
    return {
      type: 'category' as const,
      data: this.data.labels,
      ...(label
        ? { name: label, nameLocation: 'middle' as const, nameGap: CATEGORY_AXIS_NAME_GAP }
        : {}),
    };
  }

  private buildValueAxisConfig() {
    const label = this.orientation === 'horizontal' ? this.xAxisLabel : this.yAxisLabel;
    return {
      type: 'value' as const,
      ...(this.scaleToData ? { scale: true } : {}),
      ...(label
        ? { name: label, nameLocation: 'middle' as const, nameGap: VALUE_AXIS_NAME_GAP }
        : {}),
    };
  }

  private resolveColor(color: string | string[]) {
    if (Array.isArray(color)) {
      return (params: { dataIndex: number }) => color[params.dataIndex % color.length];
    }
    return color;
  }
}
