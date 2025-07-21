import { Component } from '@angular/core';
import { HeaderComponent } from '../shared/components/header/header.component';
import { HeroComponent } from '../shared/components/hero/hero.component';
import { HowItWorksComponent } from '../shared/components/how-it-works/how-it-works.component';
// import { FeaturedWomenComponent } from '../shared/components/featured-women/featured-women.component';
import { PopularServicesComponent } from '../shared/components/popular-services/popular-services.component';
import { SuccessStoriesComponent } from '../shared/components/success-stories/success-stories.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    HowItWorksComponent,
    // FeaturedWomenComponent,
    PopularServicesComponent,
    SuccessStoriesComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}
