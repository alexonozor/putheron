import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
  selector: 'app-own-business',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HeaderComponent
  ],
  templateUrl: './own-business.component.html',
  styleUrls: ['./own-business.component.scss']
})
export class OwnBusinessComponent {
  constructor(private router: Router) {}

  navigateToSignUp() {
    this.router.navigate(['/auth'], { queryParams: { mode: 'business' } });
  }

  navigateToSignIn() {
    this.router.navigate(['/auth']);
  }

  features = [
    {
      icon: 'store',
      title: 'Showcase Your Business',
      description: 'Create a professional business profile that highlights your services, portfolio, and expertise to attract potential clients.'
    },
    {
      icon: 'people',
      title: 'Connect with Clients',
      description: 'Reach thousands of customers actively searching for services in your area and industry niche.'
    },
    {
      icon: 'payment',
      title: 'Secure Payments',
      description: 'Get paid safely and on time with our integrated payment system and escrow protection.'
    },
    {
      icon: 'trending_up',
      title: 'Grow Your Revenue',
      description: 'Scale your business with our marketing tools, analytics, and customer management features.'
    },
    {
      icon: 'support',
      title: '24/7 Support',
      description: 'Get help when you need it with our dedicated support team and comprehensive resource center.'
    },
    {
      icon: 'verified',
      title: 'Build Trust',
      description: 'Earn verified badges, collect reviews, and build your reputation to attract more high-value clients.'
    }
  ];

  steps = [
    {
      number: '1',
      title: 'Create Your Profile',
      description: 'Sign up and build your professional business profile with your services, portfolio, and credentials.'
    },
    {
      number: '2',
      title: 'Get Discovered',
      description: 'Optimize your profile with relevant keywords and showcase your best work to appear in search results.'
    },
    {
      number: '3',
      title: 'Connect & Deliver',
      description: 'Respond to client inquiries, negotiate projects, and deliver exceptional work to build your reputation.'
    },
    {
      number: '4',
      title: 'Grow & Scale',
      description: 'Use our tools to manage multiple projects, automate workflows, and scale your business operations.'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      business: 'Digital Marketing Consultant',
      quote: 'PutHerOn helped me connect with clients I never would have reached otherwise. My revenue increased by 300% in just 6 months!',
      avatar: 'assets/images/testimonial-1.jpg'
    },
    {
      name: 'Michael Chen',
      business: 'Web Development Agency',
      quote: 'The platform makes it so easy to showcase our work and manage client relationships. We\'ve landed several major contracts through PutHerOn.',
      avatar: 'assets/images/testimonial-2.jpg'
    },
    {
      name: 'Aisha Patel',
      business: 'Graphic Design Studio',
      quote: 'I love how professional my business profile looks. Clients trust us more and we can charge premium rates for our services.',
      avatar: 'assets/images/testimonial-3.jpg'
    }
  ];
}
