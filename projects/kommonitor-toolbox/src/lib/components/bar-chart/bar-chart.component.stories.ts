import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';

import {
  BarChartComponent,
  type BarChartData,
  type BarChartDataset,
  type BarChartReferenceValue,
} from './bar-chart.component';

// ─── Shared Raw Data ───────────────────────────────────────────────────────────

const STADTTEILE = ['Altstadt', 'Bergerhausen', 'Holsterhausen', 'Kray', 'Rüttenscheid', 'Steele'];

const EINWOHNER_DICHTE: BarChartDataset = {
  label: 'Einwohnerdichte (EW/km²)',
  data: [4120, 3870, 3540, 4250, 5800, 3100],
  color: '#4472C4',
};

const ARBEITSLOSEN: BarChartDataset = {
  label: 'Arbeitslosenquote (%)',
  data: [9.1, 6.4, 5.8, 11.2, 4.3, 7.9],
  color: '#ED7D31',
  showMeanLine: true,
};

const SOZIALLEISTUNGEN: BarChartDataset = {
  label: 'Sozialleistungsquote (%)',
  data: [14.3, 10.1, 8.9, 17.5, 6.2, 12.4],
  color: '#FFC000',
};

const REFERENZ_STADTDURCHSCHNITT: BarChartReferenceValue = {
  value: 7.3,
  label: 'Stadtdurchschnitt',
};

// ─── Story Data ───────────────────────────────────────────────────────────────

const singleData: BarChartData = {
  labels: STADTTEILE,
  datasets: [EINWOHNER_DICHTE],
};

const multiData: BarChartData = {
  labels: STADTTEILE,
  datasets: [ARBEITSLOSEN, SOZIALLEISTUNGEN],
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<BarChartComponent> = {
  title: 'KomMonitor/BarChart',
  component: BarChartComponent,
  tags: ['autodocs'],
  decorators: [componentWrapperDecorator((story) => `<div style="height: 400px;">${story}</div>`)],
  argTypes: {
    data: {
      control: 'object',
      description: 'Kategoriale Daten mit Beschriftungen und einem oder mehreren Datensätzen.',
    },
    xAxisLabel: {
      control: 'text',
      description: 'Beschriftung der X-Achse.',
    },
    yAxisLabel: {
      control: 'text',
      description: 'Beschriftung der Y-Achse.',
    },
    orientation: {
      control: { type: 'radio' },
      options: ['vertical', 'horizontal'],
      description: "Ausrichtung der Balken: 'vertical' = Säulen, 'horizontal' = Balken.",
    },
    stacked: {
      control: 'boolean',
      description: 'Mehrere Datensätze stapeln statt nebeneinander gruppieren.',
    },
    scaleToData: {
      control: 'boolean',
      description: 'Wertachse startet am Datumminimum statt bei 0.',
    },
    showValueLabels: {
      control: 'boolean',
      description: 'Numerische Werte direkt auf jedem Balken anzeigen.',
    },
    referenceValue: {
      control: 'object',
      description: 'Optionale Referenz- oder Zielwertlinie mit Beschriftung.',
    },
  },
  args: {
    data: singleData,
    xAxisLabel: '',
    yAxisLabel: '',
    orientation: 'vertical',
    stacked: false,
    scaleToData: false,
    showValueLabels: false,
    referenceValue: undefined,
  },
};

export default meta;
type Story = StoryObj<BarChartComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Standard-Ansicht mit einem einzelnen Datensatz (Einwohnerdichte je Stadtteil). */
export const EinDataset: Story = {
  name: 'Ein Datensatz',
  args: {
    data: singleData,
    yAxisLabel: 'EW/km²',
    xAxisLabel: 'Stadtteil',
  },
};

/** Mehrere Datensätze nebeneinander. Zeigt Arbeitslosenquote und Sozialleistungsquote. */
export const MehrereDatasets: Story = {
  name: 'Mehrere Datensätze (gruppiert)',
  args: {
    data: multiData,
    yAxisLabel: 'Anteil (%)',
    xAxisLabel: 'Stadtteil',
  },
};

/** Gestapelte Darstellung mehrerer Datensätze. */
export const Gestapelt: Story = {
  name: 'Gestapelt',
  args: {
    data: multiData,
    stacked: true,
    yAxisLabel: 'Anteil (%)',
    xAxisLabel: 'Stadtteil',
  },
};

/** Horizontale Balken statt vertikale Säulen – nützlich bei vielen oder langen Kategorienamen. */
export const HorizontaleBalken: Story = {
  name: 'Horizontal',
  args: {
    data: singleData,
    orientation: 'horizontal',
    xAxisLabel: 'EW/km²',
    yAxisLabel: 'Stadtteil',
  },
};

/** Werte werden direkt auf den Balken angezeigt. */
export const MitWertbeschriftung: Story = {
  name: 'Mit Wertbeschriftung',
  args: {
    data: singleData,
    showValueLabels: true,
    yAxisLabel: 'EW/km²',
  },
};

/** Referenzlinie (Stadtdurchschnitt) und Durchschnittslinie pro Datensatz. */
export const MitReferenzlinie: Story = {
  name: 'Mit Referenzlinie',
  args: {
    data: {
      labels: STADTTEILE,
      datasets: [ARBEITSLOSEN],
    },
    yAxisLabel: 'Arbeitslosenquote (%)',
    xAxisLabel: 'Stadtteil',
    referenceValue: REFERENZ_STADTDURCHSCHNITT,
  },
};

/** Zwei Indikatorgruppen horizontal gestapelt mit Beschriftungen. */
export const HorizontalGestapelt: Story = {
  name: 'Horizontal gestapelt',
  args: {
    data: multiData,
    orientation: 'horizontal',
    stacked: true,
    showValueLabels: true,
    xAxisLabel: 'Anteil (%)',
    yAxisLabel: 'Stadtteil',
  },
};

/** Leeres Diagramm ohne Daten. */
export const Leer: Story = {
  name: 'Leer',
  args: { data: { labels: [], datasets: [] } },
};

export const Test: Story = {
  name: 'Test',
  args: {
    yAxisLabel: 'Prozent',
    showLegend: false,
    data: {
      labels: ['V', 'I', 'VI', 'III', 'IV', 'VII', 'II', 'VIII', 'IX'],
      datasets: [
        {
          label: 'Anteil',
          data: [5.02, 5.2, 5.38, 6.09, 7.15, 7.3, 8.96, 10.1, 10.2],
          showMeanLine: true,
          color: ['red', 'green'],
        },
      ],
    },
  },
};
