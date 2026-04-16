namespace API.Contracts.Seller
{
    public class SellerOrderResponse
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<SellerOrderItemResponse> Items { get; set; } = new();
        public PaymentSummaryResponse? Payment { get; set; }
    }
}
