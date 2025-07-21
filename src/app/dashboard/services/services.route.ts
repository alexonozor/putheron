import { Routes } from '@angular/router';
import { ServicesComponent } from './services.component';
import { ListServicesComponent } from './list-services/list-services.component';
import { CreateServiceComponent } from './create-service/create-service.component';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    component: ServicesComponent,
    children: [
      { path: 'list-services', component: ListServicesComponent },
      { path: '', redirectTo: 'list-services', pathMatch: 'full' },
      { 
        path: 'create-service', 
        component: CreateServiceComponent,
      },
      { 
        path: 'edit-service/:id', 
        component: CreateServiceComponent,  // Use same component for edit
      }
    ]
  }
];
