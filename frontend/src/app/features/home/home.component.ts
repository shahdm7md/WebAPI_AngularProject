import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly featuredProducts = [
    {
      label: 'Limited Edition',
      name: 'Noir Monolith Lounge',
      price: '$3,250',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD9wnQiHG5sOf38jFCHwO6QCTtNSOI-dmTMFXnn_PD1-t6PdeN_Jrh4Xrc2XzSrtWsAe4JZzedNQVuGuSSoGhFex8i_IRkpCxE13Dbpfa-cbIQ856iV8ujtJ7FIur7dbIj_GoqbP4fAr40CPzBu8uF6COFQhsNtotgbB1Zh1yRPgUIpDK5rog6VND7lH48T_-Y9Ex0nALK9BXadOMdwqVJeL1X3fsjP1EFR8GzhZo4xXbITNu69M8fn_GAFEL1Kp8eYZKumo1fYS_Y'
    },
    {
      label: 'Lighting',
      name: 'Ethereal Glass Sphere',
      price: '$890',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDOpnQ9kwjUDTKPvVIekgatmMxxHZ6ofDyMX91BhA5DuXWbrsFNDsClLc8tA9QTF65EvTVAsUbK4-5yCIBSZU6IIB-JBCfyzh1LYd1Uiu34ixGYLLDSzQi93KpOEYahUadA765JO_awHxloDKF6ed7BjNir5jquPIiw88sPRjX-ND-pZhWbkkXkn0CWQ9ltBrlGUAlcNT_Dep6Pkpli3iT8ZL0cuuR1meTzUzHqodRPA5CEUGZySLZJ1qtyrvzSnVTq0DJ-qnlWChA'
    },
    {
      label: 'Art',
      name: 'Tactile Canvas #07',
      price: '$1,420',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAKeNdDNqViqnbdSDc05UijUbRFg15r7L9GrTEU0xVj3NAlhyKqEu0tAPcZMF9L8m8snntnqR4DUTZxsg4WY3_9q6nVlRk1AQEqApZLrra9OhitJ3yXgEOYm0Iru0Gja0oGj8Zm5-RltwP7pgxobPhgCo3cIHmhSAtSQgCu9w5A_PNPD9UYg2Lr4kvEpOUgl3Il8MxrwswHxQaplXr5MG8B7P9pb57ZVL121nVZdZIfcI5W5zVHeEfLPP5muMipRB7vXEcowDCJGo0'
    },
  ];

  protected isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  protected currentUserName(): string {
    const fullName = this.authService.getCurrentUserName();
    if (fullName.trim().length > 0) {
      return fullName;
    }

    return this.authService.getCurrentUserEmail() || 'My account';
  }

  protected logout(): void {
    this.authService.clearSession();
    this.router.navigateByUrl('/auth/login');
  }
}
