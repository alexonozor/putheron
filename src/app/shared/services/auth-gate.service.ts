import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthGateModalComponent } from '../components/auth-gate-modal/auth-gate-modal.component';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGateService {
  private dialog = inject(MatDialog);
  private dialogRef: MatDialogRef<AuthGateModalComponent> | null = null;

  checkAuthGate(): Promise<boolean> {
    // Only show in production environment
    if (!environment.production) {
      return Promise.resolve(true);
    }

    // Check if user has already authenticated in this session
    const hasAccess = sessionStorage.getItem('authGateAccess') === 'true';
    if (hasAccess) {
      return Promise.resolve(true);
    }

    // Show the auth gate modal
    return this.showAuthGateModal();
  }

  private showAuthGateModal(): Promise<boolean> {
    if (this.dialogRef) {
      return Promise.resolve(false);
    }

    this.dialogRef = this.dialog.open(AuthGateModalComponent, {
      disableClose: true,
      panelClass: 'auth-gate-dialog',
      width: '450px',
      maxWidth: '90vw',
      hasBackdrop: true,
      backdropClass: 'auth-gate-backdrop'
    });

    return new Promise((resolve) => {
      this.dialogRef!.afterClosed().subscribe((result) => {
        this.dialogRef = null;
        resolve(result === true);
      });
    });
  }

  clearAuthGate(): void {
    sessionStorage.removeItem('authGateAccess');
  }
}
