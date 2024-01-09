import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { EMPTY, Subject, of, throwError } from 'rxjs';
import { nextSchedulerTick } from '../../test';
import { observableEffect } from './observable-effect';

describe('ObservableEffectTests', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should have a default status of "pending"', () => {
    TestBed.runInInjectionContext(() => {
      const testSignal = observableEffect(() => EMPTY);
      const value = testSignal();
      expect(value).toMatchObject({
        status: 'pending',
      });
    });
  });

  it('should have a default status of "pending" after calling obsFn', () => {
    TestBed.runInInjectionContext(() => {
      let called = false;
      const testSignal = observableEffect(() => {
        called = true;
        return EMPTY;
      });
      TestBed.flushEffects();

      expect(called).toBe(true);

      const value = testSignal();
      expect(value).toMatchObject({
        status: 'pending',
      });
    });
  });

  it('should set status loading', async () => {
    TestBed.runInInjectionContext(async () => {
      const testSignal = observableEffect(() => EMPTY);
      TestBed.flushEffects();

      await nextSchedulerTick();

      const value = testSignal!();
      expect(value).toMatchObject({
        status: 'loading',
      });
    });
  });

  it('should set status loaded and value', async () => {
    TestBed.runInInjectionContext(async () => {
      const testSignal = observableEffect(() => of(1));
      TestBed.flushEffects();

      await nextSchedulerTick();

      const value = testSignal!();
      expect(value).toMatchObject({
        status: 'loaded',
        value: 1,
      });
    });
  });

  it('should preserve value when reloading', async () => {
    TestBed.runInInjectionContext(async () => {
      const emit = new Subject<number>();
      const testSignal = observableEffect(() => emit);
      TestBed.flushEffects();

      emit.next(1);
      await nextSchedulerTick();

      let value = testSignal!();
      expect(value).toMatchObject({
        status: 'loaded',
        value: 1,
      });

      testSignal.load();
      TestBed.flushEffects();
      await nextSchedulerTick();

      value = testSignal!();
      expect(value).toMatchObject({
        status: 'loading',
        value: 1,
      });

      emit.next(2);
      await nextSchedulerTick();
      value = testSignal!();
      expect(value).toMatchObject({
        status: 'loaded',
        value: 2,
      });
    });
  });

  it('should set error', async () => {
    TestBed.runInInjectionContext(async () => {
      const error = new Error('Error');
      const testSignal = observableEffect(() => throwError(() => error));
      TestBed.flushEffects();
      await nextSchedulerTick();

      const value = testSignal!();
      expect(value).toMatchObject({
        status: 'error',
        error,
      });
    });
  });

  it('should not load deferred until first access', async () => {
    TestBed.runInInjectionContext(async () => {
      const testSignal = observableEffect(() => of(1), { deferred: true });
      TestBed.flushEffects();
      await nextSchedulerTick();

      // load isn't started until we get the value
      let value = testSignal!();
      expect(value).toMatchObject({
        status: 'pending',
      });

      TestBed.flushEffects();
      await nextSchedulerTick();

      value = testSignal!();
      expect(value).toMatchObject({
        status: 'loaded',
        value: 1,
      });
    });
  });

  it('should load reactively', async () => {
    TestBed.runInInjectionContext(async () => {
      const dep = signal('dep');
      const testSignal = observableEffect(() => of(dep()));
      TestBed.flushEffects();
      await nextSchedulerTick();

      // load isn't started until we get the value
      let value = testSignal!();
      expect(value).toMatchObject({
        status: 'loaded',
        value: 'dep',
      });

      dep.set('dep2');

      TestBed.flushEffects();
      await nextSchedulerTick();

      value = testSignal!();
      expect(value).toMatchObject({
        status: 'loaded',
        value: 'dep2',
      });
    });
  });
});
