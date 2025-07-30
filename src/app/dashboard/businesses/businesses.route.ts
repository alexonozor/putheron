import { Routes } from '@angular/router';
import { CreateBusinessComponent } from './create-business/create-business.component';
import { ListBusinessesComponent } from './list-businesses/list-businesses.component';
import { BusinessesComponent } from './businesses.component';

export const BUSINESSES_ROUTES: Routes = [ 
  {
    path: '',
    component: BusinessesComponent,
    children: [
      {
        path: 'list',
        component: ListBusinessesComponent,
      },
      {
        path: 'create-business',
        component: CreateBusinessComponent,
      },
      {
        path: 'edit/:id',
        component: CreateBusinessComponent,
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ],
  }
];
