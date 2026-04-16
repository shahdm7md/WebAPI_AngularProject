namespace API.Contracts.Seller
{
    public class SellerProductResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? MainImageUrl { get; set; }
        public List<ProductImageResponse> Images { get; set; } = new();
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }
}
