import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthorizationService } from './shared/services/authorization.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'putheron';
  
  private readonly authorizationService = inject(AuthorizationService);

  constructor() {
    // Expose authorization service for debugging
    if (typeof window !== 'undefined') {
      (window as any).authService = this.authorizationService;
      console.log('🔧 Authorization service exposed as window.authService for debugging');
      console.log('💡 Use window.authService.debugAuthState() to inspect permissions');
    }
  }
}
