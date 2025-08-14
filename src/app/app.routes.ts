import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateProjectStepsComponent } from './create-project-steps/create-project-steps.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { GuestGuard } from './shared/guards/guest.guard';
import { BusinessProfileComponent } from './business-profile/business-profile.component';
import { SearchComponent } from './search/search.component';
import { OwnBusinessComponent } from './own-business/own-business.component';
import { PayPalCallbackComponent } from './components/paypal-callback/paypal-callback.component';
import { StripeCallbackComponent } from './components/stripe-callback/stripe-callback.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { path: 'own-business', component: OwnBusinessComponent },
  { path: 'auth', component: AuthComponent, canActivate: [GuestGuard] },
  { path: 'login', redirectTo: 'auth' },
  { path: 'signup', redirectTo: 'auth' },
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
  
  { path: 'business/:id', component: BusinessProfileComponent },
  { 
    path: 'create-project/:businessId', 
    component: CreateProjectStepsComponent,
    canActivate: [AuthGuard]
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
  { path: '**', redirectTo: '' }

  
];
