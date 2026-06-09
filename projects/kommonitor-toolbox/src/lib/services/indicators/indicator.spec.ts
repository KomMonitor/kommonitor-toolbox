import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BEARER_TOKEN_PROVIDER, BearerTokenProvider } from '../bearer.token-provider';
import { KOMMONITOR_SERVICE_CONFIG } from '../indicator.config';
import { Indicator, IndicatorFeatureTimeseries, IndicatorService } from './indicator';

describe('IndicatorService', () => {
  const baseUrl = 'https://api.example.test';
  let service: IndicatorService;
  let httpMock: HttpTestingController;
  let token: string | undefined;

  beforeEach(() => {
    token = 'test-token';
    const tokenProvider: BearerTokenProvider = {
      getToken: () => token,
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IndicatorService,
        { provide: KOMMONITOR_SERVICE_CONFIG, useValue: { dataAccessApiBaseUrl: baseUrl } },
        { provide: BEARER_TOKEN_PROVIDER, useValue: tokenProvider },
      ],
    });

    service = TestBed.inject(IndicatorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getIndicators', () => {
    it('requests the indicators endpoint with auth headers', () => {
      const expected: Indicator[] = [{ indicatorId: '1', indicatorName: 'Test' }];
      let result: Indicator[] | undefined;

      service.getIndicators().subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${baseUrl}/management/indicators`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

      req.flush(expected);
      expect(result).toEqual(expected);
    });

    it('reflects the current token from the provider on each call', () => {
      token = 'rotated-token';
      service.getIndicators().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/management/indicators`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer rotated-token');
      req.flush([]);
    });
  });

  describe('getIndicatorTimeseries', () => {
    const url = `${baseUrl}/management/indicators/ind-1/su-1/without-geometry`;

    it('builds the without-geometry url', () => {
      service.getIndicatorTimeseries('ind-1', 'su-1').subscribe();
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('maps DATE_ keys into sorted timeseries values', () => {
      let result: IndicatorFeatureTimeseries[] | undefined;
      service.getIndicatorTimeseries('ind-1', 'su-1').subscribe((res) => (result = res));

      httpMock.expectOne(url).flush([
        {
          ID: 'feature-1',
          NAME: 'District A',
          validStartDate: '2020-01-01',
          validEndDate: null,
          arisenFrom: null,
          DATE_2022: 10,
          DATE_2020: '5.5',
          DATE_2021: null,
        },
      ]);

      expect(result).toEqual([
        {
          id: 'feature-1',
          name: 'District A',
          validStartDate: '2020-01-01',
          validEndDate: null,
          arisenFrom: null,
          values: [
            { date: '2020', value: 5.5 },
            { date: '2021', value: null },
            { date: '2022', value: 10 },
          ],
        },
      ]);
    });

    it('falls back from ID to fid to empty string and defaults missing fields', () => {
      let result: IndicatorFeatureTimeseries[] | undefined;
      service.getIndicatorTimeseries('ind-1', 'su-1').subscribe((res) => (result = res));

      httpMock.expectOne(url).flush([{ fid: 'fallback-id', DATE_2020: 1 }, { DATE_2020: 2 }]);

      expect(result).toEqual([
        {
          id: 'fallback-id',
          name: null,
          validStartDate: null,
          validEndDate: null,
          arisenFrom: null,
          values: [{ date: '2020', value: 1 }],
        },
        {
          id: '',
          name: null,
          validStartDate: null,
          validEndDate: null,
          arisenFrom: null,
          values: [{ date: '2020', value: 2 }],
        },
      ]);
    });

    it('parses non-numeric values to null', () => {
      let result: IndicatorFeatureTimeseries[] | undefined;
      service.getIndicatorTimeseries('ind-1', 'su-1').subscribe((res) => (result = res));

      httpMock.expectOne(url).flush([{ ID: 'f', DATE_2020: 'not-a-number' }]);

      expect(result?.[0].values).toEqual([{ date: '2020', value: null }]);
    });

    it('returns an empty array when the response body is null', () => {
      let result: IndicatorFeatureTimeseries[] | undefined;
      service.getIndicatorTimeseries('ind-1', 'su-1').subscribe((res) => (result = res));

      httpMock.expectOne(url).flush(null);

      expect(result).toEqual([]);
    });
  });
});
