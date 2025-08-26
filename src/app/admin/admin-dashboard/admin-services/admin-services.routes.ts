import { Routes } from '@angular/router';

export const adminServicesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-services-list/admin-services-list.component').then(
        (c) => c.AdminServicesListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./admin-service-details/admin-service-details.component').then(
        (c) => c.AdminServiceDetailsComponent
      ),
  },
];
