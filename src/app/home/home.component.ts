import { Component, OnInit, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { HeroComponent } from '../shared/components/hero/hero.component';
import { HowItWorksComponent } from '../shared/components/how-it-works/how-it-works.component';
// import { FeaturedWomenComponent } from '../shared/components/featured-women/featured-women.component';
import { SuccessStoriesComponent } from '../shared/components/success-stories/success-stories.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    HowItWorksComponent,
    // FeaturedWomenComponent,
    // SuccessStoriesComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Use effect in constructor (injection context) to react to authentication changes
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();
      const user = this.authService.user();
      
      if (isAuthenticated && user) {
        // Redirect based on user mode
        if (user.user_mode === 'business_owner') {
          console.log('Redirecting business owner to dashboard');
          this.router.navigate(['/dashboard']);
        } else {
          console.log('Redirecting client to search page');
          this.router.navigate(['/search']);
        }
      }
      // If not authenticated, stay on home page to show landing content
    });
  }

  ngOnInit() {
    // ngOnInit can be used for other initialization that doesn't involve effects
  }
}
