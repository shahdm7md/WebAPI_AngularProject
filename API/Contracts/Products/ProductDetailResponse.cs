namespace API.Contracts.Products;

public record ProductDetailResponse(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    int StockQuantity,
    string CategoryName,
    string? MainImageUrl,
    bool IsActive,
    bool IsAvailable,
    double AverageRating,
    int ReviewCount,
    IReadOnlyList<ProductImageDto> Images,
    IReadOnlyList<ProductReviewDto> Reviews);

public record ProductImageDto(
    int Id,
    string ImageUrl,
    bool IsMain);

public record ProductReviewDto(
    int Id,
    string UserName,
    int Rating,
    string? Comment,
    DateTime CreatedAt);

public sealed class CreateProductReviewRequest
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public sealed class PurchaseStatusResponse
{
    public bool HasPurchased { get; set; }
}