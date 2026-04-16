using System.ComponentModel.DataAnnotations;

namespace API.Contracts.Seller
{
    public class AddProductImageRequest
    {

        [Required]
        public IFormFile Image { get; set; } = null!;
        public bool IsMain { get; set; } = false;
    }
}
