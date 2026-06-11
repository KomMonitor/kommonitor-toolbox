import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { createEmpty, extend, isEmpty, type Extent } from 'ol/extent';
import Feature, { type FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import View from 'ol/View';
import type {
  MapCenter,
  MapGeoJsonLayer,
  MapLayer,
  MapTooltip,
  MapTooltipFn,
  MapVectorStyle,
  MapWmsLayer,
} from './map.types';

export type {
  MapCenter,
  MapGeoJsonLayer,
  MapLayer,
  MapOsmLayer,
  MapTileLayer,
  MapTooltip,
  MapTooltipFn,
  MapVectorStyle,
  MapVectorStyleFn,
  MapWmsLayer,
} from './map.types';

const DEFAULT_CENTER: MapCenter = { lon: 7.011555, lat: 51.459556 };
const DEFAULT_ZOOM = 12;

/** OL layer property under which a layer's tooltip resolver is stored. */
const TOOLTIP_FN_KEY = 'kommonitorTooltipFn';
/** Extra stroke width added to the hovered feature's outline. */
const HOVER_STROKE_EXTRA = 1.5;

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
  imports: [],
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
      const olLayers = this.buildOlLayers();
      this.map = new Map({
        target: this.mapContainer().nativeElement,
        view: new View({
          center: fromLonLat([this.center().lon, this.center().lat]),
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
      // buildOlLayers() reads the layers and projection signals.
      const olLayers = this.buildOlLayers();
      if (!this.map) return;

      this.map.getLayers().clear();
      for (const layer of olLayers) {
        this.map.addLayer(layer);
      }
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
  private syncView(olLayers: ReturnType<MapComponent['buildOlLayers']>) {
    if (!this.map) return;
    const view = this.map.getView();

    if (this.fitToData()) {
      const extent = this.dataExtent(olLayers);
      if (extent) {
        this.fitExtent(extent);
        return;
      }
    }

    this.pendingFitExtent = undefined;
    view.setCenter(fromLonLat([this.center().lon, this.center().lat]));
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
      const tooltipFn = layer?.get(TOOLTIP_FN_KEY) as MapTooltipFn | undefined;
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

  /** Combined extent of all vector layers' sources, or undefined when there is none. */
  private dataExtent(olLayers: ReturnType<MapComponent['buildOlLayers']>): Extent | undefined {
    const extent = createEmpty();
    for (const layer of olLayers) {
      if (layer instanceof VectorLayer) {
        const sourceExtent = layer.getSource()?.getExtent();
        if (sourceExtent) {
          extend(extent, sourceExtent);
        }
      }
    }
    return isEmpty(extent) ? undefined : extent;
  }

  private buildOlLayers() {
    const layers = this.layers();
    if (layers.length === 0) {
      return [new TileLayer({ source: new OSM() })];
    }
    return layers.map((cfg) => this.buildOlLayer(cfg));
  }

  private buildOlLayer(cfg: MapLayer) {
    switch (cfg.type) {
      case 'osm':
        return new TileLayer({ source: new OSM() });

      case 'tile':
        return new TileLayer({
          opacity: cfg.opacity ?? 1,
          source: new XYZ({
            url: cfg.url,
            attributions: cfg.attribution ? [cfg.attribution] : [],
          }),
        });

      case 'wms':
        return this.buildWmsLayer(cfg);

      case 'geojson':
        return this.buildGeoJsonLayer(cfg);
    }
  }

  private buildWmsLayer(cfg: MapWmsLayer) {
    return new TileLayer({
      opacity: cfg.opacity ?? 1,
      source: new TileWMS({
        url: cfg.url,
        params: { LAYERS: cfg.layers, TILED: true },
        attributions: cfg.attribution ? [cfg.attribution] : [],
      }),
    });
  }

  private buildGeoJsonLayer(cfg: MapGeoJsonLayer) {
    const features = new GeoJSON().readFeatures(cfg.data, {
      featureProjection: this.projection(),
    });

    const cfgStyle = cfg.style;
    // Resolve per feature so the hovered one gets a thicker outline; without a
    // configured style the OL default applies and hover highlighting is off.
    const style = cfgStyle
      ? (feature: FeatureLike) => {
          const base =
            typeof cfgStyle === 'function' ? cfgStyle(feature.getProperties()) : cfgStyle;
          return this.toOlStyle(base, feature === this.hoveredFeature);
        }
      : undefined;

    const layer = new VectorLayer({
      opacity: cfg.opacity ?? 1,
      source: new VectorSource({ features }),
      style,
    });
    if (cfg.tooltip) {
      layer.set(TOOLTIP_FN_KEY, cfg.tooltip);
    }
    return layer;
  }

  private toOlStyle(style: MapVectorStyle, hovered = false): Style {
    const strokeWidth = style.strokeWidth ?? 1.5;
    return new Style({
      fill: new Fill({ color: style.fillColor ?? 'rgba(0, 100, 255, 0.15)' }),
      stroke: new Stroke({
        color: style.strokeColor ?? '#0064ff',
        width: hovered ? strokeWidth + HOVER_STROKE_EXTRA : strokeWidth,
      }),
      // Lift the hovered feature so its outline is not covered by neighbours.
      zIndex: hovered ? 1 : undefined,
    });
  }
}
