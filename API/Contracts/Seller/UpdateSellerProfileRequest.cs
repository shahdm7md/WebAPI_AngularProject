using System.ComponentModel.DataAnnotations;

namespace API.Contracts.Seller
{
    public class UpdateSellerProfileRequest
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? StoreName { get; set; }

        [MaxLength(500)]
        public string? StoreDescription { get; set; }

        [Phone]
        public string? PhoneNumber { get; set; }
    }
}
