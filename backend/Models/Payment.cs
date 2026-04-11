using backend.Models.Enums;

namespace backend.Models;

public class Payment
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public string? TransactionId { get; set; }

    public DateTime? PaidAt { get; set; }

    public Order? Order { get; set; }
}