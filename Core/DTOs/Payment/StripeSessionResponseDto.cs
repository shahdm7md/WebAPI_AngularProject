namespace Core.DTOs.Payment;

public class StripeSessionResponseDto
{
    public string SessionId { get; set; } = string.Empty;

    public string CheckoutUrl { get; set; } = string.Empty;
}
