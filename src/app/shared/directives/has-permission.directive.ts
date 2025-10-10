import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  inject, 
  OnInit, 
  OnDestroy 
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthorizationService } from '../services/authorization.service';

export interface PermissionConfig {
  module: string;
  action: string;
  requireAll?: boolean; // If multiple permissions, require all vs any
}

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private readonly authorizationService = inject(AuthorizationService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly destroy$ = new Subject<void>();
  
  private _permission: string | string[] | PermissionConfig | null = null;
  private _requireAll = false;
  private _allowSuperAdmin = true;
  private _allowAdmin = false;

  @Input() 
  set hasPermission(value: string | string[] | PermissionConfig | null) {
    this._permission = value;
    this.updateView();
  }

  @Input() 
  set hasPermissionRequireAll(requireAll: boolean) {
    this._requireAll = requireAll;
    this.updateView();
  }

  @Input() 
  set hasPermissionAllowSuperAdmin(allow: boolean) {
    this._allowSuperAdmin = allow;
    this.updateView();
  }

  @Input() 
  set hasPermissionAllowAdmin(allow: boolean) {
    this._allowAdmin = allow;
    this.updateView();
  }

  ngOnInit() {
    // Listen for permission changes
    this.authorizationService.userPermissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView() {
    if (this.hasRequiredPermissions()) {
      this.showElement();
    } else {
      this.hideElement();
    }
  }

  private hasRequiredPermissions(): boolean {
    // Always allow super admin unless explicitly disabled
    if (this._allowSuperAdmin && this.authorizationService.hasRole(AuthorizationService.ROLES.SUPER_ADMIN)) {
      return true;
    }

    // Allow admin if specified
    if (this._allowAdmin && this.authorizationService.hasRole(AuthorizationService.ROLES.ADMIN)) {
      return true;
    }

    // If no permission specified, default to false
    if (!this._permission) {
      return false;
    }

    // Handle different permission input types
    if (typeof this._permission === 'string') {
      return this.authorizationService.hasPermission(this._permission);
    }

    if (Array.isArray(this._permission)) {
      if (this._requireAll) {
        return this._permission.every(perm => this.authorizationService.hasPermission(perm));
      } else {
        return this._permission.some(perm => this.authorizationService.hasPermission(perm));
      }
    }

    if (typeof this._permission === 'object' && this._permission.module && this._permission.action) {
      const permissionString = `${this._permission.module}.${this._permission.action}`;
      return this.authorizationService.hasPermission(permissionString);
    }

    return false;
  }

  private showElement() {
    if (this.viewContainer.length === 0) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  private hideElement() {
    this.viewContainer.clear();
  }
}