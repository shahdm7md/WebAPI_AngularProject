namespace API.Contracts.Admin
{
    public sealed class AdminProductResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public decimal Price { get; init; }
        public int Stock { get; init; }
        public bool IsAvailable { get; init; }
        public bool IsActive { get; init; }
        public string? MainImageUrl { get; init; }
        public string CategoryName { get; init; } = string.Empty;
        public string SellerName { get; init; } = string.Empty;
        public string SellerId { get; init; } = string.Empty;
    }

    public sealed class DeactivateProductResult
    {
        public bool Success { get; init; }
        public int StatusCode { get; init; }
        public string Message { get; init; } = string.Empty;
    }
}
