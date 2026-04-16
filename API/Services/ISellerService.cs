using API.Contracts.Seller;

namespace Core.Interfaces.Services;

public interface ISellerService
{
    // ── Profile ──────────────────────────────────────────
    Task<SellerProfileResponse> GetProfileAsync(string sellerId);
    Task<SellerProfileResponse> UpdateProfileAsync(string sellerId, UpdateSellerProfileRequest request);

    // ── Products ─────────────────────────────────────────
    Task<List<SellerProductResponse>> GetProductsAsync(string sellerId);
    Task<SellerProductResponse> GetProductByIdAsync(int productId, string sellerId);
    Task<SellerProductResponse> CreateProductAsync(string sellerId, CreateSellerProductRequest request);
    Task<SellerProductResponse> UpdateProductAsync(int productId, string sellerId, UpdateSellerProductRequest request);
    Task DeleteProductAsync(int productId, string sellerId);
    Task<SellerProductResponse> UpdateStockAsync(int productId, string sellerId, UpdateStockRequest request);

    // ── Product Images ────────────────────────────────────
    Task<ProductImageResponse> AddProductImageAsync(int productId, string sellerId, AddProductImageRequest request);
    Task DeleteProductImageAsync(int productId, string sellerId, int imageId);

    // ── Orders ────────────────────────────────────────────
    Task<List<SellerOrderResponse>> GetOrdersAsync(string sellerId, string? status = null);
    Task<SellerOrderResponse> GetOrderByIdAsync(int orderId, string sellerId);
    Task<SellerOrderResponse> UpdateOrderStatusAsync(int orderId, string sellerId, UpdateOrderStatusRequest request);

    // ── Earnings ──────────────────────────────────────────
    Task<EarningsSummaryResponse> GetEarningsSummaryAsync(string sellerId);
    Task<List<EarningsDetailResponse>> GetEarningsDetailAsync(string sellerId);
}