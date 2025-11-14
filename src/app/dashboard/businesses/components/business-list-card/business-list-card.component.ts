import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MtxGridModule, MtxGridColumn } from '@ng-matero/extensions/grid';
import { AuthService } from '../../../../shared/services/auth.service';
import { Business } from '../../../../shared/services/business.service';

@Component({
  selector: 'app-business-list-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule, MtxGridModule],
  templateUrl: './business-list-card.component.html',
  styleUrl: './business-list-card.component.scss'
})
export class BusinessListCardComponent {
  @Input() businesses: Business[] = [];
  @Input() set displayedColumns(cols: string[]) {
    this.columns.set(this.getColumnDefinitions(cols));
  }
  @Input() showEditDelete: boolean = true;
  @Input() deleteLabel: string = 'Delete';
  @Input() deleteIcon: string = 'delete';

  @Output() view = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.user;
  readonly columns = signal<MtxGridColumn[]>([]);

  getColumnDefinitions(cols: string[]): MtxGridColumn[] {
    const columnDefs: { [key: string]: MtxGridColumn } = {
      'logo': {
        header: '',
        field: 'logo_url',
        width: '60px',
        formatter: (rowData: Business) => {
          const logoUrl = rowData.logo_url;
          if (logoUrl) {
            return `<img src="${logoUrl}" alt="${rowData.name}" class="w-12 h-12 object-cover rounded">`;
          }
          return `<div class="w-12 h-12 bg-gray-100 flex items-center justify-center rounded">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>`;
        }
      },
      'name': {
        header: 'Business Name',
        field: 'name',
        width: '200px',
        formatter: (rowData: Business) => {
          const isFeatured = rowData.is_featured ? `<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            Featured
          </span>` : '';
          return `<div class="flex items-center gap-2">
            <span>${rowData.name}</span>
            ${isFeatured}
          </div>`;
        }
      },
      'category': {
        header: 'Category',
        field: 'category_id',
        width: '140px',
        formatter: (rowData: Business) => {
          const categoryName = typeof rowData.category_id === 'object' ? (rowData.category_id as any)?.name : rowData.category_id;
          return `<span class="text-sm text-gray-600">${categoryName || 'No Category'}</span>`;
        }
      },
      'description': {
        header: 'Description',
        field: 'short_description',
        width: '220px',
        formatter: (rowData: Business) => {
          const description = rowData.short_description || rowData.description || 'No description';
          const truncated = description.length > 50 ? description.substring(0, 50) + '...' : description;
          return `<span class="text-sm text-gray-700 line-clamp-2" title="${description}">${truncated}</span>`;
        }
      },
      'status': {
        header: 'Status',
        field: 'status',
        width: '110px',
        formatter: (rowData: Business) => {
          const status = rowData.status || 'pending';
          const colors: { [key: string]: string } = {
            'approved': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'rejected': 'bg-red-100 text-red-800',
            'suspended': 'bg-gray-100 text-gray-800'
          };
          const statusMap: { [key: string]: string } = {
            'approved': 'Approved',
            'pending': 'Pending',
            'rejected': 'Rejected',
            'suspended': 'Suspended'
          };
          const colorClass = colors[status] || 'bg-gray-100 text-gray-800';
          const statusText = statusMap[status] || 'Unknown';
          return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">
            ${statusText}
          </span>`;
        }
      },
      'business_type': {
        header: 'Type',
        field: 'business_type',
        width: '150px',
        formatter: (rowData: Business) => {
          const type = rowData.business_type || 'service';
          const colors: { [key: string]: string } = {
            'service': 'bg-blue-100 text-blue-800',
            'product': 'bg-purple-100 text-purple-800',
            'both': 'bg-indigo-100 text-indigo-800'
          };
          const types: { [key: string]: string } = {
            'service': 'Service',
            'product': 'Product',
            'both': 'Service & Product'
          };
          const colorClass = colors[type] || 'bg-gray-100 text-gray-800';
          const typeText = types[type] || type;
          return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">
            ${typeText}
          </span>`;
        }
      },
      'date': {
        header: 'Created',
        field: 'createdAt',
        width: '110px',
        formatter: (rowData: Business) => {
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
            children: this.getActionMenuItems()
          }
        ]
      }
    };

    return cols.map(col => columnDefs[col] || { header: col, field: col });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'approved': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'suspended': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'approved': 'Approved',
      'pending': 'Pending',
      'rejected': 'Rejected',
      'suspended': 'Suspended'
    };
    return statusMap[status] || 'Unknown';
  }

  getBusinessTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'service': 'bg-blue-100 text-blue-800',
      'product': 'bg-purple-100 text-purple-800',
      'both': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getBusinessTypeText(type: string): string {
    const types: { [key: string]: string } = {
      'service': 'Service',
      'product': 'Product',
      'both': 'Service & Product'
    };
    return types[type] || type;
  }

  isBusinessOwner(business: Business): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    const ownerId = typeof business.owner_id === 'string' ? business.owner_id : (business.owner_id as any)?._id;
    const userId = user._id;
    
    return ownerId === userId;
  }

  getActionMenuItems() {
    const items: any[] = [
      {
        icon: 'visibility',
        text: 'View',
        click: (record: Business) => this.onView(record._id)
      }
    ];

    // Add edit and delete options if showEditDelete is true
    if (this.showEditDelete) {
      items.push({
        icon: 'edit',
        text: 'Edit',
        click: (record: Business) => this.onEdit(record._id),
        disabled: (record: Business) => !this.isBusinessOwner(record)
      });
    }

    // Always add delete/action option (can be "Delete" or "Remove from Favorites")
    items.push({
      icon: this.deleteIcon,
      text: this.deleteLabel,
      click: (record: Business) => this.onDelete(record._id),
      disabled: this.showEditDelete ? (record: Business) => !this.isBusinessOwner(record) : undefined
    });

    return items;
  }

  onView(businessId: string) {
    this.view.emit(businessId);
  }

  onEdit(businessId: string) {
    this.edit.emit(businessId);
  }

  onDelete(businessId: string) {
    this.delete.emit(businessId);
  }

  trackByFn(index: number): number {
    return index;
  }
}
