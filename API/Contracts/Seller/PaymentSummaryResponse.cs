namespace API.Contracts.Seller
{
    public class PaymentSummaryResponse
    {
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? PaidAt { get; set; }
    }
}
