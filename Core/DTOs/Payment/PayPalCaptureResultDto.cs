namespace Core.DTOs.Payment;

public sealed class PayPalCaptureResultDto
{
    public bool Success { get; set; }

    public string? TransactionId { get; set; }

    public string? Status { get; set; }

    public string? Message { get; set; }
}