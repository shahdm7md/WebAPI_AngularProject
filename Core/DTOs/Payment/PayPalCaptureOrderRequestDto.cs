namespace Core.DTOs.Payment;

public sealed class PayPalCaptureOrderRequestDto
{
    public string PaypalOrderId { get; set; } = string.Empty;

    public int SystemOrderId { get; set; }
}