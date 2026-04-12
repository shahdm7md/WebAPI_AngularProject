namespace API.Contracts.Admin;

public sealed class SellerSummaryResponse
{
    public string UserId { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string FullName { get; init; } = string.Empty;

    public string StoreName { get; init; } = string.Empty;

    public bool IsActive { get; init; }

    public string SellerStatus { get; init; } = string.Empty;
}
