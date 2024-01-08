import { signal } from '@angular/core';
import {
  ObservableEffectState,
  ObservableEffectStatus,
  ReadonlyObservableEffect,
} from './observable-effect';
import { ObservableInput, from, lastValueFrom } from 'rxjs';

export type EmulatedObservableEffectOptions<T> = {
  initialValue?: T;
  initialStatus?: ObservableEffectStatus;
};

export type EmulatedObservableEffect<T> = ReadonlyObservableEffect<T> & {
  run: (fn: () => ObservableInput<T>) => Promise<T>;
};

/**
 * emulates an observable effect, but does not use an effect internally.
 * the `run` method on the returned object can be used to run an async operation and update the state to loading/loaded/error along with the value
 * @param opts 
 * @returns 
 */
export function emulateObservableEffect<T>(
  opts?: EmulatedObservableEffectOptions<T>
): EmulatedObservableEffect<T> {
  const emulatedState = signal<ObservableEffectState<T>>(
    new ObservableEffectState<T>({
      status: opts?.initialStatus ?? 'pending',
      value: opts?.initialValue,
    })
  );

  return Object.assign(emulatedState, {
    run: async (fn: () => ObservableInput<T>) => {
      emulatedState.set(
        new ObservableEffectState<T>({ ...emulatedState(), status: 'loading' })
      );
      try {
        const observable = from(fn());
        const result = await lastValueFrom(observable);
        emulatedState.set(
          new ObservableEffectState<T>({
            ...emulatedState(),
            status: 'loaded',
            value: result,
            error: undefined,
          })
        );
        return result;
      } catch (error) {
        emulatedState.set(
          new ObservableEffectState<T>({
            ...emulatedState(),
            status: 'error',
            error: error as Error,
          })
        );
        throw error;
      }
    },
  });
}
