import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { VerifyOtpComponent } from './features/auth/verify-otp/verify-otp.component';
import { HomeComponent } from './features/home/home.component';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { ManageUsersComponent } from './features/admin/manage-users/manage-users.component';
import { ManageProductsComponent } from './features/admin/manage-products/manage-products.component';
import { ManageOrdersComponent } from './features/admin/manage-orders/manage-orders.component';
import { ManageCouponsComponent } from './features/admin/manage-coupons/manage-coupons.component';
import { ManageBannersComponent } from './features/admin/manage-banners/manage-banners.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'auth/login', component: LoginComponent },
	{ path: 'auth/forgot-password', component: ForgotPasswordComponent },
	{ path: 'auth/register', component: RegisterComponent },
	{ path: 'auth/verify-otp', component: VerifyOtpComponent },
	{ path: 'admin/dashboard', component: AdminDashboardComponent },
	{ path: 'admin/users', component: ManageUsersComponent },
	{ path: 'admin/products', component: ManageProductsComponent },
	{ path: 'admin/orders', component: ManageOrdersComponent },
	{ path: 'admin/coupons', component: ManageCouponsComponent },
	{ path: 'admin/banners', component: ManageBannersComponent },
	{ path: '**', redirectTo: '' },
];
