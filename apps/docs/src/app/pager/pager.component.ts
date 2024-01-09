import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createPager } from 'ngx-signals-pack/pager';
import { delay, of } from 'rxjs';
import { ObservableEffectDebugComponent } from '../components';

const States = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

function getPage(pageNumber: number, pageSize: number) {
  const maxPage = Math.ceil(States.length / pageSize);
  if (pageNumber > maxPage) {
    return of({ items: [] });
  } else if (pageNumber < 0) {
    return of({ items: [] });
  } else {
    const start = (pageNumber - 1) * pageSize;
    const end = Math.min(start + pageSize, States.length);
    const items = States.slice(start, end);
    return of({ items }).pipe(delay(1000));
  }
}

@Component({
  selector: 'docs-pager',
  standalone: true,
  imports: [CommonModule, ObservableEffectDebugComponent],
  templateUrl: './pager.component.html',
  styleUrl: './pager.component.scss',
})
export class PagerComponent {
  readonly page = signal({ pageNumber: 1, pageSize: 5 });
  readonly pager = createPager(this.page, ({ pageNumber, pageSize }) =>
    getPage(pageNumber, pageSize)
  );

  previousPage() {
    if (this.page().pageNumber === 0) {
      return;
    }

    this.page.update((page) => ({ ...page, pageNumber: page.pageNumber - 1 }));
  }

  nextPage() {
    this.page.update((page) => ({ ...page, pageNumber: page.pageNumber + 1 }));
  }
}
