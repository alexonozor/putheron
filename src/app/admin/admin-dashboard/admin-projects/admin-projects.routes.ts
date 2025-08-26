import { Routes } from '@angular/router';

export const adminProjectsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-projects-list/admin-projects-list.component')
      .then(m => m.AdminProjectsListComponent),
    title: 'Admin Projects Management'
  },
  {
    path: ':id',
    loadComponent: () => import('./admin-project-details/admin-project-details.component')
      .then(m => m.AdminProjectDetailsComponent),
    title: 'Project Details'
  }
];
