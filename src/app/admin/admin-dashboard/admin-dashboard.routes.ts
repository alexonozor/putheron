import { Routes } from '@angular/router';
import { PermissionGuard, RoleManagementGuard } from '../../shared/guards/permission.guard';
import { AuthorizationService } from '../../shared/services/authorization.service';

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
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.BUSINESS_VIEW],
          redirectTo: '/dashboard'
        }
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./admin-users/admin-users.routes').then(
            (c) => c.adminUsersRoutes
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.USERS_VIEW],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'services',
        loadChildren: () =>
          import('./admin-services/admin-services.routes').then(
            (c) => c.adminServicesRoutes
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.SERVICES_VIEW],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./admin-categories/admin-categories.routes').then(
            (c) => c.adminCategoriesRoutes
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.CATEGORIES_VIEW],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./admin-projects/admin-projects.routes').then(
            (c) => c.adminProjectsRoutes
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.PROJECTS_VIEW],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'reviews',
        loadChildren: () =>
          import('./admin-reviews/admin-reviews.routes').then(
            (c) => c.ADMIN_REVIEWS_ROUTES
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.REVIEWS_VIEW],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'transactions',
        loadChildren: () =>
          import('./admin-transactions/admin-transactions.routes').then(
            (c) => c.adminTransactionsRoutes
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.TRANSACTIONS_VIEW],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./admin-reports/admin-reports.routes').then(
            (c) => c.adminReportsRoutes
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.REPORTS_VIEW],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'roles-and-permissions',
        loadChildren: () =>
          import('./roles-and-permission/roles-and-permission.routes').then(
            (c) => c.ROLE_AND_PERMISSION_ROUTES
          ),
        canActivate: [RoleManagementGuard]
      },
      {
        path: 'permission-examples',
        loadComponent: () =>
          import('../permission-examples/permission-examples.component').then(
            (c) => c.PermissionExamplesComponent
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.ADMIN_ACCESS],
          redirectTo: '/admin/dashboard'
        }
      },
      {
        path: 'permission-debug',
        loadComponent: () =>
          import('../permission-debug/permission-debug.component').then(
            (c) => c.PermissionDebugComponent
          )
      },
      {
        path: 'super-admin-assignment',
        loadComponent: () =>
          import('../super-admin-assignment/super-admin-assignment.component').then(
            (c) => c.SuperAdminAssignmentComponent
          ),
        canActivate: [PermissionGuard],
        data: {
          permissions: [AuthorizationService.PERMISSIONS.ADMIN_ACCESS],
          redirectTo: '/admin/dashboard'
        }
      },
    ],
  },
];
