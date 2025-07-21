import { Injectable, OnDestroy } from '@angular/core';
import { Subject, interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardRefreshService implements OnDestroy {
  private refreshSubject = new Subject<void>();
  private intervalSubscription?: Subscription;

  // Observable that components can subscribe to
  refresh$ = this.refreshSubject.asObservable();

  constructor() {
    // Set up periodic refresh every 60 seconds (less aggressive)
    this.startPeriodicRefresh();
  }

  // Method to trigger immediate refresh
  triggerRefresh() {
    this.refreshSubject.next();
  }

  // Start periodic refresh (every 60 seconds)
  private startPeriodicRefresh() {
    this.intervalSubscription = interval(60000).subscribe(() => {
      this.refreshSubject.next();
    });
  }

  // Stop periodic refresh
  stopPeriodicRefresh() {
    this.intervalSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.intervalSubscription?.unsubscribe();
    this.refreshSubject.complete();
  }
}
