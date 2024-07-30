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

export type EmulatedObservableEffectState<T> = Partial<
  Pick<ObservableEffectState<T>, 'status' | 'value' | 'error'>
>;

export type EmulatedObservableEffect<T> = ReadonlyObservableEffect<T> & {
  run: (fn: () => ObservableInput<T>) => Promise<T>;
  setValue: (value: T | undefined) => void;
  set: (state: EmulatedObservableEffectState<T>) => void;
  updateValue: (fn: (value: T | undefined) => T) => void;
  update: (
    fn: (state: ObservableEffectState<T>) => EmulatedObservableEffectState<T>
  ) => void;
  reset: () => void;
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
  const update = emulatedState.update;
  return Object.assign(emulatedState, {
    run: async (fn: () => ObservableInput<T>) => {
      update(
        (state) => new ObservableEffectState<T>({ ...state, status: 'loading' })
      );
      try {
        const observable = from(fn());
        const result = await lastValueFrom(observable);
        update(
          (state) =>
            new ObservableEffectState<T>({
              ...state,
              status: 'loaded',
              value: result,
              error: undefined,
            })
        );
        return result;
      } catch (error) {
        update(
          (state) =>
            new ObservableEffectState<T>({
              ...state,
              status: 'error',
              error: error as Error,
            })
        );
        throw error;
      }
    },

    setValue: (value: T | undefined) =>
      update((state) => new ObservableEffectState({ ...state, value })),

    updateValue: (fn: (value: T | undefined) => T) =>
      update(
        (state) =>
          new ObservableEffectState({
            ...state,
            value: fn(state.value),
          })
      ),

    set: (state: EmulatedObservableEffectState<T>) =>
      update((s) => new ObservableEffectState({ ...s, ...state })),

    update: (
      fn: (state: ObservableEffectState<T>) => EmulatedObservableEffectState<T>
    ) => update((s) => new ObservableEffectState({ ...s, ...fn(s) })),

    reset: () =>
      update(
        () =>
          new ObservableEffectState<T>({
            status: 'pending',
            error: undefined,
            value: opts?.initialValue,
          })
      ),
  });
}
