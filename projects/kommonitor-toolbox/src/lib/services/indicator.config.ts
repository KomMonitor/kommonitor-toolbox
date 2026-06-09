import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface KommonitorCommunicationServiceConfig {
  dataAccessApiBaseUrl: string;
}

export const KOMMONITOR_SERVICE_CONFIG = new InjectionToken<KommonitorCommunicationServiceConfig>(
  'KOMMONITOR_SERVICE_CONFIG',
);

export function provideKomMonitorIndicator(
  config: KommonitorCommunicationServiceConfig,
): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: KOMMONITOR_SERVICE_CONFIG, useValue: config }]);
}
