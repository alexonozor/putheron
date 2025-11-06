import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Business } from '../../../shared/services/business.service';

@Component({
  selector: 'app-business-about',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './business-about.component.html'
})
export class BusinessAboutComponent {
  business = input.required<Business>();
  businessTags = input<string[]>([]);
}
