import {
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { of } from 'rxjs';
import type { IndicatorFeatureCollection } from '../../services/indicators/indicator';
import { IndicatorService } from '../../services/indicators/indicator';
import { IndicatorMapComponent } from './indicator-map.component';

// ─── Mock Data (Essen: Anteil Bevölkerung 80 Jahre oder älter) ──────────────────

const INDICATOR_ID = 'pop-80-plus';
const SPATIAL_UNIT_ID = 'stadtbezirke';
const TIMESTAMP = '2024-12-31';

interface MockFeature {
  name: string;
  value: number;
  coordinates: number[][][];
}

const FEATURES: MockFeature[] = [
  {
    name: 'Rüttenscheid',
    value: 5.2,
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
  {
    name: 'Holsterhausen',
    value: 8.96,
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
  {
    name: 'Altstadt',
    value: 10.2,
    coordinates: [
      [
        [7.01, 51.45],
        [7.04, 51.45],
        [7.04, 51.47],
        [7.01, 51.47],
        [7.01, 51.45],
      ],
    ],
  },
];

const FEATURE_COLLECTION: IndicatorFeatureCollection = {
  type: 'FeatureCollection',
  features: FEATURES.map((feature, index) => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: feature.coordinates },
    properties: {
      ID: String(index + 1),
      NAME: feature.name,
      [`DATE_${TIMESTAMP}`]: feature.value,
    },
  })),
};

/** Minimal IndicatorService stub returning the canned sample for any id combination. */
const mockIndicatorService: Partial<IndicatorService> = {
  getIndicators: () =>
    of([
      {
        indicatorId: INDICATOR_ID,
        indicatorName: 'Anteil Bevölkerung Essen 80 Jahre oder älter',
        unit: 'Prozent',
      },
    ]),
  getIndicatorFeatureCollection: () => of(FEATURE_COLLECTION),
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<IndicatorMapComponent> = {
  title: 'KomMonitor/IndicatorMap',
  component: IndicatorMapComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      providers: [{ provide: IndicatorService, useValue: mockIndicatorService }],
    }),
    componentWrapperDecorator((story) => `<div style="height: 500px;">${story}</div>`),
  ],
  argTypes: {
    indicatorId: { control: 'text', description: 'ID des darzustellenden Indikators.' },
    spatialUnitId: { control: 'text', description: 'ID der raumbezogenen Einheit.' },
    timestamp: { control: 'text', description: 'Zeitstempel / Datum des einzufärbenden Werts.' },
    center: {
      control: 'object',
      description: 'Geografischer Mittelpunkt der Kartenansicht (Längen- und Breitengrad).',
    },
    zoom: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description:
        'Initiale Zoomstufe. Wird zusammen mit center weggelassen, zoomt die Karte automatisch auf den Datenbereich.',
    },
    showLegend: {
      control: 'boolean',
      description: 'Farb-Legende mit Wertebereich und Einheit unterhalb der Karte anzeigen.',
    },
  },
  args: {
    indicatorId: INDICATOR_ID,
    spatialUnitId: SPATIAL_UNIT_ID,
    timestamp: TIMESTAMP,
    showLegend: true,
  },
};

export default meta;
type Story = StoryObj<IndicatorMapComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Standard-Ansicht: lädt die Geometrien, färbt die Features nach ihrem Wert ein
 * und zoomt automatisch auf den Datenbereich (kein center/zoom gesetzt).
 */
export const Standard: Story = {};

/** Gleiche Karte, jedoch ohne Farb-Legende. */
export const OhneLegende: Story = {
  name: 'Ohne Legende',
  args: {
    showLegend: false,
  },
};

/**
 * Manuell gesetzter Kartenausschnitt: sobald center und/oder zoom gesetzt sind,
 * wird nicht mehr automatisch auf den Datenbereich gezoomt.
 */
export const ManuellerAusschnitt: Story = {
  name: 'Manueller Ausschnitt',
  args: {
    center: { lon: 10.4515, lat: 51.1657 },
    zoom: 6,
  },
};
