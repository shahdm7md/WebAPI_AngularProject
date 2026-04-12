using Microsoft.AspNetCore.Identity;

namespace Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string? OtpCode { get; set; }

    public DateTime? OtpExpiry { get; set; }

    public string? RefreshToken { get; set; }

    public string? SellerStatus { get; set; }

    public string? StoreName { get; set; }

    public string? StoreDescription { get; set; }

    public decimal WalletBalance { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string? Address { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Product> SoldProducts { get; set; } = new List<Product>();

    public ICollection<Cart> Carts { get; set; } = new List<Cart>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();

    public ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();
}