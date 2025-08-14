import { Routes } from '@angular/router';
import { OverviewsComponent } from './overviews/overviews.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectDetailsComponent } from '../project-details/project-details.component';
import { TestNotificationsComponent } from '../test-notifications.component';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';
import { EarningsComponent } from './earnings/earnings.component';
import { businessModeGuard } from '../shared/guards/business-mode.guard';


export const DASHBOARD_ROUTES: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' }, // Default to projects for all users
  { path: 'overview', component: OverviewsComponent, canActivate: [businessModeGuard] },

  { 
    path: 'businesses', 
    loadChildren: () => import('./businesses/businesses.route').then(m => m.BUSINESSES_ROUTES),
    canActivate: [businessModeGuard]
  },
  { 
    path: 'services', 
    loadChildren: () => import('./services/services.route').then(m => m.SERVICES_ROUTES),
    canActivate: [businessModeGuard]
  },
  { 
    path: 'notifications', 
    loadChildren: () => import('./notifications/notifications.route').then(m => m.NOTIFICATION_ROUTES)
  },
  {
      path: 'messages',
      loadChildren: () => import('./messages/messages.route').then(m => m.MESSAGES_ROUTES)
    },
  { path: 'projects', component: ProjectsComponent },
  { path: 'projects/:id', component: ProjectDetailsComponent },
  { path: 'earnings', component: EarningsComponent, canActivate: [businessModeGuard] },
  { path: 'profile', component: ProfileComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'test-notifications', component: TestNotificationsComponent },
 
  { path: '**', redirectTo: '' }
];
