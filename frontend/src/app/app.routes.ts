import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { VerifyOtpComponent } from './features/auth/verify-otp/verify-otp.component';
import { HomeComponent } from './features/home/home.component';


import { ProductListComponent } from './product-list/product-list';
import { ProductAddComponent } from './product-add/product-add';
import { ProductEditComponent } from './product-edit/product-edit';

export const routes: Routes = [
  
	{ path: '', component: HomeComponent },
	{ path: 'auth/login', component: LoginComponent },
	{ path: 'auth/register', component: RegisterComponent },
	{ path: 'auth/verify-otp', component: VerifyOtpComponent },

  
    { path: 'products', component: ProductListComponent },
    { path: 'products/add', component: ProductAddComponent },
    { path: 'products/edit/:id', component: ProductEditComponent },


	{ path: '**', redirectTo: '' },
];
