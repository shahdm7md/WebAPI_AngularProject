import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly cartService = inject(CartService);

  isLoggedIn() { return this.authService.isLoggedIn(); }

  currentUserName() {
    const name = this.authService.getCurrentUserName();
    return name?.trim() || this.authService.getCurrentUserEmail() || 'My Account';
  }

  logout() {
    this.authService.clearSession();
    this.router.navigateByUrl('/auth/login');
  }
}