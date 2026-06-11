import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { MapComponent } from './map.component';
import type { MapLayer } from './map.types';

// ─── Shared Layer Configs ─────────────────────────────────────────────────────

const OSM_LAYER: MapLayer = { type: 'osm' };

const GEOJSON_ESSEN_DISTRICTS: MapLayer = {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Rüttenscheid' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [7.0, 51.44],
              [7.03, 51.44],
              [7.03, 51.46],
              [7.0, 51.46],
              [7.0, 51.44],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: { name: 'Holsterhausen' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [6.98, 51.45],
              [7.01, 51.45],
              [7.01, 51.47],
              [6.98, 51.47],
              [6.98, 51.45],
            ],
          ],
        },
      },
    ],
  },
  style: {
    fillColor: 'rgba(0, 100, 255, 0.2)',
    strokeColor: '#0064ff',
    strokeWidth: 2,
  },
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<MapComponent> = {
  title: 'KomMonitor/Map',
  component: MapComponent,
  tags: ['autodocs'],
  decorators: [componentWrapperDecorator((story) => `<div style="height: 500px;">${story}</div>`)],
  argTypes: {
    center: {
      control: 'object',
      description: 'Geografischer Mittelpunkt der Kartenansicht (Längen- und Breitengrad).',
    },
    zoom: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: 'Initiale Zoomstufe (0 = Weltkarte, höher = mehr Detail).',
    },
    layers: {
      control: 'object',
      description: 'Geordnete Liste der anzuzeigenden Layer (OSM, Tile, WMS, GeoJSON).',
    },
    projection: {
      control: 'text',
      description: 'Projektion der Kartenansicht (Standard: EPSG:3857).',
    },
  },
};

export default meta;
type Story = StoryObj<MapComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Standard OSM',
  args: {
    center: { lon: 7.011555, lat: 51.459556 },
    zoom: 12,
    layers: [OSM_LAYER],
  },
};

export const WithGeoJson: Story = {
  name: 'OSM + GeoJSON-Vektorlayer',
  args: {
    center: { lon: 7.01, lat: 51.455 },
    zoom: 13,
    layers: [OSM_LAYER, GEOJSON_ESSEN_DISTRICTS],
  },
};

export const CustomZoom: Story = {
  name: 'Gesamtansicht Deutschland',
  args: {
    center: { lon: 10.4515, lat: 51.1657 },
    zoom: 6,
    layers: [OSM_LAYER],
  },
};
