import {
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { of } from 'rxjs';
import { IndicatorService } from '../../services/indicators/indicator';
import { IndicatorBarChartComponent } from './indicator-bar-chart.component';

// ─── Mock Data (Essen: Anteil Bevölkerung 80 Jahre oder älter) ──────────────────

const INDICATOR_ID = 'pop-80-plus';
const SPATIAL_UNIT_ID = 'stadtbezirke';
const TIMESTAMP = '2024-12-31';

const SAMPLE: { name: string; value: number }[] = [
  { name: 'I', value: 5.2 },
  { name: 'II', value: 8.96 },
  { name: 'III', value: 6.09 },
  { name: 'IV', value: 7.15 },
  { name: 'V', value: 5.02 },
  { name: 'VI', value: 5.38 },
  { name: 'VII', value: 7.3 },
  { name: 'VIII', value: 10.1 },
  { name: 'IX', value: 10.2 },
];

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
  getIndicatorTimeseries: () =>
    of(
      SAMPLE.map((entry) => ({
        id: entry.name,
        name: entry.name,
        validStartDate: null,
        validEndDate: null,
        arisenFrom: null,
        values: [{ date: TIMESTAMP, value: entry.value }],
      })),
    ),
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<IndicatorBarChartComponent> = {
  title: 'KomMonitor/IndicatorBarChart',
  component: IndicatorBarChartComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      providers: [{ provide: IndicatorService, useValue: mockIndicatorService }],
    }),
    componentWrapperDecorator((story) => `<div style="height: 400px;">${story}</div>`),
  ],
  argTypes: {
    indicatorId: { control: 'text', description: 'ID des darzustellenden Indikators.' },
    spatialUnitId: { control: 'text', description: 'ID der raumbezogenen Einheit.' },
    timestamp: { control: 'text', description: 'Zeitstempel / Datum des anzuzeigenden Werts.' },
    showBarLabels: {
      control: 'boolean',
      description: 'Beschriftungen (Name und Wert) innerhalb der Balken anzeigen.',
    },
    showMeanLine: {
      control: 'boolean',
      description: 'Linie des rechnerischen Durchschnitts anzeigen.',
    },
  },
  args: {
    indicatorId: INDICATOR_ID,
    spatialUnitId: SPATIAL_UNIT_ID,
    timestamp: TIMESTAMP,
    showBarLabels: true,
    showMeanLine: true,
  },
};

export default meta;
type Story = StoryObj<IndicatorBarChartComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Standard-Ansicht: lädt die Indikatordaten und stellt sie als sortiertes Balkendiagramm dar. */
export const Standard: Story = {};

/** Gleiche Daten, jedoch ohne die Beschriftungen innerhalb der Balken. */
export const OhneBeschriftungen: Story = {
  name: 'Ohne Beschriftungen',
  args: {
    showBarLabels: false,
  },
};

/** Gleiche Daten, jedoch ohne die Durchschnittslinie. */
export const OhneDurchschnittslinie: Story = {
  name: 'Ohne Durchschnittslinie',
  args: {
    showMeanLine: false,
  },
};
