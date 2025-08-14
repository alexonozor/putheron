import { Routes } from '@angular/router';

export const adminBusinessRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-business.component').then(
        (c) => c.AdminBusinessComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      
      {
        path: 'list',
        loadComponent: () =>
          import('./admin-business-list/admin-business-list.component').then(
            (c) => c.AdminBusinessListComponent
          ),
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import(
            './admin-business-details/admin-business-details.component'
          ).then((c) => c.AdminBusinessDetailsComponent),
      },
    ],
  },
];
