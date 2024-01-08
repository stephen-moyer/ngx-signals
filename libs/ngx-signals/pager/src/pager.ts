import { Signal, computed } from '@angular/core';
import { ObservableInput, from, map } from 'rxjs';
import {
  ObservableEffect,
  ObservableEffectState,
  ObservableEffectCacheOptions,
  ShouldCache,
  observableEffectCache,
} from 'ngx-signals';

export type PageRequest = {
  pageNumber: number;
};

export type CurrentPage = {
  pageNumber: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PageItems<T = any> = {
  items: T[];
};

type Page<T> = PageItems<T> & {
  pageNumber: number;
};

type PageItem<TPageItems extends PageItems> = TPageItems['items'][number];

type PageItemsPage<TPageItems extends PageItems> = TPageItems &
  Page<PageItem<TPageItems>>;

type PagerSignalValue<TPageItems extends PageItems> = {
  page?: PageItemsPage<TPageItems>;
  pages: PageItemsPage<TPageItems>[];
  allItems: PageItem<TPageItems>[];
};

type PagerSignalState<T extends PageItems> = ObservableEffectState<
  PagerSignalValue<T>
>;

export type Pager<
  TCurrentPage extends CurrentPage,
  TPageItems extends PageItems
> = ObservableEffect<PagerSignalValue<TPageItems>> & {
  /**
   * removes all cached pages
   * @param load If true, the current page will load again
   */
  clear: (load?: boolean) => void;

  /**
   * removes the cached page for this key
   * @param key The key to remove
   */
  remove: (key: TCurrentPage) => void;
};

export type PagerOptions<
  TCurrentPage,
  TPageItems extends PageItems
> = ObservableEffectCacheOptions<TCurrentPage, PageItemsPage<TPageItems>> & {
  /**
   * If the pages should be cached.
   * Default is true
   *
   * If false, the allItems and pages properties will only contain the current page
   */
  shouldCache?: ShouldCache<PageItemsPage<TPageItems>>;
};

/**
 * Creates a pager that reactively loads a page whenever the page signal changes
 *
 * @param page The signal that represents the current page
 * @param pageObservableFn The function that returns an observable for the page
 * @param opts options
 */
export function createPager<
  TCurrentPage extends CurrentPage,
  TPageItems extends PageItems
>(
  page: Signal<TCurrentPage>,
  pageObservableFn: (
    page: TCurrentPage
  ) => ObservableInput<TPageItems> | undefined,
  opts?: PagerOptions<TCurrentPage, TPageItems>
): Pager<TCurrentPage, TPageItems> {
  const obsEffect = observableEffectCache(
    page,
    (pageValue) => {
      const observableInput = pageObservableFn(pageValue);
      if (observableInput === undefined || observableInput === null) {
        return observableInput;
      }

      return from(observableInput).pipe(
        map((value) => ({ pageNumber: pageValue.pageNumber, ...value }))
      );
    },
    opts
  );

  // we can just emulate an async signal here because we
  // need to do some transformations
  const pagerState = computed<PagerSignalState<TPageItems>>(() => {
    const signalValue = obsEffect();
    const pages = [...obsEffect.cache.values()]
      .filter((page) => page.value !== undefined)
      .sort((a, b) => a.key.pageNumber - b.key.pageNumber)
      .reduce((acc, page) => {
        acc.push(page.value!);
        return acc;
      }, [] as PageItemsPage<TPageItems>[]);
    const allItems = pages.reduce((acc, page) => {
      acc.push(...page.items);
      return acc;
    }, [] as TPageItems[]);

    return new ObservableEffectState<PagerSignalValue<TPageItems>>({
      ...signalValue,
      value: {
        page: signalValue.value,
        pages: pages,
        allItems: allItems,
      },
    });
  });

  return Object.assign(pagerState, {
    load: () => obsEffect.load(),
    clear: (load = false) => obsEffect.clear(load),
    remove: (key: TCurrentPage) => obsEffect.remove(key),
  });
}
