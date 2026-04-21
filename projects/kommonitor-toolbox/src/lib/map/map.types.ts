export interface MapCenter {
  /** Longitude (x) in decimal degrees */
  lon: number;
  /** Latitude (y) in decimal degrees */
  lat: number;
}

// ─── Layer types ──────────────────────────────────────────────────────────────

export interface MapOsmLayer {
  /** OSM tile layer using the default OpenStreetMap tile server */
  type: 'osm';
}

export interface MapTileLayer {
  /** Generic XYZ tile layer */
  type: 'tile';
  /** XYZ tile URL template, e.g. 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' */
  url: string;
  /** Optional attribution text shown in the map */
  attribution?: string;
  /** Layer opacity between 0 (transparent) and 1 (opaque), default: 1 */
  opacity?: number;
}

export interface MapWmsLayer {
  /** OGC WMS layer rendered as tiled requests */
  type: 'wms';
  /** WMS base URL */
  url: string;
  /** Comma-separated list of WMS layer names */
  layers: string;
  /** Optional attribution text */
  attribution?: string;
  /** Layer opacity between 0 and 1, default: 1 */
  opacity?: number;
}

export interface MapVectorStyle {
  /** Fill color as CSS color string, e.g. 'rgba(0,128,255,0.2)' */
  fillColor?: string;
  /** Stroke/outline color as CSS color string */
  strokeColor?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
}

export interface MapGeoJsonLayer {
  /** Vector layer sourced from an inline GeoJSON FeatureCollection */
  type: 'geojson';
  /** GeoJSON FeatureCollection object */
  data: object;
  /** Optional styling for features */
  style?: MapVectorStyle;
  /** Layer opacity between 0 and 1, default: 1 */
  opacity?: number;
}

export type MapLayer = MapOsmLayer | MapTileLayer | MapWmsLayer | MapGeoJsonLayer;
