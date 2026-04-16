using System.ComponentModel.DataAnnotations;

namespace API.Contracts.Seller
{
    public class UpdateStockRequest
    {
        [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative")]
        public int StockQuantity { get; set; }
    }
}
