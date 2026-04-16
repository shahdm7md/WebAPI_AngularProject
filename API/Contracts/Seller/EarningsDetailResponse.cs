namespace API.Contracts.Seller
{
    public class EarningsDetailResponse
    {
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
    }
}
