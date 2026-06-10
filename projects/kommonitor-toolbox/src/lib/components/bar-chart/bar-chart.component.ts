import { Component, computed, input } from '@angular/core';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { BarChartData, BarChartDataset, BarChartReferenceValue } from './bar-chart.types';

export type { BarChartData, BarChartDataset, BarChartReferenceValue } from './bar-chart.types';

/** ECharts label option types for bar series labels. */
type BarLabelOption = NonNullable<BarSeriesOption['label']>;
type BarLabelFormatter = NonNullable<BarLabelOption['formatter']>;
type BarLabelPosition = NonNullable<BarLabelOption['position']>;
type BarLabelAlign = NonNullable<BarLabelOption['align']>;
type BarLabelVerticalAlign = NonNullable<BarLabelOption['verticalAlign']>;

const CATEGORY_AXIS_NAME_GAP = 30;
const VALUE_AXIS_NAME_GAP = 50;
const HOVER_BORDER_COLOR = '#00fff2';
const HOVER_BORDER_WIDTH = 4;
/** Tight margin around the plot area; axis labels still fit thanks to containLabel. */
const GRID_MARGIN = 16;
/** Extra top space reserved when the toolbox or legend is shown so they don't overlap the bars. */
const GRID_TOP_WITH_OVERLAY = 40;

@Component({
  selector: 'lib-bar-chart',
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
export class BarChartComponent {
  /** Chart data: category labels and one or more datasets */
  readonly data = input<BarChartData>({ labels: [], datasets: [] });
  /** Label for the category axis (X in vertical, Y in horizontal orientation) */
  readonly xAxisLabel = input('');
  /** Label for the value axis (Y in vertical, X in horizontal orientation) */
  readonly yAxisLabel = input('');
  /** Bar orientation: 'vertical' renders columns, 'horizontal' renders bars */
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  /** Stack multiple datasets on top of each other instead of grouping them side-by-side */
  readonly stacked = input(false);
  /** Start the value axis at the data minimum instead of zero */
  readonly scaleToData = input(false);
  /** Show the numeric value as a label on each bar */
  readonly showValueLabels = input(false);
  /** Draw a fixed reference line (e.g. a target or threshold value) */
  readonly referenceValue = input<BarChartReferenceValue>();
  /** Show or hide the chart legend */
  readonly showLegend = input(true);
  /** Show or hide the category-axis tick labels (e.g. when labels are rendered inside the bars) */
  readonly showCategoryLabels = input(true);
  /** ECharts label position for value labels (e.g. 'top', 'insideBottom'). Defaults to top/right by orientation. */
  readonly valueLabelPosition = input<BarLabelPosition>();
  /** Rotation in degrees for value labels (useful for in-bar labels) */
  readonly valueLabelRotate = input<number>();
  /** Horizontal alignment of the value label text */
  readonly valueLabelAlign = input<BarLabelAlign>();
  /** Vertical alignment of the value label text */
  readonly valueLabelVerticalAlign = input<BarLabelVerticalAlign>();
  /** Distance in pixels between the value label and the bar edge */
  readonly valueLabelDistance = input<number>();
  /** Custom formatter for value labels – an ECharts template string or callback */
  readonly valueLabelFormatter = input<BarLabelFormatter>();
  /** Show the export toolbox (save as image, data view) in the top-right corner */
  readonly showToolbox = input(false);

  /** ECharts options, recomputed whenever any input signal changes. */
  readonly chartOptions = computed<EChartsOption>(() => this.buildChartOptions());

  private buildChartOptions(): EChartsOption {
    const isHorizontal = this.orientation() === 'horizontal';
    const data = this.data();
    const legendData = data.datasets.map((ds) => ds.label);
    const series = data.datasets.map((ds, i) => this.buildBarSeries(ds, isHorizontal, i === 0));

    const categoryAxis = this.buildCategoryAxisConfig();
    const valueAxis = this.buildValueAxisConfig();

    return {
      ...(this.showToolbox()
        ? {
            toolbox: {
              right: 10,
              feature: {
                dataView: { readOnly: true, title: 'Daten anzeigen' },
                saveAsImage: { title: 'Als Bild speichern' },
              },
            },
          }
        : {}),
      tooltip: { trigger: 'item' },
      legend: { data: legendData, show: this.showLegend() },
      grid: {
        left: GRID_MARGIN,
        right: GRID_MARGIN,
        bottom: GRID_MARGIN,
        top: this.showToolbox() || this.showLegend() ? GRID_TOP_WITH_OVERLAY : GRID_MARGIN,
        containLabel: true,
      },
      xAxis: isHorizontal ? valueAxis : categoryAxis,
      yAxis: isHorizontal ? categoryAxis : valueAxis,
      series,
    };
  }

  private buildBarSeries(ds: BarChartDataset, isHorizontal: boolean, isFirst: boolean) {
    const markLineData: object[] = [];

    if (ds.showMeanLine) {
      markLineData.push({
        type: 'average',
        name: 'Durchschnitt',
        label: { position: 'insideStartTop' },
      });
    }

    const referenceValue = this.referenceValue();
    if (isFirst && referenceValue) {
      markLineData.push({
        ...(isHorizontal ? { xAxis: referenceValue.value } : { yAxis: referenceValue.value }),
        name: referenceValue.label ?? 'Referenz',
        label: {
          formatter: referenceValue.label ?? 'Referenz',
          ...(referenceValue.labelPosition ? { position: referenceValue.labelPosition } : {}),
        },
      });
    }

    return {
      name: ds.label,
      type: 'bar' as const,
      data: ds.data,
      stack: this.stacked() ? 'total' : undefined,
      label: this.showValueLabels() ? this.buildLabelConfig(isHorizontal) : undefined,
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

  private buildLabelConfig(isHorizontal: boolean) {
    const defaultPosition = isHorizontal ? ('right' as const) : ('top' as const);
    const rotate = this.valueLabelRotate();
    const align = this.valueLabelAlign();
    const verticalAlign = this.valueLabelVerticalAlign();
    const distance = this.valueLabelDistance();
    const formatter = this.valueLabelFormatter();
    return {
      show: true,
      position: this.valueLabelPosition() ?? defaultPosition,
      ...(rotate !== undefined ? { rotate } : {}),
      ...(align ? { align } : {}),
      ...(verticalAlign ? { verticalAlign } : {}),
      ...(distance !== undefined ? { distance } : {}),
      ...(formatter ? { formatter } : {}),
    };
  }

  private buildCategoryAxisConfig() {
    const label = this.orientation() === 'horizontal' ? this.yAxisLabel() : this.xAxisLabel();
    return {
      type: 'category' as const,
      data: this.data().labels,
      ...(this.showCategoryLabels() ? {} : { axisLabel: { show: false } }),
      ...(label
        ? { name: label, nameLocation: 'middle' as const, nameGap: CATEGORY_AXIS_NAME_GAP }
        : {}),
    };
  }

  private buildValueAxisConfig() {
    const label = this.orientation() === 'horizontal' ? this.xAxisLabel() : this.yAxisLabel();
    return {
      type: 'value' as const,
      ...(this.scaleToData() ? { scale: true } : {}),
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
