import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface Business {
  _id: string;
  name: string;
  [key: string]: any;
}

export interface Service {
  _id: string;
  business_id: string | Business;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price?: number;
  pricing_type?: 'fixed' | 'hourly' | 'project' | 'custom';
  duration?: string;
  features?: string[];
  images?: string[];
  category?: string;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  order_index?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss'
})
export class ServiceCardComponent {
  @Input() service!: Service;
  @Input() businessName: string = '';
  @Input() statusColorClass: string = '';
  @Input() statusText: string = '';

  @Output() view = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onView() {
    this.view.emit(this.service._id);
  }

  onEdit() {
    this.edit.emit(this.service._id);
  }

  onDelete() {
    this.delete.emit(this.service._id);
  }
}
