import { Routes } from '@angular/router';
import { AdminGuard } from '../shared/guards/permission.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./admin-dashboard/admin-dashboard.routes').then(c => c.adminDashboardRoutes),
    canActivate: [AdminGuard]
  },
  {
    path: 'super-admin-assignment',
    loadComponent: () => import('./super-admin-assignment/super-admin-assignment.component').then(c => c.SuperAdminAssignmentComponent),
    canActivate: [AdminGuard]
  }
];