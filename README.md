# ngx-signals

A library that adds a few utility functions for working with signals and observables together in angular, plus a bit more.

## Getting Started

#### Install

`npm i ngx-signals`

#### Example

The following shows an example of a component using `observableEffect`. If you are unfamiliar with the new signals/effects features in angular, see [here](https://angular.io/guide/signals).

```typescript
import { delay, map, of } from 'rxjs';
import { observableEffect } from 'ngx-signals';

@Component({
  selector: 'ngx-signals-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <!-- Generally you would create a reusable component to represent the different states -->
    <button (click)="reload()">Reload</button>
    <div *ngIf="example().status === 'pending'">Waiting...</div>
    <div *ngIf="example().status === 'loading'">Loading...</div>
    <div *ngIf="example().status === 'error'">Error: {{ example().error }}</div>
    <div *ngIf="example().status === 'loaded'">Value: {{ example().value }}</div>
    
    <hr />

    <button (click)="increment()">Increment</button>
    <div *ngIf="reactiveExample().status === 'pending'">Waiting...</div>
    <div *ngIf="reactiveExample().status === 'loading'">Loading...</div>
    <div *ngIf="reactiveExample().status === 'error'">Error: {{ example().error }}</div>
    <div *ngIf="reactiveExample().status === 'loaded'">Value: {{ example().value }}</div>
  `,
  styleUrl: './ngx-signals-example.component.scss',
})
export class NgxSignalsExampleComponent {
  // or httpClient.get(), or fetch(). any ObservableInput type can be returned.
  // when the component is destroyed, the observable will be unsubscribed
  readonly example = observableEffect(() => of(1).pipe(delay(1000)));

  reload() {
    this.example.load();
  }

  // the function returning an observable will be rerun everytime dependency changes
  // if dependency changes very quickly, before the observable completes,
  // it will be cancelled and the function run again returning a new 
  // observable to subscribe to.
  readonly dependency = signal(1);
  readonly reactiveExample = observableEffect(() => 
    of(this.dependency()).pipe(delay(1000))
  );

  increment() {
    this.dependency.update((val) => ++val);
  }
}
```

Please see the interactive documentation for more examples.

## Documentation

Interactive example documentation is available [here]()
