import { Routes } from '@angular/router';

export const adminTransactionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-transactions-list/admin-transactions-list.component').then(
        (c) => c.AdminTransactionsListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./admin-transaction-details/admin-transaction-details.component').then(
        (c) => c.AdminTransactionDetailsComponent
      ),
  },
];
