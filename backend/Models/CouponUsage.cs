namespace backend.Models;

public class CouponUsage
{
    public int Id { get; set; }

    public int CouponId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public DateTime UsedAt { get; set; } = DateTime.UtcNow;

    public Coupon? Coupon { get; set; }

    public ApplicationUser? User { get; set; }
}