import { Injectable } from '@angular/core';
import { Observable, defer, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

export interface CacheOptions {
  /** Time-to-live in milliseconds. Omit for a session-long entry that never expires. */
  ttlMs?: number;
}

interface CacheEntry<T> {
  value$: Observable<T>;
  /** Epoch millis at which the entry expires; `Infinity` means no expiry. */
  expiresAt: number;
}

/**
 * Generic, reusable request cache. Wraps an Observable factory keyed by a string
 * and shares a single in-flight/replayed result across all subscribers until the
 * (optional) TTL expires. Failures are never cached: an errored entry is dropped so
 * the next access retries.
 *
 * Usage:
 * ```ts
 * cache.get('indicators', () => http.get(url), { ttlMs: 300_000 });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class RequestCacheService {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, factory: () => Observable<T>, options: CacheOptions = {}): Observable<T> {
    const now = Date.now();
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > now) {
      return existing.value$ as Observable<T>;
    }

    const value$ = defer(factory).pipe(
      catchError((error) => {
        // Drop the failed entry so the next call retries instead of replaying the error.
        this.entries.delete(key);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.entries.set(key, {
      value$,
      expiresAt: options.ttlMs === undefined ? Infinity : now + options.ttlMs,
    });

    return value$;
  }

  /** Remove a single entry, or clear the whole cache when no key is given. */
  invalidate(key?: string): void {
    if (key === undefined) {
      this.entries.clear();
    } else {
      this.entries.delete(key);
    }
  }
}
