import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { BusinessProfileComponent } from './business-profile/business-profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
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
    component: CreateProjectComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }

  
];
