# Auth Gate Modal - Production Access Control

## Overview
This feature implements a password-protected modal that appears only in production environment to prevent unauthorized access to the application.

## Implementation Details

### Components Created
1. **AuthGateModalComponent** (`src/app/shared/components/auth-gate-modal/`)
   - Standalone Angular Material modal dialog
   - Username and password input fields
   - Password visibility toggle
   - Error message display
   - Non-dismissible until correct credentials are entered

2. **AuthGateService** (`src/app/shared/services/auth-gate.service.ts`)
   - Manages the auth gate lifecycle
   - Checks environment (only shows in production)
   - Uses sessionStorage to remember authentication state
   - Prevents modal from being dismissed

### Credentials
- **Username**: `admin`
- **Password**: `adminalexolalinsey`

### Behavior
- **Development**: Modal does NOT appear (for easier development)
- **Production**: Modal appears on first visit
- **Session Storage**: Once authenticated, the modal won't appear again until the browser tab is closed
- **Non-dismissible**: Users cannot click outside or press ESC to close the modal
- **Validation**: Must enter correct credentials to proceed

### Files Modified/Created
```
src/app/
├── app.component.ts                          (Modified - Added auth gate check)
├── app.component.html                        (Modified - Conditional rendering)
├── app.component.scss                        (Modified - Loading state styles)
├── shared/
│   ├── components/
│   │   └── auth-gate-modal/
│   │       ├── auth-gate-modal.component.ts  (New)
│   │       ├── auth-gate-modal.component.html (New)
│   │       └── auth-gate-modal.component.scss (New)
│   └── services/
│       └── auth-gate.service.ts              (New)
└── styles.scss                                (Modified - Global dialog styles)
```

### Testing

#### Local Development
```bash
npm start
```
The modal will NOT appear in development mode.

#### Production Build Test
```bash
npm run build
# Serve the production build locally to test
npx http-server dist/putheron/browser
```
The modal WILL appear when accessing the production build.

### To Disable the Auth Gate
If you need to disable the auth gate:

1. Open `src/app/shared/services/auth-gate.service.ts`
2. Change the condition:
```typescript
// From:
if (!environment.production) {
  return Promise.resolve(true);
}

// To:
if (true) {  // Always bypass
  return Promise.resolve(true);
}
```

Or simply set `production: false` in `environment.prod.ts` temporarily.

### Security Note
⚠️ **Important**: This is a basic client-side protection mechanism. It does NOT replace proper server-side authentication and authorization. The credentials are hardcoded in the client code and can be discovered by anyone who inspects the source code. This is suitable only for:
- Staging environments
- Demo sites
- Beta testing
- Temporary access control

For production applications with real users and sensitive data, implement proper backend authentication.
