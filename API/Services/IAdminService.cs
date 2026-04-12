using API.Contracts.Admin;

namespace API.Services;

public interface IAdminService
{
    Task<IReadOnlyCollection<SellerSummaryResponse>> GetSellersAsync();

    Task<ApproveSellerResult> ApproveSellerAsync(string userId);
}

public sealed class ApproveSellerResult
{
    public bool Success { get; init; }

    public int StatusCode { get; init; }

    public string Message { get; init; } = string.Empty;

    public SellerSummaryResponse? Seller { get; init; }
}
