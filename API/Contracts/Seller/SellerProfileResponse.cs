namespace API.Contracts.Seller
{
    public class SellerProfileResponse
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? StoreName { get; set; }
        public string? StoreDescription { get; set; }
        public string? SellerStatus { get; set; }
        public decimal WalletBalance { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
