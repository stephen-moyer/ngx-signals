import { Signal } from '@angular/core';
import {
  Observable,
  ObservableInput,
  catchError,
  from,
  shareReplay,
  tap,
} from 'rxjs';
import {
  ObservableEffectCoreOptions,
  ObservableEffect,
  observableEffect,
} from './observable-effect';
import { finalizeWithReason } from './rxjs-utils';

export type CachedObservableFn<TKey, TValue> = (
  key: TKey
) => ObservableInput<TValue> | undefined;

export type ShouldCache<T> = ((value: T) => boolean) | boolean;
export type HashFn<T> = (value: T) => string;

export type CacheEntry<TKey, TValue> = {
  key: TKey;
  observable: Observable<TValue>;
  expires?: Date;
  /**
   * The current value of the observable. May be undefined if it hasn't loaded yet.
   */
  value?: TValue;
};

export type ObservableEffectCacheOptions<TKey, TValue> =
  ObservableEffectCoreOptions<TValue> & {
    cacheErrors?: boolean;
    expirationMs?: number;
    /**
     * Callback or true/false that determines if the emitted value should be cached.
     * Default is true
     */
    shouldCache?: ShouldCache<TValue>;
    /**
     * The hash function to use for the key.
     * Default is JSON.stringify
     */
    hashFn?: HashFn<TKey>;
  };

/**
 * @see observableEffectCache
 */
export type ObservableEffectCache<TKey, TValue> = ObservableEffect<TValue> & {
  /**
   * clears the cache
   * @param load If true, the value for the current key will be loaded again
   */
  clear: (load?: boolean) => void;

  /**
   * removes the cached value for this key
   * @param key The key to remove
   */
  remove: (key: TKey) => void;

  /**
   * The internal map that backs the cache.
   */
  cache: ReadonlyMap<string, Readonly<CacheEntry<TKey, TValue>>>;
};

/**
 * Creates an observable effect that caches the observable returned from observableFn using the key.
 * @see observableEffect
 * @param key The cache key
 * @param observableFn A function that gets run in an effect, and returns an observable input or undefined. The observable will be cached
 * for the key that fn was run with.
 * @param opts options
 */
export function observableEffectCache<TKey, TValue>(
  key: Signal<TKey>,
  observableFn: CachedObservableFn<TKey, TValue>,
  opts?: ObservableEffectCacheOptions<TKey, TValue>
): ObservableEffectCache<TKey, TValue> {
  const hashFn = opts?.hashFn ?? JSON.stringify;
  const cacheErrors = opts?.cacheErrors ?? false;
  const shouldCache = opts?.shouldCache ?? (() => true);
  const cacheEnabled = typeof shouldCache === 'boolean' ? !shouldCache : true;
  const shouldCacheFn =
    typeof shouldCache === 'boolean' ? () => shouldCache : shouldCache;

  const cache = new Map<string, CacheEntry<TKey, TValue>>();
  const obsEffect = observableEffect(() => {
    const keyVal = key();
    const observableInput = observableFn(keyVal);
    // undefined/null observables dont get cached
    if (observableInput === undefined || observableInput === null) {
      return observableInput;
    }

    // check if key is undefined after calling asyncValueFn
    // because caller may be handling it
    if (keyVal === undefined) {
      throw new Error('key cannot be undefined.');
    }

    const hash = hashFn(keyVal);
    if (hash === undefined || hash === null) {
      throw new Error('hash cannot be undefined or null.');
    }

    let cacheEntry = cache.get(hash);
    if (
      cacheEntry === undefined ||
      (cacheEntry.expires ? cacheEntry.expires.getTime() < Date.now() : false)
    ) {
      const observable = from(observableInput).pipe(
        tap((value) => {
          if (cacheEnabled && !shouldCacheFn(value)) {
            cache.delete(hash);
          }

          if (cacheEnabled && cacheEntry) {
            cacheEntry.value = value;
          }
        }),
        catchError((err) => {
          if (cacheEnabled && !cacheErrors) {
            cache.delete(hash);
          }
          throw err;
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
        finalizeWithReason((reason) => {
          if (cacheEnabled && reason === 'unsubscribe') {
            cache.delete(hash);
          }
        })
      );

      const expires = opts?.expirationMs
        ? new Date(Date.now() + opts.expirationMs)
        : undefined;
      cacheEntry = { key: keyVal, observable, expires };
      if (cacheEnabled) {
        cache.set(hash, cacheEntry);
      }
    }

    return cacheEntry.observable;
  }, opts);

  return Object.assign(obsEffect, {
    clear: (load = false) => {
      cache.clear();
      if (load) {
        obsEffect.load();
      }
    },
    remove: (keyVal: TKey) => {
      const hash = hashFn(keyVal);
      if (hash === undefined || hash === null) {
        throw new Error('hash cannot be undefined or null.');
      }
      cache.delete(hash);
    },
    cache: cache as ReadonlyMap<string, Readonly<CacheEntry<TKey, TValue>>>,
  });
}
