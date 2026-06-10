import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, combineLatest, forkJoin } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { IndicatorService } from '../../services/indicators/indicator';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import type { BarChartData, BarChartReferenceValue } from '../bar-chart/bar-chart.types';
import {
  average,
  buildGradient,
  formatDe,
  toSortedFeatureValues,
} from './indicator-bar-chart.types';

const REFERENCE_LABEL = 'rechnerischer Durchschnitt';

@Component({
  selector: 'lib-indicator-bar-chart',
  imports: [BarChartComponent],
  templateUrl: './indicator-bar-chart.component.html',
  styleUrl: './indicator-bar-chart.component.scss',
})
export class IndicatorBarChartComponent {
  /** ID of the indicator to display */
  readonly indicatorId = input.required<string>();
  /** ID of the spatial unit whose features are charted */
  readonly spatialUnitId = input.required<string>();
  /** Timestamp/date selecting which value of each feature's timeseries to show */
  readonly timestamp = input.required<string>();
  /** Show or hide the name/value labels rendered inside the bars */
  readonly showBarLabels = input(true);
  /** Show or hide the computed average ("rechnerischer Durchschnitt") reference line */
  readonly showMeanLine = input(true);

  private readonly indicatorService = inject(IndicatorService);

  readonly data = signal<BarChartData>({ labels: [], datasets: [] });
  readonly referenceValue = signal<BarChartReferenceValue | undefined>(undefined);
  readonly unit = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  /** Formats the in-bar label as "<feature name>  <value>" with German number formatting. */
  readonly labelFormatter = (params: { name?: string; value?: unknown }): string => {
    const value = typeof params.value === 'number' ? formatDe(params.value) : '';
    return `${params.name ?? ''}  ${value}`.trim();
  };

  constructor() {
    combineLatest({
      indicatorId: toObservable(this.indicatorId),
      spatialUnitId: toObservable(this.spatialUnitId),
      timestamp: toObservable(this.timestamp),
    })
      .pipe(
        filter(({ indicatorId, spatialUnitId, timestamp }) =>
          Boolean(indicatorId && spatialUnitId && timestamp),
        ),
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap(({ indicatorId, spatialUnitId, timestamp }) =>
          forkJoin({
            timeseries: this.indicatorService.getIndicatorTimeseries(indicatorId, spatialUnitId),
            indicators: this.indicatorService.getIndicators(),
          }).pipe(
            map((result) => ({ ...result, indicatorId, timestamp })),
            catchError(() => {
              this.error.set('Die Indikatordaten konnten nicht geladen werden.');
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ timeseries, indicators, indicatorId, timestamp }) => {
        const indicator = indicators.find((i) => i.indicatorId === indicatorId);
        const indicatorName = indicator?.indicatorName ?? '';
        this.unit.set(indicator?.unit ?? indicator?.metadata?.unit ?? '');

        const features = toSortedFeatureValues(timeseries, timestamp);
        const values = features.map((f) => f.value);

        this.data.set({
          labels: features.map((f) => f.name),
          datasets: [
            {
              label: indicatorName,
              data: values,
              color: buildGradient(features.length),
            },
          ],
        });

        this.referenceValue.set(
          values.length > 0
            ? {
                value: average(values),
                label: `${REFERENCE_LABEL}  ${formatDe(average(values))}`,
                labelPosition: 'insideStartTop',
              }
            : undefined,
        );

        this.loading.set(false);
      });
  }
}
