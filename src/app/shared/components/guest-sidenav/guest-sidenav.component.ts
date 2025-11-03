import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-guest-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './guest-sidenav.component.html',
  styleUrls: ['./guest-sidenav.component.scss']
})
export class GuestSidenavComponent {
  @Output() closeSidenav = new EventEmitter<void>();

  constructor(private router: Router) {}

  navigateAndClose(route: string) {
    this.router.navigate([route]);
    this.closeSidenav.emit();
  }
}
