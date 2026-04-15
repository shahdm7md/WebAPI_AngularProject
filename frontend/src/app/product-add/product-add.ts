import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service'; 
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  
  templateUrl: './product-add.html', 
  styleUrls: ['./product-add.css'] 
})
export class ProductAddComponent implements OnInit {
 private productService = inject(ProductService);
  private router = inject(Router);

  product: any = { name: '', description: '', price: null, stockQuantity: 1, categoryId: '' };
  categories: any[] = [];
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  ngOnInit() {
    
    this.productService.getCategories().subscribe((res: any) => {
      // this.categories = res.data;
      this.categories = res;
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader?.result as string;
      reader.readAsDataURL(file);
    }
  }

 onSubmit() {
  const formData = new FormData();
  formData.append('Name', this.product.name);
  formData.append('Description', this.product.description);
  formData.append('Price', this.product.price);
  formData.append('StockQuantity', this.product.stockQuantity);
  formData.append('CategoryId', this.product.categoryId);
  
  if (this.selectedFile) {
    formData.append('MainImage', this.selectedFile);
  }

  
  this.productService.addProduct(formData).subscribe({
    next: (res: any) => {
      alert('Done!');
    // this.categories = res;
      this.router.navigate(['/products']); 
    },
    error: (err: any) => {
      console.error('Error!', err);
      alert('Error');
    }
  });
}
}