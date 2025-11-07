import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-business-owner',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './business-owner.component.html'
})
export class BusinessOwnerComponent {
  owner = input<User | null>(null);
  loading = input<boolean>(false);
  isOwner = input.required<boolean>();
  
  contactOwnerClick = output<void>();
}
