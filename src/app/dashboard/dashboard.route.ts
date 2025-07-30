import { Routes } from '@angular/router';
import { OverviewsComponent } from './overviews/overviews.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectDetailsComponent } from '../project-details/project-details.component';
import { TestNotificationsComponent } from '../test-notifications.component';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';


export const DASHBOARD_ROUTES: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
    { path: 'overview', component: OverviewsComponent },

  { 
    path: 'businesses', 
    loadChildren: () => import('./businesses/businesses.route').then(m => m.BUSINESSES_ROUTES)
  },
  { 
    path: 'services', 
    loadChildren: () => import('./services/services.route').then(m => m.SERVICES_ROUTES)
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
  { path: 'profile', component: ProfileComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'test-notifications', component: TestNotificationsComponent },
 
  { path: '**', redirectTo: '' }
];
