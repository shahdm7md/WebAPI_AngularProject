using backend.Models.Enums;

namespace backend.Models;

public class Coupon
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public DiscountType DiscountType { get; set; }

    public decimal Value { get; set; }

    public DateTime ExpiryDate { get; set; }

    public int UsageLimit { get; set; }

    public ICollection<CouponUsage> Usages { get; set; } = new List<CouponUsage>();
}