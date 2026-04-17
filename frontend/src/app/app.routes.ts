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
import { RoleGuard } from './core/guards/role.guard';

import { ProductListComponent } from './product-list/product-list';
import { ProductAddComponent } from './product-add/product-add';
import { ProductEditComponent } from './product-edit/product-edit';

import { SellerOrdersComponent } from './features/seller-panel/order-management/order-management';
import { SellerProductsComponent } from './features/seller-panel/product-management/product-management';
// import { SettingsComponent } from './features/seller-panel/store-settings/store-settings';
import { SellerOverviewComponent } from './features/seller-panel/seller-overview/seller-overview';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'shop',
    loadComponent: () =>
      import('./features/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'shop/product/:id',
    loadComponent: () =>
      import('./features/product-details/product-details.component').then(m => m.ProductDetailsComponent)
  },

  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/verify-otp', component: VerifyOtpComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },

  // Products
  {
    path: 'products',
    component: ProductListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Seller'] },
  },
  {
    path: 'products/add',
    component: ProductAddComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Seller'] },
  },
  {
    path: 'products/edit/:id',
    component: ProductEditComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Seller'] },
  },


  // Seller Dashboard
  { path: 'seller/dashboard', component: SellerOverviewComponent },
  { path: 'seller/orders', component: SellerOrdersComponent },
  { path: 'seller/products', component: SellerProductsComponent },
  // { path: 'seller/settings', component: SettingsComponent },



  // Admin Dashboard
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Admin'] },
  },
	{
    path: 'admin/users',
    component: ManageUsersComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Admin'] },
  },
	{
    path: 'admin/products',
    component: ManageProductsComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Admin'] },
  },
	{
    path: 'admin/orders',
    component: ManageOrdersComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Admin'] },
  },
	{
    path: 'admin/coupons',
    component: ManageCouponsComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Admin'] },
  },
	{
    path: 'admin/banners',
    component: ManageBannersComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Admin'] },
  },

  // Uppercase aliases
  { path: 'Admin/dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'Admin/users', redirectTo: 'admin/users', pathMatch: 'full' },
  { path: 'Admin/products', redirectTo: 'admin/products', pathMatch: 'full' },
  { path: 'Admin/orders', redirectTo: 'admin/orders', pathMatch: 'full' },
  { path: 'Admin/coupons', redirectTo: 'admin/coupons', pathMatch: 'full' },
  { path: 'Admin/banners', redirectTo: 'admin/banners', pathMatch: 'full' },
  
  // Cart & Checkout
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/Cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent)
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Customer'] }
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./features/order-success/order-success.component').then(m => m.OrderSuccessComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Customer'] }
  },
  {
    path: 'cancel',
    loadComponent: () =>
      import('./features/cancel/cancel.component').then(m => m.CancelComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Customer'] }
  },

  { path: '**', redirectTo: '' },
];