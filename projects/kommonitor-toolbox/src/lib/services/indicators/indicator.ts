import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BEARER_TOKEN_PROVIDER } from '../bearer.token-provider';
import { KOMMONITOR_SERVICE_CONFIG } from '../indicator.config';

export interface IndicatorMetadata {
  unit?: string;
  [key: string]: unknown;
}

export interface Indicator {
  indicatorId?: string;
  indicatorName?: string;
  unit?: string;
  metadata?: IndicatorMetadata;
  [key: string]: unknown;
}

export interface IndicatorTimeseriesValue {
  date: string;
  value: number | null;
}

export interface IndicatorFeatureTimeseries {
  id: string;
  name: string | null;
  validStartDate: string | null;
  validEndDate: string | null;
  arisenFrom: string | null;
  values: IndicatorTimeseriesValue[];
}

/** Raw, untyped indicator feature as returned by the data-management API. */
interface RawIndicatorFeature {
  ID?: string;
  fid?: string;
  NAME?: string;
  validStartDate?: string | null;
  validEndDate?: string | null;
  arisenFrom?: string | null;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class IndicatorService {
  private static readonly DATE_PREFIX = 'DATE_';
  private static readonly INDICATORS_PATH = '/management/indicators';
  private static readonly CONTENT_TYPE_JSON = 'application/json';
  private static readonly BEARER_PREFIX = 'Bearer ';

  private readonly http = inject(HttpClient);
  private readonly tokenProvider = inject(BEARER_TOKEN_PROVIDER);
  private readonly url = inject(KOMMONITOR_SERVICE_CONFIG).dataAccessApiBaseUrl;

  getIndicators(): Observable<Indicator[]> {
    return this.http.get<Indicator[]>(`${this.url}${IndicatorService.INDICATORS_PATH}`, {
      headers: this.authHeaders(),
    });
  }

  getIndicatorTimeseries(
    indicatorId: string,
    spatialUnitId: string,
  ): Observable<IndicatorFeatureTimeseries[]> {
    const url =
      `${this.url}${IndicatorService.INDICATORS_PATH}` +
      `/${indicatorId}/${spatialUnitId}/without-geometry`;

    return this.http
      .get<RawIndicatorFeature[]>(url, { headers: this.authHeaders() })
      .pipe(
        map((features) => (features ?? []).map((feature) => this.toFeatureTimeseries(feature))),
      );
  }

  private authHeaders(): Record<string, string> {
    return {
      'Content-Type': IndicatorService.CONTENT_TYPE_JSON,
      Authorization: IndicatorService.BEARER_PREFIX + this.tokenProvider.getToken(),
    };
  }

  private toFeatureTimeseries(feature: RawIndicatorFeature): IndicatorFeatureTimeseries {
    const values: IndicatorTimeseriesValue[] = Object.keys(feature)
      .filter((key) => key.startsWith(IndicatorService.DATE_PREFIX))
      .map((key) => ({
        date: key.substring(IndicatorService.DATE_PREFIX.length),
        value: this.parseValue(feature[key]),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      id: feature.ID ?? feature.fid ?? '',
      name: feature.NAME ?? null,
      validStartDate: feature.validStartDate ?? null,
      validEndDate: feature.validEndDate ?? null,
      arisenFrom: feature.arisenFrom ?? null,
      values,
    };
  }

  private parseValue(raw: unknown): number | null {
    if (raw === null || raw === undefined) {
      return null;
    }
    const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return isNaN(parsed) ? null : parsed;
  }
}
