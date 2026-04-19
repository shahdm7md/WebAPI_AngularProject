// // import { Component, OnInit, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { ActivatedRoute, RouterModule } from '@angular/router';

// // import { ProductService } from '../services/product.service';

// // @Component({
// //   selector: 'app-product-edit',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule,RouterModule],

// //   templateUrl: './product-edit.html',
// //   styleUrls: ['./product-edit.css']
// // })
// // export class ProductEditComponent implements OnInit {
// //   private productService = inject(ProductService);
// //   private route = inject(ActivatedRoute);

// //   product: any = {};
// //   categories: any[] = [];
// //   readonly imageBaseUrl = 'http://localhost:5199/';

// //   ngOnInit() {

// //     this.productService.getCategories().subscribe((res: any) => {
// //       this.categories = res.data;
// //     });


// //     this.productService.getProducts().subscribe((res: any) => {
// //       if(res.data && res.data.length > 0) {
// //         this.product = res.data[0];
// //       }
// //     });
// //   }

// //   saveChanges() {
// //     console.log('Data to send to API:', this.product);

// //   }
// // }
// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { ProductService } from '../services/product.service';

// @Component({
//   selector: 'app-product-edit',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './product-edit.html',
//   styleUrls: ['./product-edit.css']
// })
// export class ProductEditComponent implements OnInit {
//   private productService = inject(ProductService);
//   private route = inject(ActivatedRoute); // Ø¹Ø´Ø§Ù† Ù†Ù‚Ø±Ø£ Ø§Ù„Ø±Ø§Ø¨Ø·
//   private router = inject(Router); // Ø¹Ø´Ø§Ù† Ù†Ø±Ø¬Ø¹ Ù„ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø¨Ø¹Ø¯ Ø§Ù„Ø­ÙØ¸

//   product: any = {};
//   categories: any[] = [];
//   readonly imageBaseUrl = 'http://localhost:5199/';

//   ngOnInit() {
//     // 1. Ø¬Ù„Ø¨ Ø§Ù„Ø£Ù‚Ø³Ø§Ù… (Ø¨Ø¯ÙˆÙ† .data Ø²ÙŠ Ù…Ø§ Ø§ØªÙÙ‚Ù†Ø§)
//     this.productService.getCategories().subscribe((res: any) => {
//       this.categories = res;
//     });

//     // 2. Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù€ ID Ù…Ù† Ø§Ù„Ø±Ø§Ø¨Ø·ØŒ ÙˆØ¨Ø¹Ø¯ÙŠÙ† Ù†Ø·Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§ØªÙ‡ Ù…Ù† Ø§Ù„Ø¨Ø§Ùƒ Ø¥Ù†Ø¯
//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         // ØªØ£ÙƒØ¯ÙŠ Ø¥Ù† Ø¹Ù†Ø¯Ùƒ Ø¯Ø§Ù„Ø© getProductById ÙÙŠ Ø§Ù„Ù€ ProductService
//         this.productService.getProductById(Number(id)).subscribe({
//           next: (res: any) => {
//             console.log('Product loaded:', res);
//             // Ù„Ùˆ Ø§Ù„Ø¨Ø§Ùƒ Ø¥Ù†Ø¯ Ø¨ÙŠØ¨Ø¹Øª Ø§Ù„Ù…Ù†ØªØ¬ Ø¬ÙˆÙ‡ dataØŒ Ø®Ù„ÙŠÙ‡Ø§ res.data .. Ù„Ùˆ Ø¨ÙŠØ¨Ø¹ØªÙ‡ Ù…Ø¨Ø§Ø´Ø± Ø®Ù„ÙŠÙ‡Ø§ res
//             this.product = res.data ? res.data : res;
//           },
//           error: (err: any) => console.error('Error loading product', err)
//         });
//       }
//     });
//   }

//  saveChanges() {
//     // Ù‡Ù†ØªØ£ÙƒØ¯ Ø¥Ù† Ø§Ù„Ù€ ID Ù…ÙˆØ¬ÙˆØ¯
//     if (this.product.id) {
//       this.productService.updateProduct(this.product.id, this.product).subscribe({
//         next: (res: any) => {
//           alert('Done! ðŸš€');
//           // Ø¨Ø¹Ø¯ Ù…Ø§ ÙŠØ­ÙØ¸ØŒ ÙŠØ±Ø¬Ø¹Ù†Ø§ Ø£ÙˆØªÙˆÙ…Ø§ØªÙŠÙƒ Ù„ØµÙØ­Ø© Ø¹Ø±Ø¶ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª
//           this.router.navigate(['/products']);
//         },
//         error: (err: any) => {
//           console.error('Error updating product:', err);
//           alert('Ø­ØµÙ„Øª Ù…Ø´ÙƒÙ„Ø© Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ØŒ Ø±Ø§Ø¬Ø¹ÙŠ Ø§Ù„ÙƒÙˆÙ†Ø³ÙˆÙ„.');
//         }
//       });
//     }
//   }
// }







// import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { ProductService } from '../services/product.service';

// @Component({
//   selector: 'app-product-edit',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './product-edit.html',
//   styleUrls: ['./product-edit.css']
// })
// export class ProductEditComponent implements OnInit {
//   private productService = inject(ProductService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private cdr = inject(ChangeDetectorRef); // Ø¶ÙÙ†Ø§ Ø¯Ù‡ Ø¹Ø´Ø§Ù† Ù†Ø¬Ø¨Ø± Ø§Ù„Ø´Ø§Ø´Ø© ØªØªØ­Ø¯Ø« ÙÙˆØ±Ø§Ù‹

//   product: any = {};
//   categories: any[] = [];
//   readonly imageBaseUrl = 'http://localhost:5199/';

//   ngOnInit() {
//     this.productService.getCategories().subscribe((res: any) => {
//       this.categories = res;
//     });

//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         this.productService.getProductById(Number(id)).subscribe({
//           next: (res: any) => {
//             // Ù„Ùˆ Ø§Ù„Ø¨Ø§Ùƒ Ø¥Ù†Ø¯ Ø¨ÙŠØ¨Ø¹Øª Ø§Ù„Ø¯Ø§ØªØ§ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©
//             this.product = res;
//             // Ù†Ø¬Ø¨Ø± Ø§Ù„Ø£Ù†Ø¬Ù„Ø± ÙŠØ¹Ø±Ø¶ Ø§Ù„Ø¯Ø§ØªØ§ ÙÙˆØ±Ø§Ù‹
//             this.cdr.detectChanges();
//           },
//           error: (err: any) => console.error('Error loading product', err)
//         });
//       }
//     });
//   }

//   saveChanges() {
//     if (this.product.id) {
//       // Ø§Ù„Ø¨Ø§Ùƒ Ø¥Ù†Ø¯ ÙƒØ§Ù† Ù…ØªÙˆÙ‚Ø¹ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø¹ÙŠÙ†Ø© Ù„Ù„ØªØ¹Ø¯ÙŠÙ„ (CreateProductRequest)ØŒ Ù‡Ù†Ø¨Ø¹ØªÙ„Ù‡ Ø§Ù„Ø¯Ø§ØªØ§ Ù†Ø¸ÙŠÙØ©
//       const dataToUpdate = {
//         name: this.product.name,
//         description: this.product.description,
//         price: this.product.price,
//         stockQuantity: this.product.stockQuantity,
//         categoryId: Number(this.product.categoryId) // ØªØ£ÙƒÙŠØ¯ Ø¥Ù†Ù‡Ø§ Ø±Ù‚Ù…
//       };

//       this.productService.updateProduct(this.product.id, dataToUpdate).subscribe({
//         next: (res: any) => {
//           alert('ØªÙ… Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­!');
//           this.router.navigate(['/products']);
//         },
//         error: (err: any) => {
//           console.error('Error updating product:', err);
//           alert('Ø­ØµÙ„Øª Ù…Ø´ÙƒÙ„Ø© Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ (Ø±Ø§Ø¬Ø¹ Ø§Ù„ÙƒÙˆÙ†Ø³ÙˆÙ„)');
//         }
//       });
//     }
//   }
// }





import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-edit.html',
  styleUrls: ['./product-edit.css']
})
export class ProductEditComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // ðŸ‘ˆ Ø¶ÙÙ†Ø§ Ø¯Ù‡ Ø¹Ø´Ø§Ù† Ø§Ù„Ø¯Ø§ØªØ§ ØªØ¸Ù‡Ø± ÙÙˆØ±Ø§Ù‹

  product: any = {};
  categories: any[] = [];
  readonly imageBaseUrl = 'http://localhost:5199/';

  ngOnInit() {
    this.productService.getCategories().subscribe((res: any) => {
      this.categories = res;
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productService.getProductById(Number(id)).subscribe({
          next: (res: any) => {
            this.product = res.data ? res.data : res;

            this.cdr.detectChanges(); // ðŸ‘ˆ Ø§Ù„Ø³Ø·Ø± Ø¯Ù‡ Ù‡ÙŠØ®Ù„ÙŠ Ø§Ù„Ø¯Ø§ØªØ§ ØªØ¸Ù‡Ø± ÙÙŠ Ø§Ù„Ø®Ø§Ù†Ø§Øª Ø£ÙˆÙ„ Ù…Ø§ ØªÙØªØ­ Ø§Ù„ØµÙØ­Ø©
          },
          error: (err: any) => console.error('Error loading product', err)
        });
      }
    });
  }

saveChanges() {
    if (this.product.id) {
      // 1. Ensure all data is present and correctly formatted
      const cleanDataToUpdate = {
        name: this.product.name || '',
        description: this.product.description || '',
        price: Number(this.product.price) || 0,
        stockQuantity: Number(this.product.stockQuantity) || 0,
        // Fallback to 1 to prevent 400 Bad Request if category is somehow empty
        categoryId: Number(this.product.categoryId) || 1
      };

      // 2. Log the payload to verify it before sending
      console.log('Sending this payload to Backend:', cleanDataToUpdate);

      this.productService.updateProduct(this.product.id, cleanDataToUpdate).subscribe({
        next: (res: any) => {
          alert('Product updated successfully! ðŸš€');
          // Navigate back to the products list
          this.router.navigate(['/products']);
        },
        error: (err: any) => {
          console.error('Error Details:', err);

          // 3. Handle validation errors from the backend gracefully
          if (err.error && err.error.errors) {
            console.table(err.error.errors);
            alert('Validation Error: Please check the console for details on what the API rejected.');
          } else {
            alert('An unexpected error occurred while saving changes.');
          }
        }
      });
    }
  }
}

