import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Withdrawal } from '../../../../shared/models/withdrawal.model';

@Component({
  selector: 'app-earnings-withdrawals-history',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatTableModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, EmptyStateComponent],
  templateUrl: './earnings-withdrawals-history.component.html',
  styleUrl: './earnings-withdrawals-history.component.scss'
})
export class EarningsWithdrawalsHistoryComponent {
  @Input() withdrawals: Withdrawal[] = [];
  @Input() loading: boolean = false;

  readonly displayedColumns = ['date', 'method', 'description', 'amount', 'status'];

  formatDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
