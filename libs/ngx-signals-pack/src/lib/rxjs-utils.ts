import {
  MonoTypeOperatorFunction,
  Observable,
  defer,
  finalize,
  tap,
} from 'rxjs';

enum DisposeReason {
  Unsubscribe = 'unsubscribe',
  Complete = 'complete',
  Error = 'error',
}

type CallbackFunc = (reason: DisposeReason) => void;

export const finalizeWithReason =
  <T>(callback: CallbackFunc): MonoTypeOperatorFunction<T> =>
  (source: Observable<T>) =>
    defer(() => {
      let completed = false;
      let errored = false;

      return source.pipe(
        tap({
          error: () => (errored = true),
          complete: () => (completed = true),
        }),
        finalize(() => {
          if (errored) {
            callback(DisposeReason.Error);
          } else if (completed) {
            callback(DisposeReason.Complete);
          } else {
            callback(DisposeReason.Unsubscribe);
          }
        })
      );
    });
