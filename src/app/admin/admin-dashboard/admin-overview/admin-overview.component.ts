import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss'
})
export class AdminOverviewComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly stats = signal({
    totalUsers: 0,
    totalBusinesses: 0,
    totalProjects: 0,
    totalReviews: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingBusinesses: 0,
    totalRevenue: 0
  });

  readonly user = this.authService.user;

  ngOnInit() {
    this.loadDashboardStats();
  }

  async loadDashboardStats() {
    this.loading.set(true);
    try {
      // TODO: Implement API calls to get admin dashboard stats
      // This is a placeholder - replace with actual API calls
      setTimeout(() => {
        this.stats.set({
          totalUsers: 1250,
          totalBusinesses: 340,
          totalProjects: 890,
          totalReviews: 567,
          activeProjects: 123,
          completedProjects: 767,
          pendingBusinesses: 15,
          totalRevenue: 45600
        });
        this.loading.set(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading admin dashboard stats:', error);
      this.loading.set(false);
    }
  }

  refreshStats() {
    this.loadDashboardStats();
  }
}
