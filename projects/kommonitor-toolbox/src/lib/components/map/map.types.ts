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

/**
 * Resolves a {@link MapVectorStyle} per feature based on its GeoJSON properties.
 * Enables data-driven styling such as choropleth colouring.
 */
export type MapVectorStyleFn = (properties: Record<string, unknown>) => MapVectorStyle;

/** Content of the hover tooltip shown for a feature. */
export interface MapTooltip {
  /** Emphasised first line, e.g. the feature name */
  title: string;
  /** Optional second line, e.g. the formatted value */
  text?: string;
}

/**
 * Resolves the hover tooltip per feature from its GeoJSON properties.
 * Return `null` to show no tooltip for that feature.
 */
export type MapTooltipFn = (properties: Record<string, unknown>) => MapTooltip | null;

export interface MapGeoJsonLayer {
  /** Vector layer sourced from an inline GeoJSON FeatureCollection */
  type: 'geojson';
  /** GeoJSON FeatureCollection object */
  data: object;
  /**
   * Optional styling for features. Either a single style applied to all
   * features, or a function resolving a style per feature from its properties.
   */
  style?: MapVectorStyle | MapVectorStyleFn;
  /** Layer opacity between 0 and 1, default: 1 */
  opacity?: number;
  /** Optional hover tooltip resolved per feature from its properties. */
  tooltip?: MapTooltipFn;
}

export type MapLayer = MapOsmLayer | MapTileLayer | MapWmsLayer | MapGeoJsonLayer;
