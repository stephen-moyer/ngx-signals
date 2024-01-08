import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

export function useRouteParams() {
  const route = inject(ActivatedRoute);
  return toSignal(route.params, { initialValue: route.snapshot.params });
}

export function useRouteQueryParams() {
  const route = inject(ActivatedRoute);
  return toSignal(route.queryParams, {
    initialValue: route.snapshot.queryParams,
  });
}

export function useRouteData() {
  const route = inject(ActivatedRoute);
  return toSignal(route.data, {
    initialValue: route.snapshot.data,
  });
}

export function useRouteFragment() {
  const route = inject(ActivatedRoute);
  return toSignal(route.fragment, {
    initialValue: route.snapshot.fragment,
  });
}
