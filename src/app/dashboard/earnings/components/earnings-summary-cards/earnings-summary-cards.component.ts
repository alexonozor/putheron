import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface WalletSummary {
  active_orders: number;
  payments_clearing: number;
  available: number;
  total_earnings: number;
}

@Component({
  selector: 'app-earnings-summary-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './earnings-summary-cards.component.html',
  styleUrl: './earnings-summary-cards.component.scss'
})
export class EarningsSummaryCardsComponent {
  @Input() summary: WalletSummary | null = null;
  @Input() stripeConnectionStatus: 'connected' | 'pending' | 'failed' | 'not-connected' = 'not-connected';
}
