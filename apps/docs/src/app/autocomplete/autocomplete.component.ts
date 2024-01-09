import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createAutocomplete } from 'ngx-signals-pack/autocomplete';
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

function filterStates(value: string) {
  return States.filter((state) =>
    state.toLowerCase().includes(value.toLowerCase())
  );
}

@Component({
  selector: 'docs-autocomplete',
  standalone: true,
  imports: [CommonModule, ObservableEffectDebugComponent],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss',
})
export class AutocompleteComponent {
  readonly autocomplete = createAutocomplete(
    (value: string) => of(filterStates(value)).pipe(delay(150)),
    {
      delay: 300,
    }
  );
}
