import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import View from 'ol/View';
import type { MapCenter, MapGeoJsonLayer, MapLayer, MapWmsLayer } from './map.types';

export type {
  MapCenter,
  MapGeoJsonLayer,
  MapLayer,
  MapOsmLayer,
  MapTileLayer,
  MapVectorStyle,
  MapWmsLayer,
} from './map.types';

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
  imports: [],
  template: `<div #mapContainer style="width: 100%; height: 100%;"></div>`,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Geographic center of the map view */
  @Input() center: MapCenter = DEFAULT_CENTER;
  /** Initial zoom level (0 = world, higher = more detail) */
  @Input() zoom = DEFAULT_ZOOM;
  /**
   * Ordered list of map layers to display.
   * Falls back to a default OSM layer when the array is empty.
   */
  @Input() layers: MapLayer[] = [];
  /** Output projection used by the map view (default: EPSG:3857 Web Mercator) */
  @Input() projection = 'EPSG:3857';

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;

  private map?: Map;

  ngAfterViewInit(): void {
    this.map = new Map({
      target: this.mapContainer.nativeElement,
      view: new View({
        center: fromLonLat([this.center.lon, this.center.lat]),
        zoom: this.zoom,
        projection: this.projection,
      }),
      layers: this.buildOlLayers(),
    });
  }

  ngOnChanges(): void {
    if (!this.map) return;

    const view = this.map.getView();
    view.setCenter(fromLonLat([this.center.lon, this.center.lat]));
    view.setZoom(this.zoom);

    this.map.getLayers().clear();
    for (const layer of this.buildOlLayers()) {
      this.map.addLayer(layer);
    }
  }

  ngOnDestroy(): void {
    this.map?.setTarget(undefined);
  }

  private buildOlLayers() {
    if (this.layers.length === 0) {
      return [new TileLayer({ source: new OSM() })];
    }
    return this.layers.map((cfg) => this.buildOlLayer(cfg));
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
      featureProjection: this.projection,
    });

    const style = cfg.style
      ? new Style({
          fill: new Fill({ color: cfg.style.fillColor ?? 'rgba(0, 100, 255, 0.15)' }),
          stroke: new Stroke({
            color: cfg.style.strokeColor ?? '#0064ff',
            width: cfg.style.strokeWidth ?? 1.5,
          }),
        })
      : undefined;

    return new VectorLayer({
      opacity: cfg.opacity ?? 1,
      source: new VectorSource({ features }),
      style,
    });
  }
}
