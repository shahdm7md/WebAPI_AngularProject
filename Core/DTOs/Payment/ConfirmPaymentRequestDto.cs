namespace Core.DTOs.Payment;

public class ConfirmPaymentRequestDto
{
    public int OrderId { get; set; }

    public string? SessionId { get; set; }
}
