import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-business-owner',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './business-owner.component.html'
})
export class BusinessOwnerComponent {
  owner = input<User | null>(null);
  loading = input<boolean>(false);
  isOwner = input.required<boolean>();
  
  contactOwnerClick = output<void>();
}
