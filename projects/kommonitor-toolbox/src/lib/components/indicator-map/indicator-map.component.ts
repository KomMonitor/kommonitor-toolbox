import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, combineLatest, forkJoin } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import {
  classify,
  type ClassificationConfig,
  DEFAULT_CLASSIFICATION,
  discreteLegend,
  type LegendClass,
} from '../../classification';
import { IndicatorService } from '../../services/indicators/indicator';
import { MapComponent } from '../map/map.component';
import type { MapCenter, MapLayer } from '../map/map.types';
import { allValuesOf, legendLabel, valueAt } from './indicator-map.types';

const DEFAULT_CENTER: MapCenter = { lon: 10.4515, lat: 51.1657 };
const DEFAULT_ZOOM = 6;

@Component({
  selector: 'lib-indicator-map',
  imports: [MapComponent],
  templateUrl: './indicator-map.component.html',
  styleUrl: './indicator-map.component.scss',
})
export class IndicatorMapComponent {
  /** ID of the indicator to display */
  readonly indicatorId = input.required<string>();
  /** ID of the spatial unit whose features are mapped */
  readonly spatialUnitId = input.required<string>();
  /** Timestamp/date selecting which value of each feature's timeseries to colour by */
  readonly timestamp = input.required<string>();
  /**
   * Geographic center of the map view. When neither `center` nor `zoom` is set,
   * the map auto-fits to the loaded data extent after each load.
   */
  readonly center = input<MapCenter>();
  /**
   * Initial zoom level. When neither `center` nor `zoom` is set, the map
   * auto-fits to the loaded data extent after each load.
   */
  readonly zoom = input<number>();
  /** Show or hide the colour legend below the map */
  readonly showLegend = input(true);
  /** Coloring configuration: palette, classification method and number of classes. */
  readonly classification = input<ClassificationConfig>(DEFAULT_CLASSIFICATION);

  private readonly indicatorService = inject(IndicatorService);

  /** Auto-fit to the data extent unless an explicit center or zoom was provided. */
  readonly autoFit = computed(() => this.center() === undefined && this.zoom() === undefined);
  /** Effective view center: the provided value or the Germany-wide fallback. */
  readonly effectiveCenter = computed(() => this.center() ?? DEFAULT_CENTER);
  /** Effective zoom: the provided value or the Germany-wide fallback. */
  readonly effectiveZoom = computed(() => this.zoom() ?? DEFAULT_ZOOM);

  readonly layers = signal<MapLayer[]>([{ type: 'osm' }]);
  readonly unit = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  /** Whether any feature carried a numeric value (controls legend visibility). */
  readonly hasData = signal(false);
  /** Discrete legend entries (colour + value range) for the active classification. */
  readonly legendClasses = signal<LegendClass[]>([]);
  /** Formats a legend class as a German value-range label. */
  readonly legendLabel = legendLabel;

  constructor() {
    combineLatest({
      indicatorId: toObservable(this.indicatorId),
      spatialUnitId: toObservable(this.spatialUnitId),
      timestamp: toObservable(this.timestamp),
      config: toObservable(this.classification),
    })
      .pipe(
        filter(({ indicatorId, spatialUnitId, timestamp }) =>
          Boolean(indicatorId && spatialUnitId && timestamp),
        ),
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap(({ indicatorId, spatialUnitId, timestamp, config }) =>
          forkJoin({
            featureCollection: this.indicatorService.getIndicatorFeatureCollection(
              indicatorId,
              spatialUnitId,
            ),
            indicators: this.indicatorService.getIndicators(),
          }).pipe(
            map((result) => ({ ...result, indicatorId, timestamp, config })),
            catchError(() => {
              this.error.set('Die Indikatordaten konnten nicht geladen werden.');
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ featureCollection, indicators, indicatorId, timestamp, config }) => {
        const indicator = indicators.find((i) => i.indicatorId === indicatorId);
        this.unit.set(indicator?.unit ?? indicator?.metadata?.unit ?? '');

        const features = featureCollection?.features ?? [];
        // Classify across the whole timeseries when requested, else only the selected date.
        const classificationValues = config.classifyAcrossTimeseries
          ? features.flatMap((feature) => allValuesOf(feature.properties))
          : features
              .map((feature) => valueAt(feature.properties, timestamp))
              .filter((value): value is number => value !== null);

        const hasValueAtTimestamp = features.some(
          (feature) => valueAt(feature.properties, timestamp) !== null,
        );
        this.hasData.set(hasValueAtTimestamp);

        const classification = classify(classificationValues, config);
        this.legendClasses.set(discreteLegend(classification.breaks, classification.colors));

        this.layers.set([
          { type: 'osm' },
          {
            type: 'geojson',
            data: featureCollection,
            opacity: 0.8,
            style: (props) => ({
              fillColor: classification.colorFor(valueAt(props, timestamp)),
              strokeColor: '#ffffff',
              strokeWidth: 1,
            }),
          },
        ]);

        this.loading.set(false);
      });
  }
}
