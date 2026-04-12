import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { VerifyOtpComponent } from './features/auth/verify-otp/verify-otp.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'auth/login', component: LoginComponent },
	{ path: 'auth/register', component: RegisterComponent },
	{ path: 'auth/verify-otp', component: VerifyOtpComponent },
	{ path: '**', redirectTo: '' },
];
