import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { type Extent } from 'ol/extent';
import Feature, { type FeatureLike } from 'ol/Feature';
import type BaseLayer from 'ol/layer/Base';
import Map from 'ol/Map';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import View from 'ol/View';
import { buildOlLayers, getTooltipFn, vectorDataExtent } from './map.layers';
import type { MapCenter, MapLayer, MapTooltip } from './map.types';

const DEFAULT_CENTER: MapCenter = { lon: 7.011555, lat: 51.459556 };
const DEFAULT_ZOOM = 12;

/**
 * MapComponent renders an interactive OpenLayers map.
 *
 * **Required styles:** consumers of this library must include the OpenLayers
 * stylesheet in their application, e.g. by adding the following entry to the
 * `styles` array in `angular.json`:
 *
 * ```json
 * "node_modules/ol/ol.css"
 * ```
 *
 * or by importing it globally:
 *
 * ```ts
 * import 'ol/ol.css';
 * ```
 */
@Component({
  selector: 'lib-map',
  template: `
    <div #mapContainer style="width: 100%; height: 100%;"></div>
    <div #tooltip class="map-tooltip">
      @if (tooltipContent(); as tip) {
        <div class="map-tooltip__title">{{ tip.title }}</div>
        @if (tip.text) {
          <div class="map-tooltip__text">{{ tip.text }}</div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .map-tooltip {
      pointer-events: none;
      max-width: 16rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      font-size: 0.8rem;
      line-height: 1.3;
      white-space: nowrap;
    }

    .map-tooltip__title {
      font-weight: 600;
    }
  `,
})
export class MapComponent {
  /** Geographic center of the map view */
  readonly center = input<MapCenter>(DEFAULT_CENTER);
  /** Initial zoom level (0 = world, higher = more detail) */
  readonly zoom = input(DEFAULT_ZOOM);
  /**
   * Ordered list of map layers to display.
   * Falls back to a default OSM layer when the array is empty.
   */
  readonly layers = input<MapLayer[]>([]);
  /** Output projection used by the map view (default: EPSG:3857 Web Mercator) */
  readonly projection = input('EPSG:3857');
  /**
   * When true, the view fits the combined extent of all vector (GeoJSON) layers
   * after they are (re)built, instead of using {@link center} / {@link zoom}.
   * Falls back to center/zoom when there is no vector content.
   */
  readonly fitToData = input(false);
  /** Padding in pixels applied around the data extent when {@link fitToData} is active. */
  readonly fitPadding = input(24);

  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly tooltipElement = viewChild.required<ElementRef<HTMLDivElement>>('tooltip');

  /** Content of the hover tooltip; null hides it. */
  readonly tooltipContent = signal<MapTooltip | null>(null);

  /** OL layers derived from the layer configs; rebuilt only when those change. */
  private readonly olLayers = computed(() =>
    buildOlLayers(this.layers(), {
      projection: this.projection(),
      isHovered: (feature) => feature === this.hoveredFeature,
    }),
  );

  private map?: Map;
  private tooltipOverlay?: Overlay;
  /** Feature whose tooltip is showing; drawn with a thicker outline. */
  private hoveredFeature?: FeatureLike;
  /**
   * Data extent whose fit was requested while the map had no size yet (e.g. the
   * container was still `display: none`); applied on the next size change.
   */
  private pendingFitExtent?: Extent;

  constructor() {
    // Create the OpenLayers map once the view (and its container element) exists.
    afterNextRender(() => {
      const olLayers = this.olLayers();
      this.map = new Map({
        target: this.mapContainer().nativeElement,
        view: new View({
          center: this.centerCoordinate(),
          zoom: this.zoom(),
          projection: this.projection(),
        }),
        layers: olLayers,
      });
      this.map.on('change:size', () => {
        if (this.pendingFitExtent) {
          this.fitExtent(this.pendingFitExtent);
        }
      });

      this.tooltipOverlay = new Overlay({
        element: this.tooltipElement().nativeElement,
        positioning: 'bottom-center',
        offset: [0, -12],
        stopEvent: false,
      });
      this.map.addOverlay(this.tooltipOverlay);
      this.map.on('pointermove', (event) => this.updateTooltip(event));
      this.map.getViewport().addEventListener('pointerleave', () => this.hideTooltip());

      this.syncView(olLayers);
    });

    // Keep the map in sync with the inputs. Runs whenever an input signal changes;
    // the initial run is a no-op until afterNextRender has created the map.
    effect(() => {
      // Read all view-affecting signals so they are registered as dependencies.
      this.center();
      this.zoom();
      this.fitToData();
      this.fitPadding();
      const olLayers = this.olLayers();
      if (!this.map) return;

      this.map.setLayers(olLayers);
      // The feature under the cursor may be gone after the rebuild.
      this.hideTooltip();
      this.syncView(olLayers);
    });

    inject(DestroyRef).onDestroy(() => this.map?.setTarget(undefined));
  }

  /**
   * Fits the view to the data extent when {@link fitToData} is active and there is
   * vector content; otherwise applies the {@link center} / {@link zoom} inputs.
   */
  private syncView(olLayers: BaseLayer[]) {
    if (!this.map) return;
    const view = this.map.getView();

    if (this.fitToData()) {
      const extent = vectorDataExtent(olLayers);
      if (extent) {
        this.fitExtent(extent);
        return;
      }
    }

    this.pendingFitExtent = undefined;
    view.setCenter(this.centerCoordinate());
    view.setZoom(this.zoom());
  }

  /**
   * Fits the view to the given extent. While the map has no usable size (the
   * container is hidden or not laid out yet, e.g. a freshly created gridster
   * item) fitting would clamp to maxZoom, so the fit is deferred until the
   * next size change instead.
   */
  private fitExtent(extent: Extent) {
    if (!this.map) return;
    const size = this.map.getSize();
    if (!size || size[0] === 0 || size[1] === 0) {
      this.pendingFitExtent = extent;
      return;
    }
    this.pendingFitExtent = undefined;
    const padding = this.fitPadding();
    this.map.getView().fit(extent, { padding: [padding, padding, padding, padding], maxZoom: 16 });
  }

  /**
   * Shows the tooltip of the topmost feature under the cursor that belongs to a
   * layer with a tooltip resolver, or hides it when there is none.
   */
  private updateTooltip(event: MapBrowserEvent) {
    if (!this.map || event.dragging) {
      this.hideTooltip();
      return;
    }

    let content: MapTooltip | null = null;
    let hovered: FeatureLike | undefined;
    this.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
      const tooltipFn = getTooltipFn(layer);
      content = tooltipFn ? tooltipFn(feature.getProperties()) : null;
      if (content !== null) {
        hovered = feature;
        return true;
      }
      // Keep looking for a feature with tooltip content underneath.
      return undefined;
    });

    this.setHoveredFeature(hovered);
    this.tooltipContent.set(content);
    this.tooltipOverlay?.setPosition(content ? event.coordinate : undefined);
  }

  private hideTooltip() {
    this.setHoveredFeature(undefined);
    this.tooltipContent.set(null);
    this.tooltipOverlay?.setPosition(undefined);
  }

  /** Tracks the hovered feature and triggers a re-style of the old and new one. */
  private setHoveredFeature(feature: FeatureLike | undefined) {
    if (feature === this.hoveredFeature) return;
    const previous = this.hoveredFeature;
    this.hoveredFeature = feature;
    if (previous instanceof Feature) previous.changed();
    if (feature instanceof Feature) feature.changed();
  }

  private centerCoordinate() {
    const { lon, lat } = this.center();
    return fromLonLat([lon, lat]);
  }
}
