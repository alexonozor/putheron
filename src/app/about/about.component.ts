import { Component, computed, inject, ViewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from "@angular/material/sidenav";
import { UserSidenavComponent } from "../shared/components/user-sidenav/user-sidenav.component";
import { GuestSidenavComponent } from "../shared/components/guest-sidenav/guest-sidenav.component";
import { AuthService } from '../shared/services';

interface HowItWorksItem {
  title: string;
  items: string[];
}

interface WhoWeServeItem {
  title: string;
  subtitle: string;
  description: string;
}

interface PlatformFeature {
  title: string;
  items: string[];
  image: string;
  imagePosition: 'left' | 'right';
}

interface Value {
  title: string;
  description: string;
  number: string;
}

interface CommunityRule {
  number: string;
  title: string;
  items: string[];
}

@Component({
  selector: 'app-about',
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
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements AfterViewInit {
  @ViewChild('rulesContainer') rulesContainer!: ElementRef;
  
  private readonly authService = inject(AuthService);

  rulesHeight = signal<string>('auto');

  currentUser = computed(() => {
    return this.authService.user();
  });

  ngAfterViewInit() {
    this.measureRulesHeight();
    // Also measure on window resize
    window.addEventListener('resize', () => this.measureRulesHeight());
  }

  private measureRulesHeight() {
    if (this.rulesContainer) {
      const height = this.rulesContainer.nativeElement.offsetHeight;
      this.rulesHeight.set(`${height}px`);
    }
  }

  howItWorks: HowItWorksItem[] = [
    {
      title: 'For Everyone:',
      items: [
        'Create a free account',
        'Search and filter businesses by location, industry, hashtags, and more',
        'Request services, chat with business owners, and book securely'
      ]
    },
    {
      title: 'For Business Owners:',
      items: [
        'Link or share businesses to your profile (free)',
        'Switch to business owner mode to access your dashboard',
        'Manage service requests, track analytics, and chat with clients',
        'Accept or decline requests, negotiate scope, and terms',
        'Request payment and withdraw earnings',
        'All businesses go through our review process before going live'
      ]
    },
    {
      title: 'Pricing:',
      items: [
        'Listing your business: Free',
        'Searching for services: Free',
        'Booking services: 5% platform fee (only charged when services are completed and confirmed)'
      ]
    }
  ];

  whoWeServe: WhoWeServeItem[] = [
    {
      title: 'Customers & Clients',
      subtitle: 'Find and hire women-owned businesses for services you need - from accountants to caterers, designers to consultants.',
      description: ''
    },
    {
      title: 'Women Business Owners',
      subtitle: 'Getting Hired',
      description: 'List your business, get discovered by customers, manage service requests, and grow your client base.'
    },
    {
      title: 'Women Business Owners',
      subtitle: 'Hiring Others',
      description: 'Use the same platform to find and hire other women-owned businesses as vendors, contractors or partners for your own business'
    }
  ];

  platformFeatures: PlatformFeature[] = [
    {
      title: 'Smart Search & Filtering',
      items: [
        'Search by industry, location and ratings',
        'Filter by heritage, certifications (WBE/M/WBE) and',
        'Save favorite businesses for future reference'
      ],
      image: 'assets/images/about-search.svg',
      imagePosition: 'left'
    },
    {
      title: 'Secure Booking & Payment',
      items: [
        'Request services and confirm project scope before payment',
        'Pay securely through the platform',
        'Funds held until work is completed and confirmed',
        'Dispute resolution available if needed'
      ],
      image: 'assets/images/about-message.svg',
      imagePosition: 'right'
    },
    {
      title: 'Business Owner Dashboard',
      items: [
        'Manage multiple businesses from one account',
        'Track analytics and performance metrics',
        'Review and respond to service requests',
        'Chat with potential clients before accepting work',
        'Withdraw earnings directly to your bank account'
      ],
      image: 'assets/images/about-dashboard.svg',
      imagePosition: 'left'
    }
  ];

  ourValues: Value[] = [
    {
      title: 'Visibility',
      description: 'Women-owned businesses deserve to be seen and found by customers who want to support them.',
      number: '01'
    },
    {
      title: 'Community',
      description: 'When women business owners support each other, everyone wins. We create connections between women entrepreneurs and the people who want to hire them.',
      number: '02'
    },
    {
      title: 'Accessibility',
      description: 'Building a business is hard enough. We make it easy and free to get listed, get found, and get hired – without membership fees or gatekeeping.',
      number: '03'
    },
    {
      title: 'Trust',
      description: 'We facilitate trust through our review process, customer reviews, and transparent profiles – so you can make informed decisions about who to hire.',
      number: '04'
    },
    {
      title: 'Inclusion',
      description: 'We celebrate diverse heritages and backgrounds, and create space for all women entrepreneurs – certified, registered, or just getting started.',
      number: '05'
    }
  ];

  communityRules: CommunityRule[] = [
    {
      number: '1.',
      title: 'Be Kind & Respectful',
      items: [
        'Treat everyone with kindness and professionalism',
        'Support women building their businesses',
        'Communicate clearly and assume people mean well'
      ]
    },
    {
      number: '2.',
      title: 'Be Honest',
      items: [
        'Tell the truth about your business, services, and experience',
        "Don't lie about who owns your business",
        'Be upfront in all your interactions'
      ]
    },
    {
      number: '3.',
      title: 'Be Inclusive',
      items: [
        "Celebrate everyone's different backgrounds",
        'Use the heritage filters respectfully',
        "Don't discriminate or use hurtful language"
      ]
    },
    {
      number: '4.',
      title: 'Be Professional',
      items: [
        'Show up when you say you will',
        'Communicate if plans change',
        'Share helpful information with others'
      ]
    },
    {
      number: '5.',
      title: 'Be Safe',
      items: [
        'No harassment, hate speech, or harmful content',
        "Don't promote scams or illegal activities",
        "Respect people's privacy"
      ]
    }
  ];
}
