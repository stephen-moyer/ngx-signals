import { TestBed } from '@angular/core/testing';
import { observableEffectCache } from './observable-effect-cache';
import { of, tap } from 'rxjs';
import { signal } from '@angular/core';
import { nextSchedulerTick } from '../../test';

describe('ObservableEffectCacheTests', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should cache observable', async () => {
    return TestBed.runInInjectionContext(async () => {
      let count = 0;
      const key = signal('key');
      const testSignal = observableEffectCache(key, (key) => {
        return of(key).pipe(tap(() => count++));
      });
      TestBed.flushEffects();
      await nextSchedulerTick();

      expect(testSignal().value).toBe('key');
      expect(count).toBe(1);

      key.set('key2');
      TestBed.flushEffects();
      await nextSchedulerTick();

      expect(testSignal().value).toBe('key2');
      expect(count).toBe(2);

      key.set('key');
      TestBed.flushEffects();
      await nextSchedulerTick();

      expect(testSignal().value).toBe('key');
      expect(count).toBe(2);
    });
  });
});
