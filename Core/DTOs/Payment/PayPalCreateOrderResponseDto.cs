namespace Core.DTOs.Payment;

public sealed class PayPalCreateOrderResponseDto
{
    public string PaypalOrderId { get; set; } = string.Empty;
}