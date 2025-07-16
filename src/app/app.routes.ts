import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SearchComponent } from './search/search.component';
import { BusinessProfileComponent } from './business-profile/business-profile.component';
import { CreateProjectComponent } from './create-project/create-project.component';
import { CreateBusinessComponent } from './create-business/create-business.component';
import { ChatComponent } from './chat/chat.component';
import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'login', redirectTo: 'auth' },
  { path: 'signup', redirectTo: 'auth' },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'create-business', 
    component: CreateBusinessComponent,
    canActivate: [AuthGuard]
  },
  { path: 'search', component: SearchComponent },
  { path: 'business/:id', component: BusinessProfileComponent },
  { 
    path: 'create-project/:businessId', 
    component: CreateProjectComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'chat/:conversationId', 
    component: ChatComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];
