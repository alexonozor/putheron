import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from "@angular/material/sidenav";
import { UserSidenavComponent } from "../shared/components/user-sidenav/user-sidenav.component";
import { GuestSidenavComponent } from "../shared/components/guest-sidenav/guest-sidenav.component";
import { AuthService } from '../shared/services';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    HeaderComponent,
    FooterComponent,
    MatDrawer,
    MatDrawerContainer,
    UserSidenavComponent,
    GuestSidenavComponent,
    MatDrawerContent
  ],
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.scss']
})
export class TermsOfServiceComponent {
  private readonly authService = inject(AuthService);

  currentUser = computed(() => {
    return this.authService.user();
  });
}
