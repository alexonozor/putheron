import { Routes } from '@angular/router';
import { BusinessComponent } from './business.component';
import { businessModeGuard } from '../shared/guards/business-mode.guard';

export const BUSINESS_ROUTES: Routes = [
  {
    path: '',
    component: BusinessComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile/:id',
        loadComponent: () =>
          import('./business-profile/business-profile.component').then(
            (m) => m.BusinessProfileComponent
          ),
        // canActivate: [businessModeGuard],
      },
    ],
  },
];
