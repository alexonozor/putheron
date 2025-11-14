import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { Project } from '../../../../shared/services/project.service';
import { MtxGridModule, MtxGridColumn } from '@ng-matero/extensions/grid';


@Component({
  selector: 'app-project-list-card',
  standalone: true,
  imports: [
  CommonModule,
  MatCardModule,
  MatButtonModule,
  MatIconModule,
  MatMenuModule,
  MatBadgeModule,
  MtxGridModule
  ],
  templateUrl: './project-list-card.component.html',
  styleUrl: './project-list-card.component.scss'
})
export class ProjectListCardComponent {
  @Input() projects: Project[] = [];
  @Input() set displayedColumns(cols: string[]) {
    this.columns.set(this.getColumnDefinitions(cols));
  }

  readonly columns = signal<MtxGridColumn[]>([]);

  @Output() view = new EventEmitter<Project>();
  @Output() accept = new EventEmitter<Project>();
  @Output() reject = new EventEmitter<Project>();

  trackByFn(index: number, item: Project) {
    return item._id;
  }

  onView(project: Project) {
    this.view.emit(project);
  }

  onAccept(project: Project) {
    this.accept.emit(project);
  }

  onReject(project: Project) {
    this.reject.emit(project);
  }

  getStatusChipColor(status: string): 'primary' | 'accent' | 'warn' {
    const colorMap: { [key: string]: 'primary' | 'accent' | 'warn' } = {
      'requested': 'primary',
      'under_review': 'accent',
      'accepted': 'primary',
      'started': 'primary',
      'payment_requested': 'accent',
      'payment_pending': 'accent',
      'payment_completed': 'primary',
      'in_progress': 'primary',
      'awaiting_client_approval': 'accent',
      'completed': 'primary',
      'settled': 'primary',
      'rejected': 'warn',
      'cancelled': 'warn'
    };
    return colorMap[status] || 'primary';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'requested': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'started': 'bg-indigo-100 text-indigo-800',
      'payment_requested': 'bg-orange-100 text-orange-800',
      'payment_pending': 'bg-orange-100 text-orange-800',
      'payment_completed': 'bg-emerald-100 text-emerald-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'awaiting_client_approval': 'bg-amber-100 text-amber-800',
      'completed': 'bg-green-100 text-green-800',
      'settled': 'bg-teal-100 text-teal-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'requested': 'Requested',
      'under_review': 'Under Review',
      'accepted': 'Accepted',
      'started': 'Started',
      'payment_requested': 'Payment Requested',
      'payment_pending': 'Payment Pending',
      'payment_completed': 'Payment Completed',
      'in_progress': 'In Progress',
      'awaiting_client_approval': 'Awaiting Approval',
      'completed': 'Completed',
      'settled': 'Settled',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  formatDate(date: string | Date): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  }

  getBusinessName(project: Project): string {
    if (typeof project.business_id === 'object' && project.business_id.name) {
      return project.business_id.name;
    }
    return 'Unknown Business';
  }

  getClientName(project: Project): string {
    if (typeof project.client_id === 'object') {
      const client = project.client_id;
      return `${client.first_name} ${client.last_name}`;
    }
    return 'Unknown Client';
  }

  getColumnDefinitions(cols: string[]): MtxGridColumn[] {
    const columnDefs: { [key: string]: MtxGridColumn } = {
      'title': {
        header: 'Project',
        field: 'title',
        width: '250px',
        formatter: (rowData: Project) => {
          return `<div class="flex flex-col">
            <div>${rowData.title}</div>
            <div class="text-sm text-gray-600">${this.getBusinessName(rowData)}</div>
          </div>`;
        }
      },
      'client': {
        header: 'Client',
        field: 'client_id',
        width: '180px',
        formatter: (rowData: Project) => {
          return `<span class="text-sm text-gray-700">${this.getClientName(rowData)}</span>`;
        }
      },
      'budget': {
        header: 'Budget',
        field: 'offered_price',
        width: '120px',
        formatter: (rowData: Project) => {
          return `<span class="text-sm">$${rowData.offered_price}</span>`;
        }
      },
      'status': {
        header: 'Status',
        field: 'status',
        width: '150px',
        formatter: (rowData: Project) => {
          const colorClass = this.getStatusColor(rowData.status);
          const statusText = this.getStatusText(rowData.status);
          return `<div class="${colorClass} inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium">
            ${statusText}
          </div>`;
        }
      },
      'date': {
        header: 'Created',
        field: 'createdAt',
        width: '130px',
        formatter: (rowData: Project) => {
          return `<span class="text-sm text-gray-700">${new Date(rowData.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}</span>`;
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
                click: (record: Project) => this.onView(record)
              },
              {
                icon: 'check',
                text: 'Accept',
                click: (record: Project) => this.onAccept(record),
                disabled: (record: Project) => record.status !== 'requested' && record.status !== 'under_review'
              },
              {
                icon: 'close',
                text: 'Reject',
                click: (record: Project) => this.onReject(record),
                disabled: (record: Project) => record.status !== 'requested' && record.status !== 'under_review'
              }
            ]
          }
        ]
      }
    };

    return cols.map(col => columnDefs[col] || { header: col, field: col });
  }
}
