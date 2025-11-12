import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from "@angular/material/sidenav";
import { UserSidenavComponent } from "../shared/components/user-sidenav/user-sidenav.component";
import { GuestSidenavComponent } from "../shared/components/guest-sidenav/guest-sidenav.component";
import { AuthService } from '../shared/services';
import { computed } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
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
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent {
  private readonly authService = inject(AuthService);

  currentUser = computed(() => {
    return this.authService.user();
  });
}
