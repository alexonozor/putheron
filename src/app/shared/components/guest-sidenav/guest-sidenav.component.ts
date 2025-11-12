import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatDrawer } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
  @Input() drawer?: MatDrawer;

  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  
  readonly isMobile = signal<boolean>(false);

  constructor() {
    // Detect mobile breakpoint
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }

  navigateAndClose(route: string) {
    this.router.navigate([route]);
    // Only close sidenav on mobile
    if (this.isMobile() && this.drawer) {
      this.drawer.toggle();
    }
  }
}
