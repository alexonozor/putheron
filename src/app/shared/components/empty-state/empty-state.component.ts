import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface EmptyStateButton {
  label: string;
  callback: () => void;
  color?: 'primary' | 'accent' | 'warn';
  variant?: 'basic' | 'raised' | 'stroked' | 'flat';
  icon?: string;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() icon: string = 'info';
  @Input() title: string = 'No Data';
  @Input() description: string = 'No items to display.';
  @Input() buttons: EmptyStateButton[] = [];
  @Input() iconColor: string = 'text-gray-300';
}
