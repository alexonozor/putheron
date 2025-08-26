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
      {
        path: 'users',
        loadChildren: () =>
          import('./admin-users/admin-users.routes').then(
            (c) => c.adminUsersRoutes
          ),
      },
      {
        path: 'services',
        loadChildren: () =>
          import('./admin-services/admin-services.routes').then(
            (c) => c.adminServicesRoutes
          ),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./admin-categories/admin-categories.routes').then(
            (c) => c.adminCategoriesRoutes
          ),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./admin-projects/admin-projects.routes').then(
            (c) => c.adminProjectsRoutes
          ),
      },
      {
        path: 'reviews',
        loadChildren: () =>
          import('./admin-reviews/admin-reviews.routes').then(
            (c) => c.ADMIN_REVIEWS_ROUTES
          ),
      },
      {
        path: 'transactions',
        loadChildren: () =>
          import('./admin-transactions/admin-transactions.routes').then(
            (c) => c.adminTransactionsRoutes
          ),
      },
    ],
  },
];
