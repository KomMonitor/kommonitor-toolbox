import { InjectionToken } from '@angular/core';

/**
 * Abstraktion über die Beschaffung des Bearer-Tokens. Consumer binden hier
 * ihre konkrete Auth-Implementierung an, damit die Library frei von einer
 * bestimmten Auth-Lösung (z.B. Keycloak) bleibt.
 */
export interface BearerTokenProvider {
  getToken(): string | undefined;
}

export const BEARER_TOKEN_PROVIDER = new InjectionToken<BearerTokenProvider>(
  'BEARER_TOKEN_PROVIDER',
);
