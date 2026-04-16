// import { HttpClient } from '@angular/common/http';
// import { Injectable, inject } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class ProductService {
//   private http = inject(HttpClient);
//   private baseUrl = 'http://localhost:5199/api/'; // تأكدي من البورت بتاع الباك إند

//   // دالة جلب المنتجات
//   getProducts() {
//     return this.http.get<any>(this.baseUrl + 'Products');
//   }

//   // دالة جلب الأقسام
//   getCategories() {
//     return this.http.get<any>(this.baseUrl + 'Categories');
//   }

//   addProduct(formData: FormData) {
//     return this.http.post<any>(this.baseUrl + 'Products', formData);
//   }
//   // 1. دالة بتجيب بيانات منتج واحد بس بناءً على الـ ID بتاعه
//   getProductById(id: number) {
//     return this.http.get(`${this.baseUrl}Products/${id}`);
//   }

//   // 2. دالة بتبعت البيانات الجديدة للباك إند عشان يحفظ التعديل (هنحتاجها في زرار الحفظ)
//   updateProduct(id: number, productData: any) {
//     return this.http.put(`${this.baseUrl}Products/${id}`, productData);
//   }
// }

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = 'https://localhost:44395/api/';

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');

    return token
      ? {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        }
      : {};
  }

  getProducts() {
    return this.http.get(`${this.baseUrl}Products`);
  }

  getProductById(id: number) {
    return this.http.get(`${this.baseUrl}Products/${id}`);
  }

  getCategories() {
    return this.http.get(`${this.baseUrl}Categories`);
  }

  addProduct(data: any) {
    return this.http.post(`${this.baseUrl}Products`, data, this.getAuthHeaders());
  }

  updateProduct(id: number, data: any) {
    // استخدمنا PUT بناءً على كود الباك إند بتاعك
    return this.http.put(`${this.baseUrl}Products/${id}`, data, this.getAuthHeaders());
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.baseUrl}Products/${id}`, this.getAuthHeaders());
  }
}