using System.ComponentModel.DataAnnotations;

namespace API.Contracts.Seller
{
    public class UpdateSellerProductRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative")]
        public int StockQuantity { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A valid CategoryId is required")]
        public int CategoryId { get; set; }
    }
}
