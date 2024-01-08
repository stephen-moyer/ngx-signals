import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'observable-effect',
  },
  {
    path: 'observable-effect',
    loadComponent: () =>
      import('./observable-effect/observable-effect.component').then(
        (m) => m.ObservableEffectComponent
      ),
  },
  {
    path: 'observable-effect-cache',
    loadComponent: () =>
      import(
        './observable-effect-cache/observable-effect-cache.component'
      ).then((m) => m.ObservableEffectCacheComponent),
  },
  {
    path: 'pager',
    loadComponent: () =>
      import(
        './pager/pager.component'
      ).then((m) => m.PagerComponent),
  },
  {
    path: 'autocomplete',
    loadComponent: () =>
      import(
        './autocomplete/autocomplete.component'
      ).then((m) => m.AutocompleteComponent),
  },
];
