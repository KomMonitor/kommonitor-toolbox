import { TestBed } from '@angular/core/testing';
import { Observable, defer, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestCacheService } from './request-cache.service';

describe('RequestCacheService', () => {
  let service: RequestCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RequestCacheService] });
    service = TestBed.inject(RequestCacheService);
  });

  it('calls the factory only once for repeated gets within the TTL', () => {
    let calls = 0;
    const factory = (): Observable<number> =>
      defer(() => {
        calls++;
        return of(calls);
      });

    let first: number | undefined;
    let second: number | undefined;
    service.get('key', factory, { ttlMs: 1000 }).subscribe((v) => (first = v));
    service.get('key', factory, { ttlMs: 1000 }).subscribe((v) => (second = v));

    expect(calls).toBe(1);
    expect(first).toBe(1);
    expect(second).toBe(1);
  });

  describe('TTL expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(0));
    });
    afterEach(() => vi.useRealTimers());

    it('re-runs the factory after the TTL has elapsed', () => {
      let calls = 0;
      const factory = (): Observable<number> =>
        defer(() => {
          calls++;
          return of(calls);
        });

      service.get('key', factory, { ttlMs: 1000 }).subscribe();
      expect(calls).toBe(1);

      vi.setSystemTime(new Date(1001));
      let result: number | undefined;
      service.get('key', factory, { ttlMs: 1000 }).subscribe((v) => (result = v));

      expect(calls).toBe(2);
      expect(result).toBe(2);
    });

    it('never expires when no ttl is given', () => {
      let calls = 0;
      const factory = (): Observable<number> =>
        defer(() => {
          calls++;
          return of(calls);
        });

      service.get('key', factory).subscribe();
      vi.setSystemTime(new Date(10 * 60_000));
      service.get('key', factory).subscribe();

      expect(calls).toBe(1);
    });
  });

  it('does not cache failures - the next get retries', () => {
    let calls = 0;
    const factory = (): Observable<number> =>
      defer(() => {
        calls++;
        return calls === 1 ? throwError(() => new Error('boom')) : of(42);
      });

    let error: unknown;
    service.get('key', factory, { ttlMs: 1000 }).subscribe({ error: (e) => (error = e) });
    expect(error).toEqual(expect.any(Error));

    let result: number | undefined;
    service.get('key', factory, { ttlMs: 1000 }).subscribe((v) => (result = v));

    expect(calls).toBe(2);
    expect(result).toBe(42);
  });

  describe('invalidate', () => {
    it('removes a single entry by key', () => {
      let calls = 0;
      const factory = (): Observable<number> =>
        defer(() => {
          calls++;
          return of(calls);
        });

      service.get('key', factory, { ttlMs: 1000 }).subscribe();
      service.invalidate('key');
      service.get('key', factory, { ttlMs: 1000 }).subscribe();

      expect(calls).toBe(2);
    });

    it('clears all entries when no key is given', () => {
      let aCalls = 0;
      let bCalls = 0;
      const a = (): Observable<number> => defer(() => of(++aCalls));
      const b = (): Observable<number> => defer(() => of(++bCalls));

      service.get('a', a, { ttlMs: 1000 }).subscribe();
      service.get('b', b, { ttlMs: 1000 }).subscribe();
      service.invalidate();
      service.get('a', a, { ttlMs: 1000 }).subscribe();
      service.get('b', b, { ttlMs: 1000 }).subscribe();

      expect(aCalls).toBe(2);
      expect(bCalls).toBe(2);
    });
  });
});
