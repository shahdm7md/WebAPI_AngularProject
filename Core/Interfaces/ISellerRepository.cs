using Core.Entities;

namespace Core.Interfaces.Repositories;

public interface ISellerRepository
{
    // ── Profile ──────────────────────────────────────────
    Task<ApplicationUser?> GetSellerByIdAsync(string sellerId);
    Task UpdateSellerAsync(ApplicationUser seller);

    // ── Products ─────────────────────────────────────────
    Task<List<Product>> GetSellerProductsAsync(string sellerId);
    Task<Product?> GetSellerProductByIdAsync(int productId, string sellerId);
    Task<Product> CreateProductAsync(Product product);
    Task UpdateProductAsync(Product product);
    Task DeleteProductAsync(Product product);

    // ── Product Images ────────────────────────────────────
    Task<ProductImage> AddProductImageAsync(ProductImage image);
    Task<ProductImage?> GetProductImageAsync(int imageId, int productId);
    Task DeleteProductImageAsync(ProductImage image);
    Task ClearMainImageFlagAsync(int productId);

    // ── Orders ────────────────────────────────────────────
    Task<List<Order>> GetSellerOrdersAsync(string sellerId, string? status = null);
    Task<Order?> GetSellerOrderByIdAsync(int orderId, string sellerId);
    Task UpdateOrderAsync(Order order);

    // ── Earnings ──────────────────────────────────────────
    Task<List<Order>> GetSellerCompletedOrdersAsync(string sellerId);
}