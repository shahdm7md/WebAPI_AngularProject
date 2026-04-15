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
//   private route = inject(ActivatedRoute); // عشان نقرأ الرابط
//   private router = inject(Router); // عشان نرجع لصفحة المنتجات بعد الحفظ

//   product: any = {}; 
//   categories: any[] = []; 
//   readonly imageBaseUrl = 'http://localhost:5199/'; 

//   ngOnInit() {
//     // 1. جلب الأقسام (بدون .data زي ما اتفقنا)
//     this.productService.getCategories().subscribe((res: any) => {
//       this.categories = res;
//     });

//     // 2. قراءة الـ ID من الرابط، وبعدين نطلب بياناته من الباك إند
//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         // تأكدي إن عندك دالة getProductById في الـ ProductService
//         this.productService.getProductById(Number(id)).subscribe({
//           next: (res: any) => {
//             console.log('Product loaded:', res);
//             // لو الباك إند بيبعت المنتج جوه data، خليها res.data .. لو بيبعته مباشر خليها res
//             this.product = res.data ? res.data : res; 
//           },
//           error: (err: any) => console.error('Error loading product', err)
//         });
//       }
//     });
//   }

//  saveChanges() {
//     // هنتأكد إن الـ ID موجود
//     if (this.product.id) {
//       this.productService.updateProduct(this.product.id, this.product).subscribe({
//         next: (res: any) => {
//           alert('Done! 🚀');
//           // بعد ما يحفظ، يرجعنا أوتوماتيك لصفحة عرض المنتجات
//           this.router.navigate(['/products']); 
//         },
//         error: (err: any) => {
//           console.error('Error updating product:', err);
//           alert('حصلت مشكلة أثناء التعديل، راجعي الكونسول.');
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
//   private cdr = inject(ChangeDetectorRef); // ضفنا ده عشان نجبر الشاشة تتحدث فوراً

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
//             // لو الباك إند بيبعت الداتا المباشرة
//             this.product = res; 
//             // نجبر الأنجلر يعرض الداتا فوراً
//             this.cdr.detectChanges(); 
//           },
//           error: (err: any) => console.error('Error loading product', err)
//         });
//       }
//     });
//   }

//   saveChanges() {
//     if (this.product.id) {
//       // الباك إند كان متوقع بيانات معينة للتعديل (CreateProductRequest)، هنبعتله الداتا نظيفة
//       const dataToUpdate = {
//         name: this.product.name,
//         description: this.product.description,
//         price: this.product.price,
//         stockQuantity: this.product.stockQuantity,
//         categoryId: Number(this.product.categoryId) // تأكيد إنها رقم
//       };

//       this.productService.updateProduct(this.product.id, dataToUpdate).subscribe({
//         next: (res: any) => {
//           alert('تم التعديل بنجاح!');
//           this.router.navigate(['/products']); 
//         },
//         error: (err: any) => {
//           console.error('Error updating product:', err);
//           alert('حصلت مشكلة أثناء التعديل (راجع الكونسول)');
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
  private cdr = inject(ChangeDetectorRef); // 👈 ضفنا ده عشان الداتا تظهر فوراً

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
            
            this.cdr.detectChanges(); // 👈 السطر ده هيخلي الداتا تظهر في الخانات أول ما تفتح الصفحة
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
          alert('Product updated successfully! 🚀');
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