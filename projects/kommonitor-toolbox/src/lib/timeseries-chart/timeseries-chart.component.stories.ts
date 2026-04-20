import { Component } from '@angular/core';
import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';

import {
  TimeseriesChartComponent,
  type LegendComponentOption,
  type TimeseriesData,
  type TimeseriesIntervalDataset,
  type TimeseriesLineDataset,
} from './timeseries-chart.component';

// ─── Symbol Options ────────────────────────────────────────────────────────────

const SYMBOL_OPTIONS = [
  'emptyCircle',
  'circle',
  'rect',
  'roundRect',
  'triangle',
  'diamond',
  'pin',
  'arrow',
  'none',
] as const;

// ─── Shared Raw Data ───────────────────────────────────────────────────────────

const YEARS_2020_2024 = ['2020', '2021', '2022', '2023', '2024'];
const EINWOHNER_VALUES = [16869, 17031, 17105, 17115, 17200];
const HAUSHALTE_VALUES = [8200, 8350, 8400, 8420, 8500];

const INTERVAL_YEARS = [
  '2002-12-31', '2003-12-31', '2004-12-31', '2005-12-31', '2006-12-31', '2007-12-31',
  '2008-12-31', '2009-12-31', '2010-12-31', '2011-12-31', '2012-12-31', '2013-12-31',
  '2014-12-31', '2015-12-31', '2016-12-31', '2017-12-31', '2018-12-31', '2019-12-31',
  '2020-12-31', '2021-12-31', '2022-12-31', '2023-12-31',
];
const STADTBEZIRKE_MAIN   = [5.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 6.0, 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 6.8, 7.0, 7.1, 7.2, 7.2, 7.2, 7.2];
const STADTBEZIRKE_LOWER  = [3.8, 3.9, 4.0, 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.5, 5.6, 5.6, 5.7, 5.8];
const STADTBEZIRKE_UPPER  = [6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0, 8.2, 8.4, 8.5, 8.6, 8.8, 9.0, 9.2, 9.5, 9.7, 10.0];
const GESAMTSTADT_VALUES  = [4.8, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 5.9, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 6.9, 6.9, 6.9, 6.9];

// ─── Typed Datasets ────────────────────────────────────────────────────────────

const einwohnerDataset: TimeseriesLineDataset = {
  type: 'line',
  label: 'Einwohner',
  data: EINWOHNER_VALUES,
};

const haushalteDataset: TimeseriesLineDataset = {
  type: 'line',
  label: 'Haushalte',
  data: HAUSHALTE_VALUES,
};

const stadtbezirkeDataset: TimeseriesIntervalDataset = {
  type: 'interval',
  label: 'Stadtbezirke Essen (Prozent)',
  data: STADTBEZIRKE_MAIN,
  lower: STADTBEZIRKE_LOWER,
  upper: STADTBEZIRKE_UPPER,
};

const gesamtstadtDataset: TimeseriesLineDataset = {
  type: 'line',
  label: 'Gesamtstadt Essen (Prozent)',
  data: GESAMTSTADT_VALUES,
};

// ─── Story Data ────────────────────────────────────────────────────────────────

const singleData: TimeseriesData = {
  labels: YEARS_2020_2024,
  datasets: [einwohnerDataset],
};

const multiData: TimeseriesData = {
  labels: YEARS_2020_2024,
  datasets: [einwohnerDataset, haushalteDataset],
};

const intervalData: TimeseriesData = {
  labels: INTERVAL_YEARS,
  datasets: [stadtbezirkeDataset],
};

const intervalDataWithLine: TimeseriesData = {
  labels: INTERVAL_YEARS,
  datasets: [stadtbezirkeDataset, gesamtstadtDataset],
};

const emptyData: TimeseriesData = {
  labels: [],
  datasets: [],
};

// ─── Wrapper Components ────────────────────────────────────────────────────────

@Component({
  selector: 'story-resize-wrapper',
  imports: [TimeseriesChartComponent],
  styles: [`
    p { margin: 0 0 8px; font-size: 13px; color: #666; }
    .resize-container { resize: both; overflow: hidden; width: 500px; height: 300px; border: 2px dashed #ccc; box-sizing: border-box; }
  `],
  template: `
    <p>Ziehe an der Ecke unten rechts, um die Containergröße anzupassen – das Diagramm passt sich automatisch an.</p>
    <div class="resize-container">
      <lib-timeseries-chart [data]="data"></lib-timeseries-chart>
    </div>
  `,
})
class ResizeWrapperComponent {
  data = multiData;
}

const meta: Meta<TimeseriesChartComponent> = {
  title: 'KomMonitor/TimeseriesChart',
  component: TimeseriesChartComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<div style="height: 400px;">${story}</div>`),
  ],
  argTypes: {
    data: {
      control: 'object',
      description:
        'Zeitreihendaten mit Labels (Jahre/Zeitpunkte) und einem oder mehreren Datensätzen.',
    },
    xAxisLabel: {
      control: 'text',
      description: 'Beschriftung der X-Achse.',
    },
    yAxisLabel: {
      control: 'text',
      description: 'Beschriftung der Y-Achse.',
    },
    scaleToData: {
      control: 'boolean',
      description: 'Y-Achse startet am Datumminimum statt bei 0.',
    },
    legendConfig: {
      control: 'object',
      description: 'Vollständige ECharts-Legenden-Konfiguration (LegendComponentOption). Überschreibt die Komponentendefaults.',
    },
  },
  args: {
    data: singleData,
    xAxisLabel: '',
    yAxisLabel: '',
    scaleToData: false,
    legendConfig: { show: true, orient: 'horizontal', bottom: 0 },
  },
};

export default meta;
type Story = StoryObj<TimeseriesChartComponent>;

// ─── Stories ───────────────────────────────────────────────────────────────────

/** Standard-Ansicht mit einem einzelnen Datensatz (Einwohnerzahlen 2020–2024). */
export const EinDataset: Story = {
  name: 'Ein Datensatz',
  args: { data: singleData },
};

/** Mehrere Datensätze werden im selben Diagramm als separate Linien dargestellt. */
export const MehrereDatasets: Story = {
  name: 'Mehrere Datensätze',
  args: { data: multiData },
};

interface MitIntervallArgs {
  data: TimeseriesData;
  showLine: boolean;
  xAxisLabel: string;
  yAxisLabel: string;
  scaleToData: boolean;
}

/** Intervall-Zeitreihe: Die gestrichelte Linie zeigt den Mittelwert, die grau schattierte Fläche das Konfidenzintervall. Über das `data`-Control kann die Vergleichslinie (Gesamtstadt) hinzugefügt werden. */
export const MitIntervall: StoryObj<MitIntervallArgs> = {
  name: 'Intervall-Zeitreihe',
  argTypes: {
    data: { control: 'object', description: 'Zeitreihendaten mit Labels und Datensätzen (inkl. Intervall-Datensätze).' },
    showLine: { control: 'boolean', description: 'Vergleichslinie anzeigen' },
    xAxisLabel: { control: 'text', description: 'Beschriftung der X-Achse' },
    yAxisLabel: { control: 'text', description: 'Beschriftung der Y-Achse' },
    scaleToData: { control: 'boolean', description: 'Y-Achse startet am Datumminimum statt bei 0' },
  },
  args: {
    data: intervalData,
    showLine: false,
    xAxisLabel: '',
    yAxisLabel: '',
    scaleToData: false,
  },
  render: (args: MitIntervallArgs) => ({
    props: {
      data: args.showLine ? intervalDataWithLine : intervalData,
      xAxisLabel: args.xAxisLabel,
      yAxisLabel: args.yAxisLabel,
      scaleToData: args.scaleToData,
    },
    template: `
      <lib-timeseries-chart
        [data]="data"
        [xAxisLabel]="xAxisLabel"
        [yAxisLabel]="yAxisLabel"
        [scaleToData]="scaleToData">
      </lib-timeseries-chart>
    `,
    moduleMetadata: { imports: [TimeseriesChartComponent] },
  }),
};

/** Das Diagramm passt sich automatisch an die Größe seines Eltern-Elements an. Der Container kann durch Ziehen an der Ecke verändert werden. */
export const ResponsiveGroesse: Story = {
  name: 'Responsive Größenanpassung',
  render: () => ({
    props: {},
    template: `<story-resize-wrapper></story-resize-wrapper>`,
    moduleMetadata: { imports: [ResizeWrapperComponent] },
  }),
};

/** Leerer Zustand – keine Labels, keine Datensätze. */
export const Leer: Story = {
  name: 'Leer (keine Daten)',
  args: { data: emptyData },
};

/** X- und Y-Achse sind mit benutzerdefinierten Beschriftungen versehen. */
export const MitAchsenbeschriftung: Story = {
  name: 'Mit Achsenbeschriftung',
  args: {
    data: multiData,
    xAxisLabel: 'Jahr',
    yAxisLabel: 'Anzahl',
  },
};

// ─── Configurable Styling Stories ─────────────────────────────────────────────

interface LinienStylingArgs {
  color: string;
  symbol: (typeof SYMBOL_OPTIONS)[number];
  showMarkPoints: boolean;
  showMarkLine: boolean;
  xAxisLabel: string;
  yAxisLabel: string;
}

/** Konfigurierbare Liniendarstellung: Farbe, Punktsymbol, Min/Max-Marker und Durchschnittslinie lassen sich über die Controls direkt anpassen. */
export const LinienStyling: StoryObj<LinienStylingArgs> = {
  name: 'Linienstyling (konfigurierbar)',
  argTypes: {
    color: { control: 'color', description: 'Linienfarbe' },
    symbol: { control: 'select', options: SYMBOL_OPTIONS, description: 'Punktdarstellung' },
    showMarkPoints: { control: 'boolean', description: 'Min/Max-Marker anzeigen' },
    showMarkLine: { control: 'boolean', description: 'Durchschnittslinie anzeigen' },
  },
  args: {
    color: '#4e79a7',
    symbol: 'emptyCircle',
    showMarkPoints: true,
    showMarkLine: true,
    xAxisLabel: 'Jahr',
    yAxisLabel: 'Einwohner',
  },
  render: (args: LinienStylingArgs) => ({
    props: {
      data: {
        labels: YEARS_2020_2024,
        datasets: [
          {
            ...einwohnerDataset,
            color: args.color,
            symbol: args.symbol,
            showMinMaxIndicator: args.showMarkPoints,
            showMeanLine: args.showMarkLine,
          },
          haushalteDataset,
        ],
      } satisfies TimeseriesData,
      xAxisLabel: args.xAxisLabel,
      yAxisLabel: args.yAxisLabel,
    },
  }),
};

interface IntervallStylingArgs {
  color: string;
  symbol: (typeof SYMBOL_OPTIONS)[number];
  xAxisLabel: string;
  yAxisLabel: string;
}

/** Konfigurierbare Intervall-Zeitreihe: Farbe und Punktsymbol der Mittellinie sowie die Bandfarbe des Konfidenzintervalls lassen sich anpassen. */
export const IntervallStyling: StoryObj<IntervallStylingArgs> = {
  name: 'Intervallstyling (konfigurierbar)',
  argTypes: {
    color: { control: 'color', description: 'Farbe der Mittellinie und des Intervallbands' },
    symbol: { control: 'select', options: SYMBOL_OPTIONS, description: 'Punktdarstellung der Mittellinie' },
  },
  args: {
    color: '#e07b54',
    symbol: 'circle',
    xAxisLabel: 'Jahr',
    yAxisLabel: 'Prozent',
  },
  render: (args: IntervallStylingArgs) => ({
    props: {
      data: {
        labels: INTERVAL_YEARS,
        datasets: [
          {
            ...stadtbezirkeDataset,
            color: args.color,
            symbol: args.symbol,
          },
          gesamtstadtDataset,
        ],
      } satisfies TimeseriesData,
      xAxisLabel: args.xAxisLabel,
      yAxisLabel: args.yAxisLabel,
    },
  }),
};

// ─── Legend Configuration Stories ────────────────────────────────────────────

const LEGEND_ORIENT_OPTIONS = ['horizontal', 'vertical'] as const;
const LEGEND_POSITION_OPTIONS = ['bottom', 'top', 'left', 'right'] as const;

interface LegendKonfigArgs {
  show: boolean;
  orient: (typeof LEGEND_ORIENT_OPTIONS)[number];
  position: (typeof LEGEND_POSITION_OPTIONS)[number];
}

/** Die Legende lässt sich vollständig per `legendConfig`-Input steuern. Hier können Sichtbarkeit, Ausrichtung und Position direkt über Controls konfiguriert werden. */
export const LegendKonfiguration: StoryObj<LegendKonfigArgs> = {
  name: 'Legende (konfigurierbar)',
  argTypes: {
    show:     { control: 'boolean', description: 'Legende anzeigen' },
    orient:   { control: 'select', options: LEGEND_ORIENT_OPTIONS, description: 'Ausrichtung der Legende' },
    position: { control: 'select', options: LEGEND_POSITION_OPTIONS, description: 'Position der Legende' },
  },
  args: {
    show: true,
    orient: 'horizontal',
    position: 'bottom',
  },
  render: (args: LegendKonfigArgs) => {
    const legendConfig: LegendComponentOption = {
      show: args.show,
      orient: args.orient,
      ...(args.position === 'bottom' ? { bottom: 0, top: 'auto', left: 'auto', right: 'auto' } : {}),
      ...(args.position === 'top'    ? { top: 0, bottom: 'auto', left: 'auto', right: 'auto' } : {}),
      ...(args.position === 'left'   ? { left: 0, right: 'auto', top: 'center', bottom: 'auto' } : {}),
      ...(args.position === 'right'  ? { right: 0, left: 'auto', top: 'center', bottom: 'auto' } : {}),
    };
    return {
      props: { data: multiData, legendConfig },
      template: `<lib-timeseries-chart [data]="data" [legendConfig]="legendConfig"></lib-timeseries-chart>`,
      moduleMetadata: { imports: [TimeseriesChartComponent] },
    };
  },
};

/** Vergleich: linke Ansicht startet bei 0, rechte Ansicht skaliert auf den Datenbereich. Der Unterschied ist besonders sichtbar, wenn die Werte weit über 0 liegen. */
export const SkalierungAufDaten: Story = {
  name: 'Skalierung auf Daten (scaleToData)',
  render: () => ({
    props: {
      dataFromZero: { labels: YEARS_2020_2024, datasets: [einwohnerDataset] } satisfies TimeseriesData,
      dataScaled:   { labels: YEARS_2020_2024, datasets: [einwohnerDataset] } satisfies TimeseriesData,
    },
    template: `
      <div style="display: flex; gap: 24px; height: 400px;">
        <div style="flex: 1; display: flex; flex-direction: column;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #666;">scaleToData: false (Standard – Y-Achse bei 0)</p>
          <lib-timeseries-chart style="flex: 1; min-height: 0;" [data]="dataFromZero" [scaleToData]="false"></lib-timeseries-chart>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #666;">scaleToData: true (Y-Achse am Datumminimum)</p>
          <lib-timeseries-chart style="flex: 1; min-height: 0;" [data]="dataScaled" [scaleToData]="true"></lib-timeseries-chart>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [TimeseriesChartComponent] },
  }),
};
