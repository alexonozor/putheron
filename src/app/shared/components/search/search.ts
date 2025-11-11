import { CommonModule } from '@angular/common';
import { Component, input, output, model } from '@angular/core';
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

  // ✅ Two-way binding with model signal (Angular 20)
  searchQuery = model<string>('');

  // ✅ Signal outputs (Angular 20)
  searchEvent = output<string>();

  onSearch() {
    console.log('Search:', this.searchQuery());
    this.searchEvent.emit(this.searchQuery());
  }

  onQueryChange() {
    // Model automatically emits changes
  }
 }
