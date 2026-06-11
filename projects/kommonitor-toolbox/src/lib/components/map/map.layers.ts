import { createEmpty, extend, isEmpty, type Extent } from 'ol/extent';
import type { FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import type BaseLayer from 'ol/layer/Base';
import type Layer from 'ol/layer/Layer';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import type {
  MapGeoJsonLayer,
  MapLayer,
  MapTooltipFn,
  MapVectorStyle,
  MapWmsLayer,
} from './map.types';

/** OL layer property under which a layer's tooltip resolver is stored. */
const TOOLTIP_FN_KEY = 'kommonitorTooltipFn';
/** Extra stroke width added to the hovered feature's outline. */
const HOVER_STROKE_EXTRA = 1.5;

export interface LayerBuildContext {
  /** Projection GeoJSON features are transformed into (the map view's projection). */
  projection: string;
  /** Whether the feature is currently hovered; hovered features get a thicker outline. */
  isHovered: (feature: FeatureLike) => boolean;
}

/**
 * Builds the OL layers for the given layer configs.
 * Falls back to a default OSM layer when the list is empty.
 */
export function buildOlLayers(configs: MapLayer[], context: LayerBuildContext): BaseLayer[] {
  if (configs.length === 0) {
    return [new TileLayer({ source: new OSM() })];
  }
  return configs.map((cfg) => buildOlLayer(cfg, context));
}

/** Tooltip resolver attached to the given layer, if any. */
export function getTooltipFn(layer: Layer | null): MapTooltipFn | undefined {
  return layer?.get(TOOLTIP_FN_KEY) as MapTooltipFn | undefined;
}

/** Combined extent of all vector layers' sources, or undefined when there is none. */
export function vectorDataExtent(layers: BaseLayer[]): Extent | undefined {
  const extent = createEmpty();
  for (const layer of layers) {
    if (layer instanceof VectorLayer) {
      const sourceExtent = layer.getSource()?.getExtent();
      if (sourceExtent) {
        extend(extent, sourceExtent);
      }
    }
  }
  return isEmpty(extent) ? undefined : extent;
}

function buildOlLayer(cfg: MapLayer, context: LayerBuildContext): BaseLayer {
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
      return buildWmsLayer(cfg);

    case 'geojson':
      return buildGeoJsonLayer(cfg, context);
  }
}

function buildWmsLayer(cfg: MapWmsLayer): BaseLayer {
  return new TileLayer({
    opacity: cfg.opacity ?? 1,
    source: new TileWMS({
      url: cfg.url,
      params: { LAYERS: cfg.layers, TILED: true },
      attributions: cfg.attribution ? [cfg.attribution] : [],
    }),
  });
}

function buildGeoJsonLayer(cfg: MapGeoJsonLayer, context: LayerBuildContext): BaseLayer {
  const features = new GeoJSON().readFeatures(cfg.data, {
    featureProjection: context.projection,
  });

  const cfgStyle = cfg.style;
  // Resolve per feature so the hovered one gets a thicker outline; without a
  // configured style the OL default applies and hover highlighting is off.
  const style = cfgStyle
    ? (feature: FeatureLike) => {
        const base = typeof cfgStyle === 'function' ? cfgStyle(feature.getProperties()) : cfgStyle;
        return toOlStyle(base, context.isHovered(feature));
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

function toOlStyle(style: MapVectorStyle, hovered: boolean): Style {
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
