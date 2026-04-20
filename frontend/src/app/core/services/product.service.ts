import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

// ── Models ────────────────────────────────────────────────────────────────────

export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

export interface ProductResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryName: string;
  mainImageUrl?: string;
  images?: ProductImageResponse[];
}

export interface ProductListResponse {
  data: ProductResponse[];
  totalCount: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get base() { return `${this.baseUrl}/api`; }

  private get authOptions() {
    const token = localStorage.getItem('auth_token');
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  // ── Products ───────────────────────────────────────────────────────────────

  getProducts(
    search?: string,
    categoryId?: number,
    page = 1,
    size = 100,
  ): Observable<ProductListResponse> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search)     params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<ProductListResponse>(`${this.base}/Products`, { params });
  }

  getProductById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.base}/Products/${id}`);
  }

  /**
   * Creates product with main image, then uploads extra images one by one.
   * Returns the final product after all uploads are done.
   */
 addProductWithImages(data: {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  mainImage?: File;
  extraImages?: File[];
}): Observable<any> {
  const fd = new FormData();
  fd.append('name',          data.name);
  fd.append('price',         String(data.price));
  fd.append('stockQuantity', String(data.stockQuantity));
  fd.append('categoryId',    String(data.categoryId));

  if (data.description) fd.append('description', data.description);
  if (data.mainImage)   fd.append('mainImage',    data.mainImage, data.mainImage.name);

  // كل الصور الإضافية بنفس الـ key "extraImages"
  // ASP.NET Core هيربطها بـ List<IFormFile> ExtraImages تلقائياً
  data.extraImages?.forEach(file =>
    fd.append('extraImages', file, file.name)
  );

  return this.http.post<any>(`${this.base}/SellerDashboard/Products`, fd, this.authOptions);
}

  updateProduct(
    id: number,
    data: {
      name: string;
      description?: string;
      price: number;
      stockQuantity: number;
      categoryId: number;
    },
  ): Observable<any> {
    return this.http.put<any>(`${this.base}/Products/${id}`, data, this.authOptions);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/Products/${id}`, this.authOptions);
  }

  // ── Product Images ─────────────────────────────────────────────────────────

  /**
   * Uploads a single image to an existing product.
   * Uses SellerDashboard endpoint which handles IsMain flag.
   */
  addProductImage(
    productId: number,
    image: File,
    isMain: boolean,
  ): Observable<ProductImageResponse> {
    const fd = new FormData();
    fd.append('image',  image, image.name);
    fd.append('isMain', String(isMain));
    return this.http.post<ProductImageResponse>(
      `${this.base}/SellerDashboard/products/${productId}/images`,
      fd,
      this.authOptions,
    );
  }

  deleteProductImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/SellerDashboard/products/${productId}/images/${imageId}`,
      this.authOptions,
    );
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${this.base}/Categories`);
  }

  addCategory(name: string): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(
      `${this.base}/Categories`,
      { name },
      this.authOptions,
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/Categories/${id}`, this.authOptions);
  }
}