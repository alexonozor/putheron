import { Routes } from '@angular/router';

export const adminDashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-dashboard.component').then(
        (c) => c.AdminDashboardComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./admin-overview/admin-overview.component').then(
            (c) => c.AdminOverviewComponent
          ),
      },
      {
        path: 'businesses',
        loadChildren: () =>
          import('./admin-business/admin-business.routes').then(
            (c) => c.adminBusinessRoutes
          ),
      },
    ],
  },
];
