import { Routes } from '@angular/router';

export const ADMIN_REVIEWS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-reviews-list/admin-reviews-list.component').then(c => c.AdminReviewsListComponent),
    data: { title: 'Reviews Management' }
  },
  {
    path: ':id',
    loadComponent: () => import('./admin-review-details/admin-review-details.component').then(c => c.AdminReviewDetailsComponent),
    data: { title: 'Review Details' }
  }
];
