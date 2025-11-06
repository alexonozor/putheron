import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Business } from '../../../shared/services/business.service';

@Component({
  selector: 'app-business-information',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  templateUrl: './business-information.component.html'
})
export class BusinessInformationComponent {
  business = input.required<Business>();
}
