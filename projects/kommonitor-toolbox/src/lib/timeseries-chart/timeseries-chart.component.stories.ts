import type { Meta, StoryObj } from '@storybook/angular';

import { TimeseriesChartComponent, type TimeseriesData } from './timeseries-chart.component';

const singleDataset: TimeseriesData = {
  labels: ['2020', '2021', '2022', '2023', '2024'],
  datasets: [
    {
      label: 'Einwohner',
      data: [1686, 17031, 17105, 17115, 17200],
    },
  ],
};

const multiDataset: TimeseriesData = {
  labels: ['2020', '2021', '2022', '2023', '2024'],
  datasets: [
    {
      label: 'Einwohner',
      data: [16869, 17031, 17105, 17115, 17200],
    },
    {
      label: 'Haushalte',
      data: [8200, 8350, 8400, 8420, 8500],
    },
  ],
};

const emptyData: TimeseriesData = {
  labels: [],
  datasets: [],
};

const meta: Meta<TimeseriesChartComponent> = {
  title: 'KomMonitor/TimeseriesChart',
  component: TimeseriesChartComponent,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description:
        'Zeitreihendaten mit Labels (Jahre/Zeitpunkte) und einem oder mehreren Datensätzen.',
    },
  },
  args: {
    data: singleDataset,
  },
};

export default meta;
type Story = StoryObj<TimeseriesChartComponent>;

/** Standard-Ansicht mit einem einzelnen Datensatz (Einwohnerzahlen 2020–2024). */
export const EinDataset: Story = {
  name: 'Ein Datensatz',
  args: {
    data: singleDataset,
  },
};

/** Mehrere Datensätze werden im selben Diagramm als separate Linien dargestellt. */
export const MehrereDatasets: Story = {
  name: 'Mehrere Datensätze',
  args: {
    data: multiDataset,
  },
};

/** Leerer Zustand – keine Labels, keine Datensätze. */
export const Leer: Story = {
  name: 'Leer (keine Daten)',
  args: {
    data: emptyData,
  },
};
