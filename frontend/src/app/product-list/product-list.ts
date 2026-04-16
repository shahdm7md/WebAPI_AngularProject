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
//   // ضفنا السطر ده عشان نجبر الأنجلر يحدث الشاشة أول ما الداتا تيجي
//   private cdr = inject(ChangeDetectorRef); 
  
//   products: any[] = [];
//   readonly imageBaseUrl = 'http://localhost:5199/'; 

//   ngOnInit() {
//     this.productService.getProducts().subscribe({
//       next: (res: any) => {
//         console.log('API Response:', res);
        
//         // هنا بناخد الداتا ونحطها في نسخة جديدة عشان الأنجلر يحس بيها فوراً
//         this.products = res.data ? [...res.data] : []; 
        
//         // بنقول للأنجلر: "الداتا وصلت، حدث الشاشة فوراً!"
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
  // شيلنا السلاش (/) اللي في الآخر عشان الباك إند بيبعتها في أول المسار
  readonly imageBaseUrl = 'https://localhost:44395/api/'; 

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

  // 👇 دي الدالة الجديدة الخاصة بالمسح
  deleteProduct(id: number) {
    // بنطلع رسالة تأكيد الأول عشان لو داس بالغلط
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          // لو اتمسح من الباك إند، بنشيله من المصفوفة بتاعتنا عشان يختفي من الشاشة
          this.products = this.products.filter(p => p.id !== id);
          this.cdr.detectChanges(); // بنحدث الشاشة
          alert('Product deleted successfully! 🗑️');
        },
        error: (err: any) => {
          console.error('Error deleting product:', err);
          alert('Failed to delete the product.');
        }
      });
    }
  }
}