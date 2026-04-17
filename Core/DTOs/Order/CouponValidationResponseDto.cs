namespace Core.DTOs.Order;

public class CouponValidationResponseDto
{
    public bool IsValid { get; set; }

    public string Message { get; set; } = string.Empty;

    public string CouponCode { get; set; } = string.Empty;

    public decimal DiscountAmount { get; set; }
}
