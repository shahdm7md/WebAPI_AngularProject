// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ProductService } from '../services/product.service';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-product-list',
//   standalone: true,
//  imports: [CommonModule, RouterModule],

//   templateUrl: './product-list.html',
//   styleUrls: ['./product-list.css']
// })
// export class ProductListComponent implements OnInit {
//   private productService = inject(ProductService);

//   products: any[] = [];
//   readonly imageBaseUrl = 'http://localhost:5199/';

//   ngOnInit() {
//     this.productService.getProducts().subscribe({

//       next: (res: any) => {
//         console.log('API Response:', res);
//         this.products = res.data;
//       },

//       error: (err: any) =>{ console.error('API Error:', err);}

//     });
//   }
// }




// import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ProductService } from '../services/product.service';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-product-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './product-list.html',
//   styleUrls: ['./product-list.css']
// })
// export class ProductListComponent implements OnInit {
//   private productService = inject(ProductService);
//   // Ø¶ÙÙ†Ø§ Ø§Ù„Ø³Ø·Ø± Ø¯Ù‡ Ø¹Ø´Ø§Ù† Ù†Ø¬Ø¨Ø± Ø§Ù„Ø£Ù†Ø¬Ù„Ø± ÙŠØ­Ø¯Ø« Ø§Ù„Ø´Ø§Ø´Ø© Ø£ÙˆÙ„ Ù…Ø§ Ø§Ù„Ø¯Ø§ØªØ§ ØªÙŠØ¬ÙŠ
//   private cdr = inject(ChangeDetectorRef);

//   products: any[] = [];
//   readonly imageBaseUrl = 'http://localhost:5199/';

//   ngOnInit() {
//     this.productService.getProducts().subscribe({
//       next: (res: any) => {
//         console.log('API Response:', res);

//         // Ù‡Ù†Ø§ Ø¨Ù†Ø§Ø®Ø¯ Ø§Ù„Ø¯Ø§ØªØ§ ÙˆÙ†Ø­Ø·Ù‡Ø§ ÙÙŠ Ù†Ø³Ø®Ø© Ø¬Ø¯ÙŠØ¯Ø© Ø¹Ø´Ø§Ù† Ø§Ù„Ø£Ù†Ø¬Ù„Ø± ÙŠØ­Ø³ Ø¨ÙŠÙ‡Ø§ ÙÙˆØ±Ø§Ù‹
//         this.products = res.data ? [...res.data] : [];

//         // Ø¨Ù†Ù‚ÙˆÙ„ Ù„Ù„Ø£Ù†Ø¬Ù„Ø±: "Ø§Ù„Ø¯Ø§ØªØ§ ÙˆØµÙ„ØªØŒ Ø­Ø¯Ø« Ø§Ù„Ø´Ø§Ø´Ø© ÙÙˆØ±Ø§Ù‹!"
//         this.cdr.detectChanges();
//       },
//       error: (err: any) => {
//         console.error('API Error:', err);
//       },


//     });
//   }
// }




import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  products: any[] = [];
  // Ø´ÙŠÙ„Ù†Ø§ Ø§Ù„Ø³Ù„Ø§Ø´ (/) Ø§Ù„Ù„ÙŠ ÙÙŠ Ø§Ù„Ø¢Ø®Ø± Ø¹Ø´Ø§Ù† Ø§Ù„Ø¨Ø§Ùƒ Ø¥Ù†Ø¯ Ø¨ÙŠØ¨Ø¹ØªÙ‡Ø§ ÙÙŠ Ø£ÙˆÙ„ Ø§Ù„Ù…Ø³Ø§Ø±
  readonly imageBaseUrl = 'http://localhost:5199/';

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (res: any) => {
        console.log('API Response:', res);
        this.products = res.data ? [...res.data] : [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('API Error:', err);
      }
    });
  }

  // ðŸ‘‡ Ø¯ÙŠ Ø§Ù„Ø¯Ø§Ù„Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ø§Ù„Ø®Ø§ØµØ© Ø¨Ø§Ù„Ù…Ø³Ø­
  deleteProduct(id: number) {
    // Ø¨Ù†Ø·Ù„Ø¹ Ø±Ø³Ø§Ù„Ø© ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø£ÙˆÙ„ Ø¹Ø´Ø§Ù† Ù„Ùˆ Ø¯Ø§Ø³ Ø¨Ø§Ù„ØºÙ„Ø·
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          // Ù„Ùˆ Ø§ØªÙ…Ø³Ø­ Ù…Ù† Ø§Ù„Ø¨Ø§Ùƒ Ø¥Ù†Ø¯ØŒ Ø¨Ù†Ø´ÙŠÙ„Ù‡ Ù…Ù† Ø§Ù„Ù…ØµÙÙˆÙØ© Ø¨ØªØ§Ø¹ØªÙ†Ø§ Ø¹Ø´Ø§Ù† ÙŠØ®ØªÙÙŠ Ù…Ù† Ø§Ù„Ø´Ø§Ø´Ø©
          this.products = this.products.filter(p => p.id !== id);
          this.cdr.detectChanges(); // Ø¨Ù†Ø­Ø¯Ø« Ø§Ù„Ø´Ø§Ø´Ø©
          alert('Product deleted successfully! ðŸ—‘ï¸');
        },
        error: (err: any) => {
          console.error('Error deleting product:', err);
          alert('Failed to delete the product.');
        }
      });
    }
  }
}

