import { Component, inject, signal, computed, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { BusinessService } from '../../services/business.service';
import { ChatService } from '../../services/chat.service';
import { NotificationNavComponent } from '../notification-nav/notification-nav.component';
import { MatCardModule } from '@angular/material/card';
import { Search } from '../search/search';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatToolbarModule,
    MatSidenavModule,
    NotificationNavComponent,
    MatCardModule,
    Search
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly businessService = inject(BusinessService);
  private readonly chatService = inject(ChatService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);


  // Input properties
  @Input() drawer!: MatDrawer;
  @Input() maxWidth: string = 'max-w-12xl'; // Default max width for desktop

  // Search query signal for two-way binding
  readonly headerSearchQuery = signal<string>('');

  readonly user = this.authService.user;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly showMobileMenu = signal(false);
  readonly mobileMenuOpen = signal(false);

  // Unread messages count
  readonly unreadMessageCount = signal(0);
  readonly showHeaderSearch = signal(true);
  private intersectionObserver?: IntersectionObserver;
  private routerSub: any;

  // Track if user has any businesses
  readonly hasBusinesses = signal(false);
  // Get current user mode as computed signal
  readonly userMode = computed(() => {
    const user = this.user();
    return user?.user_mode || 'client';
  });

  // Check if user is a business owner as computed signal
  readonly isBusinessOwner = computed(() => {
    return this.userMode() === 'business_owner';
  });

  // Check if user has admin access - use authorization service computed signal
  readonly hasAdminAccess = computed(() => {
    return this.authorizationService.hasAdminAccess();
  });

  constructor() {
    // Add effect to debug signal changes
    effect(() => {
      const user = this.user();
      const mode = this.userMode();
      const isBusiness = this.isBusinessOwner();
      console.log('Header signals updated:', { user: user?.email, mode, isBusiness });
    });

    // Load unread message count when user is authenticated
    effect(() => {
      const isAuth = this.isAuthenticated();
      if (isAuth) {
        this.loadUnreadMessageCount();
      } else {
        this.unreadMessageCount.set(0);
      }
    });

    // Refresh unread count when navigating back from chat
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Refresh unread count on any navigation to ensure it's up to date
        if (this.isAuthenticated()) {
          this.loadUnreadMessageCount();
        }
      }
    });

    // Check if user has businesses when authenticated
    effect(() => {
      const user = this.user();
      if (user) {
        this.checkUserBusinesses();
      } else {
        this.hasBusinesses.set(false);
      }
    });

    // Initialize behavior for showing/hiding navbar search based on route
    // and hero search visibility
    this.setupRouteObserver();

    // Sync header search query with URL params
    this.syncHeaderSearchWithUrl();
  }

  private syncHeaderSearchWithUrl() {
    // Listen to route changes and update header search query
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        // Get query params from current route
        const tree = this.router.parseUrl(this.router.url);
        const searchQuery = tree.queryParams['q'] || '';
        this.headerSearchQuery.set(searchQuery);
        console.log('Header search synced with URL:', searchQuery);
      }
    });

    // Also do an initial sync
    const tree = this.router.parseUrl(this.router.url);
    const searchQuery = tree.queryParams['q'] || '';
    this.headerSearchQuery.set(searchQuery);
  }

  private setupRouteObserver() {
    // On navigation end, enable/disable observer depending on route
    this.routerSub = this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        const isHome = evt.urlAfterRedirects === '/' || evt.urlAfterRedirects === '';
        if (isHome) {
          // default: hide header search until user scrolls past hero
          this.showHeaderSearch.set(false);
          this.attachHeroObserver();
        } else {
          // always show search on non-home pages
          this.showHeaderSearch.set(true);
          this.detachHeroObserver();
        }
      }
    });

    // Also do an initial check based on current url
    const cur = this.router.url;
    const initiallyHome = cur === '/' || cur === '';
    if (initiallyHome) {
      this.showHeaderSearch.set(false);
      this.attachHeroObserver();
    } else {
      this.showHeaderSearch.set(true);
    }
  }

  private attachHeroObserver() {
    // detach any previous
    this.detachHeroObserver();
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      // find the anchor in DOM
      const el = document.getElementById('hero-search-anchor');
      if (!el) {
        // if not found, show the header search (safe fallback)
        console.warn('Hero search anchor not found, showing header search');
        this.showHeaderSearch.set(true);
        return;
      }

      console.log('Hero search observer attached');
      this.intersectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          // when the hero search is visible, hide navbar search; when it leaves view, show it
          const shouldShowHeader = !entry.isIntersecting;
          console.log('Hero intersection:', { isIntersecting: entry.isIntersecting, shouldShowHeader });
          this.showHeaderSearch.set(shouldShowHeader);
        });
      }, { root: null, threshold: 0 });

      this.intersectionObserver.observe(el);
    }, 100);
  }

  private detachHeroObserver() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }

  // Check if the user has any businesses
  private async checkUserBusinesses() {
    try {
      const businesses = await this.businessService.getMyBusinessesAsync();
      this.hasBusinesses.set(businesses.length > 0);
    } catch (error) {
      console.error('Error checking user businesses:', error);
      this.hasBusinesses.set(false);
    }
  }

  // Load unread message count
  private async loadUnreadMessageCount() {
    try {
      const count = await this.chatService.getUnreadMessageCountAsync();
      this.unreadMessageCount.set(count);
    } catch (error) {
      console.error('Error loading unread message count:', error);
      this.unreadMessageCount.set(0);
    }
  }

  // Public method to refresh business check (can be called after creating a business)
  async refreshBusinessCheck() {
    await this.checkUserBusinesses();
  }

  // Get user initials for display
  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    
    // Handle first_name and last_name
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase() + (user.email.charAt(0).toUpperCase() || '');
    }
    
    if (lastName) {
      const emailInitial = user.email.charAt(0).toUpperCase();
      return emailInitial + lastName.charAt(0).toUpperCase();
    }
    
    // Fallback to just email initial
    return user.email.charAt(0).toUpperCase();
  }

  getUserFullName(): string {
    const user = this.user();
    if (!user) return '';
    
    // Use first_name and last_name if available
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    return user.email;
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToProfile() {
    this.router.navigate(['/dashboard/profile']);
  }

  navigateToSettings() {
    this.router.navigate(['/dashboard/settings']);
  }

  navigateToMessages() {
    this.router.navigate(['/dashboard/messages']);
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  navigateToCreateBusiness() {
    this.router.navigate(['/dashboard/businesses/create-business']);
  }

  navigateToOwnBusiness() {
    // Navigate to the new own-business page
    this.router.navigate(['/own-business']);
  }

  navigateToBecomeBusiness() {
    // If not logged in, go to auth page with business mode
    this.router.navigate(['/auth'], { queryParams: { mode: 'business' } });
  }

  async switchToBusinessMode() {
    // Call API to switch user mode to business_owner
    try {
      const result = await this.authService.switchMode('business_owner');
      if (result.data) {
        console.log('Switched to business owner mode successfully');
        console.log('Updated user mode:', this.userMode());
        // Refresh business check
        await this.checkUserBusinesses();
        // Navigate to dashboard instead of create business page
        this.navigateToDashboard();
      } else {
        console.error('Failed to switch to business mode:', result.error);
      }
    } catch (error) {
      console.error('Error switching to business mode:', error);
    }
  }

  async switchToClientMode() {
    // Call API to switch user mode to client
    try {
      const result = await this.authService.switchMode('client');
      if (result.data) {
        console.log('Switched to client mode successfully');
        console.log('Updated user mode:', this.userMode());
        // Navigate to search page
        this.router.navigate(['/search']);
      } else {
        console.error('Failed to switch to client mode:', result.error);
      }
    } catch (error) {
      console.error('Error switching to client mode:', error);
    }
  }

  ngOnDestroy() {
    // cleanup
    if (this.routerSub) {
      this.routerSub.unsubscribe?.();
    }
    this.detachHeroObserver();
  }

  toggleMobileMenu() {
    this.drawer.toggle();
  }

  onHeaderSearch(query: string) {
    console.log('Header search triggered with query:', query);
    // Navigate to search page with query
    this.router.navigate(['/search'], { 
      queryParams: { q: query.trim() } 
    });
  }

  async signOut() {
    await this.authService.signOut();
  }
}