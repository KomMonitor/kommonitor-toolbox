import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface KommonitorCommunicationServiceConfig {
  dataAccessApiBaseUrl: string;
  /** Cache TTL in ms for the indicators list. Defaults to 5 minutes. */
  indicatorsTtlMs?: number;
  /** Cache TTL in ms for indicator timeseries. Defaults to 5 minutes. */
  timeseriesTtlMs?: number;
}

export const KOMMONITOR_SERVICE_CONFIG = new InjectionToken<KommonitorCommunicationServiceConfig>(
  'KOMMONITOR_SERVICE_CONFIG',
);

export function provideKomMonitorIndicator(
  config: KommonitorCommunicationServiceConfig,
): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: KOMMONITOR_SERVICE_CONFIG, useValue: config }]);
}
