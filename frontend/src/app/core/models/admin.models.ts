// =================== Dashboard ===================
export interface DashboardStatsResponse {
  totalUsers: number;
  activeSellers: number;
  pendingSellers: number;
  totalOrders: number;
  totalOrdersToday: number;
  netRevenue: number;
  lowStockProducts: number;
}

// =================== Shared ===================
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// =================== Users ===================
export interface UserSummaryResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface SellerSummaryResponse {
  userId: string;
  fullName: string;
  email: string;
  storeName?: string;
  storeDescription?: string;
  sellerStatus?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ToggleActiveResult {
  success: boolean;
  statusCode: number;
  message: string;
}

export interface ApproveSellerResult {
  success: boolean;
  statusCode: number;
  message: string;
  seller?: SellerSummaryResponse;
}

export interface RejectSellerResult {
  success: boolean;
  statusCode: number;
  message: string;
}

// =================== Products ===================
export interface AdminProductResponse {
  id: number;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  isActive: boolean;
  mainImageUrl?: string;
  categoryName: string;
  sellerName: string;
  sellerId: string;
}

export interface DeactivateProductResult {
  success: boolean;
  statusCode: number;
  message: string;
}

// =================== Orders ===================
export interface AdminOrderResponse {
  id: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface UpdateOrderStatusResult {
  success: boolean;
  statusCode: number;
  message: string;
}

// =================== Coupons ===================
export interface CouponResponse {
  id: number;
  code: string;
  discountType: string | number;
value: number; // غير الاسم هنا من discountValue لـ value  minOrderAmount?: number;
minOrderAmount: number;  
usageLimit: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'Percentage' | 'Fixed';
  Value: number;
  minOrderAmount?: number;
  usageLimit: number;
  expiryDate: string;
}

export interface UpdateCouponRequest {
  discountType: 'Percentage' | 'Fixed';
  minOrderAmount?: number;
  usageLimit: number;
  Value: number;
  expiryDate: string;
  isActive: boolean;
}

export interface CouponResult {
  success: boolean;
  statusCode: number;
  
  minOrderAmount: number;
  message: string;
  coupon?: CouponResponse;
}

// =================== Banners ===================
export interface BannerResponse {
  id: number;
  title: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateBannerRequest {
  title: string;
  link?: string;
  displayOrder: number;
}

export interface UpdateBannerRequest {
  title: string;
  link?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface BannerResult {
  success: boolean;
  statusCode: number;
  message: string;
  banner?: BannerResponse;
}
export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
}

// =================== Dashboard - Recent Orders ===================
export interface RecentOrderResponse {
  id: string;
  customerName: string;
  initials: string;
  avatarColor: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Processing' | 'Shipped' | 'Cancelled';
}

// =================== Dashboard - Top Sellers ===================
export interface TopSellerResponse {
  rank: number;
  name: string;
  category: string;
  revenue: string;
  growth: string;
  rankColor: string;
}

// =================== Dashboard - Sales Trends ===================
export interface SalesTrendResponse {
  bars: number[];
  days: string[];
}