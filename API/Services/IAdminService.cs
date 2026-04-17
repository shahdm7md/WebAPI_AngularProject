using API.Contracts.Admin;
using Core.DTOs.Order;

namespace API.Services;

public interface IAdminService
{
    Task<DashboardStatsResponse> GetDashboardStatsAsync();
    Task<PaginatedResponse<UserSummaryResponse>> GetAllUsersAsync(string? role, int page, int pageSize);
    Task<IReadOnlyCollection<SellerSummaryResponse>> GetSellersAsync();
    Task<IReadOnlyCollection<SellerSummaryResponse>> GetPendingSellersAsync();
    Task<ApproveSellerResult> ApproveSellerAsync(string userId);
    Task<RejectSellerResult> RejectSellerAsync(string userId);
    Task<ToggleActiveResult> ToggleActiveAsync(string userId);
}

public interface IAdminProductService
{
    Task<PaginatedResponse<AdminProductResponse>> GetAllProductsAsync(string? sellerId, int page, int pageSize);
    Task<DeactivateProductResult> DeactivateProductAsync(int productId);
}

public interface IAdminOrderService
{
    Task<PaginatedResponse<AdminOrderResponse>> GetAllOrdersAsync(string? status, int page, int pageSize);
    Task<UpdateOrderStatusResult> UpdateOrderStatusAsync(int orderId, string status);
    Task<byte[]> ExportOrdersCsvAsync();
}

public interface ICouponService
{
    Task<IReadOnlyCollection<CouponResponse>> GetAllAsync();
    Task<CouponResult> CreateAsync(CreateCouponRequest request);
    Task<CouponResult> UpdateAsync(int id, UpdateCouponRequest request);
    Task<CouponResult> DeleteAsync(int id);
    Task<CouponValidationResponseDto> ValidateAsync(string userId, string code);
}

public interface IBannerService
{
    Task<IReadOnlyCollection<BannerResponse>> GetAllAsync();
    Task<BannerResult> CreateAsync(CreateBannerRequest request, string imageUrl);
    Task<BannerResult> UpdateAsync(int id, UpdateBannerRequest request);
    Task<BannerResult> DeleteAsync(int id);
}

public sealed class ApproveSellerResult
{
    public bool Success { get; init; }

    public int StatusCode { get; init; }

    public string Message { get; init; } = string.Empty;

    public SellerSummaryResponse? Seller { get; init; }
}
