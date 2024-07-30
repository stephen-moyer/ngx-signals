import {
  CreateEffectOptions,
  Signal,
  WritableSignal,
  effect,
  signal,
  untracked,
} from '@angular/core';
import {
  ObservableInput,
  SchedulerLike,
  Subscription,
  asyncScheduler,
  from,
} from 'rxjs';

export type ObservableEffectStatus = 'pending' | 'loading' | 'error' | 'loaded';
export class ObservableEffectState<T> {
  readonly status: ObservableEffectStatus = 'pending';
  readonly error?: Error;
  readonly value?: T;

  get loading() {
    return this.status === 'loading';
  }
  get pending() {
    return this.status === 'pending';
  }
  get errored() {
    return this.status === 'error';
  }
  get loaded() {
    return this.status === 'loaded';
  }

  constructor(source?: Partial<ObservableEffectState<T>>) {
    if (source !== undefined) {
      Object.assign(this, source);
    }
  }
}

export type ObservableFn<T> = () => ObservableInput<T> | undefined;

export type ObservableEffectCoreOptions<T> = {
  /**
   * The initial value of the signal that represents the observables state
   */
  initialValue?: T;
  /**
   * The options for the effect that subscribes to the observable
   */
  effectOptions?: CreateEffectOptions;
  /**
   * The scheduler to run internal updates on (setting to loading / pending etc)
   *
   * If you use the asapScheduler, you must set allowSignalWrites to true on effectOptions
   *
   * Default is asyncScheduler from rxjs
   */
  scheduler?: SchedulerLike;
};

export type ObservableEffectOptions<T> = ObservableEffectCoreOptions<T> & {
  /**
   * If true, the effect will not rerun when any of the signals it references change.
   */
  nonReactive?: boolean;
  /**
   * If true, the effect will only subscribe to the observable on first access or a manual call to load()
   * This can be useful if it is used inside an ngIf/@if block
   */
  deferred?: boolean | 'access' | 'load';
};

/**
 * An observable effect that cannot be loaded manually
 */
export type ReadonlyObservableEffect<T> = Signal<ObservableEffectState<T>>;

/**
 * @see observableEffect
 */
export type ObservableEffect<T> = ReadonlyObservableEffect<T> & {
  /**
   * Triggers the observableFn to run again
   */
  load: () => void;

  /**
   * Resets the state of the observable effect to the initial state
   */
  reset: () => void;
};

export const defaultScheduler = asyncScheduler;

/**
 * Creates an effect that subscribes to the observable input.
 * Returns a signal that wraps the state of the observable (loading / loaded / error etc).
 *
 * @param observableFn A function that gets run in an effect, and returns an observable input or undefined.
 *  - If an observable input is returned, the async signal status will be set to 'loading' until the observable emits.
 *    Once the a value is emitted or resolved, the status will be set to 'loaded' and the value will be set to the emitted value.
 *  - If `undefined` is returned, the status of the async signal will be set to 'pending',
 * and the previous value preserved.
 *  - If the function or observable throws, the status of the async signal will be set to 'error',
 * the error property set to the error, and the previous value preserved.
 *  - If the function gets effect gets triggered with an observable in flight, the in flight observable will be cancelled.
 * @param opts Options
 */
export function observableEffect<T>(
  observableFn: ObservableFn<T>,
  opts?: ObservableEffectOptions<T>
): ObservableEffect<T> {
  const scheduler = opts?.scheduler ?? defaultScheduler;
  const initialStatus: ObservableEffectStatus =
    opts?.initialValue !== undefined ? 'loaded' : 'pending';

  const forceRun = signal(0);
  const asyncState = signal(
    new ObservableEffectState<T>({
      value: opts?.initialValue,
      status: initialStatus,
    })
  );

  effect((cleanup) => {
    // take dep on refresh signal so load() can force a load
    // there may be better ways to do this, but cancelling the
    // previous loadAsyncValue if load is called again or
    // dependencies in asyncValueFn change is easier this way
    const runCount = forceRun();

    // if deferred is set, don't load on first execution
    if (opts?.deferred && runCount === 0) {
      return;
    }

    const cancel = opts?.nonReactive
      ? untracked(() => subscribe(asyncState, observableFn, scheduler))
      : subscribe(asyncState, observableFn, scheduler);

    if (cancel) {
      cleanup(cancel);
    }
  }, opts?.effectOptions);

  const readonlyState = asyncState.asReadonly();
  const accessor = () => {
    if (
      (opts?.deferred === true || opts?.deferred === 'access') &&
      forceRun() === 0
    ) {
      scheduler.schedule(() => forceRun.update((val) => ++val));
    }
    return readonlyState();
  };

  return Object.assign(accessor, {
    ...readonlyState,
    load: () => forceRun.update((val) => ++val),
    reset: () =>
      asyncState.set(
        new ObservableEffectState<T>({
          value: opts?.initialValue,
          status: initialStatus,
        })
      ),
  });
}

function subscribe<T>(
  asyncState: WritableSignal<ObservableEffectState<T>>,
  observableFn: ObservableFn<T>,
  scheduler: SchedulerLike
) {
  const observableInput = observableFn();
  const scheduledSubs: Subscription[] = [];
  if (observableInput === undefined || observableInput === null) {
    const sub = scheduler.schedule(() => {
      asyncState.update(
        (val) =>
          new ObservableEffectState<T>({
            ...val,
            error: undefined,
            status: 'pending',
          })
      );
    });
    scheduledSubs.push(sub);
    return () => scheduledSubs.forEach((sub) => sub.unsubscribe());
  }

  const removeSub = (sub: Subscription) => {
    const index = scheduledSubs.indexOf(sub);
    if (index >= 0) {
      scheduledSubs.splice(index, 1);
    }
  };

  const scheduledUpdate = scheduler.schedule(() => {
    asyncState.update(
      (val) =>
        new ObservableEffectState<T>({
          ...val,
          error: undefined,
          status: 'loading',
        })
    );
    removeSub(scheduledUpdate);
  });
  scheduledSubs.push(scheduledUpdate);

  const observable = from(observableInput);
  const subscription = observable.subscribe({
    next: (value) => {
      const scheduledUpdate = scheduler.schedule(() => {
        asyncState.update(
          (val) =>
            new ObservableEffectState<T>({
              ...val,
              error: undefined,
              status: 'loaded',
              value,
            })
        );
        removeSub(scheduledUpdate);
      });
      scheduledSubs.push(scheduledUpdate);
    },
    error: (err) => {
      const scheduledUpdate = scheduler.schedule(() => {
        asyncState.update(
          (val) =>
            new ObservableEffectState<T>({
              ...val,
              error: err,
              status: 'error',
            })
        );
        removeSub(scheduledUpdate);
      });
      scheduledSubs.push(scheduledUpdate);
    },
  });

  scheduledSubs.push(subscription);

  return () => {
    scheduledSubs.forEach((sub) => sub.unsubscribe());
  };
}
