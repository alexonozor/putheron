import { Routes } from '@angular/router';
import { ListNotificationsComponent } from './list-notifications/list-notifications.component';

export const NOTIFICATION_ROUTES: Routes = [
  { path: '', component: ListNotificationsComponent },
  { path: 'list', redirectTo: '', pathMatch: 'full' },
];
