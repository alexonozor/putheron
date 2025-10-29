import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { GuestGuard } from './shared/guards/guest.guard';
import { SearchComponent } from './search/search.component';
import { PayPalCallbackComponent } from './payments/paypal-callback/paypal-callback.component';
import { StripeCallbackComponent } from './payments/stripe-callback/stripe-callback.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.route').then(m => m.AUTH_ROUTES),
    canActivate: [GuestGuard]
  },
  { path: 'login', redirectTo: 'auth/login' },
  { path: 'signup', redirectTo: 'auth/signup' },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    loadChildren: () => import('./dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES),
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'business',
    loadChildren: () => import('./business/business.routes').then(m => m.BUSINESS_ROUTES)
  },
  { 
    path: 'paypal/callback', 
    component: PayPalCallbackComponent
  },
  { 
    path: 'stripe/return', 
    component: StripeCallbackComponent
  },
  { 
    path: 'stripe/refresh', 
    component: StripeCallbackComponent
  },
 

  
];
