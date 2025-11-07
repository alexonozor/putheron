import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthorizationService } from './shared/services/authorization.service';
import { AuthGateService } from './shared/services/auth-gate.service';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressRouter } from 'ngx-progressbar/router';
@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NgProgressbar, NgProgressRouter],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'putheron';
  isAuthenticated = false;
  
  private readonly authorizationService = inject(AuthorizationService);
  private readonly authGateService = inject(AuthGateService);

  constructor() {
    // Expose authorization service for debugging
    if (typeof window !== 'undefined') {
      (window as any).authService = this.authorizationService;
      console.log('🔧 Authorization service exposed as window.authService for debugging');
      console.log('💡 Use window.authService.debugAuthState() to inspect permissions');
    }
  }

  async ngOnInit(): Promise<void> {
    // Check auth gate (only shows in production)
    this.isAuthenticated = await this.authGateService.checkAuthGate();
  }
}
