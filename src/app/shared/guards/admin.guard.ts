// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';

// export const adminGuard: CanActivateFn = async (route, state) => {
//   const authService = inject(AuthService);
//   const router = inject(Router);

//   try {
//     const currentUser = authService.currentUser;
    
//     if (!currentUser) {
//       router.navigate(['/auth']);
//       return false;
//     }

//     // Check if user has admin access
//     // Check multiple admin indicators for backward compatibility and role-based access
//     const isAdmin = (currentUser as any).is_super_admin === true ||
//                    (currentUser as any).is_admin === true ||
//                    (currentUser as any).role === 'admin' || 
//                    (currentUser as any).roles?.some((role: any) => role.name === 'admin') ||
//                    (currentUser as any).isAdmin === true ||
//                    currentUser.email?.includes('admin'); // Temporary admin check
//     // 
//     console.log('Admin guard check:', {
//       userId: currentUser._id,
//       email: currentUser.email,
//       is_super_admin: (currentUser as any).is_super_admin,
//       is_admin: (currentUser as any).is_admin,
//       role: (currentUser as any).role,
//       isAdmin: isAdmin
//     });

//     if (!isAdmin) {
//       router.navigate(['/dashboard']);
//       return false;
//     }

//     return true;
//   } catch (error) {
//     console.error('Admin guard error:', error);
//     router.navigate(['/auth']);
//     return false;
//   }
// };

// // Permission-specific guard that can be used with specific permissions
// export const requirePermission = (permission: string): CanActivateFn => {
//   return async (route, state) => {
//     const authService = inject(AuthService);
//     const router = inject(Router);

//     try {
//       const currentUser = authService.currentUser;
      
//       if (!currentUser) {
//         router.navigate(['/auth']);
//         return false;
//       }

//       // TODO: Integrate with RoleService to check user permissions
//       // const roleService = inject(RoleService);
//       // const hasPermission = await roleService.hasPermission(currentUser._id, permission);
      
//       // For now, check if user has admin access
//       const isAdmin = (currentUser as any).is_super_admin === true ||
//                      (currentUser as any).is_admin === true ||
//                      (currentUser as any).role === 'admin' || 
//                      (currentUser as any).roles?.some((role: any) => role.name === 'admin') ||
//                      (currentUser as any).isAdmin === true ||
//                      currentUser.email?.includes('admin'); // Temporary admin check

//       if (!isAdmin) {
//         router.navigate(['/dashboard']);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Permission guard error:', error);
//       router.navigate(['/auth']);
//       return false;
//     }
//   };
// };