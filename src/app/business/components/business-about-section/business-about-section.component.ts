import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Business } from '../../../shared/services/business.service';
import { User } from '../../../models/user.model';
import { BusinessAboutComponent } from '../business-about/business-about.component';
import { BusinessInformationComponent } from '../business-information/business-information.component';
import { BusinessOwnerComponent } from '../business-owner/business-owner.component';

@Component({
  selector: 'app-business-about-section',
  standalone: true,
  imports: [
    CommonModule, 
    BusinessAboutComponent, 
    BusinessInformationComponent, 
    BusinessOwnerComponent
  ],
  templateUrl: './business-about-section.component.html'
})
export class BusinessAboutSectionComponent {
  business = input.required<Business>();
  businessTags = input<string[]>([]);
  owner = input<User | null>(null);
  loading = input<boolean>(false);
  isOwner = input.required<boolean>();
  
  contactOwnerClick = output<void>();
}
