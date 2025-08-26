import { Routes } from '@angular/router';

export const adminCategoriesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-categories-list/admin-categories-list.component').then(
        (c) => c.AdminCategoriesListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./admin-category-details/admin-category-details.component').then(
        (c) => c.AdminCategoryDetailsComponent
      ),
  },
];
