import { Routes } from '@angular/router';

export const adminUsersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-users-list/admin-users-list.component').then(
        (c) => c.AdminUsersListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./admin-user-details/admin-user-details.component').then(
        (c) => c.AdminUserDetailsComponent
      ),
  },
];
