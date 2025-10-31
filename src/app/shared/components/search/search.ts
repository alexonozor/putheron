import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search',
  imports: [MatButtonModule, MatIconModule, CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
})
export class Search {
  // ✅ Signal inputs (Angular 20)
  width = input('100%');
  backgroundColor = input('#ffffff');
  placeholder = input('Search business, service or location');
  boxShadow = input('');

  // Internal state
  query = '';

  onSearch() {
    console.log('Search:', this.query);
  }
 }
