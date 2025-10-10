import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  inject,
  OnInit,
  OnDestroy 
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthorizationService } from '../services/authorization.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private readonly authService = inject(AuthorizationService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  
  private subscription?: Subscription;
  private hasView = false;

  @Input() set hasPermission(permissions: string | string[]) {
    this._permissions = Array.isArray(permissions) ? permissions : [permissions];
    this.updateView();
  }

  @Input() hasPermissionRequireAll = false;
  @Input() hasPermissionElse?: TemplateRef<any>;

  private _permissions: string[] = [];

  ngOnInit() {
    // Subscribe to permission changes
    this.subscription = this.authService.userPermissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateView() {
    const hasPermissions = this.checkPermissions();

    if (hasPermissions && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermissions && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
      
      // Show alternative template if provided
      if (this.hasPermissionElse) {
        this.viewContainer.createEmbeddedView(this.hasPermissionElse);
      }
    }
  }

  private checkPermissions(): boolean {
    if (!this._permissions.length) {
      return true; // No permissions required
    }

    if (this.hasPermissionRequireAll) {
      return this.authService.hasAllPermissions(this._permissions);
    } else {
      return this.authService.hasAnyPermission(this._permissions);
    }
  }
}

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private readonly authService = inject(AuthorizationService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  
  private subscription?: Subscription;
  private hasView = false;

  @Input() set hasRole(roles: string | string[]) {
    this._roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  @Input() hasRoleRequireAll = false;
  @Input() hasRoleElse?: TemplateRef<any>;

  private _roles: string[] = [];

  ngOnInit() {
    this.subscription = this.authService.userPermissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateView() {
    const hasRoles = this.checkRoles();

    if (hasRoles && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRoles && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
      
      if (this.hasRoleElse) {
        this.viewContainer.createEmbeddedView(this.hasRoleElse);
      }
    }
  }

  private checkRoles(): boolean {
    if (!this._roles.length) {
      return true;
    }

    if (this.hasRoleRequireAll) {
      return this._roles.every(role => this.authService.hasRole(role));
    } else {
      return this.authService.hasAnyRole(this._roles);
    }
  }
}

@Directive({
  selector: '[canAccess]',
  standalone: true
})
export class CanAccessDirective implements OnInit, OnDestroy {
  private readonly authService = inject(AuthorizationService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  
  private subscription?: Subscription;
  private hasView = false;

  @Input() set canAccess(config: {
    permissions?: string | string[];
    roles?: string | string[];
    requireAll?: boolean;
  }) {
    this._config = config;
    this.updateView();
  }

  @Input() canAccessElse?: TemplateRef<any>;

  private _config: {
    permissions?: string | string[];
    roles?: string | string[];
    requireAll?: boolean;
  } = {};

  ngOnInit() {
    this.subscription = this.authService.userPermissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateView() {
    const canAccess = this.checkAccess();

    if (canAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!canAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
      
      if (this.canAccessElse) {
        this.viewContainer.createEmbeddedView(this.canAccessElse);
      }
    }
  }

  private checkAccess(): boolean {
    const { permissions, roles, requireAll = false } = this._config;

    let hasPermissions = true;
    let hasRoles = true;

    if (permissions) {
      const permArray = Array.isArray(permissions) ? permissions : [permissions];
      hasPermissions = requireAll 
        ? this.authService.hasAllPermissions(permArray)
        : this.authService.hasAnyPermission(permArray);
    }

    if (roles) {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      hasRoles = requireAll
        ? roleArray.every(role => this.authService.hasRole(role))
        : this.authService.hasAnyRole(roleArray);
    }

    // Both conditions must be true (AND logic)
    return hasPermissions && hasRoles;
  }
}

// Convenience directive for common admin checks
@Directive({
  selector: '[isAdmin]',
  standalone: true
})
export class IsAdminDirective implements OnInit, OnDestroy {
  private readonly authService = inject(AuthorizationService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  
  private subscription?: Subscription;
  private hasView = false;

  @Input() isAdminElse?: TemplateRef<any>;

  ngOnInit() {
    this.subscription = this.authService.userPermissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateView() {
    const isAdmin = this.authService.hasPermission(AuthorizationService.PERMISSIONS.ADMIN_ACCESS) ||
                   this.authService.hasRole(AuthorizationService.ROLES.ADMIN) ||
                   this.authService.hasRole(AuthorizationService.ROLES.SUPER_ADMIN);

    if (isAdmin && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAdmin && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
      
      if (this.isAdminElse) {
        this.viewContainer.createEmbeddedView(this.isAdminElse);
      }
    }
  }
}