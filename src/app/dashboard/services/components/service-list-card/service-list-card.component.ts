import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MtxGridModule, MtxGridColumn } from '@ng-matero/extensions/grid';

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
  selector: 'app-service-list-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule, MtxGridModule],
  templateUrl: './service-list-card.component.html',
  styleUrl: './service-list-card.component.scss'
})
export class ServiceListCardComponent {
  @Input() services: Service[] = [];
  @Input() businessNameMap: { [key: string]: string } = {};
  @Input() set displayedColumns(cols: string[]) {
    this.columns.set(this.getColumnDefinitions(cols));
  }

  @Output() view = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  readonly columns = signal<MtxGridColumn[]>([]);

  trackByFn(index: number): number {
    return index;
  }

  getColumnDefinitions(cols: string[]): MtxGridColumn[] {
    const columnDefs: { [key: string]: MtxGridColumn } = {
      'image': {
        header: '',
        field: 'images',
        width: '60px',
        formatter: (rowData: Service) => {
          const imageUrl = rowData.images && rowData.images.length > 0 ? rowData.images[0] : null;
          if (imageUrl) {
            return `<img src="${imageUrl}" alt="${rowData.name}" class="w-12 h-12 object-cover rounded">`;
          }
          return `<div class="w-12 h-12 bg-gray-100 flex items-center justify-center rounded">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4"></path>
            </svg>
          </div>`;
        }
      },
      'name': {
        header: 'Service Name',
        field: 'name',
        width: '220px',
        formatter: (rowData: Service) => {
          const isFeatured = rowData.is_featured ? `<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            Featured
          </span>` : '';
          return `<div class="flex items-center gap-2">
            <span>${rowData.name}</span>
          </div>`;
        }
      },
      'business': {
        header: 'Business',
        field: 'business_id',
        width: '160px',
        formatter: (rowData: Service) => {
          const businessName = typeof rowData.business_id === 'object' ? rowData.business_id.name : this.businessNameMap[rowData._id] || 'Unknown';
          return `<span class="text-sm text-gray-600">${businessName}</span>`;
        }
      },
      'description': {
        header: 'Description',
        field: 'short_description',
        width: '200px',
        formatter: (rowData: Service) => {
          const description = rowData.short_description || rowData.description || 'No description';
          const truncated = description.length > 40 ? description.substring(0, 40) + '...' : description;
          return `<span class="text-sm text-gray-700 line-clamp-1" title="${description}">${truncated}</span>`;
        }
      },
      'status': {
        header: 'Status',
        field: 'is_active',
        width: '110px',
        formatter: (rowData: Service) => {
          const statusClass = rowData.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
          const statusText = rowData.is_active ? 'Active' : 'Inactive';
          return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>`;
        }
      },
      'price': {
        header: 'Price',
        field: 'price',
        width: '100px',
        formatter: (rowData: Service) => {
          if (rowData.price !== undefined && rowData.price !== null) {
            return `<span class="text-sm font-medium">$${rowData.price}</span>`;
          }
          return `<span class="text-sm text-gray-500">Custom</span>`;
        }
      },
      'date': {
        header: 'Created',
        field: 'createdAt',
        width: '110px',
        formatter: (rowData: Service) => {
          const dateStr = new Date(rowData.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          return `<span class="text-sm text-gray-500">${dateStr}</span>`;
        }
      },
      'actions': {
        header: 'Actions',
        field: 'actions',
        width: '80px',
        pinned: 'right',
        right: '0px',
        type: 'button',
        buttons: [
          {
            type: 'icon',
            icon: 'more_vert',
            tooltip: 'Options',
            children: [
              {
                icon: 'visibility',
                text: 'View',
                click: (record: Service) => this.onView(record._id)
              },
              {
                icon: 'edit',
                text: 'Edit',
                click: (record: Service) => this.onEdit(record._id)
              },
              {
                icon: 'delete',
                text: 'Delete',
                click: (record: Service) => this.onDelete(record._id)
              }
            ]
          }
        ]
      }
    };

    return cols.map(col => columnDefs[col] || { header: col, field: col });
  }

  onView(serviceId: string) {
    this.view.emit(serviceId);
  }

  onEdit(serviceId: string) {
    this.edit.emit(serviceId);
  }

  onDelete(serviceId: string) {
    this.delete.emit(serviceId);
  }
}
