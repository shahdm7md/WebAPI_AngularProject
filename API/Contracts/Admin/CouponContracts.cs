using SharedKernel.Enums;

namespace API.Contracts.Admin
{
    public sealed class CouponResponse
    {
        public int Id { get; init; }
        public string Code { get; init; } = string.Empty;
        public DiscountType DiscountType { get; init; }  // "Percentage" or "Fixed"
        public decimal Value { get; init; }
        public decimal? MinOrderAmount { get; init; }
        public int UsageLimit { get; init; }
        public int UsedCount { get; init; }
        public DateTime ExpiryDate { get; init; }
        public bool IsActive { get; init; }
    }

    public sealed class CreateCouponRequest
    {
        public string Code { get; init; } = string.Empty;
        public DiscountType DiscountType { get; init; } 
        public decimal Value { get; init; }
        public decimal? MinOrderAmount { get; init; }
        public int UsageLimit { get; init; } = 1;
        public DateTime ExpiryDate { get; init; }
    }

    public sealed class UpdateCouponRequest
    {
        public DiscountType DiscountType { get; init; }
        public decimal Value { get; init; }
        public decimal? MinOrderAmount { get; init; }
        public int UsageLimit { get; init; }
        public DateTime ExpiryDate { get; init; }
        public bool IsActive { get; init; }
    }

    public sealed class CouponResult
    {
        public bool Success { get; init; }
        public int StatusCode { get; init; }
        public string Message { get; init; } = string.Empty;
        public CouponResponse? Coupon { get; init; }
    }
}
