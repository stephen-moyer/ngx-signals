import { signal } from '@angular/core';
import { ObservableInput, delay, of, switchMap } from 'rxjs';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  ObservableEffectCache,
  ObservableEffectCacheOptions,
  ShouldCache,
  observableEffectCache,
} from 'ngx-signals-pack';

const defaultDelayMs = 300;

export type AutocompleteOptions<TSearchValue, TSuggestion> = Omit<
  ObservableEffectCacheOptions<TSearchValue | undefined, TSuggestion>,
  'shouldCache'
> & {
  /**
   * The delay in ms before the observable is subscribed to.
   * Default is {@link defaultDelayMs} (300)
   */
  delay?: number;

  /**
   * Callback that determines if the results should be cached for a search value.
   * Can also be true/false to always cache or never cache.
   * Default is false
   */
  shouldCache?: ShouldCache<TSuggestion>;
};

export type Autocomplete<TSearchValue, TSuggestion> = ObservableEffectCache<
  TSearchValue | undefined,
  TSuggestion
> & {
  /**
   * Starts a search for the value
   * @param searchValue the value to search for (passed to the searchFn)
   * @returns
   */
  search: (searchValue: TSearchValue) => void;
};

/**
 * Creates an autocomplete that loads suggestions for a search value.
 * @param searchFn called whenever search is called with the search value
 * It is also run in an effect, so any signal dependencies changing will call searchFn as well.
 * @param opts Options
 * @returns
 */
export function createAutocomplete<TSearchValue, TSuggestion>(
  searchFn: (searchValue: TSearchValue) => ObservableInput<TSuggestion>,
  opts?: AutocompleteOptions<TSearchValue, TSuggestion>
): Autocomplete<TSearchValue, TSuggestion> {
  const delayTime = opts?.delay ?? defaultDelayMs;
  const shouldCache = opts?.shouldCache ?? (() => false);
  const searchValue = signal<TSearchValue | undefined>(undefined);
  const autocompleteSignal = observableEffectCache(
    searchValue,
    (searchValue) => {
      if (searchValue === undefined) {
        return undefined;
      }
      return of(null).pipe(
        delay(delayTime),
        switchMap(() => searchFn(searchValue))
      );
    },
    {
      ...opts,
      shouldCache,
    }
  );
  return Object.assign(autocompleteSignal, {
    search: (value: TSearchValue) => {
      searchValue.set(value);
    },
  });
}
