import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface SortOption {
  value: string;
  label: string;
}

export interface SortSheetData {
  currentSort: string;
}

@Component({
  selector: 'app-mobile-sort-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './mobile-sort-sheet.component.html',
  styleUrls: ['./mobile-sort-sheet.component.scss']
})
export class MobileSortSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<MobileSortSheetComponent>);

  selectedSort: string = 'relevance';

  sortOptions: SortOption[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'best_selling', label: 'Best selling' },
    { value: 'newest', label: 'Newest arrivals' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: SortSheetData) {
    if (data?.currentSort) {
      this.selectedSort = data.currentSort;
    }
  }

  onSortChange(value: string): void {
    this.selectedSort = value;
  }

  showResults(): void {
    this.bottomSheetRef.dismiss(this.selectedSort);
  }

  close(): void {
    this.bottomSheetRef.dismiss();
  }
}
