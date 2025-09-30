import { Routes } from '@angular/router';

export const adminReportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-reports.component').then(
        (c) => c.AdminReportsComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin-reports-list/admin-reports-list.component').then(
            (c) => c.AdminReportsListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./admin-report-details/admin-report-details.component').then(
            (c) => c.AdminReportDetailsComponent
          ),
      },
    ],
  },
];