import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ObservableEffect } from 'ngx-signals';

@Component({
  selector: 'ngx-signals-observable-effect-debug',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <p class="grid">
      <span *ngIf="name"
        ><code>{{ name }}</code> value</span
      >
      <a
        *ngIf="value"
        style="margin-left: auto;"
        href="javascript:;"
        (click)="value.load()"
        >load</a
      >
    </p>
    <table *ngIf="value">
      <thead>
        <th>Property</th>
        <th>Value</th>
      </thead>
      <tbody>
        <tr>
          <td>status</td>
          <td>{{ value().status }}</td>
        </tr>
        <tr *ngIf="value().error">
          <td>error</td>
          <td>{{ value().error }}</td>
        </tr>
        <tr>
          <td>value</td>
          <td><pre style="max-height: 300px; overflow-y: auto;" [innerText]="valueFormatted"></pre></td>
        </tr>
      </tbody>
    </table>
  `,
})
export class ObservableEffectDebugComponent {
  @Input()
  name: string | undefined;
  @Input({ required: true })
  value: ObservableEffect<unknown> | undefined;

  get valueFormatted() {
    return JSON.stringify(this.value!(), undefined, 2);
  }
}
