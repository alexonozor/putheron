import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateProjectStepsComponent } from './create-project-steps/create-project-steps.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { GuestGuard } from './shared/guards/guest.guard';
import { BusinessProfileComponent } from './business-profile/business-profile.component';
import { SearchComponent } from './search/search.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { path: 'auth', component: AuthComponent, canActivate: [GuestGuard] },
  { path: 'login', redirectTo: 'auth' },
  { path: 'signup', redirectTo: 'auth' },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    loadChildren: () => import('./dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES),
    canActivate: [AuthGuard]
  },
  
  { path: 'business/:id', component: BusinessProfileComponent },
  { 
    path: 'create-project/:businessId', 
    component: CreateProjectStepsComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }

  
];
