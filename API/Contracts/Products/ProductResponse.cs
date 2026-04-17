namespace API.Contracts.Products
{
    public record ProductResponse(
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
    int ReviewCount);
}
