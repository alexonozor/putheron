import { Routes } from '@angular/router';
// import {
//   adminGuard,
//   requirePermission,
// } from '../../../shared/guards/admin.guard';

export const ROLE_AND_PERMISSION_ROUTES: Routes = [
      {
        path: '',
        redirectTo: 'roles',
        pathMatch: 'full',
      },
   {
        path: 'roles',
        loadComponent: () =>
          import('./role-management/role-management.component').then(
            (c) => c.RoleManagementComponent
          ),
        // canActivate: [requirePermission('roles.manage')],
      },
      // {
      //   path: 'permissions',
      //   loadComponent: () =>
      //     import(
      //       './permission-management/permission-management.component'
      //     ).then((c) => c.PermissionManagementComponent),
      //   // canActivate: [requirePermission('permissions.manage')],
      // },
      // {
      //   path: 'user-roles',
      //   loadComponent: () =>
      //     import('./user-role-assignment/user-role-assignment.component').then(
      //       (c) => c.UserRoleAssignmentComponent
      //     ),
      //   // canActivate: [requirePermission('roles.assign')],
      // },
    // path: '',
    // loadComponent: () =>
    //   import('./roles-and-permission.component').then(
    //     (c) => c.RolesAndPermissionComponent
    //   ),
    // children: [
    //   {
    //     path: '',
    //     redirectTo: 'roles',
    //     pathMatch: 'full',
    //   },
    //   {
    //     path: 'roles',
    //     loadComponent: () =>
    //       import('./role-management/role-management.component').then(
    //         (c) => c.RoleManagementComponent
    //       ),
    //     // canActivate: [requirePermission('roles.manage')],
    //   },
    //   {
    //     path: 'permissions',
    //     loadComponent: () =>
    //       import(
    //         './permission-management/permission-management.component'
    //       ).then((c) => c.PermissionManagementComponent),
    //     // canActivate: [requirePermission('permissions.manage')],
    //   },
    //   {
    //     path: 'user-roles',
    //     loadComponent: () =>
    //       import('./user-role-assignment/user-role-assignment.component').then(
    //         (c) => c.UserRoleAssignmentComponent
    //       ),
    //     // canActivate: [requirePermission('roles.assign')],
    //   },
    // ],
  
];
