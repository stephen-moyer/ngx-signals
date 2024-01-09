import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { observableEffect } from 'ngx-signals-pack';
import { delay, map, of } from 'rxjs';
import { ObservableEffectDebugComponent } from '../components';

@Component({
  selector: 'docs-observable-effect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ObservableEffectDebugComponent],
  templateUrl: './observable-effect.component.html',
  styleUrl: './observable-effect.component.scss',
})
export class ObservableEffectComponent {
  readonly example = observableEffect(() => of(1).pipe(delay(1000)));

  readonly templateExample = `
    <div *ngIf="example().status === 'pending'">Waiting...</div>
    <div *ngIf="example().status === 'loading'">Loading...</div>
    <div *ngIf="example().status === 'error'">Error: {{ example().error }}</div>
    <div *ngIf="example().status === 'loaded'">Value: {{ example().value }}</div>
  `.trim();

  readonly errorExample = observableEffect(() =>
    of(1).pipe(
      map(() => {
        throw new Error('Error!');
      })
    )
  );

  readonly dependency = signal(1);
  // Only calls the observableFn after `load` is called, or on first access (`example()`)
  readonly deferredExample = observableEffect(
    () => of(this.dependency()).pipe(delay(1000)),
    { deferred: true }
  );
  // Does not run the observable function if dependencies change, only if `load` is called
  readonly nonRxExample = observableEffect(
    () => of(this.dependency()).pipe(delay(1000)),
    { nonReactive: true }
  );

  increment(signal: WritableSignal<number>) {
    signal.update((val) => ++val);
  }
}
