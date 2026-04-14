using System.ComponentModel.DataAnnotations;

namespace API.Contracts.Products
{
    public class CreateProductRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(0.1, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Required]
        public int CategoryId { get; set; }


        public IFormFile? MainImage { get; set; }
    }
}
