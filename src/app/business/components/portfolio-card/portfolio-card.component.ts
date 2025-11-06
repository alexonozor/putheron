import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Project } from '../../../shared/services/project.service';

@Component({
  selector: 'app-portfolio-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './portfolio-card.component.html',
  styleUrls: ['./portfolio-card.component.scss']
})
export class PortfolioCardComponent {
  project = input.required<Project>();
  
  viewClick = output<Project>();

  onViewProject(): void {
    this.viewClick.emit(this.project());
  }

  getClientName(project: Project): string {
    if (typeof project.client_id === 'object' && project.client_id) {
      return `${project.client_id.first_name} ${project.client_id.last_name}`;
    }
    return 'Unknown Client';
  }

  formatProjectPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  formatProjectDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getServiceName(service: any): string {
    return typeof service === 'string' ? service : service?.name || 'Service';
  }
}
