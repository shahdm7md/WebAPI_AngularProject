import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly cartService = inject(CartService);
  readonly wishlistService = inject(WishlistService);

  ngOnInit(): void {
    this.cartService.getCart().subscribe();
  }

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