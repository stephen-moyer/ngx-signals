import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { observableEffectCache } from 'ngx-signals-pack';
import { ObservableEffectDebugComponent } from '../components';
import { delay, of } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'docs-observable-effect-cache',
  standalone: true,
  imports: [CommonModule, RouterModule, ObservableEffectDebugComponent],
  templateUrl: './observable-effect-cache.component.html',
  styleUrl: './observable-effect-cache.component.scss',
})
export class ObservableEffectCacheComponent {
  readonly dependency = signal(1);
  readonly example = observableEffectCache(this.dependency, (depVal) =>
    of(depVal).pipe(delay(1000))
  );

  increment(signal: WritableSignal<number>) {
    signal.update((val) => ++val);
  }

  decrement(signal: WritableSignal<number>) {
    signal.update((val) => --val);
  }
}
