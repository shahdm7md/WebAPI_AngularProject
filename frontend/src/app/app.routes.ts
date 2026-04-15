import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { VerifyOtpComponent } from './features/auth/verify-otp/verify-otp.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { HomeComponent } from './features/home/home.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { ManageUsersComponent } from './features/admin/manage-users/manage-users.component';
import { ManageProductsComponent } from './features/admin/manage-products/manage-products.component';
import { ManageOrdersComponent } from './features/admin/manage-orders/manage-orders.component';
import { ManageCouponsComponent } from './features/admin/manage-coupons/manage-coupons.component';
import { ManageBannersComponent } from './features/admin/manage-banners/manage-banners.component';
import { AuthGuard } from './core/guards/auth.guard';

import { ProductListComponent } from './product-list/product-list';
import { ProductAddComponent } from './product-add/product-add';
import { ProductEditComponent } from './product-edit/product-edit';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/verify-otp', component: VerifyOtpComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },

  // Products
  { path: 'products', component: ProductListComponent },
  { path: 'products/add', component: ProductAddComponent },
  { path: 'products/edit/:id', component: ProductEditComponent },

  // Cart & Checkout
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/Cart/cart.component').then(m => m.CartComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [AuthGuard]
  },

  { path: '**', redirectTo: '' },
];