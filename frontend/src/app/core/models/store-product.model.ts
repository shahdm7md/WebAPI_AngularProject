export interface StoreProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryName: string;
  mainImageUrl?: string | null;
  isActive: boolean;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
}

export interface PagedProductsResponse {
  data: StoreProduct[];
  totalCount: number;
}

export interface StorefrontQuery {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: number;
}

export interface ProductImageItem {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

export interface ProductReviewItem {
  id: number;
  userName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface ProductDetailResponse extends StoreProduct {
  images: ProductImageItem[];
  reviews: ProductReviewItem[];
}

export interface PurchaseStatusResponse {
  hasPurchased: boolean;
}

export interface CreateProductReviewRequest {
  rating: number;
  comment?: string | null;
}
