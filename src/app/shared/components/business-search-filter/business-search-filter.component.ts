import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-business-search-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './business-search-filter.component.html',
  styleUrl: './business-search-filter.component.scss'
})
export class BusinessSearchFilterComponent {
  @Input() searchTerm: string = '';
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() hideViewModeToggle: boolean = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() viewModeChange = new EventEmitter<'grid' | 'list'>();
  @Output() clearSearch = new EventEmitter<void>();

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onViewModeChange(value: 'grid' | 'list'): void {
    this.viewModeChange.emit(value);
  }

  onClearSearch(): void {
    this.clearSearch.emit();
  }
}
