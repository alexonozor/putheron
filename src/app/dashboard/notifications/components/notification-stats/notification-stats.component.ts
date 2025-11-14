import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notification-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './notification-stats.component.html',
  styleUrl: './notification-stats.component.scss'
})
export class NotificationStatsComponent {
  @Input() totalCount: number = 0;
  @Input() unreadCount: number = 0;
  @Input() readCount: number = 0;
}
