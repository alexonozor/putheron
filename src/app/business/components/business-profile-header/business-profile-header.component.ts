import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Business } from '../../../shared/services/business.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-business-profile-header',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatCardModule],
  templateUrl: './business-profile-header.component.html',
//   styleUrls: ['./business-profile-header.component.scss']
})
export class BusinessProfileHeaderComponent {
  // Inputs
  business = input.required<Business>();
  isOwner = input.required<boolean>();
  activeServicesCount = input.required<number>();
  businessTypeDisplay = input.required<string>();
  activeSection = input<string>('about');

  // Outputs (Events)
  editBusinessClick = output<void>();
  addServiceClick = output<void>();
  startProjectClick = output<void>();
  visitWebsiteClick = output<void>();
  reportBusinessClick = output<void>();
  scrollToSection = output<string>();

  // Tab links
  links = ['About', 'Services', 'Portfolio', 'Reviews'];
}
