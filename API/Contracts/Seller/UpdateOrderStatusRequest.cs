using System.ComponentModel.DataAnnotations;

namespace API.Contracts.Seller
{
    public class UpdateOrderStatusRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
